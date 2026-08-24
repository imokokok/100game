import { NextRequest, NextResponse } from "next/server";
import { d1, isOwner, participantId } from "../_shared";

const allowedKinds = new Set(["session_start", "view", "heartbeat", "interaction"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const kind = allowedKinds.has(body.kind) ? body.kind : "interaction";
  const surface = String(body.surface ?? "home").slice(0, 64);
  const duration = Math.max(0, Math.min(300, Number(body.durationSeconds) || 0));
  const existing = await participantId(req);
  if(!existing)return isOwner(req)?NextResponse.json({ok:true}):NextResponse.json({error:"Invitation required"},{status:401});
  const id = existing;
  const now = Date.now();
  const db = d1();

  await db.batch([
    db.prepare("INSERT INTO activity_events (id, participant_id, kind, surface, duration_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, kind, surface, duration, now),
    db.prepare("UPDATE participants SET last_active_at = ?, activity_count = activity_count + 1 WHERE id = ?").bind(now, id),
  ]);

  return NextResponse.json({ ok: true });
}
