import { NextRequest, NextResponse } from "next/server";
import { canAccessGroup, d1, isOwner, participantId } from "../_shared";

export async function GET(req: NextRequest) {
  const groupId = req.nextUrl.searchParams.get("groupId") ?? "";
  const channelId = req.nextUrl.searchParams.get("channelId") ?? "";
  if (!groupId || !channelId || !(await canAccessGroup(req, groupId))) return NextResponse.json({ error: "Group membership required" }, { status: 403 });
  const channel=await d1().prepare("SELECT id FROM group_channels WHERE id = ? AND group_id = ?").bind(channelId,groupId).first();if(!channel)return NextResponse.json({error:"Channel not found"},{status:404});
  const rows = await d1().prepare(`
    SELECT m.id, m.body, m.file_key, m.created_at, m.edited_at, m.participant_id, m.channel_id,
      COALESCE(p.display_code, 'Owner') AS display_code
    FROM messages m LEFT JOIN participants p ON p.id = m.participant_id
    WHERE m.group_id = ? AND m.channel_id = ? ORDER BY m.created_at ASC LIMIT 200
  `).bind(groupId,channelId).all();
  return NextResponse.json({ messages: rows.results });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const groupId = String(body.groupId ?? "");
  const channelId = String(body.channelId ?? "");
  const message = String(body.body ?? "").trim().slice(0, 4000);
  if (!groupId || !channelId || !message || !(await canAccessGroup(req, groupId))) return NextResponse.json({ error: "Invalid group message" }, { status: 403 });
  const channel=await d1().prepare("SELECT id FROM group_channels WHERE id = ? AND group_id = ?").bind(channelId,groupId).first();if(!channel)return NextResponse.json({error:"Channel not found"},{status:404});
  const ownerView = isOwner(req);
  const author = ownerView ? "owner" : ((await participantId(req)) ?? "");
  if (!author) return NextResponse.json({ error: "Sign-in required" }, { status: 401 });
  const id = crypto.randomUUID();
  const now = Date.now();
  await d1().prepare("INSERT INTO messages (id, group_id, channel_id, participant_id, body, file_key, created_at, edited_at) VALUES (?, ?, ?, ?, ?, NULL, ?, NULL)").bind(id, groupId, channelId, author, message, now).run();
  return NextResponse.json({ message: { id, body: message, participant_id: author, channel_id:channelId, display_code: ownerView ? "Owner" : undefined, created_at: now } }, { status: 201 });
}

export async function PATCH(req:NextRequest){const body=await req.json().catch(()=>({}));const id=String(body.id??"");const text=String(body.body??"").trim().slice(0,4000);const row=await d1().prepare("SELECT group_id, participant_id FROM messages WHERE id = ?").bind(id).first<{group_id:string;participant_id:string}>();if(!row||!text||!(await canAccessGroup(req,row.group_id)))return NextResponse.json({error:"Message unavailable"},{status:403});const participant=await participantId(req);if(!isOwner(req)&&participant!==row.participant_id)return NextResponse.json({error:"Only the author can edit this message"},{status:403});const now=Date.now();await d1().prepare("UPDATE messages SET body = ?, edited_at = ? WHERE id = ?").bind(text,now,id).run();return NextResponse.json({ok:true,editedAt:now})}
export async function DELETE(req:NextRequest){const id=req.nextUrl.searchParams.get("id")??"";const row=await d1().prepare("SELECT group_id, participant_id FROM messages WHERE id = ?").bind(id).first<{group_id:string;participant_id:string}>();if(!row||!(await canAccessGroup(req,row.group_id)))return NextResponse.json({error:"Message unavailable"},{status:403});const participant=await participantId(req);if(!isOwner(req)&&participant!==row.participant_id)return NextResponse.json({error:"Only the author can delete this message"},{status:403});await d1().batch([d1().prepare("DELETE FROM message_reactions WHERE message_id = ?").bind(id),d1().prepare("DELETE FROM messages WHERE id = ?").bind(id)]);return NextResponse.json({ok:true})}
