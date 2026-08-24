import { NextRequest, NextResponse } from "next/server";
import { d1, isLead, isOwner, LEAD_NAME } from "../_shared";

export async function GET(req: NextRequest) {
  if (!(isOwner(req)||await isLead(req))) return NextResponse.json({ error: "Lead sign-in required" }, { status: 401 });
  const db = d1();
  const rows = await db.prepare(`
    WITH completed_task_rows AS (
      SELECT s.participant_id, s.task_id
      FROM submissions s
      JOIN tasks t ON t.id = s.task_id
      WHERE s.status = 'submitted'
        AND t.status != 'owner_pending'
        AND t.title_zh NOT LIKE '%参与者信息问卷%'
        AND LOWER(t.title_en) NOT LIKE '%participant survey%'
      UNION
      SELECT f.participant_id, f.task_id
      FROM uploaded_files f
      JOIN tasks t ON t.id = f.task_id
      WHERE f.task_id IS NOT NULL
        AND t.status != 'owner_pending'
        AND t.title_zh NOT LIKE '%参与者信息问卷%'
        AND LOWER(t.title_en) NOT LIKE '%participant survey%'
    ),
    task_scores AS (
      SELECT participant_id, COUNT(DISTINCT task_id) AS submitted_points
      FROM completed_task_rows
      GROUP BY participant_id
    ),
    manual_scores AS (
      SELECT participant_id, COALESCE(SUM(points), 0) AS manual_points
      FROM contribution_entries
      GROUP BY participant_id
    )
    SELECT p.id, p.display_code, p.last_active_at, p.activity_count,
      COALESCE(ts.submitted_points, 0)
        + CASE WHEN EXISTS (
          SELECT 1 FROM questionnaire_responses q
          WHERE LOWER(TRIM(q.wechat_name)) = LOWER(TRIM(p.display_code))
        ) THEN 1 ELSE 0 END AS task_points,
      COALESCE(ms.manual_points, 0) AS manual_points,
      COALESCE(ts.submitted_points, 0)
        + CASE WHEN EXISTS (
          SELECT 1 FROM questionnaire_responses q
          WHERE LOWER(TRIM(q.wechat_name)) = LOWER(TRIM(p.display_code))
        ) THEN 1 ELSE 0 END
        + COALESCE(ms.manual_points, 0) AS contribution_score
    FROM participants p
    LEFT JOIN task_scores ts ON ts.participant_id = p.id
    LEFT JOIN manual_scores ms ON ms.participant_id = p.id
    ORDER BY contribution_score DESC, p.display_code COLLATE NOCASE
    LIMIT 100
  `).all();
  return NextResponse.json({ participants: rows.results });
}

export async function POST(req: NextRequest) {
  if (!(isOwner(req)||await isLead(req))) return NextResponse.json({ error: "Only the Lead Designer can adjust contribution scores" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const participant = String(body.participantId ?? "");
  const points = Math.trunc(Number(body.points));
  const reason = String(body.reason ?? "").trim().slice(0, 240);
  if (!participant || !Number.isFinite(points) || points < -1000 || points > 1000 || !reason) return NextResponse.json({ error: "Invalid score entry" }, { status: 400 });
  const recorder = req.headers.get("oai-authenticated-user-id")||`lead:${LEAD_NAME}`;
  await d1().prepare("INSERT INTO contribution_entries (id, participant_id, points, reason, recorded_by, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), participant, points, reason, recorder, Date.now()).run();
  return NextResponse.json({ ok: true }, { status: 201 });
}
