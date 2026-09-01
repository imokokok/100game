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
  zh:{language:"语言",entryKicker:"选择进入方式",entryTitle:"选择你要进入的部分",publicVisit:"普通访问",publicDescription:"阅读项目理念与共同创作者页面",inviteEntry:"邀请码进入",inviteDescription:"创作者协作区",back:"返回",privateAccess:"私密访问",enterCode:"填写邀请码",intro:"参与者填写微信群聊名和邀请码。",welcome:"创作区用于记录项目中的实际工作。",welcomeDetail:"不要求游戏制作经验。草图、文字、参考资料和未完成文件都可提交。",name:"微信群聊名（参与者）",namePlaceholder:"填写微信群聊名",code:"邀请码",verify:"验证并进入",entering:"正在进入…",required:"参与者请填写自己的微信群聊名。",error:"邀请码验证成功后才能进入协作区域。",networkError:"网络异常，请检查网络后重试。",leadAccess:"主策划登录",leadTitle:"主策划登录",leadIntro:"主策划账号由项目方单独分配，不对外发放。",leadUser:"用户名",leadUserPlaceholder:"用户名",leadPassword:"密码",leadSubmit:"登录并进入",leadError:"用户名或密码不正确。",leadTooMany:"登录尝试过于频繁，请稍后再试。",leadSwitch:"主策划登录 →",inviteSwitch:"← 返回邀请码进入",copyright:"© 2026 HuieChen. 版权所有。"},
  en:{language:"Language",entryKicker:"Choose access",entryTitle:"Choose where to enter",publicVisit:"Public visit",publicDescription:"Read the project concept and contributors",inviteEntry:"Invitation access",inviteDescription:"Creator Workspace",back:"Back",privateAccess:"Private access",enterCode:"Enter invitation",intro:"Participants enter their WeChat group name and invitation code.",welcome:"The workspace records active project work.",welcomeDetail:"Game-making experience is not required. Sketches, text, references, and unfinished files may be submitted.",name:"WeChat group name (participants)",namePlaceholder:"WeChat group name",code:"Invitation code",verify:"Verify and enter",entering:"Opening…",required:"Participants must enter their WeChat group name.",error:"The collaboration area opens after the invitation is verified.",networkError:"Network error. Please check your connection and try again.",leadAccess:"Lead sign-in",leadTitle:"Lead sign-in",leadIntro:"Lead accounts are issued by the project team and are not public.",leadUser:"Username",leadUserPlaceholder:"Username",leadPassword:"Password",leadSubmit:"Sign in",leadError:"Incorrect username or password.",leadTooMany:"Too many sign-in attempts. Please try again later.",leadSwitch:"Lead sign-in →",inviteSwitch:"← Back to invitation access",copyright:"© 2026 HuieChen. All rights reserved."},
};

function OpeningSequence({phase,onPlaying,onPlaybackBlocked,onPlaybackEnd,onPlaybackError,onFinish,mediaRef}:{phase:IntroPhase;onPlaying:()=>void;onPlaybackBlocked:(blocked:boolean)=>void;onPlaybackEnd:()=>void;onPlaybackError:()=>void;onFinish:()=>void;mediaRef:RefObject<HTMLVideoElement|null>}){
  // Mobile browsers only permit reliable inline autoplay while muted. A tap
  // anywhere on the film may restore its soundtrack without adding controls.
  const [soundEnabled,setSoundEnabled]=useState(false);
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
    onPlaybackBlocked(false);
    media.volume=1;
    media.muted=true;
    setSoundEnabled(false);
    const confirmProgress=()=>{
      if(cancelled||media.currentTime<.05)return;
      onPlaybackBlocked(false);
    };
    media.addEventListener("timeupdate",confirmProgress);
    try{
      // Do not call load() or reset currentTime here. Both operations restart
      // the request during hydration in iOS/WeChat and can freeze a decoded
      // middle frame. The server-rendered autoplay request is already active.
      const playback=media.play();
      if(playback&&typeof playback.then==="function"){
        void playback.catch(()=>{if(!cancelled)onPlaybackBlocked(true)});
      }
    }catch{
      if(!cancelled)playbackErrorRef.current();
    }
    return()=>{
      cancelled=true;
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
        poster="/video/opening-title-poster-ed541f.jpg"
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
        <source src="/video/opening-title-ed541f.mp4" type="video/mp4"/>
      </video>
    </div>
  </div>;
}

export function EntryStudio({initialInvite=false,initialLead=false,initialCode=""}:{initialInvite?:boolean;initialLead?:boolean;initialCode?:string}){
  const [lang,setLang]=useState<Lang>("zh");
  const [invite,setInvite]=useState(initialInvite);
  const [lead,setLead]=useState(initialLead);
  const [name,setName]=useState("");
  const [code,setCode]=useState(initialCode);
  const [leadUser,setLeadUser]=useState("");
  const [leadPassword,setLeadPassword]=useState("");
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [introPhase,setIntroPhase]=useState<IntroPhase>(initialInvite||initialLead?"done":"checking");
  const [introRun,setIntroRun]=useState(0);
  // Playback policy is diagnostic only. Keeping it in a ref avoids a render
  // loop from unreliable media events and, crucially, never cancels the
  // fail-open deadline.
  const introPlaybackBlocked=useRef(false);
  const introMedia=useRef<HTMLVideoElement>(null);
  const introHardStop=useRef<number|null>(null);
  const inviteRef=useRef(initialInvite);
  const leadRef=useRef(initialLead);
  const c=copy[lang];

  useEffect(()=>{
    const saved=storageGet("hundred-language");
    const next:Lang=saved==="en"||(!saved&&navigator.language.toLowerCase().startsWith("en"))?"en":"zh";
    setLang(next);
    const sync=()=>{
      const params=parseQuery(location.search);
      const nextInvite=params.access==="invite"||"invite" in params;
      const nextLead=params.access==="lead";
      const wasPastIntro=inviteRef.current||leadRef.current;
      inviteRef.current=nextInvite;
      leadRef.current=nextLead;
      setInvite(nextInvite);
      setLead(nextLead);
      if(nextInvite||nextLead){
        introPlaybackBlocked.current=false;
        setIntroPhase("done");
      }else if(wasPastIntro){
        setIntroPhase("checking");
      }
      const token=params.invite;
      if(token)setCode(token);
    };
    const restore=(event:PageTransitionEvent)=>{
      if(!event.persisted)return;
      if(introHardStop.current!==null){
        window.clearTimeout(introHardStop.current);
        introHardStop.current=null;
      }
      sync();
      const params=parseQuery(location.search);
      if(params.access==="invite"||"invite" in params||params.access==="lead")return;
      const media=introMedia.current;
      if(media){
        try{media.pause()}catch{}
      }
      introPlaybackBlocked.current=false;
      setIntroPhase("checking");
      setIntroRun(current=>current+1);
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
    if(invite||lead||introPhase!=="checking")return;
    // The supplied opening film is the project title itself, not decorative
    // scroll motion. Keep it present on every fresh entry (including devices
    // that request reduced UI motion); the surrounding transition is reduced
    // in CSS when requested.
    setIntroPhase("loading");
  },[introPhase,invite]);

  useEffect(()=>{
    if(introPhase==="loading"){
      // Never let a slow network, unsupported decoder, or old WebView trap the
      // visitor behind the opening layer. The entry page is always available.
      const fallback=window.setTimeout(()=>beginIntroExit(),2400);
      return()=>window.clearTimeout(fallback);
    }
    if(introPhase==="playing"){
      const fallback=window.setTimeout(()=>beginIntroExit(),4600);
      return()=>window.clearTimeout(fallback);
    }
    if(introPhase==="leaving"){
      const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fallback=window.setTimeout(()=>finishIntro(),reduced?40:650);
      return()=>window.clearTimeout(fallback);
    }
  },[introPhase]);

  useEffect(()=>{
    if(invite||lead)return;
    // This wall-clock watchdog is deliberately independent of video events
    // and React playback state. Some WeChat/X5 WebViews freeze on a decoded
    // middle frame without firing `ended`, `error`, `stalled`, or `playing`.
    // Even in that failure mode the access screen is released automatically.
    const release=()=>setIntroPhase(current=>current==="done"||current==="leaving"?current:"leaving");
    const hardStop=window.setTimeout(release,4800);
    introHardStop.current=hardStop;
    return()=>{
      window.clearTimeout(hardStop);
      if(introHardStop.current===hardStop)introHardStop.current=null;
    };
  },[invite,lead,introRun]);

  function beginIntroExit(){
    setIntroPhase(current=>current==="done"||current==="leaving"?current:"leaving");
  }

  function finishIntro(){
    setIntroPhase("done");
    introPlaybackBlocked.current=false;
    if(introHardStop.current!==null){
      window.clearTimeout(introHardStop.current);
      introHardStop.current=null;
    }
    const media=introMedia.current;
    if(media){
      try{media.pause()}catch{}
    }
  }

  function openInvite(event:MouseEvent<HTMLAnchorElement>){
    event.preventDefault();
    history.pushState({},"","/?access=invite");
    setNotice("");
    finishIntro();
    inviteRef.current=true;
    leadRef.current=false;
    setInvite(true);
    setLead(false);
  }

  function closeInvite(event:MouseEvent<HTMLAnchorElement>){
    event.preventDefault();
    history.pushState({},"","/");
    setNotice("");
    inviteRef.current=false;
    leadRef.current=false;
    setInvite(false);
    setLead(false);
    setIntroPhase("checking");
  }

  function openLead(event:MouseEvent<HTMLAnchorElement>){
    event.preventDefault();
    history.pushState({},"","/?access=lead");
    setNotice("");
    finishIntro();
    inviteRef.current=false;
    leadRef.current=true;
    setInvite(false);
    setLead(true);
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

  async function submitLead(event:FormEvent){
    event.preventDefault();
    if(busy)return;
    setBusy(true);
    setNotice("");
    try{
      const response=await fetch("/api/lead/login",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"content-type":"application/json"},body:JSON.stringify({username:leadUser,password:leadPassword})});
      if(!response.ok){
        setNotice(response.status===429?c.leadTooMany:c.leadError);
        return;
      }
      go("/workspace?view=journal");
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

  const introActive=!invite&&!lead&&introPhase!=="done";
  const wordmark=<span className="wordmark wordmarkInline"><span>WHAT </span><strong>100 PEOPLE</strong><span> DO TO A </span><strong>GAME</strong></span>;
  const language=<label className="languagePicker"><span><b aria-hidden="true">LANG</b>{c.language}</span><select tabIndex={introActive?-1:undefined} aria-label={c.language} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="zh">中文</option><option value="en">English</option></select></label>;

  if(lead){
    return <main className="entryGate inviteGate">
      <div className="entryTop"><a href="/?access=invite" onClick={openInvite}>{c.inviteSwitch}</a>{language}</div>
      <section>
        <span className="kicker">{c.leadAccess}</span>
        <h1>{c.leadTitle}</h1>
        <p>{c.leadIntro}</p>
        <form className="gateInvite" onSubmit={submitLead} aria-busy={busy}>
          <label><span>{c.leadUser}</span><input value={leadUser} onChange={e=>setLeadUser(e.target.value)} autoFocus autoComplete="username" maxLength={120} placeholder={c.leadUserPlaceholder}/></label>
          <label><span>{c.leadPassword}</span><input type="password" value={leadPassword} onChange={e=>setLeadPassword(e.target.value)} autoComplete="current-password" placeholder={c.leadPassword}/></label>
          <button className="primary" type="submit" disabled={busy}>{busy?c.entering:c.leadSubmit}</button>
        </form>
        {notice&&<p className="gateError" role="alert">{notice}</p>}
      </section>
      <footer className="copyright">{c.copyright}</footer>
    </main>;
  }

  if(!invite){
    return <main className={`entryGate${introActive?" introPending":""}${introPhase==="leaving"?" introRevealing":""}`}>
      {introActive&&<OpeningSequence
        phase={introPhase}
        onPlaying={()=>{
          introPlaybackBlocked.current=false;
          setIntroPhase(current=>current==="loading"?"playing":current);
        }}
        onPlaybackBlocked={blocked=>{introPlaybackBlocked.current=blocked}}
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
      <p className="gateSwitch"><a href="/?access=lead" onClick={openLead}>{c.leadSwitch}</a></p>
    </section>
    <footer className="copyright">{c.copyright}</footer>
  </main>;
}
