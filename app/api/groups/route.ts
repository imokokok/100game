import { NextRequest, NextResponse } from "next/server";
import { d1, isOwner, participantId } from "../_shared";

export async function POST(req: NextRequest) {
  if (!isOwner(req)) return NextResponse.json({ error: "Only the Owner can create groups" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 80);
  const members = Array.isArray(body.members) ? [...new Set(body.members.map(String))].slice(0, 100) : [];
  if (!name) return NextResponse.json({ error: "Group name required" }, { status: 400 });
  const id = crypto.randomUUID();
  const now = Date.now();
  const owner = req.headers.get("oai-authenticated-user-id") ?? "owner";
  const statements = [d1().prepare("INSERT INTO groups (id, name, created_by, created_at) VALUES (?, ?, ?, ?)").bind(id, name, owner, now)];
  statements.push(d1().prepare("INSERT INTO group_channels (id, group_id, name, kind, position, created_at) VALUES (?, ?, 'general', 'text', 0, ?)").bind(crypto.randomUUID(), id, now));
  for (const participant of members) statements.push(d1().prepare("INSERT OR IGNORE INTO group_members (group_id, participant_id, joined_at) SELECT ?, id, ? FROM participants WHERE id = ?").bind(id, now, participant));
  await d1().batch(statements);
  return NextResponse.json({ group: { id, name, memberCount: members.length } }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const participant = await participantId(req);
  if (!participant && !isOwner(req)) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  const ownerView = isOwner(req);
  const query = ownerView
    ? `SELECT g.id, g.name, g.created_at, COUNT(gm.participant_id) AS member_count FROM groups g LEFT JOIN group_members gm ON gm.group_id = g.id GROUP BY g.id ORDER BY g.created_at DESC`
    : `SELECT g.id, g.name, g.created_at, COUNT(all_members.participant_id) AS member_count FROM groups g JOIN group_members mine ON mine.group_id = g.id AND mine.participant_id = ? LEFT JOIN group_members all_members ON all_members.group_id = g.id GROUP BY g.id ORDER BY g.created_at DESC`;
  const rows = ownerView ? await d1().prepare(query).all() : await d1().prepare(query).bind(participant).all();
  return NextResponse.json({ groups: rows.results.map(row=>({...row,can_manage:ownerView})) });
}
