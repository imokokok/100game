import { NextRequest, NextResponse } from "next/server";
import { d1, participantId } from "../_shared";

const allowedKinds = new Set(["session_start", "view", "heartbeat", "interaction"]);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const kind = allowedKinds.has(body.kind) ? body.kind : "interaction";
  const surface = String(body.surface ?? "home").slice(0, 64);
  const duration = Math.max(0, Math.min(300, Number(body.durationSeconds) || 0));
  const existing = participantId(req);
  const id = existing ?? `anon-${crypto.randomUUID()}`;
  const now = Date.now();
  const db = d1();

  await db.batch([
    db.prepare("INSERT OR IGNORE INTO participants (id, display_code, locale, created_at, last_active_at, activity_count) VALUES (?, ?, 'zh', ?, ?, 0)").bind(id, `访客-${id.slice(-4).toUpperCase()}`, now, now),
    db.prepare("INSERT INTO activity_events (id, participant_id, kind, surface, duration_seconds, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), id, kind, surface, duration, now),
    db.prepare("UPDATE participants SET last_active_at = ?, activity_count = activity_count + 1 WHERE id = ?").bind(now, id),
  ]);

  const res = NextResponse.json({ ok: true });
  if (!existing) res.cookies.set("participant", id, { httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 24 * 365 });
  return res;
}
