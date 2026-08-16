import { NextRequest, NextResponse } from "next/server";
import { d1, participantId } from "../_shared";

const surveyId = "playtest-main";

export async function GET(req: NextRequest) {
  const participant = participantId(req);
  if (!participant) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  const row = await d1().prepare("SELECT payload, updated_at FROM survey_responses WHERE participant_id = ? AND survey_id = ?").bind(participant, surveyId).first<{ payload: string; updated_at: number }>();
  return NextResponse.json({ response: row ? { ...JSON.parse(row.payload), updatedAt: row.updated_at } : null });
}

export async function POST(req: NextRequest) {
  const participant = participantId(req);
  if (!participant) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const scale = Math.max(1, Math.min(5, Math.trunc(Number(body.scale) || 0)));
  const moment = String(body.moment ?? "").trim().slice(0, 4000);
  if (!scale) return NextResponse.json({ error: "Rating required" }, { status: 400 });
  const now = Date.now();
  const payload = JSON.stringify({ scale, moment });
  await d1().prepare(`
    INSERT INTO survey_responses (id, participant_id, survey_id, payload, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(participant_id, survey_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
  `).bind(crypto.randomUUID(), participant, surveyId, payload, now).run();
  return NextResponse.json({ ok: true, updatedAt: now });
}
