import { NextResponse } from "next/server";
import { d1, isLead } from "../../_shared";
import { hasSurveyResultsAccess } from "../_auth";

export async function GET(req: Request) {
  if (!hasSurveyResultsAccess(req) && !(await isLead(req))) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }
  const { results } = await d1()
    .prepare(
      "SELECT id, wechat_name, locale, payload, submitted_at FROM questionnaire_responses WHERE payload::jsonb ->> '_surveyType' = ? ORDER BY submitted_at DESC LIMIT 1000",
    )
    .bind("npc-design")
    .all();
  return NextResponse.json(
    { responses: results },
    { headers: { "cache-control": "private, no-store", "x-content-type-options": "nosniff" } },
  );
}
