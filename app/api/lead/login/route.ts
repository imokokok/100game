import {NextResponse} from "next/server";
import {
 beginLeadLoginAttempt,
 clearLeadLoginAttempts,
 clearLeadSession,
 clearParticipantSession,
 setLeadSession,
 validLeadCredentials,
} from "../../_shared";

export async function POST(req:Request){
 const {name,code}=await req.json().catch(()=>({name:"",code:""})) as {name?:string;code?:string};
 let attempt;
 try{attempt=await beginLeadLoginAttempt(req);}catch{
  return NextResponse.json({error:"Lead access is temporarily unavailable"},{status:503,headers:{"cache-control":"no-store"}});
 }
 if(!attempt.allowed){
  return NextResponse.json({error:"Too many lead login attempts"},{status:429,headers:{"cache-control":"no-store","retry-after":String(attempt.retryAfter)}});
 }
 if(!validLeadCredentials(name,code)){
  const res=NextResponse.json({error:"Invalid lead credentials"},{status:401,headers:{"cache-control":"no-store"}});
  clearLeadSession(res);
  return res;
 }
 await clearLeadLoginAttempts(attempt.clientKey);
 const res=NextResponse.json({ok:true},{headers:{"cache-control":"no-store"}});
 await setLeadSession(res);
 clearParticipantSession(res);
 return res;
}
