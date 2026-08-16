import { NextRequest, NextResponse } from "next/server";
import { canAccessGroup, d1, isOwner, participantId } from "../_shared";

export async function GET(req: NextRequest) {
  const groupId = req.nextUrl.searchParams.get("groupId") ?? "";
  if (!groupId || !(await canAccessGroup(req, groupId))) return NextResponse.json({ error: "Group membership required" }, { status: 403 });
  const rows = await d1().prepare(`
    SELECT m.id, m.body, m.file_key, m.created_at, m.participant_id,
      COALESCE(p.display_code, 'Owner') AS display_code
    FROM messages m LEFT JOIN participants p ON p.id = m.participant_id
    WHERE m.group_id = ? ORDER BY m.created_at ASC LIMIT 200
  `).bind(groupId).all();
  return NextResponse.json({ messages: rows.results });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const groupId = String(body.groupId ?? "");
  const message = String(body.body ?? "").trim().slice(0, 4000);
  if (!groupId || !message || !(await canAccessGroup(req, groupId))) return NextResponse.json({ error: "Invalid group message" }, { status: 403 });
  const ownerView = isOwner(req);
  const author = ownerView ? "owner" : ((await participantId(req)) ?? "");
  if (!author) return NextResponse.json({ error: "Sign-in required" }, { status: 401 });
  const id = crypto.randomUUID();
  const now = Date.now();
  await d1().prepare("INSERT INTO messages (id, group_id, participant_id, body, file_key, created_at) VALUES (?, ?, ?, ?, NULL, ?)").bind(id, groupId, author, message, now).run();
  return NextResponse.json({ message: { id, body: message, participant_id: author, display_code: ownerView ? "Owner" : undefined, created_at: now } }, { status: 201 });
}
