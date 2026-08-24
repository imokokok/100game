import { NextRequest, NextResponse } from "next/server";
import { canAccessGroup, d1, isOwner, participantId, getBlob, putBlob, deleteBlob } from "../_shared";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "audio/mpeg", "audio/wav", "audio/mp4", "video/mp4", "application/pdf", "text/plain", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]);
const workspaceCategories = new Set(["draft", "process", "final"]);

export async function POST(req: NextRequest) {
  const participant = await participantId(req);
  if (!participant && !isOwner(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  const groupId = String(form.get("groupId") ?? "") || null;
  const taskId = String(form.get("taskId") ?? "") || null;
  const requestedCategory = String(form.get("category") ?? "");
  const category = workspaceCategories.has(requestedCategory) ? requestedCategory : "draft";
  const requestedWeek = Number(form.get("week") ?? 0);
  const week = Number.isInteger(requestedWeek) && requestedWeek >= 0 && requestedWeek <= 4 ? requestedWeek : 0;
  if (!(file instanceof File) || file.size === 0 || file.size > 50 * 1024 * 1024 || !allowedTypes.has(file.type)) return NextResponse.json({ error: "Unsupported file or file is larger than 50 MB" }, { status: 400 });
  if (groupId && !(await canAccessGroup(req, groupId))) return NextResponse.json({ error: "Group membership required" }, { status: 403 });
  const ownerKey = participant ?? "owner";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "upload";
  const id = crypto.randomUUID();
  const objectKey = `${groupId ? `groups/${groupId}` : `workspace/week-${week}/${category}`}/${id}-${safeName}`;
  await putBlob(objectKey, file, file.type);
  const now = Date.now();
  await d1().prepare("INSERT INTO uploaded_files (id, participant_id, group_id, task_id, category, week, object_key, name, content_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, ownerKey, groupId, taskId, category, week, objectKey, file.name.slice(0, 240), file.type, file.size, now).run();
  return NextResponse.json({ file: { id, name: file.name, size: file.size, contentType: file.type, createdAt: now } }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const groupId = req.nextUrl.searchParams.get("groupId") ?? "";
  const category = req.nextUrl.searchParams.get("category") ?? "";
  const requestedWeek = Number(req.nextUrl.searchParams.get("week") ?? 0);
  const week = Number.isInteger(requestedWeek) && requestedWeek >= 0 && requestedWeek <= 4 ? requestedWeek : 0;
  if (!id && !groupId && !category && req.nextUrl.searchParams.has("week")) {
    if (!(await participantId(req)) && !isOwner(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rows = await d1().prepare("SELECT id, name, content_type, size, created_at, participant_id, category, week FROM uploaded_files WHERE week = ? AND group_id IS NULL AND category IN ('draft', 'process', 'final') ORDER BY created_at DESC LIMIT 300").bind(week).all();
    return NextResponse.json({ files: rows.results });
  }
  if (!id && workspaceCategories.has(category)) {
    if (!(await participantId(req)) && !isOwner(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const rows = await d1().prepare("SELECT id, name, content_type, size, created_at, participant_id, category, week FROM uploaded_files WHERE category = ? AND week = ? AND group_id IS NULL ORDER BY created_at DESC LIMIT 100").bind(category, week).all();
    return NextResponse.json({ files: rows.results });
  }
  if (!id && groupId) {
    if (!(await canAccessGroup(req, groupId))) return NextResponse.json({ error: "Group membership required" }, { status: 403 });
    const rows = await d1().prepare("SELECT id, name, content_type, size, created_at, participant_id FROM uploaded_files WHERE group_id = ? ORDER BY created_at DESC LIMIT 100").bind(groupId).all();
    return NextResponse.json({ files: rows.results });
  }
  const row = await d1().prepare("SELECT participant_id, group_id, category, object_key, name, content_type FROM uploaded_files WHERE id = ?").bind(id).first<{ participant_id: string; group_id: string | null; category: string; object_key: string; name: string; content_type: string }>();
  if (!row) return NextResponse.json({ error: "File not found" }, { status: 404 });
  const viewer = await participantId(req);
  const allowed = isOwner(req) || (row.group_id ? await canAccessGroup(req, row.group_id) : workspaceCategories.has(row.category) ? Boolean(viewer) : viewer === row.participant_id);
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  const object = await getBlob(row.object_key);
  if (!object) return NextResponse.json({ error: "File missing" }, { status: 404 });
  return new Response(object.body, { headers: { "content-type": row.content_type, "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(row.name)}`, "cache-control": "private, no-store" } });
}
