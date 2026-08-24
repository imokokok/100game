import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

export const LEAD_NAME = "Hera";
const LEAD_SESSION_MAX_AGE = 60 * 60 * 8;

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

async function signLeadPayload(payload:string){
  const secret=(env as unknown as {LEAD_SESSION_SECRET?:string}).LEAD_SESSION_SECRET;
  if(!secret)throw new Error("Lead session secret is unavailable");
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload)));
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/g,"");
}

export function validLeadCredentials(name:unknown,code:unknown){
  const expectedCode=(env as unknown as {LEAD_ACCESS_CODE?:string}).LEAD_ACCESS_CODE;
  const submittedName=String(name??"").trim();
  const submittedCode=String(code??"").trim();
  return Boolean(expectedCode&&safeEq(submittedName,LEAD_NAME)&&safeEq(submittedCode,expectedCode));
}

export async function setLeadSession(res:NextResponse){
  const expiry=Date.now()+LEAD_SESSION_MAX_AGE*1000;
  const payload=`${LEAD_NAME}.${expiry}`;
  const token=`${payload}.${await signLeadPayload(payload)}`;
  res.cookies.set("lead_session",token,{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:LEAD_SESSION_MAX_AGE});
}

export function clearLeadSession(res:NextResponse){
  res.cookies.set("lead_session","",{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:0});
}

export async function isLead(req:Request){
  const raw=req.headers.get("cookie")?.match(/(?:^|; )lead_session=([^;]+)/)?.[1];
  if(!raw)return false;
  const parts=decodeURIComponent(raw).split(".");
  if(parts.length!==3)return false;
  const [name,expiry,sig]=parts;
  const expiresAt=Number(expiry);
  if(!safeEq(name,LEAD_NAME)||!Number.isFinite(expiresAt)||Date.now()>expiresAt)return false;
  const expected=await signLeadPayload(`${name}.${expiry}`);
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
