import { NextRequest, NextResponse } from "next/server";
import { d1, isLead } from "../_shared";

function isPublicUrl(value:unknown){
  try{const url=new URL(String(value??""));return ["http:","https:"].includes(url.protocol)&&!url.username&&!url.password}catch{return false}
}

export async function GET(_req:NextRequest){
  const rows=await d1().prepare("SELECT id, version, url, notes_zh, notes_en, published_at FROM game_links ORDER BY published_at DESC").all();
  // Rows in this table are explicitly published by the Lead Designer. Keep
  // the public response to its display fields and omit malformed legacy URLs.
  const links=rows.results.filter(row=>isPublicUrl((row as {url?:unknown}).url)).map(row=>{
    const link=row as Record<string,unknown>;
    return {id:link.id,version:link.version,url:link.url,notes_zh:link.notes_zh,notes_en:link.notes_en,published_at:link.published_at};
  });
  return NextResponse.json({links},{headers:{"cache-control":"public, s-maxage=60, stale-while-revalidate=300"}});
}
export async function POST(req:NextRequest){
  if(!(await isLead(req)))return NextResponse.json({error:"Only the Lead Designer can publish links"},{status:403});
  const body=await req.json().catch(()=>({}));
  const version=String(body.version??"").trim().slice(0,80);const url=String(body.url??"").trim().slice(0,2000);const notesZh=String(body.notesZh??"").trim().slice(0,2000);const notesEn=String(body.notesEn??notesZh).trim().slice(0,2000);
  if(!isPublicUrl(url))return NextResponse.json({error:"Valid public URL required"},{status:400});
  if(!version)return NextResponse.json({error:"Version required"},{status:400});
  const id=crypto.randomUUID();const now=Date.now();await d1().prepare("INSERT INTO game_links (id, version, url, notes_zh, notes_en, published_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id,version,url,notesZh,notesEn,now).run();
  return NextResponse.json({link:{id,version,url,notes_zh:notesZh,notes_en:notesEn,published_at:now}},{status:201});
}
export async function DELETE(req:NextRequest){
  if(!(await isLead(req)))return NextResponse.json({error:"Only the Lead Designer can remove links"},{status:403});
  const id=req.nextUrl.searchParams.get("id")??"";if(!id)return NextResponse.json({error:"Link required"},{status:400});await d1().prepare("DELETE FROM game_links WHERE id = ?").bind(id).run();return NextResponse.json({ok:true});
}
