"use client";
import {useEffect,useState} from "react";

export function SurveyHub(){
 const [lang,setLang]=useState<"zh"|"en">("zh");
 useEffect(()=>{const saved=localStorage.getItem("hundred-language");if(saved==="en")queueMicrotask(()=>setLang("en"))},[]);
 const zh=lang==="zh";
 return <main className="surveyHub"><header><a href="/">WHAT 100 PEOPLE DO TO A GAME<span>一百个人怎么做游戏</span></a><button onClick={()=>setLang(zh?"en":"zh")}>{zh?"EN":"中文"}</button></header><section className="surveyHubIntro"><p>PROJECT SURVEYS · 项目问卷</p><h1>{zh?"问卷中心":"Survey Centre"}</h1><span>{zh?"项目中的问卷将陆续在这里发布。你可以查看问卷名称、用途和当前状态，再选择进入。":"Project surveys will be published here over time. Review each survey’s purpose and status before opening it."}</span></section><section className="surveyCatalogue"><a href="/survey/participant-portrait"><div><span>01 · {zh?"开放填写":"OPEN"}</span><h2>{zh?"参与者创作画像":"Participant Creative Portrait"}</h2><p>{zh?"了解每位参与者的经验、媒介偏好、创作判断、合作意向与投入方式。":"A portrait of each participant’s experience, media preferences, creative judgment, collaboration interests, and availability."}</p></div><strong>{zh?"进入问卷":"Open survey"} →</strong></a></section><footer><a href="/">← {zh?"返回创作者协作区":"Back to creator workspace"}</a><span>WHAT 100 PEOPLE DO TO A GAME</span></footer></main>
}
