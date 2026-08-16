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

export async function sha256(value:string){
  const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("");
}

export async function participantId(req: NextRequest) {
  const token=req.cookies.get("participant_session")?.value;
  if(!token)return null;
  const row=await d1().prepare("SELECT participant_id FROM participant_sessions WHERE token_hash = ? AND expires_at > ?").bind(await sha256(token),Date.now()).first<{participant_id:string}>();
  return row?.participant_id??null;
}

export async function canAccessGroup(req: NextRequest, groupId: string) {
  if (isOwner(req)) return true;
  const participant = await participantId(req);
  if (!participant) return false;
  const member = await d1().prepare("SELECT 1 FROM group_members WHERE group_id = ? AND participant_id = ?").bind(groupId, participant).first();
  return Boolean(member);
}
