import {env} from "cloudflare:workers";
import {NextResponse} from "next/server";
import {isLead,isOwner} from "../../_shared";
export async function GET(req:Request){if(!isOwner(req)&&!await isLead(req))return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"cache-control":"no-store"}});const {results}=await env.DB.prepare("SELECT id, wechat_name, locale, payload, submitted_at FROM questionnaire_responses ORDER BY submitted_at DESC LIMIT 1000").all();return NextResponse.json({responses:results},{headers:{"cache-control":"private, no-store","x-content-type-options":"nosniff"}})}
