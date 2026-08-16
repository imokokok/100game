import { NextRequest, NextResponse } from "next/server";
import { d1 } from "../_shared";

async function hash(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(x => x.toString(16).padStart(2, "0")).join("");
}

export async function GET(req: NextRequest) {
  const id = req.cookies.get("participant")?.value;
  if (!id) return NextResponse.json({ participant: null });
  const row = await d1().prepare("SELECT id, display_code, locale FROM participants WHERE id = ?").bind(id).first();
  return NextResponse.json({ participant: row ?? null });
}

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing invitation" }, { status: 400 });
  const row = await d1().prepare("SELECT i.participant_id AS id, p.display_code, p.locale FROM invitations i JOIN participants p ON p.id = i.participant_id WHERE i.token_hash = ? AND i.revoked_at IS NULL AND (i.expires_at IS NULL OR i.expires_at > ?)").bind(await hash(String(token).trim()), Date.now()).first();
  if (!row) return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 403 });
  const res = NextResponse.json({ participant: row });
  res.cookies.set("participant", String(row.id), { httpOnly: true, sameSite: "strict", secure: true, maxAge: 60 * 60 * 24 * 30 });
  return res;
}
