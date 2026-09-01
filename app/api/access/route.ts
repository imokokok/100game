import { NextRequest, NextResponse } from "next/server";
import { POST as participantLogin } from "../participant/route";
import { clearAdminSession } from "../_shared";

/**
 * Invitation entry for participants only.
 *
 * Lead sign-in has its own route. This endpoint used to branch on whether the
 * submitted name matched the lead's, which handed any visitor a way to confirm
 * which administrator names exist. Verifying one credential type per endpoint
 * removes that signal.
 */
export async function POST(req: NextRequest) {
  const { code, name } = (await req.json().catch(() => ({}))) as { code?: string; name?: string };
  const value = String(code ?? "").trim();
  if (!value) return NextResponse.json({ error: "Missing access code" }, { status: 400, headers: { "cache-control": "no-store" } });
  const participantHeaders = new Headers({ "content-type": "application/json" });
  const participantCookie = req.headers.get("cookie");
  if (participantCookie) participantHeaders.set("cookie", participantCookie);
  const participantReq = new NextRequest(new URL("/api/participant", req.url), {
    method: "POST",
    headers: participantHeaders,
    body: JSON.stringify({ token: value, name }),
  });
  const res = await participantLogin(participantReq);
  // A participant signing in on a shared browser ends any lead session there,
  // so the two identities never stay active on the same device.
  clearAdminSession(res);
  if (!res.ok) return res;
  const data = (await res.clone().json()) as { participant: unknown };
  return new NextResponse(JSON.stringify({ role: "participant", participant: data.participant }), {
    status: res.status,
    headers: res.headers,
  });
}
