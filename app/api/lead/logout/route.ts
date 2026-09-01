import { NextResponse } from "next/server";
import { destroyAdminSession } from "../../_shared";

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  await destroyAdminSession(req, res);
  return res;
}
