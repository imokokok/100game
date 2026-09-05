"use client";

import {useCallback,useEffect,useRef,useState,type FormEvent,type MouseEvent,type RefObject} from "react";
import {parseQuery,storageGet,storageSet} from "./client-compat";
import {editorialContent,type EditorialLang} from "./public-home/content";
import {mountOpeningPlayback,enableOpeningSound} from "./opening-playback";
import {
 ClosingSection,HeroSection,InspirationSection,PeopleSection,ProcessSection,ProjectMark,QuestionSection,Why100Section,WorldSection,
} from "./public-home/sections";

import meetingMinutes from "./public-home/meeting-minutes.json";

type IntroPhase="loading"|"playing"|"leaving"|"done";
type PublicView="concept"|"projects"|"process";

/* This ES5 watchdog is emitted in the initial HTML. It still releases the
   opening when a slow/old embedded browser never hydrates the React bundle. */
const INTRO_FAILSAFE_SCRIPT="(function(){window.setTimeout(function(){var e=document.getElementById('opening-sequence');if(!e||e.getAttribute('data-runtime-ready')==='true')return;e.setAttribute('data-expired','true');e.style.display='none';var v=e.getElementsByTagName('video')[0];if(v)try{v.pause();}catch(x){}},12000);}());";

function viewFromHash(hash:string):PublicView{
 if(hash==="#projects")return "projects";
 if(hash==="#process")return "process";
 return "concept";
}

function ProcessArchive({lang}:{lang:EditorialLang}){
 const zh=lang==="zh";
 const entries=[
  {date:"2026.09.03",type:zh?"策划会议":"PLANNING MEETING",title:zh?"第一次策划团队会议":"First planning team meeting",body:zh?"围绕概念与目标、故事与世界观、角色设计、机制与玩法、参考与风格、制作落地与分工展开讨论。":"A first working agenda covering concept, story world, characters, mechanics, references, production, and roles.",image:"/process/week0-planning-meeting.jpg",file:null},
  {date:"2026.09.03",type:zh?"会议纪要":"MEETING MINUTES",title:zh?"09.03 策划团队会议纪要":"Planning team meeting minutes · 09.03",body:zh?"本次会议的讨论结论与后续安排。点击展开阅读完整纪要。":"Meeting conclusions and next steps. Expand to read the original Chinese minutes.",image:null,file:"/process/week0-meeting-minutes.docx",minutes:true},
  {date:"2026.09.03",type:zh?"项目制度":"PROJECT RECORD",title:zh?"贡献记录与最终署名规则":"Contribution records and final credit rules",body:zh?"记录项目中实际完成的工作、职责范围与过程版本；最终署名以可核对的过程记录和实际贡献为准。":"A record of completed work, responsibilities, and project versions; final credits follow verifiable process records and actual contributions.",image:null,file:"/process/week0-contribution-records.docx"},
  {date:"2026.09.04",type:zh?"项目提案":"DIGITAL PROPOSAL",title:zh?"100 项目 Digital Proposal":"100 Project Digital Proposal",body:zh?"关于双角色叙事、日程、100 个 NPC、互动与玩法方向的第一版完整提案。":"The first full proposal for dual-character narrative, routines, one hundred NPCs, interactions, and gameplay direction.",image:null,file:"/process/week0-digital-proposal.docx"},
 ];
 return <section className="editorialProcessArchive" aria-labelledby="processArchiveTitle">
  <header><div><p className="editorialEyebrow">WEEK 0 · PHOTOJOURNAL</p><h1 id="processArchiveTitle">{zh?"过程展示":"Process"}</h1></div><p>{zh?"从第一次会议开始，持续记录项目如何形成。":"A continuing record of how the project takes shape, beginning with its first meeting."}</p></header>
  <div className="processArchiveList">{entries.map((entry,index)=><article className={`processArchiveEntry ${entry.image?"hasImage":""}`} key={entry.title}>
   <div className="processArchiveNumber">{String(index+1).padStart(2,"0")}</div><time>{entry.date}</time><div className="processArchiveCopy"><span>{entry.type}</span><h2>{entry.title}</h2><p>{entry.body}</p>{entry.minutes?<details className="processDisclosure"><summary><span className="whenClosed">{zh?"展开会议纪要":"Read meeting minutes"}</span><span className="whenOpen">{zh?"收起会议纪要":"Collapse meeting minutes"}</span></summary><div className="meetingMinutes" lang="zh">{meetingMinutes.map((text,i)=>/^[一二三四五六七八九十]+、/.test(text)?<h3 key={i}>{text}</h3>:<p key={i}>{text}</p>)}<a href={entry.file!} download>{zh?"下载原文件（Word）":"Download original (Word)"} →</a></div></details>:entry.file&&<a href={entry.file} download>{zh?"查看原文件":"Open original document"} <b>→</b></a>}</div>{entry.image&&<details className="processDisclosure processImageDisclosure"><summary><span className="whenClosed">{zh?"展开会议图片":"View meeting image"}</span><span className="whenOpen">{zh?"收起会议图片":"Collapse meeting image"}</span></summary><a href={entry.image} target="_blank" rel="noopener noreferrer" aria-label={zh?"查看原尺寸图片":"View full-size image"}><img src={entry.image} alt={zh?"2026 年 9 月 3 日策划团队会议议程":"Planning team meeting agenda, 3 September 2026"} loading="lazy"/></a></details>}
  </article>)}</div>
 </section>;
}

function EditorialEmptyView({eyebrow,title,status,body}:{eyebrow:string;title:string;status:string;body:string}){
 return <section className="editorialEmptyView" aria-labelledby={`empty-${title}`}>
  <div className="editorialEmptyIndex" aria-hidden="true">00 / 00</div>
  <div className="editorialEmptyCopy" data-reveal>
   <p className="editorialEyebrow">{eyebrow}</p>
   <h1 id={`empty-${title}`}>{title}</h1>
   <span className="editorialEmptyRule" aria-hidden="true"/>
   <strong>{status}</strong>
   <p>{body}</p>
  </div>
  <div className="editorialEmptyShape" aria-hidden="true"><span/><i/></div>
 </section>;
}

function ConceptReelIndicator({active,onSelect}:{active:number;onSelect:(index:number)=>void}){
 return <nav className="conceptReelIndicator" aria-label="理念页版面导航">
  <span>{String(active+1).padStart(2,"0")}</span>
  <div>{Array.from({length:8},(_,index)=><button key={index} type="button" className={active===index?"isActive":""} aria-label={`前往理念版面 ${index+1}`} aria-current={active===index?"step":undefined} onClick={()=>onSelect(index)}/>)}</div>
  <span>08</span>
 </nav>;
}

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

function OpeningSequence({phase,mediaRef,onPlaying,onEnded,onError,onFinish,soundOffLabel,soundOnLabel}:{phase:IntroPhase;mediaRef:RefObject<HTMLVideoElement|null>;onPlaying:()=>void;onEnded:()=>void;onError:()=>void;onFinish:()=>void;soundOffLabel:string;soundOnLabel:string}){
 const [soundEnabled,setSoundEnabled]=useState(false);

 const callbacks=useRef({onPlaying,onEnded,onFinish});
 useEffect(()=>{callbacks.current={onPlaying,onEnded,onFinish}},[onPlaying,onEnded,onFinish]);
 const enableSound=useCallback(()=>{
  const media=mediaRef.current;
  if(media)void enableOpeningSound(media).then(enabled=>{if(media.isConnected)setSoundEnabled(enabled)});
 },[mediaRef]);

 useEffect(()=>{
  const media=mediaRef.current;if(!media)return;
  const overlay=media.closest(".openingSequence");
  if(overlay?.getAttribute("data-expired")==="true"){callbacks.current.onFinish();return}
  overlay?.setAttribute("data-runtime-ready","true");
  const dispose=mountOpeningPlayback(media,{
   onStart:()=>callbacks.current.onPlaying(),
   onEnd:()=>callbacks.current.onEnded(),
  });
  document.addEventListener("WeixinJSBridgeReady",enableSound);
  document.addEventListener("YixinJSBridgeReady",enableSound);
  return()=>{
   dispose();
   document.removeEventListener("WeixinJSBridgeReady",enableSound);
   document.removeEventListener("YixinJSBridgeReady",enableSound);
  };
 },[enableSound,mediaRef]);

 return <div
  id="opening-sequence"
  className={`openingSequence is${phase[0].toUpperCase()}${phase.slice(1)}`}
  role="dialog"
  aria-modal="true"
  aria-label="WHAT 100 PEOPLE DO TO A GAME opening title"
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
    disablePictureInPicture
    disableRemotePlayback
    onClick={enableSound}
    aria-label="WHAT 100 PEOPLE DO TO A GAME animated opening"
   >
    <source src="/video/opening-title-ed541f.mp4" type="video/mp4"/>
   </video>
  </div>
  <button
   type="button"
   className={`openingSoundHint${soundEnabled?" isOn":""}`}
   onClick={enableSound}
   aria-label={soundEnabled?soundOnLabel:soundOffLabel}
  >
   <span>{soundEnabled?soundOnLabel:soundOffLabel}</span>
  </button>
 </div>;
}

export function EntryStudio({initialInvite=false,initialCode="",initialPublicView="concept"}:{initialInvite?:boolean;initialCode?:string;initialPublicView?:PublicView}){
 const [lang,setLang]=useState<EditorialLang>("zh"),[creatorOpen,setCreatorOpen]=useState(initialInvite),[name,setName]=useState(""),[code,setCode]=useState(initialCode),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [introPhase,setIntroPhase]=useState<IntroPhase>(initialInvite||initialPublicView!=="concept"?"done":"loading");
 const [publicView,setPublicView]=useState<PublicView>(initialPublicView),[activeConcept,setActiveConcept]=useState(0);
 const firstInput=useRef<HTMLInputElement>(null),creatorButton=useRef<HTMLAnchorElement>(null),introMedia=useRef<HTMLVideoElement>(null),introHardStop=useRef<number|null>(null),scrollProgress=useRef<HTMLSpanElement>(null);
 const c=editorialContent[lang];

 useEffect(()=>{
  const sync=()=>{const params=parseQuery(location.search);const nextOpen=params.access==="invite"||"invite" in params;setCreatorOpen(nextOpen);setPublicView(params.view==="process"||params.view==="projects"?params.view:viewFromHash(location.hash));if(nextOpen||params.view==="process"||params.view==="projects")finishIntro();const token=params.invite;if(token)setCode(token)};
  const restore=(event:PageTransitionEvent)=>{if(event.persisted)finishIntro()};
  const hydrate=window.setTimeout(()=>{const saved=storageGet("hundred-language");if(saved==="en")setLang("en");sync()},0);
  window.addEventListener("popstate",sync);window.addEventListener("hashchange",sync);window.addEventListener("pageshow",restore);return()=>{window.clearTimeout(hydrate);window.removeEventListener("popstate",sync);window.removeEventListener("hashchange",sync);window.removeEventListener("pageshow",restore)};
 },[]);
 useEffect(()=>{document.documentElement.lang=lang==="zh"?"zh-CN":"en";storageSet("hundred-language",lang)},[lang]);
 useEffect(()=>{
  if(introPhase==="leaving"){
   const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
   const fallback=window.setTimeout(()=>finishIntro(),reduced?80:950);return()=>window.clearTimeout(fallback);
  }
 },[introPhase]);
 useEffect(()=>{
  if(initialInvite)return;
  const hardStop=window.setTimeout(()=>finishIntro(),12000);introHardStop.current=hardStop;
  return()=>{window.clearTimeout(hardStop);if(introHardStop.current===hardStop)introHardStop.current=null};
 },[initialInvite]);
 useEffect(()=>{
  if(introPhase==="done"&&!creatorOpen&&document.body.style.overflow==="hidden")document.body.style.removeProperty("overflow");
 },[creatorOpen,introPhase]);
 useEffect(()=>{
  if(!creatorOpen)return;
  const previous=document.body.style.overflow;document.body.style.overflow="hidden";
  const timer=window.setTimeout(()=>firstInput.current?.focus(),30);
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="Escape"){event.preventDefault();closeCreator(false);return}
   if(event.key!=="Tab")return;
   const root=document.querySelector<HTMLElement>(".homeCreatorPanel");
   if(!root)return;
   const focusable=Array.from(root.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.offsetParent!==null);
   if(!focusable.length)return;
   const first=focusable[0],last=focusable[focusable.length-1];
   const active=document.activeElement as HTMLElement|null;
   if(event.shiftKey){
    if(active===first||!root.contains(active)){event.preventDefault();last.focus()}
   }else{
    if(active===last||!root.contains(active)){event.preventDefault();first.focus()}
   }
  };
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
  targets.forEach(target=>observer.observe(target));
  revealVisible();
  const delayed=window.setTimeout(revealVisible,120);
  return()=>{observer.disconnect();window.clearTimeout(delayed)};
 },[introPhase,publicView]);
 useEffect(()=>{
  if(introPhase!=="done"||publicView!=="concept")return;
  const sections=Array.from(document.querySelectorAll<HTMLElement>(".conceptSections .editorialSection"));
  if(!sections.length)return;
  const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced){sections.forEach(section=>section.classList.remove("isReelActive"));if(scrollProgress.current)scrollProgress.current.style.transform="scaleX(0)";return}
  let frame=0,active=-1,scrollRange=1,trackSections=window.innerWidth>820;let centers:number[]=[];
  const measure=()=>{scrollRange=Math.max(document.documentElement.scrollHeight-window.innerHeight,1);trackSections=window.innerWidth>820;if(!trackSections&&active!==-1){active=-1;sections.forEach(section=>section.classList.remove("isReelActive"));setActiveConcept(0)}centers=trackSections?sections.map(section=>{const rect=section.getBoundingClientRect();return rect.top+window.scrollY+rect.height*.5}):[];queue()};
  const update=()=>{
   frame=0;const scrollY=window.scrollY,progress=Math.min(Math.max(scrollY/scrollRange,0),1);
   if(trackSections){const center=scrollY+window.innerHeight*.5;let best=0,distance=Number.POSITIVE_INFINITY;centers.forEach((value,index)=>{const next=Math.abs(value-center);if(next<distance){distance=next;best=index}});if(best!==active){active=best;sections.forEach((section,index)=>section.classList.toggle("isReelActive",index===best));setActiveConcept(best)}}
   if(scrollProgress.current)scrollProgress.current.style.transform=`scaleX(${progress})`;
  };
  const queue=()=>{if(!frame)frame=window.requestAnimationFrame(update)};
  measure();window.addEventListener("scroll",queue,{passive:true});window.addEventListener("resize",measure);
  return()=>{if(frame)window.cancelAnimationFrame(frame);window.removeEventListener("scroll",queue);window.removeEventListener("resize",measure);sections.forEach(section=>section.classList.remove("isReelActive"));if(scrollProgress.current)scrollProgress.current.style.transform="scaleX(0)"};
 },[introPhase,publicView,lang]);

 function updateCreatorUrl(open:boolean,push:boolean){
  const url=new URL(location.href);if(open)url.searchParams.set("access","invite");else{url.searchParams.delete("access");url.searchParams.delete("invite")}
  const target=`${url.pathname}${url.search}${url.hash}`;(push?history.pushState:history.replaceState).call(history,{},"",target);
 }
 function changeView(event:MouseEvent<HTMLAnchorElement>,next:PublicView){
  event.preventDefault();finishIntro();setPublicView(next);setActiveConcept(0);
  history.pushState({},"",next==="concept"?"/":`/?view=${next}`);window.setTimeout(()=>window.scrollTo({top:0,behavior:"auto"}),0);
 }
 function selectConcept(index:number){
  const scroll=()=>document.getElementById(`section-${String(index+1).padStart(2,"0")}`)?.scrollIntoView({behavior:typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  if(publicView!=="concept"){setPublicView("concept");history.pushState({},"","/");window.setTimeout(scroll,0)}else scroll();
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

return <>{!initialInvite&&<script dangerouslySetInnerHTML={{__html:INTRO_FAILSAFE_SCRIPT}}/>}<main className={`publicHome${introActive?" homeIntroPending":""}${introPhase==="leaving"?" homeIntroRevealing":""}`}>
 {introActive&&<OpeningSequence
  phase={introPhase}
  mediaRef={introMedia}
  onPlaying={()=>setIntroPhase(current=>current==="loading"?"playing":current)}
  onEnded={beginIntroExit}
  onError={beginIntroExit}
  onFinish={finishIntro}
  soundOffLabel={c.ui.soundOff}
  soundOnLabel={c.ui.soundOn}
 />}
 <div className={`editorialPage editorialView-${publicView}`}>
  <header className="editorialHeader">
   <a className="editorialBrand" href="/" onClick={event=>changeView(event,"concept")} aria-label="WHAT 100 PEOPLE DO TO A GAME"><ProjectMark/></a>
   <nav className="editorialNav" aria-label={lang==="zh"?"首页导航":"Home navigation"}>
    <a href="/" aria-current={publicView==="concept"?"page":undefined} onClick={event=>changeView(event,"concept")}>{c.ui.about}</a>
    <a href="/?view=projects" aria-current={publicView==="projects"?"page":undefined} onClick={event=>changeView(event,"projects")}>{c.ui.project}</a>
    <a href="/?view=process" aria-current={publicView==="process"?"page":undefined} onClick={event=>changeView(event,"process")}>{c.ui.process}</a>
   </nav>
   <div className="editorialTools">
    <a className="editorialSurveyLink" href="/survey">{c.ui.survey}</a>
    <EditorialLanguageMenu lang={lang} label={c.ui.language} onChange={setLang}/>
    <a ref={creatorButton} className="editorialCreatorButton" href="/?access=invite" onClick={openCreator} aria-haspopup="dialog" aria-expanded={creatorOpen}>{c.ui.creator}</a>
    </div>
   </header>
   <nav className="mobileQuickLinks" aria-label={lang==="zh"?"手机快捷入口":"Mobile quick links"}><a href="/survey">{lang==="zh"?"项目问卷":"Project surveys"}</a><a href="/?view=process" onClick={event=>changeView(event,"process")}>{lang==="zh"?"过程展示":"Process"}</a></nav>

   {publicView==="concept"?<>
    <span ref={scrollProgress} className="editorialScrollProgress" aria-hidden="true"/>
    <div className="conceptSections">
     <HeroSection copy={c.hero}/><QuestionSection copy={c.question}/><Why100Section copy={c.why}/><ProcessSection copy={c.process}/>
     <WorldSection copy={c.world}/><PeopleSection copy={c.people}/><InspirationSection copy={c.inspiration}/><ClosingSection copy={c.closing}/>
    </div>
    <ConceptReelIndicator active={activeConcept} onSelect={selectConcept}/>
   </>:publicView==="projects"?
    <EditorialEmptyView eyebrow={c.ui.projectEyebrow} title={c.ui.project} status={c.ui.pending} body={c.ui.projectEmpty}/>:
    <ProcessArchive lang={lang}/>}

   <footer className="editorialFooter">
    <span>{c.ui.footer}</span>
    <div><a href="/" onClick={event=>changeView(event,"concept")}>{c.ui.about}</a><a href="/?view=projects" onClick={event=>changeView(event,"projects")}>{c.ui.project}</a><a href="/?view=process" onClick={event=>changeView(event,"process")}>{c.ui.process}</a><a href="/survey">{c.ui.survey}</a><a href="/?access=invite" onClick={openCreator}>{c.ui.creator}</a></div>
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
 </main></>;
}
