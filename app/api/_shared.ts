import { env } from "cloudflare:workers";
import { NextRequest } from "next/server";

export function d1() {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("D1 binding DB is unavailable");
  return db;
}

export function r2() {
  const bucket = (env as unknown as { UPLOADS?: R2Bucket }).UPLOADS;
  if (!bucket) throw new Error("R2 binding UPLOADS is unavailable");
  return bucket;
}

export function isOwner(req: NextRequest) {
  const ownerId = (env as unknown as { OWNER_USER_ID?: string }).OWNER_USER_ID;
  const userId = req.headers.get("oai-authenticated-user-id");
  return Boolean(ownerId && userId && ownerId === userId);
}

export function participantId(req: NextRequest) {
  return req.cookies.get("participant")?.value ?? null;
}

export async function canAccessGroup(req: NextRequest, groupId: string) {
  if (isOwner(req)) return true;
  const participant = participantId(req);
  if (!participant) return false;
  const member = await d1().prepare("SELECT 1 FROM group_members WHERE group_id = ? AND participant_id = ?").bind(groupId, participant).first();
  return Boolean(member);
}
