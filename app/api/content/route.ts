import { NextRequest, NextResponse } from "next/server";
import { d1, isOwner } from "../_shared";

const localeList = ["zh", "en", "ja", "es", "fr", "ar", "hi", "bn", "sw", "ha", "id", "pt"];
const locales = new Set(localeList);
const editableKeys = new Set([
  "landing.eyebrow",
  "landing.titleA",
  "landing.titleB",
  "landing.subtitle",
  "landing.conceptA",
  "landing.conceptB",
  "landing.conceptC",
  "overview.note",
  "copyright",
]);

type ContentRow = { locale: string; content_key: string; value: string; updated_at: number };

export async function GET() {
  const result = await d1()
    .prepare("SELECT locale, content_key, value, updated_at FROM content_overrides ORDER BY locale, content_key")
    .all<ContentRow>();
  const content: Record<string, Record<string, string>> = Object.fromEntries(localeList.map(locale => [locale, {}]));
  let updatedAt = 0;
  for (const row of result.results ?? []) {
    if (locales.has(row.locale) && editableKeys.has(row.content_key)) {
      content[row.locale][row.content_key] = row.value;
      updatedAt = Math.max(updatedAt, Number(row.updated_at) || 0);
    }
  }
  return NextResponse.json({ content, updatedAt }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: "Only the Owner can edit public content" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as { locale?: unknown; values?: unknown } | null;
  const locale = typeof body?.locale === "string" ? body.locale : "";
  if (!locales.has(locale) || !body?.values || typeof body.values !== "object" || Array.isArray(body.values)) {
    return NextResponse.json({ error: "Invalid content update" }, { status: 400 });
  }
  const values = body.values as Record<string, unknown>;
  const entries = Object.entries(values).filter(([key, value]) => editableKeys.has(key) && typeof value === "string");
  if (!entries.length || entries.some(([, value]) => (value as string).trim().length === 0 || (value as string).length > 1200)) {
    return NextResponse.json({ error: "Content cannot be empty or longer than 1200 characters" }, { status: 400 });
  }
  const now = Date.now();
  const editor = req.headers.get("oai-authenticated-user-id") ?? "owner";
  const statements = entries.map(([key, value]) => d1().prepare(`
    INSERT INTO content_overrides (locale, content_key, value, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(locale, content_key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  `).bind(locale, key, (value as string).trim(), now, editor));
  await d1().batch(statements);
  return NextResponse.json({ ok: true, updatedAt: now });
}
