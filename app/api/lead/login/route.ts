import { NextResponse } from "next/server";
import {
  beginLeadLoginAttempt,
  clearLeadLoginAttempts,
  clearAdminSession,
  clearParticipantSession,
  createAdminSession,
  recordAudit,
  verifyAdminCredentials,
} from "../../_shared";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
    // Accepted so an older client that still posts `name` / `code` keeps working.
    name?: string;
    code?: string;
  };
  const username = body.username ?? body.name;
  const password = body.password ?? body.code;

  let attempt;
  try {
    attempt = await beginLeadLoginAttempt(req);
  } catch {
    return NextResponse.json({ error: "Lead access is temporarily unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
  if (!attempt.allowed) {
    return NextResponse.json(
      { error: "Too many lead login attempts" },
      { status: 429, headers: { "cache-control": "no-store", "retry-after": String(attempt.retryAfter) } },
    );
  }

  const admin = await verifyAdminCredentials(username, password);
  if (!admin) {
    // Deliberately identical for an unknown username, a wrong password, and a
    // disabled account, so the response cannot be used to probe either half.
    await recordAudit(null, "login_failed", String(username ?? "").trim().slice(0, 120) || null, req);
    const res = NextResponse.json({ error: "Invalid lead credentials" }, { status: 401, headers: { "cache-control": "no-store" } });
    clearAdminSession(res);
    return res;
  }

  await clearLeadLoginAttempts(attempt.clientKey);
  const res = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  await createAdminSession(req, res, admin);
  clearParticipantSession(res);
  return res;
}
