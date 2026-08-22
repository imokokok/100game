"use client";

import {useEffect, useRef} from "react";

export function PortfolioMotion(){
 const progress=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const root=document.documentElement;
  root.classList.add("motion-ready");
  const selector=[
   ".conceptStandalone>.kicker",
   ".conceptStandalone>h1",
   ".conceptStandalone>.conceptSubtitle",
   ".conceptEssay>p",
   ".conceptQuestions>p",
   ".conceptRecruitment",
   ".peopleCta",
   ".peoplePage .creditsHead>*",
   ".peoplePage .designerGrid>article",
   ".peoplePage .leadCredit"
  ].join(",");
  const items=[...document.querySelectorAll<HTMLElement>(selector)];
  items.forEach((item,index)=>{item.classList.add("portfolioReveal");item.style.setProperty("--reveal-order",String(index%6))});
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("isVisible");observer.unobserve(entry.target)}}),{rootMargin:"0px 0px -8%",threshold:.08});
  items.forEach(item=>observer.observe(item));
  let frame=0;
  const update=()=>{frame=0;const max=document.documentElement.scrollHeight-innerHeight;const value=max>0?scrollY/max:0;progress.current?.style.setProperty("--portfolio-progress",String(Math.max(0,Math.min(1,value))))};
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)};
  update();addEventListener("scroll",scroll,{passive:true});addEventListener("resize",scroll,{passive:true});
  return()=>{observer.disconnect();if(frame)cancelAnimationFrame(frame);removeEventListener("scroll",scroll);removeEventListener("resize",scroll);root.classList.remove("motion-ready")};
 },[]);
 return <div ref={progress} className="portfolioProgress" aria-hidden="true"><i/></div>;
}
