import { NextRequest, NextResponse } from "next/server";
import { put, del } from "@vercel/blob";
import { getDb, type Database } from "../../db";

export type { Database };

export const LEAD_NAME = "Hera";
const LEAD_SESSION_MAX_AGE = 60 * 60 * 8;

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
    access: "public",
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return url;
}

export async function getBlob(
  url: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
  const res = await fetch(url);
  if (!res.ok || !res.body) return null;
  return {
    body: res.body,
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
  };
}

export async function deleteBlob(url: string): Promise<void> {
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

// --- Auth ----------------------------------------------------------------

export function isOwner(req: NextRequest): boolean {
  const ownerId = process.env.OWNER_USER_ID;
  const userId = req.headers.get("oai-authenticated-user-id");
  return Boolean(ownerId && userId && ownerId === userId);
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
  const raw = req.headers.get("cookie")?.match(/(?:^|; )lead_session=([^;]+)/)?.[1];
  if (!raw) return false;
  const parts = decodeURIComponent(raw).split(".");
  if (parts.length !== 3) return false;
  const [name, expiry, sig] = parts;
  const expiresAt = Number(expiry);
  if (!safeEq(name, LEAD_NAME) || !Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const expected = await signLeadPayload(`${name}.${expiry}`);
  return safeEq(sig, expected);
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
  if (isOwner(req)) return true;
  const participant = await participantId(req);
  if (!participant) return false;
  const member = await d1()
    .prepare("SELECT 1 FROM group_members WHERE group_id = ? AND participant_id = ?")
    .bind(groupId, participant)
    .first();
  return Boolean(member);
}
