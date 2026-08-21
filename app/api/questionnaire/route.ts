import {env} from "cloudflare:workers";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function POST(req:Request){try{const body=await req.json() as {answers?:Record<string,unknown>,locale?:string};const name=String(body.answers?.wechatName||"").trim();if(!name)return NextResponse.json({error:"WeChat name is required"},{status:400});const now=Date.now(),id=crypto.randomUUID();await env.DB.prepare("INSERT INTO questionnaire_responses (id, wechat_name, locale, payload, submitted_at) VALUES (?, ?, ?, ?, ?)").bind(id,name,body.locale==="en"?"en":"zh",JSON.stringify(body.answers),now).run();return NextResponse.json({ok:true,id})}catch{return NextResponse.json({error:"Unable to save response"},{status:500})}}
