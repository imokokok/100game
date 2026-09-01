"use client";

import {useEffect,useRef,useState,type FormEvent,type MouseEvent} from "react";

type Lang="zh"|"en";

const copy={
 zh:{
  language:"语言",project:"项目",survey:"填写问卷",creator:"主创入口",
  kicker:"PARTICIPATORY GAME PROJECT · 共同创作计划",
  title:"一百个人，如何共同做出一个游戏？",
  intro:"我们邀请一百个年龄、职业与经验不同的人，在三十天中通过选择、协商和试验，共同形成一件尚未被预设形式的游戏作品。参与不以游戏制作经验为前提。",
  fillSurvey:"填写参与者问卷",learnMore:"了解项目",
  aboutKicker:"ABOUT THE PROJECT · 关于项目",aboutTitle:"我们寻找的不是一百名游戏设计师。",
  aboutBody:"项目从一百个人彼此不同的经验与判断出发，讨论谁可以制作游戏、什么能够成为游戏，以及创作资源如何被重新分配。技术是实现作品的方法，而不是进入表达的资格。",
  aboutNote:"最终形式不会被预先限定为电子游戏、桌面游戏或任何既有类别。作品将由参与者共同决定。",
  statPeople:"个人",statDays:"天",statWork:"共同作品",
  questionsKicker:"QUESTIONS FOR THE MEDIUM",questions:["游戏从何时开始成为游戏？","谁决定什么可以成为游戏？","作为媒介，游戏的边界究竟在哪里？"],
  surveyKicker:"PARTICIPANT PORTRAIT · 参与者创作画像",surveyTitle:"把你的经验带进游戏。",
  surveyBody:"问卷用于了解每位参与者的经验、媒介偏好、创作判断与合作方式。没有标准答案，也不要求专业背景；草稿会自动保存在当前设备。",
  surveyAction:"开始填写问卷",surveyPrivacy:"提交内容仅供主策划整理与创作协调。",
  poster:"项目招募海报",posterNote:"打开完整海报",
  creatorTitle:"进入创作协作区",creatorIntro:"项目成员与主策划从这里进入。参与者请填写微信群聊名及邀请码。",
  name:"微信群聊名",namePlaceholder:"填写你的微信群聊名",code:"邀请码",codePlaceholder:"填写邀请码",
  enter:"验证并进入",entering:"正在进入…",close:"关闭",required:"请填写微信群聊名。",error:"邀请码无效、已过期，或当前网络暂时不可用。",
  footer:"一百个人怎么做游戏 · 共同创作项目"
 },
 en:{
  language:"Language",project:"Project",survey:"Questionnaire",creator:"Creator access",
  kicker:"PARTICIPATORY GAME PROJECT",
  title:"How can one hundred people make a game together?",
  intro:"One hundred people of different ages, professions and experiences will shape a work over thirty days through choice, negotiation and experimentation. Previous game-making experience is not required.",
  fillSurvey:"Fill in the participant questionnaire",learnMore:"About the project",
  aboutKicker:"ABOUT THE PROJECT",aboutTitle:"We are not looking for one hundred game designers.",
  aboutBody:"The project begins with the different experiences and judgements of one hundred people. It asks who may make games, what may become a game, and how creative resources can be redistributed. Technology is a means of realisation, not a qualification for expression.",
  aboutNote:"The outcome will not be prescribed as a video game, board game, or any established category. Its participants will decide what it becomes.",
  statPeople:"people",statDays:"days",statWork:"shared work",
  questionsKicker:"QUESTIONS FOR THE MEDIUM",questions:["When does a game begin to be a game?","Who decides what may become a game?","Where are the boundaries of the medium?"],
  surveyKicker:"PARTICIPANT PORTRAIT",surveyTitle:"Bring your experience into the game.",
  surveyBody:"The questionnaire records each participant's experience, media preferences, creative judgement and preferred ways of collaborating. There are no standard answers and no professional background is required. Your draft is saved on this device.",
  surveyAction:"Start the questionnaire",surveyPrivacy:"Submitted responses are available only to the Lead Designer for project coordination.",
  poster:"Project recruitment poster",posterNote:"Open full poster",
  creatorTitle:"Enter the collaboration space",creatorIntro:"Project members and the Lead Designer enter here. Participants should provide their WeChat group name and invitation code.",
  name:"WeChat group name",namePlaceholder:"Your WeChat group name",code:"Invitation code",codePlaceholder:"Enter invitation code",
  enter:"Verify and enter",entering:"Entering…",close:"Close",required:"Please provide your WeChat group name.",error:"The invitation is invalid, expired, or the network is temporarily unavailable.",
  footer:"WHAT 100 PEOPLE DO TO A GAME · COLLECTIVE PROJECT"
 }
} as const;

export function EntryStudio(){
 const [lang,setLang]=useState<Lang>("zh"),[creatorOpen,setCreatorOpen]=useState(false),[name,setName]=useState(""),[code,setCode]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const firstInput=useRef<HTMLInputElement>(null),creatorButton=useRef<HTMLAnchorElement>(null);
 const c=copy[lang];

 useEffect(()=>{
  try{const saved=localStorage.getItem("hundred-language");if(saved==="en")setLang("en")}catch{}
  const sync=()=>{const params=new URLSearchParams(location.search);setCreatorOpen(params.get("access")==="invite"||params.has("invite"));const token=params.get("invite");if(token)setCode(token)};
  sync();window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync);
 },[]);
 useEffect(()=>{document.documentElement.lang=lang==="zh"?"zh-CN":"en";try{localStorage.setItem("hundred-language",lang)}catch{}},[lang]);
 useEffect(()=>{
  if(!creatorOpen)return;
  const previous=document.body.style.overflow;document.body.style.overflow="hidden";
  const timer=window.setTimeout(()=>firstInput.current?.focus(),30);
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")closeCreator(false)};
  window.addEventListener("keydown",onKey);
  return()=>{window.clearTimeout(timer);window.removeEventListener("keydown",onKey);document.body.style.overflow=previous};
 },[creatorOpen]);

 function updateCreatorUrl(open:boolean,push:boolean){
  const url=new URL(location.href);if(open)url.searchParams.set("access","invite");else{url.searchParams.delete("access");url.searchParams.delete("invite")}
  const target=`${url.pathname}${url.search}${url.hash}`;(push?history.pushState:history.replaceState).call(history,{},"",target);
 }
 function openCreator(event?:MouseEvent<HTMLAnchorElement>){event?.preventDefault();setNotice("");setCreatorOpen(true);updateCreatorUrl(true,true)}
 function closeCreator(restoreFocus=true){setNotice("");setCreatorOpen(false);updateCreatorUrl(false,false);if(restoreFocus)window.setTimeout(()=>creatorButton.current?.focus(),0)}
 function changeLang(next:Lang){setLang(next)}
 async function submit(event:FormEvent){
  event.preventDefault();if(busy)return;if(!name.trim()){setNotice(c.required);firstInput.current?.focus();return}
  setBusy(true);setNotice("");
  const controller=typeof AbortController==="undefined"?null:new AbortController();
  let timeout=0;
  try{
   const request=fetch("/api/access",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code,name}),...(controller?{signal:controller.signal}:{})});
   const response=await Promise.race([request,new Promise<Response>((_,reject)=>{timeout=window.setTimeout(()=>{controller?.abort();reject(new Error("timeout"))},12000)})]);
   if(!response.ok){setNotice(c.error);return}
   const data=await response.json() as {role:"lead"|"participant"};
   location.replace(data.role==="lead"?"/workspace?view=journal":"/workspace");
  }catch{setNotice(c.error)}finally{window.clearTimeout(timeout);setBusy(false)}
 }

 return <main className="publicHome">
  <header className="homeHeader">
   <a className="homeBrand" href="#top" aria-label="WHAT 100 PEOPLE DO TO A GAME"><span>WHAT </span><strong>100 PEOPLE</strong><span> DO TO A </span><strong>GAME</strong></a>
   <nav className="homeNav" aria-label={lang==="zh"?"首页导航":"Home navigation"}>
    <a href="#about">{c.project}</a><a href="/survey/participant-portrait">{c.survey}</a>
   </nav>
   <div className="homeTools">
    <label className="homeLanguage"><span>{c.language}</span><select value={lang} onChange={event=>changeLang(event.target.value as Lang)} aria-label={c.language}><option value="zh">中文</option><option value="en">English</option></select></label>
    <a ref={creatorButton} className="homeCreatorButton" href="/lead" onClick={openCreator} aria-haspopup="dialog" aria-expanded={creatorOpen}>{c.creator}</a>
   </div>
  </header>

  <section className="homeHero" id="top">
   <div className="homeHeroCopy">
    <p className="homeKicker">{c.kicker}</p>
    <h1>{c.title}</h1>
    <p className="homeIntro">{c.intro}</p>
    <div className="homeActions"><a className="homePrimary" href="/survey/participant-portrait">{c.fillSurvey}<span aria-hidden="true">↗</span></a><a className="homeSecondary" href="#about">{c.learnMore}<span aria-hidden="true">↓</span></a></div>
   </div>
   <div className="homeNumbers" aria-label={lang==="zh"?"项目数字":"Project numbers"}>
    <div><strong>100</strong><span>{c.statPeople}</span></div>
    <div><strong>30</strong><span>{c.statDays}</span></div>
    <div><strong>01</strong><span>{c.statWork}</span></div>
   </div>
  </section>

  <section className="homeAbout" id="about">
   <div><p className="homeKicker">{c.aboutKicker}</p><h2>{c.aboutTitle}</h2></div>
   <div className="homeAboutText"><p>{c.aboutBody}</p><p>{c.aboutNote}</p><a href="/concept">{c.learnMore}<span aria-hidden="true"> →</span></a></div>
  </section>

  <section className="homeQuestions" aria-labelledby="homeQuestionsTitle">
   <p className="homeKicker" id="homeQuestionsTitle">{c.questionsKicker}</p>
   <div>{c.questions.map((question,index)=><p key={question}><span>{String(index+1).padStart(2,"0")}</span>{question}</p>)}</div>
  </section>

  <section className="homeSurvey" aria-labelledby="homeSurveyTitle">
   <div><p className="homeKicker">{c.surveyKicker}</p><h2 id="homeSurveyTitle">{c.surveyTitle}</h2></div>
   <div><p>{c.surveyBody}</p><a className="homeSurveyAction" href="/survey/participant-portrait">{c.surveyAction}<span aria-hidden="true">↗</span></a><small>{c.surveyPrivacy}</small></div>
  </section>

  <figure className="homePoster"><a href="/project-recruitment-poster.jpg" target="_blank" rel="noreferrer"><img src="/project-recruitment-poster.jpg" width="1024" height="1536" loading="lazy" decoding="async" alt={c.poster}/><span>{c.posterNote} ↗</span></a><figcaption>{c.poster}</figcaption></figure>

  <footer className="homeFooter"><span>{c.footer}</span><a href="/lead" onClick={openCreator}>{c.creator} →</a><span>© 2026 HuieChen</span></footer>

  {creatorOpen&&<div className="homeCreatorOverlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)closeCreator()}}>
   <section className="homeCreatorPanel" role="dialog" aria-modal="true" aria-labelledby="creatorDialogTitle">
    <header><p className="homeKicker">CREATOR ACCESS · 创作协作区</p><button type="button" onClick={()=>closeCreator()} aria-label={c.close}>×</button></header>
    <h2 id="creatorDialogTitle">{c.creatorTitle}</h2><p>{c.creatorIntro}</p>
    <form className="homeCreatorForm" onSubmit={submit} aria-busy={busy}>
     <label><span>{c.name}</span><input ref={firstInput} value={name} onChange={event=>setName(event.target.value)} autoComplete="name" maxLength={40} placeholder={c.namePlaceholder}/></label>
     <label><span>{c.code}</span><input value={code} onChange={event=>setCode(event.target.value)} autoComplete="one-time-code" autoCapitalize="none" autoCorrect="off" placeholder={c.codePlaceholder}/></label>
     <button type="submit" disabled={busy}>{busy?c.entering:c.enter}</button>
    </form>
    {notice&&<p className="homeCreatorError" role="alert">{notice}</p>}
   </section>
  </div>}
 </main>;
}
