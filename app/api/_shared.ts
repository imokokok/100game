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

function safeEq(a:string,b:string){
  if(a.length!==b.length)return false;
  let value=0;
  for(let i=0;i<a.length;i++)value|=a.charCodeAt(i)^b.charCodeAt(i);
  return value===0;
}

export async function isLead(req:Request){
  const raw=req.headers.get("cookie")?.match(/(?:^|; )lead_session=([^;]+)/)?.[1];
  if(!raw)return false;
  const [expiry,sig]=decodeURIComponent(raw).split(".");
  if(!expiry||!sig||Date.now()>Number(expiry)||!env.LEAD_SESSION_SECRET)return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(env.LEAD_SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(expiry)));
  const expected=btoa(String.fromCharCode(...bytes)).replace(/=+$/g,"");
  return safeEq(sig,expected);
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
