import {env} from "cloudflare:workers";
import {NextResponse} from "next/server";
const enc=new TextEncoder();
function safeEq(a:string,b:string){if(a.length!==b.length)return false;let value=0;for(let i=0;i<a.length;i++)value|=a.charCodeAt(i)^b.charCodeAt(i);return value===0}
async function sign(s:string){const key=await crypto.subtle.importKey("raw",enc.encode(env.LEAD_SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const b=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(s)));return btoa(String.fromCharCode(...b)).replace(/=+$/g,"")}
export async function POST(req:Request){const {code}=await req.json().catch(()=>({code:""})) as {code?:string};const value=String(code??"").trim();if(!env.LEAD_ACCESS_CODE||!safeEq(value,env.LEAD_ACCESS_CODE))return NextResponse.json({error:"Invalid code"},{status:401,headers:{"cache-control":"no-store"}});const expiry=Date.now()+1000*60*60*8,payload=String(expiry),token=`${payload}.${await sign(payload)}`;const res=NextResponse.json({ok:true},{headers:{"cache-control":"no-store"}});res.cookies.set("lead_session",token,{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:60*60*8});return res}
