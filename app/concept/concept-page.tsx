"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import {useEffect,useState,type MouseEvent} from "react";
import {languageOptions,translations,type Language} from "../bilingual-i18n";
import {localeCopy} from "../bilingual-locale-copy";
import {PublicDesignerRanking} from "../live-flows";
import {Wordmark} from "../wordmark";

type PublicView="concept"|"people";

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
  questions:["游戏从何时开始成为游戏？","谁决定什么可以成为游戏？","作为媒介，游戏的边界究竟在哪里？"]
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
  questions:["At what point does a game become a game?","Who decides what may count as a game?","Where are the boundaries of the medium?"]
 }
} as const;

export function PublicPages({initialView}:{initialView:PublicView}){
 const [lang,setLang]=useState<Language>("zh");
 const [view,setView]=useState<PublicView>(initialView);
 useEffect(()=>{if(new URLSearchParams(location.search).get("public")==="1")history.replaceState({},"",location.pathname);try{const saved=localStorage.getItem("hundred-language") as Language|null;if(saved&&translations[saved])setTimeout(()=>setLang(saved),0)}catch{}const sync=()=>setView(location.pathname==="/people"?"people":"concept");addEventListener("popstate",sync);return()=>removeEventListener("popstate",sync)},[]);
 useEffect(()=>{try{localStorage.setItem("hundred-language",lang)}catch{}document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr"},[lang]);
 const c=localeCopy[lang];const t=translations[lang];
 useEffect(()=>{document.title=`${view==="concept"?c.concept:c.people} — WHAT 100 PEOPLE DO TO A GAME`},[view,c.concept,c.people]);
 const go=(next:PublicView)=>(event:MouseEvent<HTMLAnchorElement>)=>{event.preventDefault();if(view===next)return;history.pushState({},"",next==="concept"?"/concept":"/people");setView(next);window.scrollTo(0,0)};
 const editorial=lang==="zh"||lang==="en"?conceptEditorial[lang]:null;
 return <main className={`publicPage ${view==="concept"?"conceptPage":"peoplePage"}`}><header className="top"><a className="publicBack" href="/">← {c.back}</a><a className="mark" href="/" aria-label="WHAT 100 PEOPLE DO TO A GAME"><Wordmark/></a><nav aria-label={c.publicPages}><a className={view==="concept"?"active":""} href="/concept" onClick={go("concept")}>{c.concept}</a><a className={view==="people"?"active":""} href="/people" onClick={go("people")}>{c.people}</a></nav><label className="languagePicker"><span><b aria-hidden="true">🌐</b>{c.language}</span><select aria-label={c.language} value={lang} onChange={e=>{const next=e.target.value as Language;try{localStorage.setItem("hundred-language",next)}catch{}setLang(next)}}>{languageOptions.filter(x=>x.value==="zh"||x.value==="en").map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label></header>{view==="concept"?<section className="conceptStandalone"><span className="kicker conceptLabelBlock">{c.concept}</span><h1><span className="conceptHeadlineLine">{editorial?editorial.headline[0]:c.headline[0]}</span><span className="conceptHeadlineLine accent">{editorial?editorial.headline[1]:c.headline[1]}</span></h1><p className="conceptSubtitle">{editorial?editorial.subtitle:c.subtitle}</p><div className="conceptEssay">{editorial?editorial.essay.map((p,i)=><p key={i}>{p}</p>):c.essay.map((p,i)=><p key={i}>{p}</p>)}</div>{editorial&&<div className="conceptQuestions">{editorial.questions.map(question=><p key={question}>{question}</p>)}</div>}<a className="peopleCta" href="/people" onClick={go("people")}>{c.meet} →</a></section>:<PublicDesignerRanking lang={lang}/>}<footer className="copyright">{t.copyright}</footer></main>
}

export function ConceptPage(){return <PublicPages initialView="concept"/>}
