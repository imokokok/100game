import { NextResponse } from "next/server";
import { constantTimeEqual } from "../../../../db/admin-crypto.mjs";
import { beginLeadLoginAttempt, clearLeadLoginAttempts } from "../../_shared";
import { setSurveyResultsSession } from "../_auth";

export async function POST(req: Request) {
  let attempt;
  try {
    attempt = await beginLeadLoginAttempt(req, "survey-results");
  } catch {
    return NextResponse.json(
      { error: "Results access is temporarily unavailable" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  if (!attempt.allowed) {
    return NextResponse.json(
      { error: "Too many attempts" },
      {
        status: 429,
        headers: { "cache-control": "no-store", "retry-after": String(attempt.retryAfter) },
      },
    );
  }

  const body = (await req.json().catch(() => ({}))) as { code?: unknown };
  const expectedCode = process.env.SURVEY_RESULTS_ACCESS_CODE ?? "100";
  if (!constantTimeEqual(String(body.code ?? ""), expectedCode)) {
    return NextResponse.json(
      { error: "Invalid verification code" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const res = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  if (!setSurveyResultsSession(res)) {
    return NextResponse.json(
      { error: "Results access is not configured" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  await clearLeadLoginAttempts(attempt.clientKey);
  return res;
}
