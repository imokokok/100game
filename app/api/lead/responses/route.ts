import {NextRequest,NextResponse} from "next/server";
import {d1,isLead} from "../../_shared";
export async function GET(req:NextRequest){if(!(await isLead(req)))return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"cache-control":"no-store"}});const {results}=await d1().prepare("SELECT id, wechat_name, locale, payload, submitted_at FROM questionnaire_responses ORDER BY submitted_at DESC LIMIT 1000").all();return NextResponse.json({responses:results},{headers:{"cache-control":"private, no-store","x-content-type-options":"nosniff"}})}

export async function DELETE(req:NextRequest){
 if(!(await isLead(req)))return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"cache-control":"no-store"}});
 const body=await req.json().catch(()=>({})) as {ids?:unknown};
 const ids=Array.isArray(body.ids)?[...new Set(body.ids.map(String).filter(Boolean))].slice(0,20):[];
 if(!ids.length)return NextResponse.json({error:"Response ids required"},{status:400,headers:{"cache-control":"no-store"}});
 const existing=await d1().batch(ids.map(id=>d1().prepare("SELECT id FROM questionnaire_responses WHERE id = ?").bind(id)));
 const found=existing.flatMap(result=>(result.results??[]).map(row=>String((row as {id?:unknown}).id??""))).filter(Boolean);
 if(found.length!==ids.length)return NextResponse.json({error:"One or more responses no longer exist"},{status:409,headers:{"cache-control":"no-store"}});
 const deleted=await d1().batch(ids.map(id=>d1().prepare("DELETE FROM questionnaire_responses WHERE id = ?").bind(id)));
 const changes=deleted.reduce((total,result)=>total+Number(result.meta?.changes??0),0);
 return NextResponse.json({ok:true,deleted:changes},{headers:{"cache-control":"private, no-store","x-content-type-options":"nosniff"}});
}
