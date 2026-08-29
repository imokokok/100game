import { NextRequest, NextResponse } from "next/server";
import { d1, isLead, participantId, deleteBlob } from "../_shared";

export async function POST(req: NextRequest) {
  const ownerView = await isLead(req);
  const participant = await participantId(req);
  if (!participant && !ownerView) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim().slice(0, 80);
  const requestedMembers = Array.isArray(body.members) ? body.members.map(String) : [];
  const members = [...new Set(!ownerView&&participant ? [participant, ...requestedMembers] : requestedMembers)].slice(0, 100);
  if (!name) return NextResponse.json({ error: "Group name required" }, { status: 400 });
  const id = crypto.randomUUID();
  const channelId = crypto.randomUUID();
  const now = Date.now();
  const creator = ownerView ? "lead:Hera" : participant!;
  const statements = [d1().prepare("INSERT INTO groups (id, name, created_by, created_at) VALUES (?, ?, ?, ?)").bind(id, name, creator, now)];
  statements.push(d1().prepare("INSERT INTO group_channels (id, group_id, name, kind, position, created_at) VALUES (?, ?, 'general', 'text', 0, ?)").bind(channelId, id, now));
  for (const participant of members) statements.push(d1().prepare("INSERT OR IGNORE INTO group_members (group_id, participant_id, joined_at) SELECT ?, id, ? FROM participants WHERE id = ?").bind(id, now, participant));
  await d1().batch(statements);
  return NextResponse.json({ group: { id, name, memberCount: members.length, defaultChannel: { id: channelId, group_id: id, name: "general", kind: "text", position: 0 } } }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const participant = await participantId(req);
  const ownerView = await isLead(req);
  if (!participant && !ownerView) return NextResponse.json({ error: "Invitation required" }, { status: 401 });
  const query = ownerView
    ? `SELECT g.id, g.name, g.created_at, COUNT(gm.participant_id) AS member_count,
        (SELECT id FROM group_channels WHERE group_id = g.id ORDER BY position, created_at LIMIT 1) AS default_channel_id,
        (SELECT name FROM group_channels WHERE group_id = g.id ORDER BY position, created_at LIMIT 1) AS default_channel_name
      FROM groups g LEFT JOIN group_members gm ON gm.group_id = g.id GROUP BY g.id ORDER BY g.created_at DESC`
    : `SELECT g.id, g.name, g.created_at, COUNT(all_members.participant_id) AS member_count,
        (SELECT id FROM group_channels WHERE group_id = g.id ORDER BY position, created_at LIMIT 1) AS default_channel_id,
        (SELECT name FROM group_channels WHERE group_id = g.id ORDER BY position, created_at LIMIT 1) AS default_channel_name
      FROM groups g JOIN group_members mine ON mine.group_id = g.id AND mine.participant_id = ? LEFT JOIN group_members all_members ON all_members.group_id = g.id GROUP BY g.id ORDER BY g.created_at DESC`;
  const rows = ownerView ? await d1().prepare(query).all() : await d1().prepare(query).bind(participant).all();
  return NextResponse.json({ groups: rows.results.map(row=>({...row,can_manage:ownerView})), canManage: ownerView, canCreate: true });
}

export async function PATCH(req:NextRequest){if(!(await isLead(req)))return NextResponse.json({error:"Only the Lead Designer can manage group members"},{status:403});const body=await req.json().catch(()=>({}));const id=String(body.id??"");const name=String(body.name??"").trim().slice(0,80);const members=Array.isArray(body.members)?[...new Set(body.members.map(String))].slice(0,100):[];if(!id||!name)return NextResponse.json({error:"Group and name required"},{status:400});const now=Date.now();const statements=[d1().prepare("UPDATE groups SET name = ? WHERE id = ?").bind(name,id),d1().prepare("DELETE FROM group_members WHERE group_id = ?").bind(id)];for(const participant of members)statements.push(d1().prepare("INSERT OR IGNORE INTO group_members (group_id, participant_id, joined_at) SELECT ?, id, ? FROM participants WHERE id = ?").bind(id,now,participant));await d1().batch(statements);return NextResponse.json({ok:true})}

export async function DELETE(req:NextRequest){if(!(await isLead(req)))return NextResponse.json({error:"Only the Lead Designer can delete groups"},{status:403});const id=req.nextUrl.searchParams.get("id")??"";if(!id)return NextResponse.json({error:"Group required"},{status:400});const files=await d1().prepare("SELECT object_key FROM uploaded_files WHERE group_id = ?").bind(id).all<{object_key:string}>();for(const file of files.results)await deleteBlob(file.object_key);await d1().batch([d1().prepare("DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE group_id = ?)").bind(id),d1().prepare("DELETE FROM messages WHERE group_id = ?").bind(id),d1().prepare("DELETE FROM uploaded_files WHERE group_id = ?").bind(id),d1().prepare("DELETE FROM group_channels WHERE group_id = ?").bind(id),d1().prepare("DELETE FROM group_members WHERE group_id = ?").bind(id),d1().prepare("DELETE FROM groups WHERE id = ?").bind(id)]);return NextResponse.json({ok:true})}
