import { NextRequest, NextResponse } from "next/server";
import { put, get, del } from "@vercel/blob";
import { getDb, type Database } from "../../db";

export type { Database };

export const LEAD_NAME = "Hera";
const LEAD_SESSION_MAX_AGE = 60 * 60 * 8;
const LEAD_RATE_WINDOW_MS = 15 * 60 * 1000;
const LEAD_CLIENT_ATTEMPT_LIMIT = 7;
const LEAD_GLOBAL_ATTEMPT_LIMIT = 120;
let leadRateTableReady: Promise<void> | null = null;

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

// --- Auth ----------------------------------------------------------------

/**
 * Legacy platform-owner authentication is intentionally disabled.
 *
 * Deployment-specific identity headers can be supplied by ordinary clients
 * unless an independently verified gateway signs them. They must never grant
 * access to private project data. Lead access is authorised exclusively by
 * the signed, HttpOnly session validated by `isLead` below.
 */
export function isOwner(_req: NextRequest): boolean {
  return false;
}

function safeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let value = 0;
  for (let i = 0; i < a.length; i++) value |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return value === 0;
}

async function signLeadPayload(payload: string): Promise<string> {
  const secret = process.env.LEAD_SESSION_SECRET;
  if (!secret) throw new Error("Lead session secret is unavailable");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)),
  );
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/g, "");
}

export function validLeadCredentials(name: unknown, code: unknown): boolean {
  const expectedCode = process.env.LEAD_ACCESS_CODE;
  const submittedName = String(name ?? "").trim();
  const submittedCode = String(code ?? "").trim();
  return Boolean(expectedCode && safeEq(submittedName, LEAD_NAME) && safeEq(submittedCode, expectedCode));
}

export async function setLeadSession(res: NextResponse): Promise<void> {
  const expiry = Date.now() + LEAD_SESSION_MAX_AGE * 1000;
  const payload = `${LEAD_NAME}.${expiry}`;
  const token = `${payload}.${await signLeadPayload(payload)}`;
  res.cookies.set("lead_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: LEAD_SESSION_MAX_AGE,
  });
}

export function clearLeadSession(res: NextResponse): void {
  res.cookies.set("lead_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

export async function isLead(req: Request): Promise<boolean> {
  const raw = req.headers
    .get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("lead_session="))
    ?.slice("lead_session=".length);
  if (!raw) return false;
  try {
    const parts = decodeURIComponent(raw).split(".");
    if (parts.length !== 3) return false;
    const [name, expiry, sig] = parts;
    const expiresAt = Number(expiry);
    if (!safeEq(name, LEAD_NAME) || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
    const expected = await signLeadPayload(`${name}.${expiry}`);
    return safeEq(sig, expected);
  } catch {
    // Missing secrets and malformed cookie encodings must fail closed instead
    // of turning every protected endpoint into a 500 response.
    return false;
  }
}

export function isLeadName(name: unknown): boolean {
  return safeEq(String(name ?? "").trim(), LEAD_NAME);
}

async function ensureLeadRateTable(): Promise<void> {
  if (!leadRateTableReady) {
    leadRateTableReady = (async () => {
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
      leadRateTableReady = null;
      throw error;
    });
  }
  await leadRateTableReady;
}

async function leadClientKey(req: Request): Promise<string> {
  // Vercel overwrites its forwarding headers at the edge. The generic
  // forwarding header remains a fallback for local/self-hosted deployments;
  // the global bucket still limits an attacker who spoofs that fallback.
  const forwarded =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for") ??
    "unknown";
  const address = forwarded.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent")?.slice(0, 256) ?? "unknown";
  const salt = process.env.LEAD_SESSION_SECRET ?? "lead-login-rate-limit";
  return sha256(`${salt}\n${address}\n${userAgent}`);
}

export type LeadLoginAttempt = {
  allowed: boolean;
  clientKey: string;
  retryAfter: number;
};

/**
 * Records and checks a lead-login attempt in Postgres. This is deliberately
 * durable rather than an in-memory counter so the limit applies across every
 * serverless instance. Database errors are allowed to propagate: lead login
 * must fail closed if its security state cannot be checked.
 */
export async function beginLeadLoginAttempt(req: Request): Promise<LeadLoginAttempt> {
  await ensureLeadRateTable();
  const now = Date.now();
  const cutoff = now - LEAD_RATE_WINDOW_MS;
  const clientKey = await leadClientKey(req);
  const db = d1();
  await db.batch([
    db.prepare("DELETE FROM lead_login_attempts WHERE attempted_at < ?").bind(now - 24 * 60 * 60 * 1000),
    db.prepare("INSERT INTO lead_login_attempts (id, client_key, attempted_at) VALUES (?, ?, ?)").bind(
      crypto.randomUUID(),
      clientKey,
      now,
    ),
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
  const clientBlocked = Number(clientRow?.count ?? 0) > LEAD_CLIENT_ATTEMPT_LIMIT;
  const globalBlocked = Number(globalRow?.count ?? 0) > LEAD_GLOBAL_ATTEMPT_LIMIT;
  const oldest = globalBlocked ? oldestGlobal?.attempted_at : oldestClient?.attempted_at;
  const retryAfter = Math.max(1, Math.ceil(((oldest ?? now) + LEAD_RATE_WINDOW_MS - now) / 1000));
  return { allowed: !clientBlocked && !globalBlocked, clientKey, retryAfter };
}

export async function clearLeadLoginAttempts(clientKey: string): Promise<void> {
  await ensureLeadRateTable();
  await d1().prepare("DELETE FROM lead_login_attempts WHERE client_key = ?").bind(clientKey).run();
}

export function clearParticipantSession(res: NextResponse): void {
  res.cookies.set("participant_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export async function participantId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("participant_session")?.value;
  if (!token) return null;
  const row = await d1()
    .prepare("SELECT participant_id FROM participant_sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(await sha256(token), Date.now())
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
