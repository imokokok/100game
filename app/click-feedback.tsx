"use client";

import { useEffect, useState } from "react";

type Pulse={x:number;y:number;size:number;key:number};

export function ClickFeedback(){
 const [pulse,setPulse]=useState<Pulse|null>(null);
 useEffect(()=>{
  const interactive="button:not(:disabled),a[href],summary,label:has(input),[role='button'],input[type='radio'],input[type='checkbox']";
  const show=(target:EventTarget|null,x?:number,y?:number)=>{const element=target instanceof Element?target.closest(interactive):null;if(!element)return;const rect=element.getBoundingClientRect();const px=x??rect.left+rect.width/2;const py=y??rect.top+rect.height/2;setPulse({x:px,y:py,size:Math.max(24,Math.min(52,Math.max(rect.width,rect.height)*.28)),key:Date.now()})};
  const pointer=(event:PointerEvent)=>show(event.target,event.clientX,event.clientY);
  const keyboard=(event:KeyboardEvent)=>{if(event.key==="Enter"||event.key===" ")show(event.target)};
  document.addEventListener("pointerdown",pointer,{passive:true});document.addEventListener("keydown",keyboard);
  return()=>{document.removeEventListener("pointerdown",pointer);document.removeEventListener("keydown",keyboard)};
 },[]);
 return <div className="interactionLayer" aria-hidden="true">{pulse&&<i key={pulse.key} style={{left:pulse.x,top:pulse.y,width:pulse.size,height:pulse.size}}/>}</div>;
}
