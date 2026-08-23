import { NextRequest, NextResponse } from "next/server";
import { d1, isLead, isOwner } from "../_shared";

export async function GET(req: NextRequest) {
  if (!(isOwner(req)||await isLead(req))) return NextResponse.json({ error: "Lead sign-in required" }, { status: 401 });
  const db = d1();
  const rows = await db.prepare(`
    SELECT p.id, p.display_code, p.last_active_at, p.activity_count,
      COALESCE(SUM(c.points), 0) AS contribution_score
    FROM participants p
    LEFT JOIN contribution_entries c ON c.participant_id = p.id
    GROUP BY p.id, p.display_code, p.last_active_at, p.activity_count
    ORDER BY p.last_active_at DESC
    LIMIT 100
  `).all();
  return NextResponse.json({ participants: rows.results });
}

export async function POST(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: "Only the Owner can record contribution scores" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const participant = String(body.participantId ?? "");
  const points = Math.trunc(Number(body.points));
  const reason = String(body.reason ?? "").trim().slice(0, 240);
  if (!participant || !Number.isFinite(points) || points < -1000 || points > 1000 || !reason) return NextResponse.json({ error: "Invalid score entry" }, { status: 400 });
  const recorder = req.headers.get("oai-authenticated-user-id")!;
  await d1().prepare("INSERT INTO contribution_entries (id, participant_id, points, reason, recorded_by, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), participant, points, reason, recorder, Date.now()).run();
  return NextResponse.json({ ok: true }, { status: 201 });
}
