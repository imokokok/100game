import { NextRequest, NextResponse } from "next/server";
import { d1, isOwner, participantId } from "../_shared";

export async function GET(req: NextRequest) {
  const participant = participantId(req);
  if (!participant && !isOwner(req)) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  if (isOwner(req) && !participant) {
    const rows = await d1().prepare("SELECT id, title_zh, title_en, status, sort_order FROM tasks ORDER BY sort_order").all();
    return NextResponse.json({ tasks: rows.results });
  }
  const rows = await d1().prepare(`
    SELECT t.id, t.title_zh, t.title_en, t.status, t.sort_order,
      s.body, s.status AS submission_status, s.updated_at
    FROM tasks t LEFT JOIN submissions s ON s.task_id = t.id AND s.participant_id = ?
    WHERE t.status != 'archived' ORDER BY t.sort_order
  `).bind(participant).all();
  return NextResponse.json({ tasks: rows.results });
}

export async function POST(req: NextRequest) {
  const participant = participantId(req);
  if (!participant) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const taskId = String(body.taskId ?? "");
  const text = String(body.body ?? "").trim().slice(0, 12000);
  const status = body.status === "submitted" ? "submitted" : "draft";
  if (!taskId) return NextResponse.json({ error: "Task required" }, { status: 400 });
  const task = await d1().prepare("SELECT id FROM tasks WHERE id = ? AND status != 'archived'").bind(taskId).first();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  const now = Date.now();
  await d1().prepare(`
    INSERT INTO submissions (id, participant_id, task_id, kind, body, file_key, status, updated_at)
    VALUES (?, ?, ?, 'text', ?, NULL, ?, ?)
    ON CONFLICT(participant_id, task_id) DO UPDATE SET body = excluded.body, status = excluded.status, updated_at = excluded.updated_at
  `).bind(crypto.randomUUID(), participant, taskId, text, status, now).run();
  return NextResponse.json({ ok: true, status, updatedAt: now });
}
