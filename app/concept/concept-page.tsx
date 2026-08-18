"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import {useEffect,useState,type MouseEvent} from "react";
import {languageOptions,translations,type Language} from "../i18n";
import {localeCopy} from "../locale-copy";
import {PublicDesignerRanking} from "../live-flows";
import {Wordmark} from "../wordmark";

type PublicView="concept"|"people";

// Access is checked after hydration because sessionStorage is scoped to this browser tab.
export function PublicPages({initialView}:{initialView:PublicView}){
 const [lang,setLang]=useState<Language>("zh");
 const [view,setView]=useState<PublicView>(initialView);
 const [accessReady,setAccessReady]=useState(false);
 useEffect(()=>{const direct=new URLSearchParams(location.search).get("public")==="1";if(direct){sessionStorage.setItem("w100-entry-choice","public");history.replaceState({},"",location.pathname)}else if(sessionStorage.getItem("w100-entry-choice")!=="public"){location.replace("/");return}const saved=localStorage.getItem("hundred-language") as Language|null;queueMicrotask(()=>{setAccessReady(true);if(saved&&translations[saved])setLang(saved)});const sync=()=>setView(location.pathname==="/people"?"people":"concept");addEventListener("popstate",sync);fetch("/api/designers",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(data=>{if(data?.designers)sessionStorage.setItem("w100-designers-cache",JSON.stringify(data.designers))}).catch(()=>undefined);return()=>removeEventListener("popstate",sync)},[]);
 useEffect(()=>{localStorage.setItem("hundred-language",lang);document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr"},[lang]);
 const c=localeCopy[lang];const t=translations[lang];
 useEffect(()=>{document.title=`${view==="concept"?c.concept:c.people} — HOW 100 PEOPLE CALL A GAME`},[view,c.concept,c.people]);
 const go=(next:PublicView)=>(event:MouseEvent<HTMLAnchorElement>)=>{event.preventDefault();if(view===next)return;history.pushState({},"",next==="concept"?"/concept":"/people");setView(next);window.scrollTo(0,0)};
 if(!accessReady)return <main className="publicAccessCheck" aria-label={c.publicPages}/>;
 return <main className={`publicPage ${view==="concept"?"conceptPage":"peoplePage"}`}><header className="top"><a className="mark" href="/" aria-label="HOW 100 PEOPLE CALL A GAME"><Wordmark/></a><nav aria-label={c.publicPages}><a className="publicBack" href="/">← {c.back}</a><a className={view==="concept"?"active":""} href="/concept" onClick={go("concept")}>{c.concept}</a><a className={view==="people"?"active":""} href="/people" onClick={go("people")}>{c.people}</a></nav><label className="languagePicker"><span><b aria-hidden="true">🌐</b>{c.language}</span><select aria-label={c.language} value={lang} onChange={e=>{const next=e.target.value as Language;localStorage.setItem("hundred-language",next);setLang(next)}}>{languageOptions.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label></header>{view==="concept"?<section className="conceptStandalone"><span className="kicker conceptLabelBlock">{c.concept}</span><h1><span className="conceptHeadlineLine">{c.headline[0]}</span><span className="conceptHeadlineLine accent">{c.headline[1]}</span></h1><p className="conceptSubtitle">{c.subtitle}</p><div className="conceptEssay">{c.essay.map((p,i)=><p key={i}>{p}</p>)}</div><a className="peopleCta" href="/people" onClick={go("people")}>{c.meet} →</a></section>:<PublicDesignerRanking lang={lang}/>}<footer className="copyright">{t.copyright}</footer></main>
}

export function ConceptPage(){return <PublicPages initialView="concept"/>}
