import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {NextRequest} from "next/server";
import {d1,isLead,isOwner,participantId} from "../api/_shared";
import {Studio,type WorkspaceRole,type WorkspaceView} from "../studio";
import type {LeadResponse} from "../lead/lead-dashboard";

const allowedViews:WorkspaceView[]=["home","tasks","survey","links","journal","dashboard"];

export default async function WorkspacePage({searchParams}:{searchParams:Promise<{view?:string}>}){
 const requestHeaders=await headers();
 const request=new NextRequest("https://hundred-people-game.jzwjf5xs57.chatgpt.site/workspace",{headers:requestHeaders});
 let participant:{id:string;display_code:string};
 let role:WorkspaceRole;
 if(isOwner(request)||await isLead(request)){
  participant={id:"owner",display_code:"Hera"};role="lead";
 }else{
  const id=await participantId(request);
  if(!id)redirect("/?access=invite");
  const row=await d1().prepare("SELECT id, display_code FROM participants WHERE id = ?").bind(id).first<{id:string;display_code:string}>();
  if(!row)redirect("/?access=invite");
  participant=row;role="participant";
 }
 const requested=(await searchParams).view as WorkspaceView|undefined;
 const initialView=requested&&allowedViews.includes(requested)&&(role==="lead"||requested!=="dashboard")?requested:"home";
 let initialResponses:LeadResponse[]|undefined;
 if(role==="lead"&&initialView==="survey"){
  const result=await d1().prepare("SELECT id, wechat_name, locale, payload, submitted_at FROM questionnaire_responses ORDER BY submitted_at DESC LIMIT 1000").all<LeadResponse>();
  initialResponses=result.results;
 }
 return <Studio initialParticipant={participant} initialRole={role} initialView={initialView} initialResponses={initialResponses}/>;
}
