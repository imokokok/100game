"use client";

import {useEffect,useRef,useState,type FormEvent,type MouseEvent,type Ref,type SyntheticEvent} from "react";
import {parseQuery,storageGet,storageSet} from "./client-compat";

type Lang="zh"|"en";
type IntroPhase="checking"|"loading"|"playing"|"leaving"|"done";
const copy={
 zh:{language:"语言",publicVisit:"普通访问",publicDescription:"阅读项目理念与共同创作者页面",inviteEntry:"邀请码进入",inviteDescription:"创作者协作区",back:"返回",privateAccess:"私密访问",enterCode:"填写邀请码",intro:"参与者填写微信群聊名和邀请码；主策划直接输入主策划验证码。",welcome:"创作区用于记录项目中的实际工作。",welcomeDetail:"不要求游戏制作经验。草图、文字、参考资料和未完成文件都可提交。",name:"微信群聊名（参与者）",namePlaceholder:"填写微信群聊名",code:"邀请码",verify:"验证并进入",entering:"正在进入…",required:"参与者请填写自己的微信群聊名。",error:"邀请码验证成功后才能进入协作区域。",networkError:"网络异常，请检查网络后重试。",copyright:"© 2026 HuieChen. 版权所有。"},
 en:{language:"Language",publicVisit:"Public visit",publicDescription:"Read the project concept and contributors",inviteEntry:"Invitation access",inviteDescription:"Creator Workspace",back:"Back",privateAccess:"Private access",enterCode:"Enter invitation",intro:"Participants enter their WeChat group name and invitation code. The Lead Designer enters the lead access code.",welcome:"The workspace records active project work.",welcomeDetail:"Game-making experience is not required. Sketches, text, references, and unfinished files may be submitted.",name:"WeChat group name (participants)",namePlaceholder:"WeChat group name",code:"Invitation code",verify:"Verify and enter",entering:"Opening…",required:"Participants must enter their WeChat group name.",error:"The collaboration area opens after the invitation is verified.",networkError:"Network error. Please check your connection and try again.",copyright:"© 2026 HuieChen. All rights reserved."}
};

function TitlePicture({className,alt="",priority=false,onLoad,onError,imageRef}:{className?:string;alt?:string;priority?:boolean;onLoad?:(event:SyntheticEvent<HTMLImageElement>)=>void;onError?:()=>void;imageRef?:Ref<HTMLImageElement>}){
 return <picture className={className}>
  <source media="(max-width: 860px)" srcSet="/what-100-people-title-600.webp" type="image/webp"/>
  <source srcSet="/what-100-people-title.webp" type="image/webp"/>
  <source srcSet="/what-100-people-title-600.png" type="image/png"/>
  <img ref={imageRef} src="/what-100-people-title-600.png" alt={alt} width="1200" height="800" fetchPriority={priority?"high":undefined} onLoad={onLoad} onError={onError}/>
 </picture>;
}

function OpeningSequence({phase,onReady,onFinish,onSoundRequest,onSoundToggle,soundOn}:{phase:IntroPhase;onReady:()=>void;onFinish:()=>void;onSoundRequest:()=>void;onSoundToggle:()=>void;soundOn:boolean}){
 const fragments=["what","hundred","people","do","game"];
 const ready=useRef(false);
 const preloadImage=useRef<HTMLImageElement>(null);
 function artworkReady(image?:HTMLImageElement|null){
  if(ready.current)return;
  ready.current=true;
  if(image&&typeof image.decode==="function")image.decode().then(onReady,onReady);
  else onReady();
 }
 useEffect(()=>{if(preloadImage.current?.complete)artworkReady(preloadImage.current)},[]);
 const active=phase==="playing"||phase==="leaving";
 return <div className={`openingSequence${phase==="loading"?" isLoading":" isPlaying"}${phase==="leaving"?" isLeaving":""}`} onPointerDown={onSoundRequest} aria-label="WHAT 100 PEOPLE DO TO A GAME opening title">
  <div className="openingPaper" aria-hidden="true"/>
  <div className="openingArtwork" role="img" aria-label="WHAT 100 PEOPLE DO TO A GAME">
   <TitlePicture className={active?"openingArtworkBase":"openingArtworkPreload"} priority imageRef={preloadImage} onLoad={event=>artworkReady(event.currentTarget)} onError={()=>artworkReady()}/>
   {active&&fragments.map(name=><span className={`openingFragment openingFragment-${name}`} key={name} aria-hidden="true"><TitlePicture/></span>)}
  </div>
  <button className={`openingSound${soundOn?" isOn":""}`} type="button" aria-pressed={soundOn} onPointerDown={event=>event.stopPropagation()} onClick={onSoundToggle}>
   <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path className="soundWave" d="M16 9.3c1.4 1.5 1.4 3.9 0 5.4M18.8 6.5c3 3 3 8 0 11"/></svg>
   <span>{soundOn?"声音已开 / Sound on":"开启声音 / Sound"}</span>
  </button>
  <button className="openingSkip" type="button" onPointerDown={event=>event.stopPropagation()} onClick={onFinish}>跳过片头 / Skip</button>
 </div>;
}

export function EntryStudio(){
 const [lang,setLang]=useState<Lang>("zh"),[invite,setInvite]=useState(false),[name,setName]=useState(""),[code,setCode]=useState(""),[notice,setNotice]=useState(""),[busy,setBusy]=useState(false),[introPhase,setIntroPhase]=useState<IntroPhase>("loading"),[introSoundOn,setIntroSoundOn]=useState(false);const introAudio=useRef<HTMLAudioElement>(null);const c=copy[lang];
 useEffect(()=>{const saved=storageGet("hundred-language");const next:Lang=saved==="en"||(!saved&&navigator.language.toLowerCase().startsWith("en"))?"en":"zh";setLang(next);const sync=()=>{const params=parseQuery(location.search);const nextInvite=params.access==="invite"||"invite" in params;setInvite(nextInvite);setIntroPhase(nextInvite?"done":"loading");const token=params.invite;if(token)setCode(token)};const restore=(event:PageTransitionEvent)=>{if(event.persisted)sync()};sync();window.addEventListener("popstate",sync);window.addEventListener("pageshow",restore);return()=>{window.removeEventListener("popstate",sync);window.removeEventListener("pageshow",restore)}},[]);
 useEffect(()=>{storageSet("hundred-language",lang);document.documentElement.lang=lang==="zh"?"zh-CN":"en"},[lang]);
 useEffect(()=>{
  if(introPhase==="loading"){
   const fallback=window.setTimeout(()=>setIntroPhase("playing"),1400);
   return()=>window.clearTimeout(fallback);
  }
  if(introPhase!=="playing"&&introPhase!=="leaving")return;
  const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  const compact=typeof matchMedia==="function"&&matchMedia("(max-width: 700px), (hover: none) and (pointer: coarse)").matches;
  if(introPhase==="playing"){
   const timer=window.setTimeout(()=>setIntroPhase("leaving"),reduced?900:compact?2300:2600);
   const audioTimer=reduced?0:window.setTimeout(()=>playIntroSound(),70);
   return()=>{window.clearTimeout(timer);if(audioTimer)window.clearTimeout(audioTimer)};
  }
  const timer=window.setTimeout(()=>finishIntro(),reduced?120:compact?280:340);
  return()=>window.clearTimeout(timer);
 },[introPhase]);
 function playIntroSound(){if(introPhase!=="playing")return;const audio=introAudio.current;if(!audio)return;if(!audio.paused){setIntroSoundOn(true);return}try{audio.volume=.24;if(audio.currentTime<.02)audio.currentTime=.08;const playback=audio.play();if(playback&&typeof playback.then==="function")playback.then(()=>setIntroSoundOn(true),()=>setIntroSoundOn(false));else setIntroSoundOn(true)}catch{setIntroSoundOn(false)}}
 function requestIntroSound(){if(introPhase==="playing"&&!introSoundOn)playIntroSound()}
 function toggleIntroSound(){const audio=introAudio.current;if(!audio)return;if(introSoundOn){try{audio.pause()}catch{}setIntroSoundOn(false);return}playIntroSound()}
 function finishIntro(){setIntroPhase("done");setIntroSoundOn(false);const audio=introAudio.current;if(audio){try{audio.pause();audio.currentTime=0}catch{}}}
 function openInvite(event:MouseEvent<HTMLAnchorElement>){event.preventDefault();history.pushState({},"","/?access=invite");setNotice("");setIntroPhase("done");setInvite(true)}
 function closeInvite(event:MouseEvent<HTMLAnchorElement>){event.preventDefault();history.pushState({},"","/");setNotice("");setIntroPhase("loading");setInvite(false)}
 async function submit(event:FormEvent){event.preventDefault();if(busy)return;setBusy(true);setNotice("");try{const response=await fetch("/api/access",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code,name})});if(!response.ok){const data=await response.json().catch(()=>({})) as {error?:string};setNotice(data.error==="Participant name is required"?c.required:c.error);return}const data=await response.json() as {role:"lead"|"participant";session?:string};go(data.role==="lead"?"/workspace?view=journal":data.session?`/workspace?k=${encodeURIComponent(data.session)}`:"/workspace");return}catch{setNotice(c.networkError)}finally{setBusy(false)}}
 function go(url:string){try{location.href=url}catch{location.replace(url)}setTimeout(()=>{if(!location.href.includes(url))location.href=url},600)}
 const wordmark=<span className="wordmark wordmarkInline"><span>WHAT </span><strong>100 PEOPLE</strong><span> DO TO A </span><strong>GAME</strong></span>;
 const language=<label className="languagePicker"><span><b aria-hidden="true">LANG</b>{c.language}</span><select aria-label={c.language} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="zh">中文</option><option value="en">English</option></select></label>;
 if(!invite)return <main className={`entryGate${introPhase==="checking"?" introChecking":""}`}>{introPhase!=="checking"&&introPhase!=="done"&&<><audio ref={introAudio} src="/audio/printer-intro.mp3" preload="auto" aria-hidden="true"/><OpeningSequence phase={introPhase} onReady={()=>setIntroPhase(current=>current==="loading"?"playing":current)} onFinish={finishIntro} onSoundRequest={requestIntroSound} onSoundToggle={toggleIntroSound} soundOn={introSoundOn}/></>}<div className="entryTop">{wordmark}{language}</div><section><h1 className="publicBrandTitle"><TitlePicture alt="WHAT 100 PEOPLE DO TO A GAME" priority/></h1><div className="entryChoices"><a className="entryChoice" href="/concept"><b>{c.publicVisit}</b><span>{c.publicDescription}</span></a><a className="entryChoice" href="/?access=invite" onClick={openInvite}><b>{c.inviteEntry}</b><span>{c.inviteDescription}</span></a></div></section><footer className="copyright">{c.copyright}</footer></main>;
 return <main className="entryGate inviteGate"><div className="entryTop"><a href="/" onClick={closeInvite}>← {c.back}</a>{language}</div><section><span className="kicker">{c.privateAccess}</span><h1>{c.enterCode}</h1><p>{c.intro}</p><aside className="creatorWelcome"><strong>{c.welcome}</strong><span>{c.welcomeDetail}</span></aside><form className="gateInvite" onSubmit={submit} aria-busy={busy}><label><span>{c.name}</span><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={40} placeholder={c.namePlaceholder}/></label><label><span>{c.code}</span><input value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" placeholder={c.code}/></label><button className="primary" type="submit" disabled={busy}>{busy?c.entering:c.verify}</button></form>{notice&&<p className="gateError" role="alert">{notice}</p>}</section><footer className="copyright">{c.copyright}</footer></main>;
}
