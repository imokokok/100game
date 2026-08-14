import { NextRequest, NextResponse } from "next/server";
import { isOwner, participantId } from "../_shared";

export async function POST(req: NextRequest) {
  if (!participantId(req) && !isOwner(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  return NextResponse.json({ id: crypto.randomUUID(), name: file.name, size: file.size, status: "accepted" }, { status: 201 });
}
