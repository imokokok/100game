import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

export function d1() {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("D1 binding DB is unavailable");
  return db;
}

export function isOwner(req: NextRequest) {
  const ownerId = (env as unknown as { OWNER_USER_ID?: string }).OWNER_USER_ID;
  const userId = req.headers.get("oai-authenticated-user-id");
  return Boolean(ownerId && userId && ownerId === userId);
}

export function participantId(req: NextRequest) {
  return req.cookies.get("participant")?.value ?? null;
}
