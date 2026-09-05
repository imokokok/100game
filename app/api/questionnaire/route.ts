import {d1} from "../_shared";
import {NextRequest,NextResponse} from "next/server";
import {questions} from "../../survey/questions";
import {npcQuestions} from "../../survey/npc-questions";
import {answerError,isRecord,questionVisible,type Answers} from "../../survey/validation";
export const dynamic="force-dynamic";
const headers={"cache-control":"no-store"};
export async function POST(req:NextRequest){
 let body:unknown;
 try{body=await req.json()}catch{return NextResponse.json({error:"Invalid request"},{status:400,headers})}
 if(!isRecord(body)||!isRecord(body.answers))return NextResponse.json({error:"Invalid answers"},{status:400,headers});
 if(body.surveyType!==undefined&&body.surveyType!=="npc-design"&&body.surveyType!=="participant-portrait")return NextResponse.json({error:"Unknown survey type"},{status:400,headers});
 const surveyType=body.surveyType==="npc-design"?"npc-design":"participant-portrait",locale=body.locale==="en"?"en":"zh";
 if(JSON.stringify(body.answers).length>65536)return NextResponse.json({error:"Response is too large"},{status:413,headers});
 const activeQuestions=surveyType==="npc-design"?npcQuestions:questions;
 const answers:Answers={};
 for(const q of activeQuestions){
  if(!questionVisible(q,body.answers))continue;
  const value=body.answers[q.id],error=answerError(q,value,locale);
  if(error)return NextResponse.json({error,field:q.id},{status:400,headers});
  if(typeof value==="string")answers[q.id]=value.trim();
  else if(Array.isArray(value))answers[q.id]=Array.from(new Set(value as string[]));
 }
 const name=answers.wechatName as string,payload=JSON.stringify({...answers,_surveyType:surveyType});
 try{
  const id=crypto.randomUUID(),now=Date.now();
  await d1().prepare("INSERT INTO questionnaire_responses (id, wechat_name, locale, payload, submitted_at) VALUES (?, ?, ?, ?, ?)").bind(id,name,locale,payload,now).run();
  return NextResponse.json({ok:true,id},{headers});
 }catch{return NextResponse.json({error:"Unable to save response"},{status:500,headers})}
}
