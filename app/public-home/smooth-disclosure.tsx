"use client";

import {useEffect,useRef,type MouseEvent,type ReactNode} from "react";

/** Native details remain the fallback. Only a user-triggered disclosure is
 * measured/animated; no scroll loop, timer, or animation library is needed. */
export function SmoothDisclosure({className="",closedLabel,openLabel,children}:{className?:string;closedLabel:string;openLabel:string;children:ReactNode}){
 const root=useRef<HTMLDetailsElement>(null);
 const animation=useRef<Animation|null>(null);
 const destination=useRef(false);
 useEffect(()=>()=>{if(animation.current){animation.current.onfinish=null;animation.current.cancel()}},[]);
 function toggle(event:MouseEvent<HTMLElement>){
  const el=root.current;if(!el)return;
  const reduced=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(typeof el.animate!=="function"||reduced){
   if(animation.current){animation.current.onfinish=null;animation.current.cancel();animation.current=null;el.style.height="";el.style.overflow=""}
   return;
  }
  event.preventDefault();
  const start=el.getBoundingClientRect().height;
  const opening=animation.current?!destination.current:!el.open;
  if(animation.current){animation.current.onfinish=null;animation.current.cancel()}
  destination.current=opening;
  el.style.height="";el.style.overflow="hidden";el.open=true;
  const end=opening?el.getBoundingClientRect().height:el.querySelector("summary")!.getBoundingClientRect().height;
  const finish=()=>{el.open=opening;el.style.height="";el.style.overflow="";animation.current=null};
  try{
   const run=el.animate({height:[`${start}px`,`${end}px`]},{duration:Math.min(360,220+Math.abs(end-start)*.06),easing:"cubic-bezier(.22,1,.36,1)"});
   animation.current=run;run.onfinish=finish;
  }catch{finish()}
 }
 return <details ref={root} className={`processDisclosure ${className}`}>
  <summary onClick={toggle}><span className="whenClosed">{closedLabel}</span><span className="whenOpen">{openLabel}</span></summary>
  <div className="disclosureContent">{children}</div>
 </details>;
}
