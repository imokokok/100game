import {NextRequest,NextResponse} from "next/server";
import {POST as participantLogin} from "../participant/route";
import {
 beginLeadLoginAttempt,
 clearLeadLoginAttempts,
 clearLeadSession,
 clearParticipantSession,
 isLeadName,
 setLeadSession,
 validLeadCredentials,
} from "../_shared";

export async function POST(req:NextRequest){
 const {code,name}=await req.json().catch(()=>({code:"",name:""})) as {code?:string;name?:string};
 const value=String(code??"").trim();
 if(!value)return NextResponse.json({error:"Missing access code"},{status:400});
 if(isLeadName(name)){
  let attempt;
  try{attempt=await beginLeadLoginAttempt(req);}catch{
   return NextResponse.json({error:"Lead access is temporarily unavailable"},{status:503,headers:{"cache-control":"no-store"}});
  }
  if(!attempt.allowed){
   return NextResponse.json({error:"Too many lead login attempts"},{status:429,headers:{"cache-control":"no-store","retry-after":String(attempt.retryAfter)}});
  }
  if(!validLeadCredentials(name,value)){
   const res=NextResponse.json({error:"Invalid lead credentials"},{status:401,headers:{"cache-control":"no-store"}});
   clearLeadSession(res);
   return res;
  }
  await clearLeadLoginAttempts(attempt.clientKey);
  const res=NextResponse.json({role:"lead"},{headers:{"cache-control":"no-store"}});
  await setLeadSession(res);
  clearParticipantSession(res);
  return res;
 }
 const participantHeaders=new Headers({"content-type":"application/json"});
 const participantCookie=req.headers.get("cookie");
 if(participantCookie)participantHeaders.set("cookie",participantCookie);
 const participantReq=new NextRequest(new URL("/api/participant",req.url),{method:"POST",headers:participantHeaders,body:JSON.stringify({token:value,name})});
 const res=await participantLogin(participantReq);
 clearLeadSession(res);
 if(!res.ok)return res;
 const data=await res.clone().json() as {participant:unknown};
 return new NextResponse(JSON.stringify({role:"participant",participant:data.participant}),{status:res.status,headers:res.headers});
}
