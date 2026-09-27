"use client";

import {useCallback,useEffect,useRef,useState,type FormEvent,type MouseEvent,type RefObject} from "react";
import {editorialContent,type EditorialLang} from "./public-home/content";
import {mountOpeningPlayback,enableOpeningSound} from "./opening-playback";
import {
 ClosingSection,HeroSection,InspirationSection,PeopleSection,ProcessSection,ProjectMark,QuestionSection,Why100Section,WorldSection,
} from "./public-home/sections";

type IntroPhase="checking"|"loading"|"playing"|"leaving"|"done";
type PublicView="concept"|"projects"|"process";
type ProcessEntry={date:string;type:string;title:string;body:string;author:string;image:string|null;file:string|null;zhFile:string|null;enFile:string|null};

/* This ES5 watchdog is emitted in the initial HTML. It still releases the
   opening when a slow/old embedded browser never hydrates the React bundle. */
const INTRO_FAILSAFE_SCRIPT="(function(){window.setTimeout(function(){var e=document.getElementById('opening-sequence');if(!e||e.getAttribute('data-runtime-ready')==='true')return;e.setAttribute('data-expired','true');e.style.display='none';var v=e.getElementsByTagName('video')[0];if(v)try{v.pause();}catch(x){}},12000);}());";

function viewFromLocation():PublicView{
 const requested=new URLSearchParams(location.search).get("view");
 if(requested==="projects"||requested==="process")return requested;
 const hash=location.hash;
 if(hash==="#projects")return "projects";
 if(hash==="#process")return "process";
 return "concept";
}

function EditorialEmptyView({eyebrow,title,status,body}:{eyebrow:string;title:string;status:string;body:string}){
 return <section className="editorialEmptyView" aria-labelledby={`empty-${title}`}>
  <div className="editorialEmptyIndex" aria-hidden="true">00 / 00</div>
  <div className="editorialEmptyCopy" data-reveal><p className="editorialEyebrow">{eyebrow}</p><h1 id={`empty-${title}`}>{title}</h1><span className="editorialEmptyRule" aria-hidden="true"/><strong>{status}</strong><p>{body}</p></div>
  <div className="editorialEmptyShape" aria-hidden="true"><span/><i/></div>
 </section>;
}

function ProcessArchive({lang}:{lang:EditorialLang}){
 const zh=lang==="zh";
 const weeks:{week:number;entries:ProcessEntry[]}[]=[
  {week:0,entries:[
   {date:"2026.09.03",type:zh?"策划会议":"PLANNING MEETING",title:zh?"第一次策划团队会议":"First planning team meeting",body:zh?"围绕概念与目标、故事与世界观、角色设计、机制与玩法、参考与风格、制作落地与分工展开讨论。":"A first working agenda covering concept, story world, characters, mechanics, references, production, and roles.",author:"HuieChen 陈慧娥",image:"/process/week0-planning-meeting.jpg",file:null,zhFile:null,enFile:null},
   {date:"2026.09.03",type:zh?"项目制度":"PROJECT RECORD",title:zh?"贡献记录与最终署名规则":"Contribution records and final credit rules",body:zh?"记录项目中实际完成的工作、职责范围与过程版本；最终署名以可核对的过程记录和实际贡献为准。":"A record of completed work, responsibilities, and project versions; final credits follow verifiable process records and actual contributions.",author:"HuieChen 陈慧娥",image:null,file:"/process/week0-contribution-records.docx",zhFile:null,enFile:null},
   {date:"2026.09.04",type:zh?"项目提案":"DIGITAL PROPOSAL",title:zh?"早期数字项目提案":"Early digital proposal",body:zh?"记录项目网站与数字协作方式的早期提案，保留为后续迭代可核对的过程版本。":"The early proposal for the project's digital form and collaboration workflow, retained as a traceable process version.",author:"HuieChen 陈慧娥",image:null,file:"/process/week0-digital-proposal.docx",zhFile:null,enFile:null},
  ]},
  {week:1,entries:[
   {date:"2026.09.09",type:zh?"剧情版本":"STORY VERSION",title:zh?"七日寻声":"Seven Days of Listening",body:zh?"以雾镇、陈远留下的磁带与河底录音为线索，展开 A 与 B 平行追寻同一段旧故事的七日主线。":"A seven-day mystery in which A and B follow different traces left by Chen Yuan, two cassettes and recordings hidden beneath Wuzhen's river.",author:"赤睦",image:null,file:null,zhFile:"/process/week1-seven-days-listening.txt",enFile:"/process/week1-seven-days-listening-en.txt"},
   {date:"2026.09.09",type:zh?"故事大纲":"STORY OUTLINE",title:zh?"雾港故事大纲":"Mist Harbor story outline",body:zh?"建立雾港的历史、永居制度、七天结构、八组玩法及双主角与资源系统之间的关系。":"Defines Mist Harbor's history, residency process, seven-day arc, eight activity groups and the two protagonists' relationship to time and resources.",author:"熊韬炀",image:null,file:null,zhFile:"/process/week1-mist-harbor-story-outline.docx",enFile:"/process/week1-mist-harbor-story-outline-en.docx"},
   {date:"2026.09.09",type:zh?"故事修改":"STORY REVISION",title:zh?"雾港背景故事修改版":"Mist Harbor setting revision",body:zh?"将雾港进一步调整为带有南法海岸、薰衣草田、旧铁路与石灰岩小镇气质的完整背景版本。":"Reworks Mist Harbor as a coastal town shaped by lavender fields, limestone, an abandoned railway and the rhythms of southern France.",author:"熊韬炀",image:null,file:null,zhFile:"/process/week1-mist-harbor-story-revision.docx",enFile:"/process/week1-mist-harbor-story-revision-en.docx"},
   {date:"2026.09.10",type:zh?"故事大纲":"STORY OUTLINE",title:zh?"Solmere 故事大纲":"Solmere story outline",body:zh?"确立 Solmere 的传媒产业、小镇尺度、七天试居、双主角职业背景及贯穿玩法的平行叙事。":"Establishes Solmere's creative industries, small-town scale, seven-day residency, parallel protagonists and activity-led narrative.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week1-solmere-story-outline.docx",enFile:"/process/week1-solmere-story-outline-en.docx"},
   {date:"2026.09.09",type:zh?"游戏文本":"GAME NARRATIVE",title:zh?"游戏文本设计 1.0":"Game narrative design 1.0",body:zh?"建立海岛小镇、七天申请流程、双主角平行动线、人物处境与偏魔幻现实主义的叙事基调。":"Defines the island town, seven-day application, parallel protagonists, their different circumstances and the magical-realist narrative tone.",author:"咸鱼",image:null,file:null,zhFile:"/process/week1-game-narrative-design.docx",enFile:"/process/week1-game-narrative-design-en.docx"},
   {date:"2026.09.10",type:zh?"主线叙事":"MAIN NARRATIVE",title:zh?"主线叙事结构":"Main narrative structure",body:zh?"以十五个叙事阶段梳理两位主角抵达小镇、建立关系、面对误解与等待评定结果的完整推进。":"A fifteen-stage narrative map tracing both protagonists from their arrival through relationships, misunderstandings and the residency decision.",author:"山梨之星",image:null,file:null,zhFile:"/process/week1-main-narrative.xls",enFile:"/process/week1-main-narrative-en.xlsx"},
   {date:"2026.09.11",type:zh?"系统草稿":"SYSTEM DRAFT",title:zh?"小镇地图与游戏流程草稿":"Town map and game flow draft",body:zh?"整理小镇地点、双主角路线、核心玩法入口与从序章到周日的章节推进。":"A working map of the town, the two protagonist routes, core activities and the chapter flow from the prologue to Sunday.",author:"咸蛋黄",image:null,file:null,zhFile:"/process/week1-town-flow-draft.docx",enFile:"/process/week1-town-flow-draft-en.docx"},
   {date:"WEEK 1",type:zh?"项目提案":"DIGITAL PROPOSAL",title:zh?"100 项目 Digital Proposal":"100 Project Digital Proposal",body:zh?"关于双角色叙事、日程、100 个 NPC、互动与玩法方向的第一版完整提案。":"The first full proposal for dual-character narrative, routines, one hundred NPCs, interactions, and gameplay direction.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week1-digital-proposal.docx",enFile:"/process/week1-digital-proposal-en.docx"},
  ]},
  {week:2,entries:[
   {date:"2026.09.14",type:zh?"人物剧本":"CHARACTER SCREENPLAY",title:zh?"A · 来到 Solmere 之前":"A · Before Solmere",body:zh?"通过家庭、暑假与一次游戏项目，写出 A 的行动力、选择欲与项目结束后的空白。":"A screenplay about family, an unstructured summer and a game project that reveals A's appetite for decisions and the emptiness after completion.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week2-solmere-script-a.pdf",enFile:"/process/week2-solmere-script-a-en.pdf"},
   {date:"2026.09.14",type:zh?"人物剧本":"CHARACTER SCREENPLAY",title:zh?"B · 来到 Solmere 之前":"B · Before Solmere",body:zh?"通过家庭、音乐与制作管理工作，建立 B 对稳定、责任、野心与个人兴趣之间的拉扯。":"A screenplay about family, music and production management, establishing B's tension between stability, responsibility, ambition and private desire.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week2-solmere-script-b.pdf",enFile:"/process/week2-solmere-script-b-en.pdf"},
   {date:"2026.09.17",type:zh?"尾声":"EPILOGUE",title:zh?"尾声":"Epilogue",body:zh?"A 与 B 带着各自的文件走出审核，在唱片店因为一张写着 B 名字的 CD 第一次真正看见彼此。":"A and B leave the review with their documents and finally see one another in the record shop through a CD carrying B's name.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week2-epilogue.pdf",enFile:"/process/week2-epilogue-en.pdf"},
   {date:"WEEK 2",type:zh?"开发记录":"DEVELOPMENT UPDATE",title:zh?"Week 2 开发进度及 Week 3 开发安排":"Week 2 development update and Week 3 plan",body:zh?"记录本周整体推进、主线档案系统、双角色设计、主要 NPC、小游戏与交互系统，并整理下一周的开发安排。":"A record of the week's progress across the main archive system, dual protagonists, key NPCs, minigames and interactions, followed by the Week 3 development plan.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week2-development-update-week3-plan.docx",enFile:"/process/week2-development-update-week3-plan-en.docx"},
  ]},
  {week:3,entries:[
   {date:"WEEK 3",type:zh?"架构调整":"STRUCTURE REVISION",title:zh?"SOLMERE 架构调整说明":"SOLMERE structure revision",body:zh?"说明项目从七天调整为五天后的双线叙事、人物骨架、时间结构、NPC 关系及第五天交叉体验。":"The revised five-day structure, dual narrative, character foundations, time design, NPC relationships and the Day 5 crossover.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week3-architecture-adjustment.docx",enFile:"/process/week3-architecture-adjustment-en.docx"},
   {date:"WEEK 3",type:zh?"主体机制":"CORE MECHANICS",title:zh?"SOLMERE 主体机制与系统设计":"SOLMERE core mechanics and system design",body:zh?"在架构调整之后，进一步说明由状态、时间和金钱共同驱动的日程管理主体机制。":"Following the structure revision, this document defines the schedule-management core driven by status, time and money systems.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week3-core-mechanics-system-design.docx",enFile:"/process/week3-core-mechanics-system-design-en.docx"},
   {date:"2026.09.25",type:zh?"文本设计":"NARRATIVE DESIGN",title:zh?"Maya 书店交互文本设计":"Maya bookshop interaction design",body:zh?"以书店 NPC Maya 为例，拆解初见、闲聊、关系互动与任务认可的文本分支。":"A branching dialogue map for the bookshop NPC Maya, covering first contact, small talk, relationship scenes and task recognition.",author:"山梨之心",image:null,file:null,zhFile:"/process/week3-text-design-2.pdf",enFile:"/process/week3-text-design-2-en.pdf"},
   {date:"2026.09.25",type:zh?"文本示例":"DIALOGUE SAMPLE",title:zh?"石泳琪交互文本示例":"Shiyongqi interaction sample",body:zh?"从初次见面到深入交流与获取认可，展示餐厅角色石泳琪的完整互动语气与触发结构。":"A complete interaction sample for the restaurant character Shiyongqi, from first meeting to deeper conversation and earned recognition.",author:"熊韬炀",image:null,file:null,zhFile:"/process/week3-text-design-example.docx",enFile:"/process/week3-text-design-example-en.docx"},
  ]},
 ];
 return <section className="editorialProcessArchive" aria-labelledby="processArchiveTitle">
  <header><div><p className="editorialEyebrow">WEEK 0–3 · PROCESS ARCHIVE</p><h1 id="processArchiveTitle">{zh?"过程展示":"Process"}</h1></div><p>{zh?"从第一次会议开始，按周记录项目如何形成、调整与推进。":"A week-by-week record of how the project takes shape, changes and moves forward."}</p></header>
  <div className="processArchiveList">{weeks.map(group=><section className="processWeekGroup" key={group.week} aria-labelledby={`processWeek${group.week}`}>
   <header className="processWeekHeader"><span>W{String(group.week).padStart(2,"0")}</span><h2 id={`processWeek${group.week}`}>{zh?`第 ${group.week} 周`:`Week ${group.week}`}</h2><small>{String(group.entries.length).padStart(2,"0")} {zh?"项记录":"records"}</small></header>
   {group.entries.map((entry,index)=><article className={`processArchiveEntry ${entry.image?"hasImage":""}`} key={entry.title}>
    <div className="processArchiveNumber">{String(index+1).padStart(2,"0")}</div><time>{entry.date}</time><div className="processArchiveCopy"><span>{entry.type}</span><small className="processArchiveAuthor">{zh?"署名":"BY"} · {entry.author}</small><h3>{entry.title}</h3><p>{entry.body}</p><div className="processArchiveDownloads">{entry.file&&<a href={entry.file} download>{zh?"查看原文件":"Open original document"} <b>→</b></a>}{entry.zhFile&&<a href={entry.zhFile} download>{zh?"中文原件":"Chinese original"} <b>→</b></a>}{entry.enFile&&<a href={entry.enFile} download>{zh?"英文版":"English version"} <b>→</b></a>}</div></div>{entry.image&&<img src={entry.image} alt={zh?"2026 年 9 月 3 日策划团队会议议程":"Planning team meeting agenda, 3 September 2026"} loading="lazy"/>}
   </article>)}
  </section>)}</div>
 </section>;
}

function ConceptReelIndicator({active,onSelect}:{active:number;onSelect:(index:number)=>void}){
 return <nav className="conceptReelIndicator" aria-label="理念页版面导航"><span>{String(active+1).padStart(2,"0")}</span><div>{Array.from({length:8},(_,index)=><button key={index} type="button" className={active===index?"isActive":""} aria-label={`前往理念版面 ${index+1}`} aria-current={active===index?"step":undefined} onClick={()=>onSelect(index)}/>)}</div><span>08</span></nav>;
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

function OpeningSequence({phase,mediaRef,onPlaying,onEnded,onError,onFinish}:{phase:IntroPhase;mediaRef:RefObject<HTMLVideoElement|null>;onPlaying:()=>void;onEnded:()=>void;onError:()=>void;onFinish:()=>void}){
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
  aria-label="HOW 100 PEOPLE CALL A GAME opening title"
  onClick={enableSound}
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
    width="1280"
    height="720"
    poster="/video/opening-title-poster-65f6fc0.webp"
    autoPlay
    playsInline
    preload="auto"
    controls={false}
    controlsList="nodownload noplaybackrate noremoteplayback"
    {...{"webkit-playsinline":"true","x5-playsinline":"true","x5-video-player-type":"h5-page","x5-video-player-fullscreen":"false"}}
    muted={!soundEnabled}
    disablePictureInPicture
    disableRemotePlayback
    aria-label="HOW 100 PEOPLE CALL A GAME animated opening"
   >
    <source src="/video/opening-title-6a63d7e7.mp4" type="video/mp4"/>
    <track kind="captions" src="/video/opening-title-captions.vtt" srcLang="en" label="Sound effects"/>
   </video>
  </div>
 </div>;
}
export function EntryStudio({initialInvite=false,initialCode="",initialPublicView="concept"}:{initialInvite?:boolean;initialCode?:string;initialPublicView?:PublicView}){
 const [lang,setLang]=useState<EditorialLang>("zh"),[creatorOpen,setCreatorOpen]=useState(initialInvite),[name,setName]=useState(""),[code,setCode]=useState(initialCode),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [introPhase,setIntroPhase]=useState<IntroPhase>(initialInvite||initialPublicView!=="concept"?"done":"loading");
 const [publicView,setPublicView]=useState<PublicView>(initialPublicView),[activeConcept,setActiveConcept]=useState(0);
 const firstInput=useRef<HTMLInputElement>(null),creatorButton=useRef<HTMLAnchorElement>(null),introMedia=useRef<HTMLVideoElement>(null),introHardStop=useRef<number|null>(null),scrollProgress=useRef<HTMLSpanElement>(null);
 const c=editorialContent[lang];

 useEffect(()=>{
  const sync=()=>{const params=new URLSearchParams(location.search);const nextOpen=params.get("access")==="invite"||params.has("invite");setCreatorOpen(nextOpen);setPublicView(viewFromLocation());if(nextOpen||viewFromLocation()!=="concept")finishIntro();const token=params.get("invite");if(token)setCode(token)};
  const restore=(event:PageTransitionEvent)=>{if(event.persisted)finishIntro()};
  const hydrate=window.setTimeout(()=>{try{const saved=localStorage.getItem("hundred-language");if(saved==="en")setLang("en")}catch{/* Storage can be disabled in embedded browsers. */}sync()},0);
  window.addEventListener("popstate",sync);window.addEventListener("hashchange",sync);window.addEventListener("pageshow",restore);return()=>{window.clearTimeout(hydrate);window.removeEventListener("popstate",sync);window.removeEventListener("hashchange",sync);window.removeEventListener("pageshow",restore)};
 },[]);
 useEffect(()=>{document.documentElement.lang=lang==="zh"?"zh-CN":"en";try{localStorage.setItem("hundred-language",lang)}catch{/* Storage can be disabled in embedded browsers. */}},[lang]);
 useEffect(()=>{
  if(introPhase==="leaving"){
   const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
   const fallback=window.setTimeout(()=>finishIntro(),reduced?80:720);return()=>window.clearTimeout(fallback);
  }
 },[introPhase]);
 useEffect(()=>{
  if(introPhase!=="done"||publicView!=="concept")return;
  const sections=Array.from(document.querySelectorAll<HTMLElement>(".conceptSections .editorialSection"));if(!sections.length)return;
  const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduced){sections.forEach(section=>section.classList.remove("isReelActive"));if(scrollProgress.current)scrollProgress.current.style.transform="scaleX(0)";return}
  let frame=0,active=-1,scrollRange=1,trackSections=window.innerWidth>820;let centers:number[]=[];
  const measure=()=>{scrollRange=Math.max(document.documentElement.scrollHeight-window.innerHeight,1);trackSections=window.innerWidth>820;if(!trackSections&&active!==-1){active=-1;sections.forEach(section=>section.classList.remove("isReelActive"));setActiveConcept(0)}centers=trackSections?sections.map(section=>{const rect=section.getBoundingClientRect();return rect.top+window.scrollY+rect.height*.5}):[];queue()};
  const update=()=>{frame=0;const scrollY=window.scrollY,progress=Math.min(Math.max(scrollY/scrollRange,0),1);if(trackSections){const center=scrollY+window.innerHeight*.5;let best=0,distance=Number.POSITIVE_INFINITY;centers.forEach((value,index)=>{const next=Math.abs(value-center);if(next<distance){distance=next;best=index}});if(best!==active){active=best;sections.forEach((section,index)=>section.classList.toggle("isReelActive",index===best));setActiveConcept(best)}}if(scrollProgress.current)scrollProgress.current.style.transform=`scaleX(${progress})`};
  const queue=()=>{if(!frame)frame=window.requestAnimationFrame(update)};measure();window.addEventListener("scroll",queue,{passive:true});window.addEventListener("resize",measure);
  return()=>{if(frame)window.cancelAnimationFrame(frame);window.removeEventListener("scroll",queue);window.removeEventListener("resize",measure);sections.forEach(section=>section.classList.remove("isReelActive"));if(scrollProgress.current)scrollProgress.current.style.transform="scaleX(0)"};
 },[introPhase,publicView,lang]);
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
  targets.forEach(target=>observer.observe(target));
  revealVisible();
  const delayed=window.setTimeout(revealVisible,120);
  return()=>{observer.disconnect();window.clearTimeout(delayed)};
 },[introPhase,publicView]);

 function updateCreatorUrl(open:boolean,push:boolean){
  const url=new URL(location.href);if(open)url.searchParams.set("access","invite");else{url.searchParams.delete("access");url.searchParams.delete("invite")}
  const target=`${url.pathname}${url.search}${url.hash}`;(push?history.pushState:history.replaceState).call(history,{},"",target);
 }
 function changeView(event:MouseEvent<HTMLAnchorElement>,next:PublicView){event.preventDefault();finishIntro();setPublicView(next);setActiveConcept(0);history.pushState({},"",next==="concept"?"/":`/?view=${next}`);window.setTimeout(()=>window.scrollTo({top:0,behavior:"auto"}),0)}
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
   const request=fetch("/api/access",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code,name}),...(controller?{signal:controller.signal}:{})});
   const response=await Promise.race([request,new Promise<Response>((_,reject)=>{timeout=window.setTimeout(()=>{controller?.abort();reject(new Error("timeout"))},12000)})]);
   if(!response.ok){setNotice(c.ui.error);return}
   const data=await response.json() as {role:"lead"|"participant"};
   location.replace(data.role==="lead"?"/workspace?view=dashboard":"/workspace");
  }catch{setNotice(c.ui.error)}finally{window.clearTimeout(timeout);setBusy(false)}
 }

 const introActive=introPhase!=="done";

 return <>{!initialInvite&&<script dangerouslySetInnerHTML={{__html:INTRO_FAILSAFE_SCRIPT}}/>}<main className={`publicHome${introActive?" homeIntroPending":""}${introPhase==="leaving"?" homeIntroRevealing":""}`}>
  {introActive&&<OpeningSequence
   phase={introPhase}
   mediaRef={introMedia}
   onPlaying={()=>setIntroPhase(current=>current==="checking"||current==="loading"?"playing":current)}
   onEnded={beginIntroExit}
   onError={beginIntroExit}
   onFinish={finishIntro}
  />}
  <div className={`editorialPage editorialView-${publicView}`}>
   <header className="editorialHeader">
    <a className="editorialBrand" href="#concept" onClick={event=>changeView(event,"concept")} aria-label="HOW 100 PEOPLE CALL A GAME"><ProjectMark/></a>
    <nav className="editorialNav" aria-label={lang==="zh"?"首页导航":"Home navigation"}>
     <a href="/" aria-current={publicView==="concept"?"page":undefined} onClick={event=>changeView(event,"concept")}>{c.ui.about}</a>
     <a href="/?view=projects" aria-current={publicView==="projects"?"page":undefined} onClick={event=>changeView(event,"projects")}>{c.ui.project}</a>
     <a href="/?view=process" aria-current={publicView==="process"?"page":undefined} onClick={event=>changeView(event,"process")}>{c.ui.process}</a>
    </nav>
    <div className="editorialTools">
     <a className="editorialSurveyLink" href="/survey">{c.ui.survey}</a>
     <EditorialLanguageMenu lang={lang} label={c.ui.language} onChange={setLang}/>
     <a ref={creatorButton} className="editorialCreatorButton" href="/lead" onClick={openCreator} aria-haspopup="dialog" aria-expanded={creatorOpen}>{c.ui.creator}</a>
   </div>
   </header>
   <nav className="mobileQuickLinks" aria-label={lang==="zh"?"手机快捷入口":"Mobile quick links"}><a href="/survey">{lang==="zh"?"项目问卷":"Project surveys"}</a><a href="/?view=process" onClick={event=>changeView(event,"process")}>{lang==="zh"?"过程展示":"Process"}</a></nav>

   {publicView==="concept"?<><span ref={scrollProgress} className="editorialScrollProgress" aria-hidden="true"/><div className="conceptSections"><HeroSection copy={c.hero}/><QuestionSection copy={c.question}/><Why100Section copy={c.why}/><ProcessSection copy={c.process}/><WorldSection copy={c.world}/><PeopleSection copy={c.people}/><InspirationSection copy={c.inspiration}/><ClosingSection copy={c.closing}/></div><ConceptReelIndicator active={activeConcept} onSelect={selectConcept}/></>:publicView==="projects"?<EditorialEmptyView eyebrow={c.ui.projectEyebrow} title={c.ui.project} status={c.ui.pending} body={c.ui.projectEmpty}/>:<ProcessArchive lang={lang}/>}

   <footer className="editorialFooter">
    <span>{c.ui.footer}</span>
    <div><a href="/" onClick={event=>changeView(event,"concept")}>{c.ui.about}</a><a href="/?view=projects" onClick={event=>changeView(event,"projects")}>{c.ui.project}</a><a href="/?view=process" onClick={event=>changeView(event,"process")}>{c.ui.process}</a><a href="/survey">{c.ui.survey}</a><a href="/lead" onClick={openCreator}>{c.ui.creator}</a></div>
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
    </section>
   </div>}
  </div>
 </main></>;
}
