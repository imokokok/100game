import {NextResponse} from "next/server";
import {clearLeadSession,setLeadSession,validLeadCredentials} from "../../_shared";

export async function POST(req:Request){
 const {name,code}=await req.json().catch(()=>({name:"",code:""})) as {name?:string;code?:string};
 if(!validLeadCredentials(name,code)){
  const res=NextResponse.json({error:"Invalid lead credentials"},{status:401,headers:{"cache-control":"no-store"}});
  clearLeadSession(res);
  return res;
 }
 const res=NextResponse.json({ok:true},{headers:{"cache-control":"no-store"}});
 await setLeadSession(res);
 return res;
}
