"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import {useEffect,useState,type MouseEvent} from "react";
import {parseQuery,storageGet,storageSet} from "../client-compat";
import {runMicrotask} from "../client-compat";
import {languageOptions,translations,type Language} from "../bilingual-i18n";
import {localeCopy} from "../bilingual-locale-copy";
import {Wordmark} from "../wordmark";

type PublicView="concept"|"people";
type MetricPanel="people"|"weeks"|"games"|null;
type PublicGameLink={id:string;version:string;url:string;notes_zh?:string|null;notes_en?:string|null;published_at:number};

function PosterWord({text}:{text:string}){
 return <span className="conceptWordInk">{Array.from(text).map((character,index)=><span key={`${character}-${index}`}>{character===" "?"\u00a0":character}</span>)}</span>;
}

function RecruitmentPoster({lang}:{lang:Language}){
 return <figure className="projectPoster projectPosterBottom" data-reveal><a href="/project-recruitment-poster.jpg" target="_blank" rel="noreferrer"><img src="/project-recruitment-poster.jpg" width="1024" height="1536" loading="lazy" decoding="async" alt={lang==="zh"?"WHAT 100 PEOPLE DO TO A GAME 项目招募海报":"WHAT 100 PEOPLE DO TO A GAME recruitment poster"}/></a><figcaption>{lang==="zh"?"项目招募海报 · 2026":"Project recruitment poster · 2026"}</figcaption></figure>;
}

const conceptEditorial={
 zh:{
  headline:["游戏从何处开始","谁有权定义它"],
  subtitle:"从一百个人的差异出发，讨论创作资源如何被重新分配、谁可以制作游戏，以及游戏作为媒介能够抵达何处。",
  essay:[
   "当游戏制作被等同于程序、美术、引擎与建模，它便首先被描述为一套需要经过训练才能进入的专业体系。技术确实构成许多游戏的生产条件，却不构成游戏的全部，更不应成为表达的资格。",
   "人无需先成为作家才写下一句话，也无需获得艺术家的身份才借图像表达。游戏同样应当从“有什么需要被表达”开始，而不是从“是否掌握制作技术”开始。选择、回应、制定或打破规则，以及对另一种可能性的试探，已经构成游戏发生的基本条件。",
   "因此，一段记忆、一个社会问题、一种关系、一次迟到、一片树叶，或一个长期无人触及的问题，都可能成为游戏的材料。技术能够将这些材料转化为可运行、可观看或可参与的形式；它扩大实现的范围，却不决定谁有权开始。",
   "这个项目寻找的不是一百名游戏设计师，而是一百个彼此不同的人。年龄、职业、专业、身份与经历不设预先门槛；编程、绘画、建模经验，以及日常是否玩游戏，都不是参与的前提。若一百个人拥有相同的知识、经验与判断，一百这个数量本身便失去意义。",
   "任何人都可以做游戏，并不意味着制作无需知识、劳动与协作，而是意味着这些条件不应被用来垄断创作资格。阶级位置与资源占有长期影响谁能获得教育、设备、时间、空间、语言支持与展示机会。项目无法假装在三十天内消除这些结构性不平等，但可以在具体的共同创作中重新分配进入、表达与决定的权利：不让资源优势自然转化为话语优势，也不让专业经验垄断游戏的定义。",
   "人与人的差异并非只来自个人选择，也来自资源如何被分配。不同的可及条件，加上推荐机制与相近社群对熟悉内容的反复强化，逐渐形成彼此分隔的信息茧房。人们能够接触何种游戏、想象何种形式，乃至是否相信自己有权创作，都可能先被所处环境划定边界。让一百个人进入同一创作过程，不是为了假装这些边界不存在，而是让它们显现、相遇，并获得被重新协商的可能。",
   "项目真正希望留下的是差异：人如何理解同一个问题，如何作出决定，什么值得被重视，何种经验塑造了判断，以及谁注意到尚未被他人注意的事物。它们不是等待被技术加工的背景资料，而是能够直接进入规则、叙事、空间、关系与行动的创作材料。",
   "最终形式不会被预先限定为电子游戏、桌面游戏或任何既有类别。作品将由一百个人在三十天内，通过选择、协商、试验与修订共同形成。它或许成为一个游戏；更重要的是，它将重新提出关于游戏本身的问题。"
  ],
  questions:["游戏从何时开始成为游戏？","谁决定什么可以成为游戏？","作为媒介，游戏的边界究竟在哪里？"],
  call:{kicker:"100 PEOPLE · 30 DAYS",title:"现在，它尚未存在。",body:"作品将从参与者各自的经验与判断中形成。项目不以既往制作经验为前提，并特别希望从未参与过游戏制作的人进入其中。",deadline:"招募截止 · 2026.09.05",contact:"参与方式：私信主策划，或通过海报所列邮箱 / 微信联系。",action:"BE 1 OF 100"}
 },
 en:{
  headline:["Where does a game begin?","Who has the right to define it?"],
  subtitle:"Beginning with the differences among one hundred people, the project asks how creative resources might be redistributed, who can make games, and how far the medium can reach.",
  essay:[
   "When making games is reduced to programming, art, engines, and modelling, it is presented first as a professional system one may enter only after training. These disciplines are conditions of production for many games, but they are not the whole of the medium, nor should they determine who is entitled to express something through it.",
   "No one must first become a writer to write a sentence, or acquire the status of an artist to speak through images. Games, too, can begin with what needs to be said rather than with proof of technical competence. A game is already taking place wherever people choose and respond, establish or break rules, and test another possibility.",
   "A memory, a social question, a relationship, an instance of lateness, a leaf, or a subject left unspoken can therefore become material for a game. Technology can make such material operational, visible, or participatory. It extends what can be realised; it does not decide who may begin.",
   "This project is not looking for one hundred game designers. It is looking for one hundred different people. Age, profession, discipline, identity, and experience are not entry requirements; neither are programming, drawing, modelling, or even a habit of playing games. If all one hundred people shared the same knowledge, experience, and judgement, the number itself would be meaningless.",
   "Anyone can make a game. This does not deny the knowledge, labour, or collaboration that production requires; it refuses to let those conditions become a monopoly on creative legitimacy. Class position and control of resources have long shaped who can access education, equipment, time, space, language support, and opportunities to be seen. This project cannot pretend to dissolve structural inequality in thirty days, but within a concrete shared process it can redistribute the rights to enter, speak, and decide—so that material advantage does not automatically become authority, and professional experience does not monopolise the definition of a game.",
   "Difference is not produced by individual choice alone; it is also shaped by the distribution of resources. Unequal access, together with recommendation systems and like-minded communities that repeatedly reinforce the familiar, produces separate information bubbles. What games a person encounters, what forms they can imagine, and whether they believe themselves entitled to create may therefore be bounded in advance by their environment. Bringing one hundred people into the same process does not pretend those boundaries have disappeared; it makes them visible, places them in relation, and allows them to be renegotiated.",
   "What the project seeks to preserve is difference: how each person understands a question, makes a decision, recognises what matters, and notices what others have not. These are not background materials waiting to be processed by technique. They can enter directly into rules, narratives, spaces, relationships, and actions.",
   "The outcome will not be prescribed as a video game, board game, or any other established category. Over thirty days, one hundred people will form the work through choice, negotiation, testing, and revision. It may become a game. More importantly, it will ask the medium to account for itself again."
  ],
  questions:["At what point does a game become a game?","Who decides what may count as a game?","Where are the boundaries of the medium?"],
  call:{kicker:"100 PEOPLE · 30 DAYS",title:"For now, it does not exist.",body:"The work will emerge from the experience and judgement of its participants. No prior production experience is required; people who have never made a game are especially invited.",deadline:"Applications close · 2026.09.05",contact:"To take part, contact the lead designer directly or use the email / WeChat listed on the poster.",action:"BE 1 OF 100"}
 }
} as const;

function PublicDesignerRanking({lang}:{lang:Language}){
 const c=localeCopy[lang];
 return <section className="publicCredits publicCreditsPending" id="designers"><div className="creditsHead"><span className="kicker">{c.collaborators}</span><h2>{c.collaborators}</h2><p>{lang==="zh"?"共同创作者名单将在人员信息确认后统一录入。":"The collaborator list will be added after participant information is confirmed."}</p></div><div className="collaboratorPending" role="status"><span>01—100</span><b>{lang==="zh"?"待录入":"To be added"}</b></div></section>
}

function ProjectMetrics({lang,open,onToggle,links,linksLoaded}:{lang:Language;open:MetricPanel;onToggle:(panel:Exclude<MetricPanel,null>)=>void;links:PublicGameLink[];linksLoaded:boolean}){
 const zh=lang==="zh";
 const metrics=[
  {id:"people" as const,value:"100",label:zh?"个人":"PEOPLE",target:zh?"人员架构":"People structure"},
  {id:"weeks" as const,value:"30",label:zh?"天":"DAYS",target:zh?"项目周次":"Project weeks"},
  {id:"games" as const,value:"01",label:zh?"共同作品":"SHARED WORK",target:zh?"游戏链接":"Game links"}
 ];
 return <><div className="conceptMetrics" aria-label={zh?"项目结构":"Project structure"}>{metrics.map(metric=><button type="button" key={metric.id} className={open===metric.id?"is-active":""} aria-expanded={open===metric.id} aria-controls={`metric-panel-${metric.id}`} onClick={()=>onToggle(metric.id)}><b>{metric.value}</b><small>{metric.label}</small><span>{metric.target}</span></button>)}</div>{open&&<section className="metricDetail" id={`metric-panel-${open}`} aria-live="polite">{open==="people"&&<><header><small>100 / PEOPLE</small><h2>{zh?"人员架构":"People structure"}</h2></header><div className="peopleStructure"><p><b>{zh?"主策划":"Lead Designer"}</b><span>Hera</span></p><p><b>{zh?"策划层":"Planning"}</b><span>{zh?"深度策划 / 基础策划与测试反馈":"Deep planning / Planning and testing"}</span></p><p><b>{zh?"实现层":"Production"}</b><span>{zh?"美术、视觉、声音 / 技术实现":"Art, visual, sound / Technical production"}</span></p><p><b>{zh?"共同创作者":"Co-creators"}</b><span>{zh?"待问卷确认后录入":"Added after survey confirmation"}</span></p></div><a href="/people">{zh?"查看共同创作者":"View co-creators"} →</a></>}{open==="weeks"&&<><header><small>30 / DAYS</small><h2>{zh?"项目周次":"Project weeks"}</h2></header><ol className="weekSequence">{[0,1,2,3,4].map(week=><li key={week}><b>W{week}</b><span>Week {week}</span></li>)}</ol></>}{open==="games"&&<><header><small>01 / SHARED WORK</small><h2>{zh?"游戏链接":"Game links"}</h2></header>{!linksLoaded?<p className="metricStatus">{zh?"正在读取已发布版本…":"Loading published builds…"}</p>:links.length?<div className="publicGameLinks">{links.map(link=><a key={link.id} href={link.url} target="_blank" rel="noreferrer"><span><b>{link.version}</b><small>{(zh?link.notes_zh:link.notes_en)||""}</small></span><i>↗</i></a>)}</div>:<p className="metricStatus">{zh?"游戏链接将在版本发布后显示。":"Game links will appear after a build is published."}</p>}</>}</section>}</>;
}

export function PublicPages({initialView}:{initialView:PublicView}){
 const [lang,setLang]=useState<Language>("zh");
 const [view,setView]=useState<PublicView>(initialView);
 const [compactManifesto,setCompactManifesto]=useState(false);
 const [openManifesto,setOpenManifesto]=useState(-1);
 const [metricPanel,setMetricPanel]=useState<MetricPanel>(null);
 const [gameLinks,setGameLinks]=useState<PublicGameLink[]>([]);
 const [gameLinksLoaded,setGameLinksLoaded]=useState(false);
 useEffect(()=>{if(parseQuery(location.search).public==="1")history.replaceState({},"",location.pathname);const saved=storageGet("hundred-language") as Language|null;runMicrotask(()=>{if(saved&&translations[saved])setLang(saved)});const sync=()=>setView(location.pathname==="/people"?"people":"concept");addEventListener("popstate",sync);return()=>removeEventListener("popstate",sync)},[]);
 useEffect(()=>{if(typeof window.matchMedia!=="function")return;const media=window.matchMedia("(max-width: 700px)");const sync=()=>setCompactManifesto(media.matches);sync();if(typeof media.addEventListener==="function"){media.addEventListener("change",sync);return()=>media.removeEventListener("change",sync)}media.addListener(sync);return()=>media.removeListener(sync)},[]);
 useEffect(()=>{storageSet("hundred-language",lang);document.documentElement.lang=lang;document.documentElement.dir=(lang as string)==="ar"?"rtl":"ltr"},[lang]);
 const c=localeCopy[lang];const t=translations[lang];
 useEffect(()=>{document.title=`${view==="concept"?c.concept:c.people} — WHAT 100 PEOPLE DO TO A GAME`},[view,c.concept,c.people]);
 useEffect(()=>{if(view!=="concept")return;const page=document.querySelector(".conceptPage");const nodes=Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));page?.classList.add("motion-ready");if(!("IntersectionObserver" in window)){nodes.forEach(node=>node.classList.add("is-visible"));return}const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){(entry.target as HTMLElement).classList.add("is-visible");observer.unobserve(entry.target)}}),{rootMargin:"0px 0px -10% 0px",threshold:.12});nodes.forEach(node=>observer.observe(node));return()=>observer.disconnect()},[view,lang]);
 useEffect(()=>{if(metricPanel!=="games"||gameLinksLoaded)return;fetch("/api/game-links",{cache:"no-store"}).then(async response=>{if(response.ok){const data=await response.json() as {links?:PublicGameLink[]};setGameLinks(data.links||[])}setGameLinksLoaded(true)}).catch(()=>setGameLinksLoaded(true))},[metricPanel,gameLinksLoaded]);
 const go=(next:PublicView)=>(event:MouseEvent<HTMLAnchorElement>)=>{event.preventDefault();if(view===next)return;history.pushState({},"",next==="concept"?"/concept":"/people");setView(next);window.scrollTo(0,0)};
 const editorial=lang==="zh"||lang==="en"?conceptEditorial[lang]:null;
 const manifesto=[
  {code:"01 / ACCESS",title:lang==="zh"?"技术不决定谁有资格开始":"Technique does not decide who may begin",body:editorial?editorial.essay[0]:c.essay[0]},
  {code:"02 / RESOURCES",title:lang==="zh"?"重新分配进入、表达与决定的权利":"Redistributing access, voice and decision",body:editorial?editorial.essay[4]:c.essay[1]},
  {code:"03 / DIFFERENCE",title:lang==="zh"?"让信息茧房彼此相遇":"Bringing information bubbles into relation",body:editorial?editorial.essay[5]:c.essay[2]},
  {code:"04 / FORM",title:lang==="zh"?"最终形式由一百个人共同形成":"One hundred people form the outcome",body:editorial?editorial.essay[7]:c.essay[3]}
 ];
 return <main className={`publicPage ${view==="concept"?"conceptPage":"peoplePage"} ${compactManifesto?"manifesto-ready":""}`}><header className="top"><a className="publicBack" href="/">← {c.back}</a><a className="mark" href="/" aria-label="WHAT 100 PEOPLE DO TO A GAME"><span className="fullPublicMark"><Wordmark/></span><span className="compactPublicMark" aria-hidden="true">WHAT 100 / GAME</span></a><nav aria-label={c.publicPages}><a className={view==="concept"?"active":""} href="/concept" onClick={go("concept")}>{c.concept}</a><a className={view==="people"?"active":""} href="/people" onClick={go("people")}>{c.people}</a></nav><label className="languagePicker"><span><b aria-hidden="true">🌐</b>{c.language}</span><select aria-label={c.language} value={lang} onChange={e=>{const next=e.target.value as Language;storageSet("hundred-language",next);setLang(next)}}>{languageOptions.filter(x=>x.value==="zh"||x.value==="en").map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label></header>{view==="concept"?<section className="conceptStandalone"><header className="conceptHero" data-reveal><span className="kicker conceptLabelBlock" aria-label="WHAT 100 PEOPLE DO TO A GAME"><span className="conceptWord conceptWordWhat" aria-hidden="true"><PosterWord text="WHAT"/></span><span className="conceptWord conceptWordHundred" aria-hidden="true"><PosterWord text="100"/></span><span className="conceptWord conceptWordPeople" aria-hidden="true"><PosterWord text="PEOPLE"/></span><span className="conceptWord conceptWordConnector" aria-hidden="true"><PosterWord text="DO TO A"/></span><span className="conceptWord conceptWordGame" aria-hidden="true"><PosterWord text="GAME"/></span></span><h1><span className="conceptHeadlineLine">{editorial?editorial.headline[0]:c.headline[0]}</span><span className="conceptHeadlineLine accent">{editorial?editorial.headline[1]:c.headline[1]}</span></h1><p className="conceptSubtitle">{editorial?editorial.subtitle:c.subtitle}</p><ProjectMetrics lang={lang} open={metricPanel} onToggle={panel=>setMetricPanel(current=>current===panel?null:panel)} links={gameLinks} linksLoaded={gameLinksLoaded}/></header><section className="conceptFeature" data-reveal><div className="conceptFeatureCopy"><span>PROJECT 01 / OPEN CALL</span><h2>{lang==="zh"?"我们不寻找一百名游戏设计师。":"We are not looking for one hundred game designers."}</h2><p><span>{editorial?editorial.essay[3]:c.essay[0]}</span></p><strong>{lang==="zh"?"我们寻找一百个人。":"We are looking for one hundred people."}</strong></div></section><section className="conceptManifesto" aria-label={lang==="zh"?"项目理念":"Project manifesto"}>{manifesto.map((item,index)=>{const expanded=!compactManifesto||openManifesto===index;return <article key={item.code} className={openManifesto===index?"is-open":""} data-reveal><button type="button" className="manifestoToggle" aria-expanded={expanded} aria-controls={`manifesto-body-${index}`} aria-disabled={!compactManifesto} tabIndex={compactManifesto?0:-1} onClick={()=>{if(compactManifesto)setOpenManifesto(current=>current===index?-1:index)}}><span className="manifestoCode">{item.code}</span><h2>{item.title}</h2><i aria-hidden="true"/></button><div id={`manifesto-body-${index}`} className="manifestoBody"><div><p>{item.body}</p></div></div></article>})}</section>{editorial&&<><div className="conceptQuestions" data-reveal><span>QUESTIONS FOR THE MEDIUM</span>{editorial.questions.map(question=><p key={question}>{question}</p>)}</div><aside className="conceptRecruitment" data-reveal><span className="kicker">{editorial.call.kicker}</span><h2>{editorial.call.title}</h2><p>{editorial.call.body}</p><strong>{editorial.call.deadline}</strong><p>{editorial.call.contact}</p><b>{editorial.call.action}</b></aside></>}<a className="peopleCta" href="/people" onClick={go("people")} data-reveal>{c.meet} →</a><RecruitmentPoster lang={lang}/></section>:<PublicDesignerRanking lang={lang}/>}<footer className="copyright">{t.copyright}</footer></main>
}

export function ConceptPage(){return <PublicPages initialView="concept"/>}
