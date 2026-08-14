import { NextRequest, NextResponse } from "next/server";
import { isOwner, participantId } from "../_shared";

export async function POST(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: "Only the Owner can create groups" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ id: crypto.randomUUID(), name: String(body.name ?? "未命名小组") }, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!participantId(req) && !isOwner(req)) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  return NextResponse.json({ groups: [] });
}
