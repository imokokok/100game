import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const SURVEY_RESULTS_COOKIE = "survey_results_session";
const SESSION_MAX_AGE_SECONDS = 4 * 60 * 60;
const SESSION_SCOPE = "survey-results";

function sessionSecret(): string | null {
  return process.env.SURVEY_RESULTS_SESSION_SECRET ?? process.env.LEAD_SESSION_SECRET ?? null;
}

function signature(expiresAt: string, secret: string): string {
  return createHmac("sha256", secret).update(`${SESSION_SCOPE}:${expiresAt}`).digest("base64url");
}

export function hasSurveyResultsAccess(req: Request): boolean {
  const secret = sessionSecret();
  if (!secret) return false;
  const cookie = req.headers.get("cookie")
    ?.split(";")
    .map(value => value.trim())
    .find(value => value.startsWith(`${SURVEY_RESULTS_COOKIE}=`));
  if (!cookie) return false;
  let raw: string;
  try {
    raw = decodeURIComponent(cookie.slice(SURVEY_RESULTS_COOKIE.length + 1));
  } catch {
    return false;
  }
  const separator = raw.indexOf(".");
  if (separator < 1) return false;
  const expiresAt = raw.slice(0, separator);
  const supplied = raw.slice(separator + 1);
  if (!/^\d+$/.test(expiresAt) || Number(expiresAt) <= Date.now()) return false;
  const expected = signature(expiresAt, secret);
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}

export function setSurveyResultsSession(res: NextResponse): boolean {
  const secret = sessionSecret();
  if (!secret) return false;
  const expiresAt = String(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  res.cookies.set(SURVEY_RESULTS_COOKIE, `${expiresAt}.${signature(expiresAt, secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return true;
}
