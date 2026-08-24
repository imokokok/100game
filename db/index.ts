import postgres, { type Sql } from "postgres";

// A thin D1-compatible layer over Postgres so the existing route handlers
// (which use d1().prepare(sql).bind(...).first()/.all()/.run()/.batch())
// keep working unchanged after moving off Cloudflare D1.
//
// It translates SQLite-isms that the routes rely on:
//   - `?` positional placeholders -> Postgres `$1, $2, ...`
//   - `INSERT OR IGNORE INTO group_members ... SELECT ...` -> `ON CONFLICT DO NOTHING`
//   - `COLLATE NOCASE` -> removed (Postgres has no NOCASE collation)

type Row = Record<string, unknown>;

let client: Sql | null = null;

function getClient(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    client = postgres(url, {
      prepare: false,
      // Postgres int8 (bigint) defaults to JS BigInt. Our epoch-ms timestamps
      // fit in Number's safe range, so parse them back to numbers to match the
      // original D1 (SQLite 64-bit integer) behavior and avoid JSON.stringify
      // throwing on BigInt values.
      types: {
        bigint: { to: 20, from: [20], parse: (x: string) => Number(x), serialize: (x: unknown) => String(x) },
      },
    });
  }
  return client;
}

class Statement {
  private sql: string;
  private params: unknown[] = [];

  constructor(rawSql: string, private pg: Sql) {
    this.sql = translate(rawSql);
  }

  bind(...params: unknown[]): this {
    this.params = params;
    return this;
  }

  async first<T = Row>(): Promise<T | undefined> {
    const rows = (await this.pg.unsafe(this.sql, this.params as never[])) as unknown[];
    return (rows[0] as T) ?? undefined;
  }

  async all<T = Row>(): Promise<{ results: T[]; meta: { changes: number } }> {
    const rows = (await this.pg.unsafe(this.sql, this.params as never[])) as unknown[];
    const changes = (rows as { count?: number }).count ?? 0;
    return { results: rows as T[], meta: { changes } };
  }

  async run(): Promise<{ meta: { changes: number } }> {
    const rows = (await this.pg.unsafe(this.sql, this.params as never[])) as unknown[];
    return { meta: { changes: (rows as { count?: number }).count ?? 0 } };
  }
}

export class Database {
  constructor(private pg: Sql) {}

  prepare(sql: string): Statement {
    return new Statement(sql, this.pg);
  }

  async batch(
    statements: Statement[],
  ): Promise<Array<{ results: unknown[]; meta: { changes: number } }>> {
    const out: Array<{ results: unknown[]; meta: { changes: number } }> = [];
    for (const s of statements) out.push(await s.all());
    return out;
  }
}

function translate(sql: string): string {
  let n = 0;
  let out = sql.replace(/\?/g, () => `$${++n}`);

  if (/INSERT OR IGNORE INTO group_members/i.test(out)) {
    out = out.replace(/INSERT OR IGNORE INTO group_members/i, "INSERT INTO group_members");
    out = out.replace(
      /FROM participants WHERE id = \$\d+$/i,
      (m) => `${m} ON CONFLICT (group_id, participant_id) DO NOTHING`,
    );
  }

  out = out.replace(/\sCOLLATE\s+NOCASE/gi, "");
  return out;
}

export function getDb(): Database {
  return new Database(getClient());
}
