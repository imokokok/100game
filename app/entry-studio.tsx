"use client";

import {useCallback,useEffect,useRef,useState,type FormEvent,type MouseEvent,type RefObject} from "react";
import {parseQuery,storageGet,storageSet} from "./client-compat";
import {editorialContent,type EditorialLang} from "./public-home/content";
import {
 ClosingSection,HeroSection,InspirationSection,PeopleSection,ProcessSection,ProjectMark,QuestionSection,Why100Section,WorldSection,
} from "./public-home/sections";

type IntroPhase="loading"|"playing"|"leaving"|"done";

function EditorialLanguageMenu({lang,label,onChange}:{lang:EditorialLang;label:string;onChange:(next:EditorialLang)=>void}){
 const [open,setOpen]=useState(false);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);

 useEffect(()=>{
  if(!open)return;
  const closeOutside=(event:PointerEvent)=>{if(root.current&&!root.current.contains(event.target as Node))setOpen(false)};
  const closeWithKeyboard=(event:KeyboardEvent)=>{if(event.key!=="Escape")return;setOpen(false);trigger.current?.focus()};
  document.addEventListener("pointerdown",closeOutside);
  window.addEventListener("keydown",closeWithKeyboard);
  return()=>{document.removeEventListener("pointerdown",closeOutside);window.removeEventListener("keydown",closeWithKeyboard)};
 },[open]);

 const select=(next:EditorialLang)=>{onChange(next);setOpen(false);window.setTimeout(()=>trigger.current?.focus(),0)};
 return <div ref={root} className={`editorialLanguage${open?" isOpen":""}`}>
  <span className="editorialLanguageLabel">{label}</span>
  <button ref={trigger} className="editorialLanguageTrigger" type="button" aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>
   <span>{lang==="zh"?"中文":"EN"}</span><i aria-hidden="true"/>
  </button>
  {open&&<div className="editorialLanguageMenu" role="listbox" aria-label={label}>
   <button type="button" role="option" aria-selected={lang==="zh"} onClick={()=>select("zh")}>中文</button>
   <button type="button" role="option" aria-selected={lang==="en"} onClick={()=>select("en")}>EN</button>
  </div>}
 </div>;
}

function OpeningSequence({phase,mediaRef,onPlaying,onEnded,onError,onFinish}:{phase:IntroPhase;mediaRef:RefObject<HTMLVideoElement|null>;onPlaying:()=>void;onEnded:()=>void;onError:()=>void;onFinish:()=>void}){
 const [soundEnabled,setSoundEnabled]=useState(false);

 const enableSound=useCallback(()=>{
  const media=mediaRef.current;if(!media)return;
  media.volume=1;media.muted=false;
  try{
   const playback=media.play();
   if(playback&&typeof playback.then==="function")void playback.then(()=>setSoundEnabled(true)).catch(()=>{media.muted=true;setSoundEnabled(false);void media.play().catch(()=>undefined)});
   else setSoundEnabled(true);
  }catch{media.muted=true;setSoundEnabled(false);try{void media.play()}catch{/* The independent timeout releases the page. */}}
 },[mediaRef]);

 useEffect(()=>{
  if(phase!=="loading")return;
  const media=mediaRef.current;if(!media)return;
  let cancelled=false;
  media.volume=1;
  media.muted=false;
  try{
   const audible=media.play();
   if(audible&&typeof audible.then==="function"){
    void audible.then(()=>{if(!cancelled)setSoundEnabled(true)}).catch(()=>{
     if(cancelled)return;media.muted=true;setSoundEnabled(false);
     try{const muted=media.play();if(muted&&typeof muted.catch==="function")void muted.catch(()=>{if(!cancelled)onError()})}catch{onError()}
    });
   }else window.setTimeout(()=>{if(!cancelled)setSoundEnabled(true)},0);
  }catch{
   media.muted=true;
   try{void media.play()}catch{onError()}
  }
  const bridge=()=>enableSound();
  document.addEventListener("WeixinJSBridgeReady",bridge);
  document.addEventListener("YixinJSBridgeReady",bridge);
  return()=>{cancelled=true;document.removeEventListener("WeixinJSBridgeReady",bridge);document.removeEventListener("YixinJSBridgeReady",bridge)};
 },[enableSound,mediaRef,onError,phase]);

 return <div
  className={`openingSequence is${phase[0].toUpperCase()}${phase.slice(1)}`}
  role="dialog"
  aria-modal="true"
  aria-label="WHAT 100 PEOPLE DO TO A GAME opening title"
  onPointerDown={enableSound}
  onTouchEnd={enableSound}
  onAnimationEnd={event=>{if(event.currentTarget===event.target&&phase==="leaving")onFinish()}}
 >
  <div className="openingMedia">
   <picture className="openingTitleStill" aria-hidden="true">
    <source srcSet="/images/title-art-sharp-v2.webp" type="image/webp"/>
    <img src="/images/title-art-sharp-v2-fallback.png" alt="" width="1920" height="1280" decoding="async" draggable="false"/>
   </picture>
   <video
    ref={mediaRef}
    className="openingVideo"
    width="960"
    height="720"
    poster="/video/opening-title-poster-ed541f.webp"
    autoPlay
    playsInline
    preload="auto"
    controls={false}
    controlsList="nodownload noplaybackrate noremoteplayback"
    {...{"webkit-playsinline":"true","x5-playsinline":"true","x5-video-player-type":"h5-page","x5-video-player-fullscreen":"false"}}
    muted={!soundEnabled}
    onPlaying={onPlaying}
    onEnded={onEnded}
    onError={onError}
    disablePictureInPicture
    disableRemotePlayback
    aria-label="WHAT 100 PEOPLE DO TO A GAME animated opening"
   >
    <source src="/video/opening-title-ed541f.mp4" type="video/mp4"/>
   </video>
  </div>
 </div>;
}

export function EntryStudio({initialInvite=false,initialCode=""}:{initialInvite?:boolean;initialCode?:string}){
 const [lang,setLang]=useState<EditorialLang>("zh"),[creatorOpen,setCreatorOpen]=useState(initialInvite),[name,setName]=useState(""),[code,setCode]=useState(initialCode),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [introPhase,setIntroPhase]=useState<IntroPhase>(initialInvite?"done":"loading");
 const firstInput=useRef<HTMLInputElement>(null),creatorButton=useRef<HTMLAnchorElement>(null),introMedia=useRef<HTMLVideoElement>(null),introHardStop=useRef<number|null>(null);
 const c=editorialContent[lang];

 useEffect(()=>{
  const sync=()=>{const params=parseQuery(location.search);const nextOpen=params.access==="invite"||"invite" in params;setCreatorOpen(nextOpen);if(nextOpen)finishIntro();const token=params.invite;if(token)setCode(token)};
  const restore=(event:PageTransitionEvent)=>{if(event.persisted)finishIntro()};
  const hydrate=window.setTimeout(()=>{const saved=storageGet("hundred-language");if(saved==="en")setLang("en");sync()},0);
  window.addEventListener("popstate",sync);window.addEventListener("pageshow",restore);return()=>{window.clearTimeout(hydrate);window.removeEventListener("popstate",sync);window.removeEventListener("pageshow",restore)};
 },[]);
 useEffect(()=>{document.documentElement.lang=lang==="zh"?"zh-CN":"en";storageSet("hundred-language",lang)},[lang]);
 useEffect(()=>{
  if(introPhase==="loading"){
   const fallback=window.setTimeout(()=>beginIntroExit(),4000);return()=>window.clearTimeout(fallback);
  }
  if(introPhase==="playing"){
   const fallback=window.setTimeout(()=>beginIntroExit(),3800);return()=>window.clearTimeout(fallback);
  }
  if(introPhase==="leaving"){
   const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
   const fallback=window.setTimeout(()=>finishIntro(),reduced?80:650);return()=>window.clearTimeout(fallback);
  }
 },[introPhase]);
 useEffect(()=>{
  if(initialInvite)return;
  const release=()=>setIntroPhase(current=>current==="done"||current==="leaving"?current:"leaving");
  const hardStop=window.setTimeout(release,6800);introHardStop.current=hardStop;
  return()=>{window.clearTimeout(hardStop);if(introHardStop.current===hardStop)introHardStop.current=null};
 },[initialInvite]);
 useEffect(()=>{
  if(introPhase==="done")return;
  const previous=document.body.style.overflow;document.body.style.overflow="hidden";
  return()=>{document.body.style.overflow=previous};
 },[introPhase]);
 useEffect(()=>{
  if(!creatorOpen)return;
  const previous=document.body.style.overflow;document.body.style.overflow="hidden";
  const timer=window.setTimeout(()=>firstInput.current?.focus(),30);
  const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")closeCreator(false)};
  window.addEventListener("keydown",onKey);
  return()=>{window.clearTimeout(timer);window.removeEventListener("keydown",onKey);document.body.style.overflow=previous};
 },[creatorOpen]);
 useEffect(()=>{
  if(introPhase!=="done")return;
  const page=document.querySelector<HTMLElement>(".editorialPage");
  if(!page)return;
  const targets=Array.from(page.querySelectorAll<HTMLElement>("[data-reveal]"));
  const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced||!("IntersectionObserver" in window)){targets.forEach(target=>target.classList.add("isVisible"));return}
  page.classList.add("motionReady");
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;(entry.target as HTMLElement).classList.add("isVisible");observer.unobserve(entry.target)})},{rootMargin:"0px 0px -8%",threshold:.08});
  const revealVisible=()=>targets.forEach(target=>{
   if(target.classList.contains("isVisible"))return;
   const rect=target.getBoundingClientRect();
   if(rect.top<window.innerHeight*.94&&rect.bottom>0){target.classList.add("isVisible");observer.unobserve(target)}
  });
  let frame=0;
  const queueReveal=()=>{if(frame)return;frame=window.requestAnimationFrame(()=>{frame=0;revealVisible()})};
  targets.forEach(target=>observer.observe(target));
  revealVisible();
  window.addEventListener("scroll",queueReveal,{passive:true});window.addEventListener("resize",queueReveal);
  const delayed=window.setTimeout(revealVisible,120);
  return()=>{observer.disconnect();window.clearTimeout(delayed);if(frame)window.cancelAnimationFrame(frame);window.removeEventListener("scroll",queueReveal);window.removeEventListener("resize",queueReveal)};
 },[introPhase]);

 function updateCreatorUrl(open:boolean,push:boolean){
  const target=open?"/?access=invite":"/";(push?history.pushState:history.replaceState).call(history,{},"",target);
 }
 function beginIntroExit(){setIntroPhase(current=>current==="done"||current==="leaving"?current:"leaving")}
 function finishIntro(){
  setIntroPhase("done");
  if(introHardStop.current!==null){window.clearTimeout(introHardStop.current);introHardStop.current=null}
  const media=introMedia.current;if(media)try{media.pause()}catch{/* The media may already be detached. */}
 }
 function openCreator(event?:MouseEvent<HTMLAnchorElement>){if(event){event.preventDefault();creatorButton.current=event.currentTarget}finishIntro();setNotice("");setCreatorOpen(true);updateCreatorUrl(true,true)}
 function closeCreator(restoreFocus=true){setNotice("");setCreatorOpen(false);updateCreatorUrl(false,false);if(restoreFocus)window.setTimeout(()=>creatorButton.current?.focus(),0)}
 async function submit(event:FormEvent){
  event.preventDefault();if(busy)return;if(!name.trim()){setNotice(c.ui.required);firstInput.current?.focus();return}
  setBusy(true);setNotice("");
  const controller=typeof AbortController==="undefined"?null:new AbortController();
  let timeout=0;
  try{
   const request=fetch("/api/access",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"content-type":"application/json"},body:JSON.stringify({code,name}),...(controller?{signal:controller.signal}:{})});
   const response=await Promise.race([request,new Promise<Response>((_,reject)=>{timeout=window.setTimeout(()=>{controller?.abort();reject(new Error("timeout"))},12000)})]);
   if(!response.ok){setNotice(c.ui.error);return}
   location.replace("/workspace");
  }catch{setNotice(c.ui.error)}finally{window.clearTimeout(timeout);setBusy(false)}
 }

 const introActive=introPhase!=="done";

 return <main className={`publicHome${introActive?" homeIntroPending":""}${introPhase==="leaving"?" homeIntroRevealing":""}`}>
  {introActive&&<OpeningSequence
   phase={introPhase}
   mediaRef={introMedia}
   onPlaying={()=>setIntroPhase(current=>current==="loading"?"playing":current)}
   onEnded={beginIntroExit}
   onError={beginIntroExit}
   onFinish={finishIntro}
  />}
  <div className="editorialPage">
   <header className="editorialHeader">
    <a className="editorialBrand" href="#section-01" aria-label="WHAT 100 PEOPLE DO TO A GAME"><ProjectMark/></a>
    <nav className="editorialNav" aria-label={lang==="zh"?"首页导航":"Home navigation"}>
     <a href="#section-01">Home</a>
     <a href="#section-02">{c.ui.about}</a>
     <a href="#section-04">{c.ui.project}</a>
     <a href="#section-07">{c.ui.stories}</a>
    </nav>
    <div className="editorialTools">
     <a className="editorialSurveyLink" href="/survey/participant-portrait">{c.ui.survey}</a>
     <EditorialLanguageMenu lang={lang} label={c.ui.language} onChange={setLang}/>
     <a ref={creatorButton} className="editorialCreatorButton" href="/?access=invite" onClick={openCreator} aria-haspopup="dialog" aria-expanded={creatorOpen}>{c.ui.creator}</a>
    </div>
   </header>

   <HeroSection copy={c.hero}/>
   <QuestionSection copy={c.question}/>
   <Why100Section copy={c.why}/>
   <ProcessSection copy={c.process}/>
   <WorldSection copy={c.world}/>
   <PeopleSection copy={c.people}/>
   <InspirationSection copy={c.inspiration}/>
   <ClosingSection copy={c.closing}/>

   <footer className="editorialFooter">
    <span>{c.ui.footer}</span>
    <div><a href="/concept">{c.ui.about}</a><a href="/survey/participant-portrait">{c.ui.survey}</a><a href="/?access=invite" onClick={openCreator}>{c.ui.creator}</a></div>
    <span>© 2026 HuieChen</span>
   </footer>

   {creatorOpen&&<div className="homeCreatorOverlay" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)closeCreator()}}>
    <section className="homeCreatorPanel editorialCreatorPanel" role="dialog" aria-modal="true" aria-labelledby="creatorDialogTitle">
     <header><p className="editorialEyebrow">{c.ui.creatorKicker}</p><button type="button" onClick={()=>closeCreator()} aria-label={c.ui.close}>×</button></header>
     <h2 id="creatorDialogTitle">{c.ui.creatorTitle}</h2><p>{c.ui.creatorIntro}</p>
     <form className="homeCreatorForm" onSubmit={submit} aria-busy={busy}>
      <label><span>{c.ui.name}</span><input ref={firstInput} value={name} onChange={event=>setName(event.target.value)} autoComplete="name" maxLength={40} placeholder={c.ui.namePlaceholder}/></label>
      <label><span>{c.ui.code}</span><input value={code} onChange={event=>setCode(event.target.value)} autoComplete="one-time-code" autoCapitalize="none" autoCorrect="off" placeholder={c.ui.codePlaceholder}/></label>
      <button type="submit" disabled={busy}>{busy?c.ui.entering:c.ui.enter}</button>
     </form>
     {notice&&<p className="homeCreatorError" role="alert">{notice}</p>}
     <p className="editorialLeadLink"><a href="/lead">{lang==="zh"?"主策划登录 →":"Lead sign-in →"}</a></p>
    </section>
   </div>}
  </div>
 </main>;
}
