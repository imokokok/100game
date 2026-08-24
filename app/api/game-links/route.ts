import { NextRequest, NextResponse } from "next/server";
import { d1, isOwner, participantId } from "../_shared";

export async function GET(req:NextRequest){
  if(!(await participantId(req))&&!isOwner(req))return NextResponse.json({error:"Invitation required"},{status:401});
  const rows=await d1().prepare("SELECT id, version, url, notes_zh, notes_en, published_at FROM game_links ORDER BY published_at DESC").all();
  return NextResponse.json({links:rows.results});
}
export async function POST(req:NextRequest){
  if(!isOwner(req))return NextResponse.json({error:"Only the Owner can publish links"},{status:403});
  const body=await req.json().catch(()=>({}));
  const version=String(body.version??"").trim().slice(0,80);const url=String(body.url??"").trim().slice(0,2000);const notesZh=String(body.notesZh??"").trim().slice(0,2000);const notesEn=String(body.notesEn??notesZh).trim().slice(0,2000);
  try{const parsed=new URL(url);if(!["http:","https:"].includes(parsed.protocol))throw new Error()}catch{return NextResponse.json({error:"Valid URL required"},{status:400})}
  if(!version)return NextResponse.json({error:"Version required"},{status:400});
  const id=crypto.randomUUID();const now=Date.now();await d1().prepare("INSERT INTO game_links (id, version, url, notes_zh, notes_en, published_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id,version,url,notesZh,notesEn,now).run();
  return NextResponse.json({link:{id,version,url,notes_zh:notesZh,notes_en:notesEn,published_at:now}},{status:201});
}
export async function DELETE(req:NextRequest){
  if(!isOwner(req))return NextResponse.json({error:"Only the Owner can remove links"},{status:403});
  const id=req.nextUrl.searchParams.get("id")??"";if(!id)return NextResponse.json({error:"Link required"},{status:400});await d1().prepare("DELETE FROM game_links WHERE id = ?").bind(id).run();return NextResponse.json({ok:true});
}
