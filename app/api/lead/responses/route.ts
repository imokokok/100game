import {env} from "cloudflare:workers";
import {NextResponse} from "next/server";
const enc=new TextEncoder();
function safeEq(a:string,b:string){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
async function authorized(req:Request){const raw=req.headers.get("cookie")?.match(/(?:^|; )lead_session=([^;]+)/)?.[1];if(!raw)return false;const [expiry,sig]=decodeURIComponent(raw).split(".");if(!expiry||Date.now()>Number(expiry))return false;const key=await crypto.subtle.importKey("raw",enc.encode(env.LEAD_SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const b=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(expiry)));const expected=btoa(String.fromCharCode(...b)).replace(/=+$/g,"");return safeEq(sig,expected)}
export async function GET(req:Request){if(!await authorized(req))return NextResponse.json({error:"Unauthorized"},{status:401});const {results}=await env.DB.prepare("SELECT id, wechat_name, locale, payload, submitted_at FROM questionnaire_responses ORDER BY submitted_at DESC").all();return NextResponse.json({responses:results})}
