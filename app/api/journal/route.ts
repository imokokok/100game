import { NextRequest, NextResponse } from "next/server";
import { d1, isLead, isOwner, participantId, r2 } from "../_shared";

const imageTypes=new Set(["image/jpeg","image/png","image/webp","image/heic","image/heif"]);
const stages=new Set(["week-0","week-1","week-2","week-3","week-4"]);

async function canEdit(req:NextRequest){return isOwner(req)||await isLead(req)}
function clean(value:FormDataEntryValue|null,max:number){return String(value??"").replace(/[\u0000-\u001F\u007F]/g,"").trim().slice(0,max)}
function cleanStage(value:FormDataEntryValue|null){const stage=String(value??"");return stages.has(stage)?stage:"week-0"}
function cleanOccurredAt(value:FormDataEntryValue|null){const parsed=Date.parse(String(value??""));return Number.isFinite(parsed)?parsed:Date.now()}

export async function GET(req:NextRequest){
  const participant=await participantId(req);
  const editor=await canEdit(req);
  if(!participant&&!editor)return NextResponse.json({error:"Invitation required"},{status:401});
  const id=req.nextUrl.searchParams.get("id")??"";
  if(id){
    const row=await d1().prepare("SELECT file_key, content_type, file_name FROM journal_entries WHERE id = ?").bind(id).first<{file_key:string;content_type:string|null;file_name:string|null}>();
    if(!row)return NextResponse.json({error:"Entry not found"},{status:404});
    const object=await r2().get(row.file_key);
    if(!object?.body)return NextResponse.json({error:"File missing"},{status:404});
    return new Response(object.body,{headers:{"content-type":row.content_type||"application/octet-stream","content-disposition":`inline; filename*=UTF-8''${encodeURIComponent(row.file_name||"journal")}`,"cache-control":"private, max-age=300"}});
  }
  const rows=await d1().prepare("SELECT id, title_zh, title_en, body_zh, body_en, stage, tags, participant_id, content_type, file_name, occurred_at FROM journal_entries ORDER BY occurred_at DESC LIMIT 100").all();
  return NextResponse.json({entries:rows.results,canEdit:editor},{headers:{"cache-control":"private, no-store"}});
}

export async function POST(req:NextRequest){
  if(!(await canEdit(req)))return NextResponse.json({error:"Only the Lead Designer can publish journal entries"},{status:403});
  const form=await req.formData();
  const file=form.get("file");
  if(!(file instanceof File)||!file.size||file.size>20*1024*1024||!imageTypes.has(file.type))return NextResponse.json({error:"Image required (max 20 MB)"},{status:400});
  const titleZh=clean(form.get("titleZh"),160),titleEn=clean(form.get("titleEn"),160)||titleZh;
  const bodyZh=clean(form.get("bodyZh"),4000),bodyEn=clean(form.get("bodyEn"),4000)||bodyZh;
  const stage=cleanStage(form.get("stage")),tags=clean(form.get("tags"),300),occurredAt=cleanOccurredAt(form.get("occurredAt"));
  if(!titleZh)return NextResponse.json({error:"Title required"},{status:400});
  const id=crypto.randomUUID(),safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-120)||"image",key=`journal/${id}-${safe}`;
  await r2().put(key,file.stream(),{httpMetadata:{contentType:file.type}});
  await d1().prepare("INSERT INTO journal_entries (id, title_zh, title_en, body_zh, body_en, stage, tags, file_key, participant_id, content_type, file_name, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'owner', ?, ?, ?)").bind(id,titleZh,titleEn,bodyZh,bodyEn,stage,tags,key,file.type,file.name.slice(0,240),occurredAt).run();
  return NextResponse.json({ok:true,id},{status:201});
}

export async function PATCH(req:NextRequest){
  if(!(await canEdit(req)))return NextResponse.json({error:"Only the Lead Designer can edit journal entries"},{status:403});
  const body=await req.json().catch(()=>({})) as Record<string,unknown>;
  const id=String(body.id??""),titleZh=String(body.titleZh??"").trim().slice(0,160),titleEn=String(body.titleEn??titleZh).trim().slice(0,160)||titleZh;
  const bodyZh=String(body.bodyZh??"").trim().slice(0,4000),bodyEn=String(body.bodyEn??bodyZh).trim().slice(0,4000)||bodyZh;
  const stage=stages.has(String(body.stage??""))?String(body.stage):"week-0",tags=String(body.tags??"").trim().slice(0,300);
  const occurredAt=Number.isFinite(Number(body.occurredAt))?Number(body.occurredAt):Date.now();
  if(!id||!titleZh)return NextResponse.json({error:"Entry and title required"},{status:400});
  const result=await d1().prepare("UPDATE journal_entries SET title_zh = ?, title_en = ?, body_zh = ?, body_en = ?, stage = ?, tags = ?, occurred_at = ? WHERE id = ?").bind(titleZh,titleEn,bodyZh,bodyEn,stage,tags,occurredAt,id).run();
  if(!result.meta.changes)return NextResponse.json({error:"Entry not found"},{status:404});
  return NextResponse.json({ok:true});
}

export async function DELETE(req:NextRequest){
  if(!(await canEdit(req)))return NextResponse.json({error:"Only the Lead Designer can remove journal entries"},{status:403});
  const id=req.nextUrl.searchParams.get("id")??"";
  const row=await d1().prepare("SELECT file_key FROM journal_entries WHERE id = ?").bind(id).first<{file_key:string}>();
  if(!row)return NextResponse.json({error:"Entry not found"},{status:404});
  await r2().delete(row.file_key);
  await d1().prepare("DELETE FROM journal_entries WHERE id = ?").bind(id).run();
  return NextResponse.json({ok:true});
}
