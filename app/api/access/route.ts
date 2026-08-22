import {env} from "cloudflare:workers";
import {NextRequest,NextResponse} from "next/server";
import {POST as participantLogin} from "../participant/route";

const enc=new TextEncoder();
function safeEq(a:string,b:string){if(a.length!==b.length)return false;let value=0;for(let i=0;i<a.length;i++)value|=a.charCodeAt(i)^b.charCodeAt(i);return value===0}
async function sign(value:string){const key=await crypto.subtle.importKey("raw",enc.encode(env.LEAD_SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const bytes=new Uint8Array(await crypto.subtle.sign("HMAC",key,enc.encode(value)));return btoa(String.fromCharCode(...bytes)).replace(/=+$/g,"")}

export async function POST(req:NextRequest){
 const {code,name}=await req.json().catch(()=>({code:"",name:""})) as {code?:string;name?:string};
 const value=String(code??"").trim();
 if(!value)return NextResponse.json({error:"Missing access code"},{status:400});
 if(env.LEAD_ACCESS_CODE&&safeEq(value,env.LEAD_ACCESS_CODE)){
  const expiry=Date.now()+1000*60*60*8,payload=String(expiry),token=`${payload}.${await sign(payload)}`;
  const res=NextResponse.json({role:"lead"});
  res.cookies.set("lead_session",token,{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:60*60*8});
  return res;
 }
 const participantReq=new NextRequest(new URL("/api/participant",req.url),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({token:value,name})});
 const res=await participantLogin(participantReq);
 if(!res.ok)return res;
 const data=await res.clone().json() as {participant:unknown};
 return new NextResponse(JSON.stringify({role:"participant",participant:data.participant}),{status:res.status,headers:res.headers});
}
