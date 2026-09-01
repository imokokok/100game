import { NextRequest, NextResponse } from "next/server";
import { currentAdmin, d1, participantId, sha256 } from "../_shared";

export async function GET(req: NextRequest) {
  const admin = await currentAdmin(req);
  if(admin)return NextResponse.json({participant:{id:"owner",display_code:admin.displayName,locale:"zh"},role:"lead"},{headers:{"cache-control":"private, no-store"}});
  const id = await participantId(req);
  if (!id) return NextResponse.json({ participant: null });
  const row = await d1().prepare("SELECT id, display_code, locale FROM participants WHERE id = ?").bind(id).first();
  return NextResponse.json({ participant: row ?? null, role: row ? "participant" : null });
}

export async function POST(req: NextRequest) {
  const { token, name } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing invitation" }, { status: 400 });
  const displayName=String(name??"").replace(/[\u0000-\u001F\u007F]/g,"").trim().slice(0,40);
  const row = await d1().prepare("SELECT i.id AS invitation_id, i.participant_id AS id, i.reusable, p.display_code, p.locale FROM invitations i LEFT JOIN participants p ON p.id = i.participant_id WHERE i.token_hash = ? AND i.revoked_at IS NULL AND (i.expires_at IS NULL OR i.expires_at > ?)").bind(sha256(String(token).trim()), Date.now()).first<{invitation_id:string;id:string|null;reusable:number;display_code:string|null;locale:string|null}>();
  if (!row) return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 403 });
  if(!displayName)return NextResponse.json({error:"Participant name is required"},{status:400});
  const now=Date.now();
  let participant:{id:string;display_code:string;locale:string}|null=null;
  if(row.reusable){
    const existingId=await participantId(req);
    if(existingId){
      const saved=await d1().prepare("SELECT id, display_code, locale FROM participants WHERE id = ?").bind(existingId).first<{id:string;display_code:string;locale:string}>();
      if(saved?.display_code===displayName)participant=saved;
    }
    // The shared 911 invitation points at a sentinel participant in the seed
    // data. Never reuse that sentinel—or another person's matching display
    // name—for a new browser. Only a valid existing cookie may restore an ID.
    if(!participant){
      const id=crypto.randomUUID();
      participant={id,display_code:displayName,locale:"zh"};
      await d1().prepare("INSERT INTO participants (id, display_code, locale, created_at, last_active_at, activity_count) VALUES (?, ?, 'zh', ?, NULL, 0)").bind(id,displayName,now).run();
    }
  }else if(row.id&&row.display_code){
    participant={id:row.id,display_code:row.display_code,locale:row.locale||"zh"};
  }
  if(!participant)return NextResponse.json({error:"Invitation participant unavailable"},{status:403});
  if(participant.display_code!==displayName){await d1().prepare("UPDATE participants SET display_code = ? WHERE id = ?").bind(displayName,participant.id).run();participant={...participant,display_code:displayName}}
  const session=crypto.randomUUID()+crypto.randomUUID();const expires=now+60*60*24*30*1000;await d1().prepare("INSERT INTO participant_sessions (token_hash, participant_id, created_at, expires_at) VALUES (?, ?, ?, ?)").bind(sha256(session),participant.id,now,expires).run();
  const res = NextResponse.json({ participant }, { headers: { "cache-control": "private, no-store" } });
  res.cookies.set("participant_session", session, { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
