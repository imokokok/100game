"use client";
import {useEffect,useState} from "react";
import {runMicrotask} from "../client-compat";

export function SurveyHub(){
 const [lang,setLang]=useState<"zh"|"en">("zh");
 useEffect(()=>{const saved=localStorage.getItem("hundred-language");if(saved==="en")runMicrotask(()=>setLang("en"))},[]);
 const zh=lang==="zh";
 return <main className="surveyHub"><header><a href="/">WHAT 100 PEOPLE DO TO A GAME<span>一百个人怎么做游戏</span></a><button onClick={()=>setLang(zh?"en":"zh")}>{zh?"EN":"中文"}</button></header><section className="surveyHubIntro"><div><p>PROJECT SURVEYS · 项目问卷</p><h1>{zh?"项目问卷":"Project Surveys"}</h1></div><div className="surveyHubStatement"><b>{zh?"从每个人出发，形成共同的创作判断。":"Beginning with each person, forming a shared creative judgment."}</b><span>{zh?"这里集中发布项目各阶段的问卷。每份问卷都会标明用途与开放状态，已提交的内容仅供主策划整理与协调。":"Questionnaires for each project stage are published here. Every survey states its purpose and status; submitted responses are available only to the Lead Designer for coordination."}</span></div></section><section className="surveyCatalogue" aria-label={zh?"问卷列表":"Survey list"}><header><span>NO.</span><span>{zh?"问卷":"SURVEY"}</span><span>{zh?"状态":"STATUS"}</span></header><a href="/survey/participant-portrait"><span className="surveyIndex">01</span><div><small>{zh?"参与者信息 · 创作研究":"PARTICIPANT PROFILE · CREATIVE RESEARCH"}</small><h2>{zh?"参与者创作画像":"Participant Creative Portrait"}</h2><p>{zh?"记录经验、媒介偏好、创作判断、合作意向与投入方式，为后续分组和创作协调提供依据。":"Records experience, media preferences, creative judgment, collaboration interests and availability for grouping and coordination."}</p></div><div className="surveyStatus"><span>{zh?"开放填写":"OPEN"}</span><b className="surveyCta">{zh?"进入问卷":"Open survey"}</b></div></a></section><footer><a href="/">{zh?"返回项目入口":"Back to project entrance"}</a><span>© 2026 HuieChen</span></footer></main>
}
