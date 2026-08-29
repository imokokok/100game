import { NextRequest, NextResponse } from "next/server";
import { d1, isLead, participantId } from "../_shared";

export async function GET(req: NextRequest) {
  const participant = await participantId(req);
  const lead=await isLead(req);
  if (!participant && !lead) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  if (lead) {
    const rows = await d1().prepare("SELECT id, title_zh, title_en, status, sort_order, week FROM tasks ORDER BY week, sort_order").all();
    return NextResponse.json({ tasks: rows.results });
  }
  const rows = await d1().prepare(`
    SELECT t.id, t.title_zh, t.title_en, t.status, t.sort_order, t.week,
      s.body, s.status AS submission_status, s.updated_at
    FROM tasks t LEFT JOIN submissions s ON s.task_id = t.id AND s.participant_id = ?
    WHERE t.status != 'archived' ORDER BY t.week, t.sort_order
  `).bind(participant).all();
  return NextResponse.json({ tasks: rows.results });
}

export async function POST(req: NextRequest) {
  const participant = await isLead(req) ? "owner" : await participantId(req);
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

export async function PUT(req: NextRequest) {
  if (!(await isLead(req))) return NextResponse.json({ error: "Only the Lead Designer can create tasks" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const titleZh = String(body.titleZh ?? "").trim().slice(0, 160);
  const titleEn = String(body.titleEn ?? titleZh).trim().slice(0, 160);
  const week = Math.max(0, Math.min(4, Number(body.week) || 0));
  if (!titleZh) return NextResponse.json({ error: "Task title required" }, { status: 400 });
  const id = crypto.randomUUID();
  const order = Number((await d1().prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM tasks").first<{next_order:number}>())?.next_order ?? 1);
  await d1().prepare("INSERT INTO tasks (id, title_zh, title_en, status, sort_order, week) VALUES (?, ?, ?, 'active', ?, ?)").bind(id, titleZh, titleEn, order, week).run();
  return NextResponse.json({ task: { id, title_zh: titleZh, title_en: titleEn, status: "active", sort_order: order, week } }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await isLead(req))) return NextResponse.json({ error: "Only the Lead Designer can update tasks" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? "");
  const status = body.status === "archived" ? "archived" : "active";
  if (!id) return NextResponse.json({ error: "Task required" }, { status: 400 });
  await d1().prepare("UPDATE tasks SET status = ? WHERE id = ?").bind(status, id).run();
  return NextResponse.json({ ok: true });
}
