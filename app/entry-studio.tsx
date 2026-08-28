"use client";

import {useEffect,useRef,useState,type FormEvent,type MouseEvent} from "react";
import {parseQuery,sessionGet,sessionSet,storageGet,storageSet} from "./client-compat";

type Lang="zh"|"en";
type IntroPhase="checking"|"playing"|"leaving"|"done";
const INTRO_SESSION_KEY="hundred-opening-v1";
const copy={
 zh:{language:"语言",publicVisit:"普通访问",publicDescription:"阅读项目理念与共同创作者页面",inviteEntry:"邀请码进入",inviteDescription:"创作者协作区",back:"返回",privateAccess:"私密访问",enterCode:"填写邀请码",intro:"参与者填写微信群聊名和邀请码；主策划直接输入主策划验证码。",welcome:"创作区用于记录项目中的实际工作。",welcomeDetail:"不要求游戏制作经验。草图、文字、参考资料和未完成文件都可提交。",name:"微信群聊名（参与者）",namePlaceholder:"填写微信群聊名",code:"邀请码",verify:"验证并进入",entering:"正在进入…",required:"参与者请填写自己的微信群聊名。",error:"邀请码验证成功后才能进入协作区域。",networkError:"网络异常，请检查网络后重试。",copyright:"© 2026 HuieChen. 版权所有。"},
 en:{language:"Language",publicVisit:"Public visit",publicDescription:"Read the project concept and contributors",inviteEntry:"Invitation access",inviteDescription:"Creator Workspace",back:"Back",privateAccess:"Private access",enterCode:"Enter invitation",intro:"Participants enter their WeChat group name and invitation code. The Lead Designer enters the lead access code.",welcome:"The workspace records active project work.",welcomeDetail:"Game-making experience is not required. Sketches, text, references, and unfinished files may be submitted.",name:"WeChat group name (participants)",namePlaceholder:"WeChat group name",code:"Invitation code",verify:"Verify and enter",entering:"Opening…",required:"Participants must enter their WeChat group name.",error:"The collaboration area opens after the invitation is verified.",networkError:"Network error. Please check your connection and try again.",copyright:"© 2026 HuieChen. All rights reserved."}
};

function TitlePicture({className,alt="",priority=false}:{className?:string;alt?:string;priority?:boolean}){
 return <picture className={className}>
  <source media="(max-width: 480px)" srcSet="/what-100-people-title-600.webp" type="image/webp"/>
  <source media="(max-width: 480px)" srcSet="/what-100-people-title-600.png" type="image/png"/>
  <source srcSet="/what-100-people-title.webp" type="image/webp"/>
  <img src="/what-100-people-title.png" alt={alt} width="1200" height="800" fetchPriority={priority?"high":undefined}/>
 </picture>;
}

function OpeningSequence({phase,onFinish,onSoundRequest}:{phase:IntroPhase;onFinish:()=>void;onSoundRequest:()=>void}){
 const fragments=["what","hundred","people","do","game"];
 return <div className={`openingSequence${phase==="leaving"?" isLeaving":""}`} onPointerDown={onSoundRequest} onTouchStart={onSoundRequest} aria-label="WHAT 100 PEOPLE DO TO A GAME opening title">
  <div className="openingPaper" aria-hidden="true"/>
  <div className="openingArtwork" role="img" aria-label="WHAT 100 PEOPLE DO TO A GAME">
   <TitlePicture className="openingArtworkBase"/>
   {fragments.map(name=><span className={`openingFragment openingFragment-${name}`} key={name} aria-hidden="true"><TitlePicture/></span>)}
  </div>
  <button className="openingSkip" type="button" onPointerDown={event=>event.stopPropagation()} onTouchStart={event=>event.stopPropagation()} onClick={onFinish}>跳过片头 / Skip</button>
 </div>;
}

export function EntryStudio(){
 const [lang,setLang]=useState<Lang>("zh"),[invite,setInvite]=useState(false),[name,setName]=useState(""),[code,setCode]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[introPhase,setIntroPhase]=useState<IntroPhase>("checking");const introAudio=useRef<HTMLAudioElement>(null);const c=copy[lang];
 useEffect(()=>{const saved=storageGet("hundred-language");const next:Lang=saved==="en"||(!saved&&navigator.language.toLowerCase().startsWith("en"))?"en":"zh";setLang(next);const sync=()=>{const params=parseQuery(location.search);const nextInvite=params.access==="invite"||"invite" in params;setInvite(nextInvite);setIntroPhase(nextInvite||sessionGet(INTRO_SESSION_KEY)?"done":"playing");const token=params.invite;if(token)setCode(token)};sync();window.addEventListener("popstate",sync);return()=>window.removeEventListener("popstate",sync)},[]);
 useEffect(()=>{storageSet("hundred-language",lang);document.documentElement.lang=lang==="zh"?"zh-CN":"en"},[lang]);
 useEffect(()=>{
  if(introPhase!=="playing"&&introPhase!=="leaving")return;
  const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(introPhase==="playing"){
   const timer=window.setTimeout(()=>setIntroPhase("leaving"),reduced?120:1980);
   if(!reduced){const audio=introAudio.current;if(audio){try{audio.volume=.22;audio.currentTime=.08;const playback=audio.play();if(playback&&typeof playback.catch==="function")playback.catch(()=>undefined)}catch{}}}
   return()=>window.clearTimeout(timer);
  }
  const timer=window.setTimeout(()=>finishIntro(),reduced?20:520);
  return()=>window.clearTimeout(timer);
 },[introPhase]);
 function requestIntroSound(){if(introPhase!=="playing")return;const audio=introAudio.current;if(!audio||!audio.paused)return;try{audio.volume=.22;const playback=audio.play();if(playback&&typeof playback.catch==="function")playback.catch(()=>undefined)}catch{}}
 function finishIntro(){sessionSet(INTRO_SESSION_KEY,"1");setIntroPhase("done");const audio=introAudio.current;if(audio){try{audio.pause();audio.currentTime=0}catch{}}}
 function openInvite(event:MouseEvent<HTMLAnchorElement>){event.preventDefault();history.pushState({},"","/?access=invite");setNotice("");setInvite(true)}
 function closeInvite(event:MouseEvent<HTMLAnchorElement>){event.preventDefault();history.pushState({},"","/");setNotice("");setInvite(false)}
 async function submit(event:FormEvent){event.preventDefault();if(busy)return;setBusy(true);setNotice("");try{const response=await fetch("/api/access",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code,name})});if(!response.ok){const data=await response.json().catch(()=>({})) as {error?:string};setNotice(data.error==="Participant name is required"?c.required:c.error);return}const data=await response.json() as {role:"lead"|"participant";session?:string};go(data.role==="lead"?"/workspace?view=journal":data.session?`/workspace?k=${encodeURIComponent(data.session)}`:"/workspace");return}catch{setNotice(c.networkError)}finally{setBusy(false)}}
 function go(url:string){try{location.href=url}catch{location.replace(url)}setTimeout(()=>{if(!location.href.includes(url))location.href=url},600)}
 const wordmark=<span className="wordmark wordmarkInline"><span>WHAT </span><strong>100 PEOPLE</strong><span> DO TO A </span><strong>GAME</strong></span>;
 const language=<label className="languagePicker"><span><b aria-hidden="true">LANG</b>{c.language}</span><select aria-label={c.language} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="zh">中文</option><option value="en">English</option></select></label>;
 if(!invite)return <main className={`entryGate${introPhase==="checking"?" introChecking":""}`}>{(introPhase==="playing"||introPhase==="leaving")&&<><audio ref={introAudio} src="/audio/printer-intro.mp3" preload="auto" aria-hidden="true"/><OpeningSequence phase={introPhase} onFinish={finishIntro} onSoundRequest={requestIntroSound}/></>}<div className="entryTop">{wordmark}{language}</div><section><h1 className="publicBrandTitle"><TitlePicture alt="WHAT 100 PEOPLE DO TO A GAME" priority/></h1><div className="entryChoices"><a className="entryChoice" href="/concept"><b>{c.publicVisit}</b><span>{c.publicDescription}</span></a><a className="entryChoice" href="/?access=invite" onClick={openInvite}><b>{c.inviteEntry}</b><span>{c.inviteDescription}</span></a></div></section><footer className="copyright">{c.copyright}</footer></main>;
 return <main className="entryGate inviteGate"><div className="entryTop"><a href="/" onClick={closeInvite}>← {c.back}</a>{language}</div><section><span className="kicker">{c.privateAccess}</span><h1>{c.enterCode}</h1><p>{c.intro}</p><aside className="creatorWelcome"><strong>{c.welcome}</strong><span>{c.welcomeDetail}</span></aside><form className="gateInvite" onSubmit={submit} aria-busy={busy}><label><span>{c.name}</span><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={40} placeholder={c.namePlaceholder}/></label><label><span>{c.code}</span><input value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" placeholder={c.code}/></label><button className="primary" type="submit" disabled={busy}>{busy?c.entering:c.verify}</button></form>{notice&&<p className="gateError" role="alert">{notice}</p>}</section><footer className="copyright">{c.copyright}</footer></main>;
}
