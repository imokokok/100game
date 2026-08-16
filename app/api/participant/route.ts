import { NextRequest, NextResponse } from "next/server";
import { d1, participantId, sha256 } from "../_shared";

export async function GET(req: NextRequest) {
  const id = await participantId(req);
  if (!id) return NextResponse.json({ participant: null });
  const row = await d1().prepare("SELECT id, display_code, locale FROM participants WHERE id = ?").bind(id).first();
  return NextResponse.json({ participant: row ?? null });
}

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing invitation" }, { status: 400 });
  const row = await d1().prepare("SELECT i.participant_id AS id, p.display_code, p.locale FROM invitations i JOIN participants p ON p.id = i.participant_id WHERE i.token_hash = ? AND i.revoked_at IS NULL AND (i.expires_at IS NULL OR i.expires_at > ?)").bind(await sha256(String(token).trim()), Date.now()).first();
  if (!row) return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 403 });
  const session=crypto.randomUUID()+crypto.randomUUID();const now=Date.now();const expires=now+60*60*24*30*1000;await d1().prepare("INSERT INTO participant_sessions (token_hash, participant_id, created_at, expires_at) VALUES (?, ?, ?, ?)").bind(await sha256(session),String(row.id),now,expires).run();
  const res = NextResponse.json({ participant: row });
  res.cookies.set("participant_session", session, { httpOnly: true, sameSite: "strict", secure: true, maxAge: 60 * 60 * 24 * 30 });
  return res;
}
