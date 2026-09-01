import { NextRequest, NextResponse } from "next/server";
import { put, get, del } from "@vercel/blob";
import { getDb, type Database } from "../../db";
import { dummyPassword, randomToken, sha256Hex, verifyPassword } from "../../db/admin-crypto.mjs";

export type { Database };

export { sha256Hex as sha256 };

// --- Session lifetime -----------------------------------------------------
// A session dies four hours after it was created, or one hour after the last
// request it served, whichever comes first.
const ADMIN_SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000;
const ADMIN_SESSION_IDLE_MS = 60 * 60 * 1000;
// `last_seen_at` is refreshed at most once per minute per session so that a
// busy dashboard does not turn every request into a database write.
const ADMIN_SESSION_REFRESH_MS = 60 * 1000;
// Validating a session now costs a database read. These lookups are cached
// per instance so a page that checks the lead role several times still only
// reads once.
const ADMIN_CACHE_TTL_MS = 30 * 1000;
const ADMIN_CACHE_MAX_ENTRIES = 500;
export const ADMIN_COOKIE = "admin_session";
// Superseded cookie from the previous hard-coded credential scheme.
const LEGACY_ADMIN_COOKIE = "lead_session";

const ADMIN_RATE_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_CLIENT_ATTEMPT_LIMIT = 7;
const ADMIN_GLOBAL_ATTEMPT_LIMIT = 120;
let adminTablesReady: Promise<void> | null = null;
let adminRateTableReady: Promise<void> | null = null;

/** Returns the Postgres-backed, D1-compatible database handle. */
export function d1(): Database {
  return getDb();
}

// --- Object storage (Vercel Blob, was Cloudflare R2) -----------------------

export async function putBlob(
  key: string,
  body: File | Blob | ReadableStream | Buffer | string,
  contentType: string,
): Promise<string> {
  const { url } = await put(key, body as File, {
    // These files are served through authenticated application routes. A
    // private Blob prevents a copied storage URL bypassing those checks.
    access: "private",
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return url;
}

export async function getBlob(
  urlOrPathname: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const result = await get(urlOrPathname, {
    access: "private",
    useCache: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return {
    body: result.stream,
    contentType: result.blob.contentType ?? "application/octet-stream",
  };
}

export async function deleteBlob(urlOrPathname: string): Promise<void> {
  await del(urlOrPathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

// --- Administrator auth ---------------------------------------------------
// Lead access is granted by a row in `admin_sessions` reached through a random
// secret held in an HttpOnly cookie. Nothing about the account — not the
// username, not the password — lives in the source tree or in an environment
// variable any more, so adding, disabling, or re-issuing an administrator no
// longer requires a redeploy.

export type AdminPrincipal = {
  id: string;
  username: string;
  displayName: string;
};

type AdminRow = {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  password_salt: string;
  disabled_at: number | null;
};

type AdminSessionRow = {
  admin_id: string;
  username: string;
  display_name: string;
  created_at: number;
  expires_at: number;
  last_seen_at: number;
  disabled_at: number | null;
};

const adminSessionCache = new Map<string, { admin: AdminPrincipal | null; expiresAt: number }>();

async function ensureAdminTables(): Promise<void> {
  if (!adminTablesReady) {
    adminTablesReady = (async () => {
      const db = d1();
      await db.batch([
        db.prepare(`CREATE TABLE IF NOT EXISTS admins (
          id text PRIMARY KEY NOT NULL,
          username text NOT NULL,
          display_name text NOT NULL,
          password_hash text NOT NULL,
          password_salt text NOT NULL,
          created_at bigint NOT NULL,
          last_login_at bigint,
          disabled_at bigint
        )`),
        db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_username ON admins (lower(username))"),
        db.prepare(`CREATE TABLE IF NOT EXISTS admin_sessions (
          token_hash text PRIMARY KEY NOT NULL,
          admin_id text NOT NULL,
          created_at bigint NOT NULL,
          expires_at bigint NOT NULL,
          last_seen_at bigint NOT NULL,
          ip text,
          user_agent text,
          revoked_at bigint
        )`),
        db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions (admin_id, expires_at)"),
        db.prepare(`CREATE TABLE IF NOT EXISTS admin_audit_log (
          id text PRIMARY KEY NOT NULL,
          admin_id text,
          action text NOT NULL,
          detail text,
          ip text,
          created_at bigint NOT NULL
        )`),
        db.prepare("CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log (created_at)"),
      ]);
    })().catch((error) => {
      adminTablesReady = null;
      throw error;
    });
  }
  await adminTablesReady;
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const entry of header.split(";")) {
    const trimmed = entry.trim();
    if (!trimmed.startsWith(`${name}=`)) continue;
    try {
      return decodeURIComponent(trimmed.slice(name.length + 1));
    } catch {
      return null;
    }
  }
  return null;
}

function clientAddress(req: Request): string {
  // Vercel overwrites its forwarding headers at the edge. The generic
  // forwarding header remains a fallback for local/self-hosted deployments.
  const forwarded =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for") ??
    "unknown";
  return forwarded.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

function clientAgent(req: Request): string {
  return req.headers.get("user-agent")?.slice(0, 256) ?? "unknown";
}

/**
 * Checks a submitted username and password against the `admins` table.
 *
 * A missing account still performs one key derivation so that the response
 * time does not reveal which administrator names exist.
 */
export async function verifyAdminCredentials(
  username: unknown,
  password: unknown,
): Promise<AdminPrincipal | null> {
  const submittedUsername = String(username ?? "").trim();
  const submittedPassword = String(password ?? "");
  if (!submittedUsername || !submittedPassword) return null;
  await ensureAdminTables();
  const row = await d1()
    .prepare(
      "SELECT id, username, display_name, password_hash, password_salt, disabled_at FROM admins WHERE lower(username) = lower(?)",
    )
    .bind(submittedUsername)
    .first<AdminRow>();
  if (!row) {
    const dummy = dummyPassword();
    await verifyPassword(submittedPassword, dummy.salt, dummy.hash);
    return null;
  }
  const matched = await verifyPassword(submittedPassword, row.password_salt, row.password_hash);
  if (!matched || row.disabled_at) return null;
  return { id: row.id, username: row.username, displayName: row.display_name };
}

/** Issues a new revocable session and attaches its cookie to the response. */
export async function createAdminSession(
  req: Request,
  res: NextResponse,
  admin: AdminPrincipal,
): Promise<void> {
  await ensureAdminTables();
  const token = randomToken(32);
  const now = Date.now();
  await d1()
    .prepare(
      "INSERT INTO admin_sessions (token_hash, admin_id, created_at, expires_at, last_seen_at, ip, user_agent, revoked_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)",
    )
    .bind(
      sha256Hex(token),
      admin.id,
      now,
      now + ADMIN_SESSION_MAX_AGE_MS,
      now,
      clientAddress(req),
      clientAgent(req),
    )
    .run();
  await d1().prepare("UPDATE admins SET last_login_at = ? WHERE id = ?").bind(now, admin.id).run();
  setAdminCookie(res, token);
  await recordAudit(admin.id, "login", admin.username, req);
}

/** Revokes the caller's own session. */
export async function destroyAdminSession(req: Request, res: NextResponse): Promise<void> {
  const token = readCookie(req, ADMIN_COOKIE);
  const admin = await currentAdmin(req);
  if (token) {
    try {
      await d1()
        .prepare("UPDATE admin_sessions SET revoked_at = ? WHERE token_hash = ?")
        .bind(Date.now(), sha256Hex(token))
        .run();
    } catch {
      // A revoked row is a nicety; the cookie removal below is what ends the
      // session, so a database failure must not block signing out.
    }
    adminSessionCache.delete(sha256Hex(token));
  }
  clearAdminSession(res);
  if (admin) await recordAudit(admin.id, "logout", admin.username, req);
}

/** Digest of the session cookie, used to identify a session without its secret. */
export function adminTokenHash(req: Request): string | null {
  const token = readCookie(req, ADMIN_COOKIE);
  return token ? sha256Hex(token) : null;
}

/**
 * Resolves the administrator behind the request, or null when there is none.
 *
 * Results are cached briefly per instance. Revoking a session therefore takes
 * effect within thirty seconds everywhere rather than only on the instance
 * that processed the revocation.
 */
export async function currentAdmin(req: Request): Promise<AdminPrincipal | null> {
  const tokenHash = adminTokenHash(req);
  if (!tokenHash) return null;
  const now = Date.now();
  const cached = adminSessionCache.get(tokenHash);
  if (cached && cached.expiresAt > now) return cached.admin;
  const admin = await loadAdminSession(tokenHash, now);
  if (adminSessionCache.size >= ADMIN_CACHE_MAX_ENTRIES) adminSessionCache.clear();
  adminSessionCache.set(tokenHash, { admin, expiresAt: now + ADMIN_CACHE_TTL_MS });
  return admin;
}

async function loadAdminSession(tokenHash: string, now: number): Promise<AdminPrincipal | null> {
  try {
    await ensureAdminTables();
    const row = await d1()
      .prepare(
        `SELECT s.admin_id AS admin_id, s.created_at AS created_at, s.expires_at AS expires_at,
                s.last_seen_at AS last_seen_at, a.username AS username, a.display_name AS display_name,
                a.disabled_at AS disabled_at
         FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
         WHERE s.token_hash = ? AND s.revoked_at IS NULL`,
      )
      .bind(tokenHash)
      .first<AdminSessionRow>();
    if (!row || row.disabled_at) return null;
    if (now > Number(row.expires_at)) return null;
    if (now - Number(row.last_seen_at) > ADMIN_SESSION_IDLE_MS) return null;
    if (now - Number(row.last_seen_at) > ADMIN_SESSION_REFRESH_MS) {
      const refreshedExpiry = Math.min(
        Number(row.created_at) + ADMIN_SESSION_MAX_AGE_MS,
        now + ADMIN_SESSION_IDLE_MS,
      );
      await d1()
        .prepare("UPDATE admin_sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?")
        .bind(now, refreshedExpiry, tokenHash)
        .run();
    }
    return { id: row.admin_id, username: row.username, displayName: row.display_name };
  } catch {
    // Missing credentials, an unreachable database, and malformed cookies must
    // all fail closed instead of turning every protected endpoint into a 500.
    return null;
  }
}

/** True when the request carries a valid administrator session. */
export async function isLead(req: Request): Promise<boolean> {
  return (await currentAdmin(req)) !== null;
}

/**
 * Signing identity recorded on rows the lead creates or edits. Older rows keep
 * their original `lead:Hera` value; both forms are display-only audit text and
 * are never used to make an authorisation decision.
 */
export async function adminPrincipal(req: Request): Promise<string> {
  const admin = await currentAdmin(req);
  return admin ? `admin:${admin.username}` : "lead:unknown";
}

/** Appends to the administrator audit trail. Never fails the caller. */
export async function recordAudit(
  adminId: string | null,
  action: string,
  detail: string | null,
  req: Request,
): Promise<void> {
  try {
    await ensureAdminTables();
    await d1()
      .prepare(
        "INSERT INTO admin_audit_log (id, admin_id, action, detail, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), adminId, action, detail, clientAddress(req), Date.now())
      .run();
  } catch {
    // Losing an audit entry is preferable to rejecting the action it describes.
  }
}

function setAdminCookie(res: NextResponse, token: string): void {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: Math.floor(ADMIN_SESSION_MAX_AGE_MS / 1000),
  });
  // Drop a leftover cookie from the previous scheme so it cannot linger.
  res.cookies.set(LEGACY_ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export function clearAdminSession(res: NextResponse): void {
  for (const name of [ADMIN_COOKIE, LEGACY_ADMIN_COOKIE]) {
    res.cookies.set(name, "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  }
}

// --- Login rate limiting --------------------------------------------------

async function ensureAdminRateTable(): Promise<void> {
  if (!adminRateTableReady) {
    adminRateTableReady = (async () => {
      const db = d1();
      await db.batch([
        db.prepare(`CREATE TABLE IF NOT EXISTS lead_login_attempts (
          id text PRIMARY KEY NOT NULL,
          client_key text NOT NULL,
          attempted_at bigint NOT NULL
        )`),
        db.prepare(
          "CREATE INDEX IF NOT EXISTS idx_lead_login_attempts_client_time ON lead_login_attempts (client_key, attempted_at)",
        ),
        db.prepare(
          "CREATE INDEX IF NOT EXISTS idx_lead_login_attempts_time ON lead_login_attempts (attempted_at)",
        ),
      ]);
    })().catch((error) => {
      adminRateTableReady = null;
      throw error;
    });
  }
  await adminRateTableReady;
}

function adminClientKey(req: Request): string {
  const address = clientAddress(req);
  const userAgent = clientAgent(req);
  const salt = process.env.LEAD_SESSION_SECRET ?? "lead-login-rate-limit";
  return sha256Hex(`${salt}\n${address}\n${userAgent}`);
}

export type LeadLoginAttempt = {
  allowed: boolean;
  clientKey: string;
  retryAfter: number;
};

/**
 * Records and checks a login attempt in Postgres. This is deliberately
 * durable rather than an in-memory counter so the limit applies across every
 * serverless instance. Database errors are allowed to propagate: login must
 * fail closed if its security state cannot be checked.
 */
export async function beginLeadLoginAttempt(req: Request): Promise<LeadLoginAttempt> {
  await ensureAdminRateTable();
  const now = Date.now();
  const cutoff = now - ADMIN_RATE_WINDOW_MS;
  const clientKey = adminClientKey(req);
  const db = d1();
  await db.batch([
    db.prepare("DELETE FROM lead_login_attempts WHERE attempted_at < ?").bind(now - 24 * 60 * 60 * 1000),
    db
      .prepare("INSERT INTO lead_login_attempts (id, client_key, attempted_at) VALUES (?, ?, ?)")
      .bind(crypto.randomUUID(), clientKey, now),
  ]);
  const [clientRow, globalRow, oldestClient, oldestGlobal] = await Promise.all([
    db
      .prepare("SELECT COUNT(*) AS count FROM lead_login_attempts WHERE client_key = ? AND attempted_at >= ?")
      .bind(clientKey, cutoff)
      .first<{ count: number }>(),
    db
      .prepare("SELECT COUNT(*) AS count FROM lead_login_attempts WHERE attempted_at >= ?")
      .bind(cutoff)
      .first<{ count: number }>(),
    db
      .prepare("SELECT MIN(attempted_at) AS attempted_at FROM lead_login_attempts WHERE client_key = ? AND attempted_at >= ?")
      .bind(clientKey, cutoff)
      .first<{ attempted_at: number | null }>(),
    db
      .prepare("SELECT MIN(attempted_at) AS attempted_at FROM lead_login_attempts WHERE attempted_at >= ?")
      .bind(cutoff)
      .first<{ attempted_at: number | null }>(),
  ]);
  const clientBlocked = Number(clientRow?.count ?? 0) > ADMIN_CLIENT_ATTEMPT_LIMIT;
  const globalBlocked = Number(globalRow?.count ?? 0) > ADMIN_GLOBAL_ATTEMPT_LIMIT;
  const oldest = globalBlocked ? oldestGlobal?.attempted_at : oldestClient?.attempted_at;
  const retryAfter = Math.max(1, Math.ceil(((oldest ?? now) + ADMIN_RATE_WINDOW_MS - now) / 1000));
  return { allowed: !clientBlocked && !globalBlocked, clientKey, retryAfter };
}

export async function clearLeadLoginAttempts(clientKey: string): Promise<void> {
  await ensureAdminRateTable();
  await d1().prepare("DELETE FROM lead_login_attempts WHERE client_key = ?").bind(clientKey).run();
}

// --- Participant sessions -------------------------------------------------

export function clearParticipantSession(res: NextResponse): void {
  res.cookies.set("participant_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function participantId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("participant_session")?.value;
  if (!token) return null;
  const row = await d1()
    .prepare("SELECT participant_id FROM participant_sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(sha256Hex(token), Date.now())
    .first<{ participant_id: string }>();
  return row?.participant_id ?? null;
}

export async function canAccessGroup(req: NextRequest, groupId: string): Promise<boolean> {
  if (await isLead(req)) return true;
  const participant = await participantId(req);
  if (!participant) return false;
  const member = await d1()
    .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND participant_id = ?")
    .bind(groupId, participant)
    .first();
  return Boolean(member);
}
