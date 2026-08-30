"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
  type Ref,
  type RefObject,
  type SyntheticEvent,
} from "react";
import {preload} from "react-dom";
import {parseQuery,storageGet,storageSet} from "./client-compat";

type Lang="zh"|"en";
type IntroPhase="checking"|"loading"|"playing"|"leaving"|"done";

const copy={
  zh:{language:"语言",publicVisit:"普通访问",publicDescription:"阅读项目理念与共同创作者页面",inviteEntry:"邀请码进入",inviteDescription:"创作者协作区",back:"返回",privateAccess:"私密访问",enterCode:"填写邀请码",intro:"参与者填写微信群聊名和邀请码；主策划直接输入主策划验证码。",welcome:"创作区用于记录项目中的实际工作。",welcomeDetail:"不要求游戏制作经验。草图、文字、参考资料和未完成文件都可提交。",name:"微信群聊名（参与者）",namePlaceholder:"填写微信群聊名",code:"邀请码",verify:"验证并进入",entering:"正在进入…",required:"参与者请填写自己的微信群聊名。",error:"邀请码验证成功后才能进入协作区域。",networkError:"网络异常，请检查网络后重试。",copyright:"© 2026 HuieChen. 版权所有。"},
  en:{language:"Language",publicVisit:"Public visit",publicDescription:"Read the project concept and contributors",inviteEntry:"Invitation access",inviteDescription:"Creator Workspace",back:"Back",privateAccess:"Private access",enterCode:"Enter invitation",intro:"Participants enter their WeChat group name and invitation code. The Lead Designer enters the lead access code.",welcome:"The workspace records active project work.",welcomeDetail:"Game-making experience is not required. Sketches, text, references, and unfinished files may be submitted.",name:"WeChat group name (participants)",namePlaceholder:"WeChat group name",code:"Invitation code",verify:"Verify and enter",entering:"Opening…",required:"Participants must enter their WeChat group name.",error:"The collaboration area opens after the invitation is verified.",networkError:"Network error. Please check your connection and try again.",copyright:"© 2026 HuieChen. All rights reserved."},
};

function TitlePicture({className,alt="",priority=false,onLoad,onError,imageRef}:{className?:string;alt?:string;priority?:boolean;onLoad?:(event:SyntheticEvent<HTMLImageElement>)=>void;onError?:()=>void;imageRef?:Ref<HTMLImageElement>}){
  return <picture className={className}>
    <source media="(max-width: 860px)" srcSet="/what-100-people-title-600.webp" type="image/webp"/>
    <source srcSet="/what-100-people-title.webp" type="image/webp"/>
    <source srcSet="/what-100-people-title-600.png" type="image/png"/>
    <img ref={imageRef} src="/what-100-people-title-600.png" alt={alt} width="1200" height="800" fetchPriority={priority?"high":undefined} onLoad={onLoad} onError={onError}/>
  </picture>;
}

function OpeningSequence({phase,onPlaying,onPlaybackBlocked,onPlaybackEnd,onPlaybackError,onFinish,onSkip,onSoundToggle,onSoundEnable,soundOn,mediaRef}:{phase:IntroPhase;onPlaying:()=>void;onPlaybackBlocked:(blocked:boolean)=>void;onPlaybackEnd:()=>void;onPlaybackError:()=>void;onFinish:()=>void;onSkip:()=>void;onSoundToggle:()=>void;onSoundEnable:()=>void;soundOn:boolean;mediaRef:RefObject<HTMLVideoElement|null>}){
  // Keep a real play action available until the media timeline has actually
  // advanced. Some older iOS and WeChat WebViews resolve play() while still
  // displaying the poster frame.
  const [needsPlayGesture,setNeedsPlayGesture]=useState(true);
  const playbackErrorRef=useRef(onPlaybackError);
  playbackErrorRef.current=onPlaybackError;

  function reportBlocked(blocked:boolean){
    setNeedsPlayGesture(blocked);
    onPlaybackBlocked(blocked);
  }

  function requestPlayback(){
    const media=mediaRef.current;
    if(!media)return;
    // This function runs directly inside a click/tap gesture, which is the
    // only cross-browser way to guarantee audible playback.
    media.volume=1;
    media.muted=false;
    onSoundEnable();
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
    setNeedsPlayGesture(true);
    onPlaybackBlocked(true);
    media.volume=1;
    media.muted=false;
    try{media.currentTime=0}catch{}
    const attempt=()=>{
      if(cancelled)return;
      try{
        const playback=media.play();
        if(playback&&typeof playback.then==="function"){
          void playback.catch(()=>{
            if(cancelled)return;
            // Autoplay rejection is not a broken media file. Keep the opening
            // visible and offer a direct gesture instead of skipping it.
            setNeedsPlayGesture(true);
            onPlaybackBlocked(true);
          });
        }
      }catch{
        if(!cancelled){
          setNeedsPlayGesture(true);
          onPlaybackBlocked(true);
        }
      }
    };
    const retry=()=>{if(media.paused&&!media.error)attempt()};
    const confirmProgress=()=>{
      if(cancelled||media.currentTime<.05)return;
      setNeedsPlayGesture(false);
      onPlaybackBlocked(false);
    };
    const progressWatch=window.setTimeout(()=>{
      if(cancelled)return;
      if(media.paused||media.currentTime<.05){
        setNeedsPlayGesture(true);
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
  >
    <div className="openingPaper" aria-hidden="true"/>
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
      muted={!soundOn}
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
    {needsPlayGesture&&<button className="openingStart" type="button" onClick={requestPlayback}>播放有声片头 / Play with sound</button>}
    <div className="openingControls">
      <button className={`openingSound${soundOn?" isOn":""}`} type="button" aria-label={soundOn?"关闭片头声音 / Mute opening":"开启片头声音 / Play opening sound"} aria-pressed={soundOn} onClick={onSoundToggle}>
        <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path className="soundWave" d="M16 9.3c1.4 1.5 1.4 3.9 0 5.4M18.8 6.5c3 3 3 8 0 11"/></svg>
        <span>{soundOn?"声音已开 / Sound on":"开启声音 / Sound"}</span>
      </button>
      <button className="openingSkip" type="button" onClick={onSkip}>跳过片头 / Skip</button>
    </div>
  </div>;
}

export function EntryStudio({initialInvite=false,initialCode=""}:{initialInvite?:boolean;initialCode?:string}){
  if(!initialInvite){
    preload("/video/opening-title-poster.jpg",{as:"image",type:"image/jpeg",fetchPriority:"high"});
    preload("/video/opening-title-6a63d7e7.mp4",{as:"video",type:"video/mp4"});
  }
  const [lang,setLang]=useState<Lang>("zh");
  const [invite,setInvite]=useState(initialInvite);
  const [name,setName]=useState("");
  const [code,setCode]=useState(initialCode);
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [introPhase,setIntroPhase]=useState<IntroPhase>(initialInvite?"done":"checking");
  const [introSoundOn,setIntroSoundOn]=useState(true);
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
      setIntroSoundOn(false);
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
    // that request reduced UI motion); the Skip control remains immediately
    // available and the surrounding transition is reduced in CSS.
    setIntroSoundOn(true);
    setIntroPhase("loading");
  },[introPhase,invite]);

  useEffect(()=>{
    if(introPhase==="loading"&&!introWaitingForGesture){
      // Slow mobile networks must not make the opening disappear. If playback
      // has not started, keep the film visible and expose a direct play action.
      const fallback=window.setTimeout(()=>setIntroWaitingForGesture(true),8000);
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

  function toggleIntroSound(){
    const media=introMedia.current;
    if(!media)return;
    if(introSoundOn){
      media.muted=true;
      setIntroSoundOn(false);
      return;
    }
    media.volume=1;
    media.muted=false;
    try{
      const playback=media.play();
      if(playback&&typeof playback.then==="function"){
        void playback.then(()=>setIntroSoundOn(true),()=>{
          media.muted=true;
          setIntroSoundOn(false);
          try{
            const mutedPlayback=media.play();
            if(mutedPlayback&&typeof mutedPlayback.catch==="function")void mutedPlayback.catch(()=>{});
          }catch{}
        });
      }else setIntroSoundOn(true);
    }catch{
      media.muted=true;
      setIntroSoundOn(false);
    }
  }

  function finishIntro(){
    setIntroPhase("done");
    setIntroSoundOn(false);
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
          // A transient media/autoplay error is not permission to skip the
          // supplied opening film. Keep its poster on screen and let the user
          // retry or explicitly choose Skip.
          setIntroWaitingForGesture(true);
          setIntroPhase(current=>current==="done"||current==="leaving"?current:"loading");
        }}
        onFinish={finishIntro}
        onSkip={beginIntroExit}
        onSoundToggle={toggleIntroSound}
        onSoundEnable={()=>setIntroSoundOn(true)}
        soundOn={introSoundOn}
        mediaRef={introMedia}
      />}
      <div className="entryTop" aria-hidden={introActive} inert={introActive?true:undefined}>{wordmark}{language}</div>
      <section aria-hidden={introActive} inert={introActive?true:undefined}>
        <h1 className="publicBrandTitle entryProjectTitle"><TitlePicture alt="WHAT 100 PEOPLE DO TO A GAME" priority={!introActive}/></h1>
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
