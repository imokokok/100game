"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import {parseQuery,storageGet,storageSet} from "./client-compat";

type Lang="zh"|"en";
type IntroPhase="checking"|"loading"|"playing"|"leaving"|"done";

const copy={
  zh:{language:"语言",entryKicker:"选择进入方式",entryTitle:"选择你要进入的部分",publicVisit:"普通访问",publicDescription:"阅读项目理念与共同创作者页面",inviteEntry:"邀请码进入",inviteDescription:"创作者协作区",back:"返回",privateAccess:"私密访问",enterCode:"填写邀请码",intro:"参与者填写微信群聊名和邀请码；主策划直接输入主策划验证码。",welcome:"创作区用于记录项目中的实际工作。",welcomeDetail:"不要求游戏制作经验。草图、文字、参考资料和未完成文件都可提交。",name:"微信群聊名（参与者）",namePlaceholder:"填写微信群聊名",code:"邀请码",verify:"验证并进入",entering:"正在进入…",required:"参与者请填写自己的微信群聊名。",error:"邀请码验证成功后才能进入协作区域。",networkError:"网络异常，请检查网络后重试。",copyright:"© 2026 HuieChen. 版权所有。"},
  en:{language:"Language",entryKicker:"Choose access",entryTitle:"Choose where to enter",publicVisit:"Public visit",publicDescription:"Read the project concept and contributors",inviteEntry:"Invitation access",inviteDescription:"Creator Workspace",back:"Back",privateAccess:"Private access",enterCode:"Enter invitation",intro:"Participants enter their WeChat group name and invitation code. The Lead Designer enters the lead access code.",welcome:"The workspace records active project work.",welcomeDetail:"Game-making experience is not required. Sketches, text, references, and unfinished files may be submitted.",name:"WeChat group name (participants)",namePlaceholder:"WeChat group name",code:"Invitation code",verify:"Verify and enter",entering:"Opening…",required:"Participants must enter their WeChat group name.",error:"The collaboration area opens after the invitation is verified.",networkError:"Network error. Please check your connection and try again.",copyright:"© 2026 HuieChen. All rights reserved."},
};

function OpeningSequence({phase,onPlaying,onPlaybackBlocked,onPlaybackEnd,onPlaybackError,onFinish,mediaRef}:{phase:IntroPhase;onPlaying:()=>void;onPlaybackBlocked:(blocked:boolean)=>void;onPlaybackEnd:()=>void;onPlaybackError:()=>void;onFinish:()=>void;mediaRef:RefObject<HTMLVideoElement|null>}){
  // Start audibly where a browser permits it, then fall back to muted motion.
  // A tap anywhere on the film restores its soundtrack without adding UI.
  const [soundEnabled,setSoundEnabled]=useState(true);
  const playbackErrorRef=useRef(onPlaybackError);
  playbackErrorRef.current=onPlaybackError;

  function reportBlocked(blocked:boolean){
    onPlaybackBlocked(blocked);
  }

  function requestPlayback(){
    const media=mediaRef.current;
    if(!media)return;
    // This function runs directly inside a click/tap gesture, which is the
    // only cross-browser way to guarantee audible playback.
    media.volume=1;
    media.muted=false;
    setSoundEnabled(true);
    onPlaybackBlocked(false);
    try{
      const playback=media.play();
      if(playback&&typeof playback.then==="function"){
        void playback.catch(()=>reportBlocked(true));
      }
    }catch{
      reportBlocked(true);
    }
  }

  useEffect(()=>{
    if(phase!=="loading")return;
    const media=mediaRef.current;
    if(!media)return;
    let cancelled=false;
    onPlaybackBlocked(true);
    media.volume=1;
    media.muted=false;
    setSoundEnabled(true);
    try{media.currentTime=0}catch{}
    const startMuted=()=>{
      if(cancelled)return;
      media.muted=true;
      setSoundEnabled(false);
      try{
        const mutedPlayback=media.play();
        if(mutedPlayback&&typeof mutedPlayback.then==="function"){
          void mutedPlayback.catch(()=>{
            if(!cancelled)onPlaybackBlocked(true);
          });
        }
      }catch{
        onPlaybackBlocked(true);
      }
    };
    const attempt=()=>{
      if(cancelled)return;
      try{
        const playback=media.play();
        if(playback&&typeof playback.then==="function"){
          void playback.catch(()=>{
            if(cancelled)return;
            // Browsers normally reject audible autoplay. Fall back to muted
            // playback immediately so the opening never traps the visitor;
            // the next tap can still enable its original soundtrack.
            startMuted();
          });
        }
      }catch{
        startMuted();
      }
    };
    const retry=()=>{if(media.paused&&!media.error)attempt()};
    const confirmProgress=()=>{
      if(cancelled||media.currentTime<.05)return;
      onPlaybackBlocked(false);
    };
    const progressWatch=window.setTimeout(()=>{
      if(cancelled)return;
      if(media.paused||media.currentTime<.05){
        onPlaybackBlocked(true);
      }
    },1200);
    media.addEventListener("loadeddata",retry);
    media.addEventListener("canplay",retry);
    media.addEventListener("timeupdate",confirmProgress);
    try{media.load();attempt()}catch{
      if(!cancelled)playbackErrorRef.current();
    }
    return()=>{
      cancelled=true;
      window.clearTimeout(progressWatch);
      media.removeEventListener("loadeddata",retry);
      media.removeEventListener("canplay",retry);
      media.removeEventListener("timeupdate",confirmProgress);
    };
  },[mediaRef,onPlaybackBlocked,phase]);

  return <div
    className={`openingSequence is${phase[0].toUpperCase()}${phase.slice(1)}`}
    role="dialog"
    aria-modal="true"
    aria-label="WHAT 100 PEOPLE DO TO A GAME opening title"
    onAnimationEnd={event=>{
      if(event.currentTarget===event.target&&phase==="leaving")onFinish();
    }}
    onClick={requestPlayback}
  >
    <div className="openingPaper" aria-hidden="true"/>
    <div className="openingMedia">
      <video
        ref={mediaRef}
        className="openingVideo"
        width="1280"
        height="720"
        poster="/video/opening-title-poster.jpg"
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        {...{"webkit-playsinline":"true","x5-playsinline":"true","x5-video-player-type":"h5-page","x5-video-player-fullscreen":"false"}}
        muted={!soundEnabled}
        onPlaying={()=>{
          reportBlocked(false);
          onPlaying();
        }}
        onEnded={onPlaybackEnd}
        onError={()=>{
          reportBlocked(true);
          onPlaybackError();
        }}
        disablePictureInPicture
        aria-label="WHAT 100 PEOPLE DO TO A GAME animated opening"
      >
        <source src="/video/opening-title-6a63d7e7.mp4" type="video/mp4"/>
      </video>
    </div>
  </div>;
}

export function EntryStudio({initialInvite=false,initialCode=""}:{initialInvite?:boolean;initialCode?:string}){
  const [lang,setLang]=useState<Lang>("zh");
  const [invite,setInvite]=useState(initialInvite);
  const [name,setName]=useState("");
  const [code,setCode]=useState(initialCode);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [introPhase,setIntroPhase]=useState<IntroPhase>(initialInvite?"done":"checking");
  const [introWaitingForGesture,setIntroWaitingForGesture]=useState(false);
  const introMedia=useRef<HTMLVideoElement>(null);
  const inviteRef=useRef(initialInvite);
  const c=copy[lang];

  useEffect(()=>{
    const saved=storageGet("hundred-language");
    const next:Lang=saved==="en"||(!saved&&navigator.language.toLowerCase().startsWith("en"))?"en":"zh";
    setLang(next);
    const sync=()=>{
      const params=parseQuery(location.search);
      const nextInvite=params.access==="invite"||"invite" in params;
      const wasInvite=inviteRef.current;
      inviteRef.current=nextInvite;
      setInvite(nextInvite);
      if(nextInvite){
        setIntroWaitingForGesture(false);
        setIntroPhase("done");
      }else if(wasInvite){
        setIntroPhase("checking");
      }
      const token=params.invite;
      if(token)setCode(token);
    };
    const restore=(event:PageTransitionEvent)=>{
      if(!event.persisted)return;
      sync();
      const params=parseQuery(location.search);
      if(params.access==="invite"||"invite" in params)return;
      const media=introMedia.current;
      if(media){
        try{media.pause();media.currentTime=0}catch{}
      }
      setIntroWaitingForGesture(false);
      setIntroPhase("checking");
    };
    sync();
    window.addEventListener("popstate",sync);
    window.addEventListener("pageshow",restore);
    return()=>{
      window.removeEventListener("popstate",sync);
      window.removeEventListener("pageshow",restore);
    };
  },[]);

  useEffect(()=>{
    storageSet("hundred-language",lang);
    document.documentElement.lang=lang==="zh"?"zh-CN":"en";
  },[lang]);

  useEffect(()=>{
    if(invite||introPhase!=="checking")return;
    // The supplied opening film is the project title itself, not decorative
    // scroll motion. Keep it present on every fresh entry (including devices
    // that request reduced UI motion); the surrounding transition is reduced
    // in CSS when requested.
    setIntroPhase("loading");
  },[introPhase,invite]);

  useEffect(()=>{
    if(introPhase==="loading"&&!introWaitingForGesture){
      // Never let a slow network, unsupported decoder, or old WebView trap the
      // visitor behind the opening layer. The entry page is always available.
      const fallback=window.setTimeout(()=>beginIntroExit(),4200);
      return()=>window.clearTimeout(fallback);
    }
    if(introPhase==="playing"){
      const fallback=window.setTimeout(()=>beginIntroExit(),5500);
      return()=>window.clearTimeout(fallback);
    }
    if(introPhase==="leaving"){
      const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fallback=window.setTimeout(()=>finishIntro(),reduced?40:1100);
      return()=>window.clearTimeout(fallback);
    }
  },[introPhase,introWaitingForGesture]);

  function beginIntroExit(){
    setIntroPhase(current=>current==="done"||current==="leaving"?current:"leaving");
  }

  function finishIntro(){
    setIntroPhase("done");
    setIntroWaitingForGesture(false);
    const media=introMedia.current;
    if(media){
      try{media.pause();media.currentTime=0}catch{}
    }
  }

  function openInvite(event:MouseEvent<HTMLAnchorElement>){
    event.preventDefault();
    history.pushState({},"","/?access=invite");
    setNotice("");
    finishIntro();
    inviteRef.current=true;
    setInvite(true);
  }

  function closeInvite(event:MouseEvent<HTMLAnchorElement>){
    event.preventDefault();
    history.pushState({},"","/");
    setNotice("");
    inviteRef.current=false;
    setInvite(false);
    setIntroPhase("checking");
  }

  async function submit(event:FormEvent){
    event.preventDefault();
    if(busy)return;
    setBusy(true);
    setNotice("");
    try{
      const response=await fetch("/api/access",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"content-type":"application/json"},body:JSON.stringify({code,name})});
      if(!response.ok){
        const data=await response.json().catch(()=>({})) as {error?:string};
        setNotice(data.error==="Participant name is required"?c.required:c.error);
        return;
      }
      const data=await response.json() as {role:"lead"|"participant"};
      go(data.role==="lead"?"/workspace?view=journal":"/workspace");
      return;
    }catch{
      setNotice(c.networkError);
    }finally{
      setBusy(false);
    }
  }

  function go(url:string){
    try{location.href=url}catch{location.replace(url)}
    setTimeout(()=>{if(!location.href.includes(url))location.href=url},600);
  }

  const introActive=!invite&&introPhase!=="done";
  const wordmark=<span className="wordmark wordmarkInline"><span>WHAT </span><strong>100 PEOPLE</strong><span> DO TO A </span><strong>GAME</strong></span>;
  const language=<label className="languagePicker"><span><b aria-hidden="true">LANG</b>{c.language}</span><select tabIndex={introActive?-1:undefined} aria-label={c.language} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="zh">中文</option><option value="en">English</option></select></label>;

  if(!invite){
    return <main className={`entryGate${introActive?" introPending":""}${introPhase==="leaving"?" introRevealing":""}`}>
      {introActive&&<OpeningSequence
        phase={introPhase}
        onPlaying={()=>{
          setIntroWaitingForGesture(false);
          setIntroPhase(current=>current==="loading"?"playing":current);
        }}
        onPlaybackBlocked={setIntroWaitingForGesture}
        onPlaybackEnd={beginIntroExit}
        onPlaybackError={()=>{
          // A broken media file must not trap visitors on the opening layer.
          beginIntroExit();
        }}
        onFinish={finishIntro}
        mediaRef={introMedia}
      />}
      <div className="entryTop" aria-hidden={introActive} inert={introActive?true:undefined}>{wordmark}{language}</div>
      <section aria-hidden={introActive} inert={introActive?true:undefined}>
        <span className="kicker entryKicker">{c.entryKicker}</span>
        <h1 className="entryAccessTitle">{c.entryTitle}</h1>
        <div className="entryChoices"><a tabIndex={introActive?-1:undefined} className="entryChoice" href="/concept"><b>{c.publicVisit}</b><span>{c.publicDescription}</span></a><a tabIndex={introActive?-1:undefined} className="entryChoice" href="/?access=invite" onClick={openInvite}><b>{c.inviteEntry}</b><span>{c.inviteDescription}</span></a></div>
      </section>
      <footer className="copyright" aria-hidden={introActive} inert={introActive?true:undefined}>{c.copyright}</footer>
    </main>;
  }

  return <main className="entryGate inviteGate">
    <div className="entryTop"><a href="/" onClick={closeInvite}>← {c.back}</a>{language}</div>
    <section>
      <span className="kicker">{c.privateAccess}</span>
      <h1>{c.enterCode}</h1>
      <p>{c.intro}</p>
      <aside className="creatorWelcome"><strong>{c.welcome}</strong><span>{c.welcomeDetail}</span></aside>
      <form className="gateInvite" onSubmit={submit} aria-busy={busy}>
        <label><span>{c.name}</span><input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={40} placeholder={c.namePlaceholder}/></label>
        <label><span>{c.code}</span><input value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" placeholder={c.code}/></label>
        <button className="primary" type="submit" disabled={busy}>{busy?c.entering:c.verify}</button>
      </form>
      {notice&&<p className="gateError" role="alert">{notice}</p>}
    </section>
    <footer className="copyright">{c.copyright}</footer>
  </main>;
}
