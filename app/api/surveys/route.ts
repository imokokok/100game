import { NextRequest, NextResponse } from "next/server";
import { d1, isLead, participantId } from "../_shared";

export async function GET(req: NextRequest) {
  const manage = req.nextUrl.searchParams.get("manage") === "1";
  const lead = manage ? await isLead(req) : false;
  if (manage && !lead) return NextResponse.json({ error: "Lead access required" }, { status: 403 });
  if (manage) {
    const rows = await d1().prepare("SELECT id, title_zh, title_en, question_zh, question_en, status, created_at FROM survey_forms ORDER BY created_at DESC").all();
    const responseRows = await d1().prepare(`
      SELECT r.id, r.survey_id, r.participant_id, COALESCE(p.display_code, r.participant_id) AS participant_name, r.payload, r.updated_at
      FROM survey_responses r
      LEFT JOIN participants p ON p.id = r.participant_id
      ORDER BY r.updated_at DESC
      LIMIT 2000
    `).all<{id:string;survey_id:string;participant_id:string;participant_name:string;payload:string;updated_at:number}>();
    const responses = responseRows.results.map(({payload,...response})=>{
      let answers:Record<string,unknown>={};
      try { const parsed=JSON.parse(payload) as unknown;if(parsed&&typeof parsed==="object"&&!Array.isArray(parsed))answers=parsed as Record<string,unknown>; }
      catch { answers={response:payload}; }
      return {...response,answers};
    });
    return NextResponse.json({ forms: rows.results, responses }, { headers: { "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  }
  const participant = await participantId(req);
  if (!participant) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  const form = await d1().prepare("SELECT id, title_zh, title_en, question_zh, question_en FROM survey_forms WHERE status = 'active' ORDER BY created_at DESC LIMIT 1").first<{id:string;title_zh:string;title_en:string;question_zh:string;question_en:string}>();
  if (!form) return NextResponse.json({ form: null, response: null });
  const surveyId = form.id;
  const row = await d1().prepare("SELECT payload, updated_at FROM survey_responses WHERE participant_id = ? AND survey_id = ?").bind(participant, surveyId).first<{ payload: string; updated_at: number }>();
  let response = null;
  if (row) {
    try { response = { ...JSON.parse(row.payload), updatedAt: row.updated_at }; }
    catch { response = { updatedAt: row.updated_at }; }
  }
  return NextResponse.json({ form, response });
}

export async function POST(req: NextRequest) {
  const participant = await participantId(req);
  if (!participant) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const surveyId = String(body.surveyId ?? "");
  const scale = Math.max(1, Math.min(5, Math.trunc(Number(body.scale) || 0)));
  const moment = String(body.moment ?? "").trim().slice(0, 4000);
  if (!scale || !surveyId) return NextResponse.json({ error: "Survey and rating required" }, { status: 400 });
  const form = await d1().prepare("SELECT id FROM survey_forms WHERE id = ? AND status = 'active'").bind(surveyId).first();
  if (!form) return NextResponse.json({ error: "Survey unavailable" }, { status: 404 });
  const now = Date.now();
  const payload = JSON.stringify({ scale, moment });
  await d1().prepare(`
    INSERT INTO survey_responses (id, participant_id, survey_id, payload, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(participant_id, survey_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
  `).bind(crypto.randomUUID(), participant, surveyId, payload, now).run();
  return NextResponse.json({ ok: true, updatedAt: now });
}

export async function PUT(req: NextRequest) {
  if (!(await isLead(req))) return NextResponse.json({ error: "Only the Lead Designer can create surveys" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const titleZh = String(body.titleZh ?? "").trim().slice(0, 160);
  const titleEn = String(body.titleEn ?? titleZh).trim().slice(0, 160);
  const questionZh = String(body.questionZh ?? "").trim().slice(0, 500);
  const questionEn = String(body.questionEn ?? questionZh).trim().slice(0, 500);
  if (!titleZh || !questionZh) return NextResponse.json({ error: "Title and question required" }, { status: 400 });
  const id = crypto.randomUUID();
  const now = Date.now();
  await d1().batch([
    d1().prepare("UPDATE survey_forms SET status = 'archived' WHERE status = 'active'"),
    d1().prepare("INSERT INTO survey_forms (id, title_zh, title_en, question_zh, question_en, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)").bind(id,titleZh,titleEn,questionZh,questionEn,now),
  ]);
  return NextResponse.json({ form: { id, title_zh:titleZh, title_en:titleEn, question_zh:questionZh, question_en:questionEn, status:"active", created_at:now } }, { status: 201 });
}
