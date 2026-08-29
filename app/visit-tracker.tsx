"use client";

import {useEffect} from "react";
import {sessionGet,sessionSet} from "./client-compat";

const SESSION_KEY="w100-visit-recorded";

export function VisitTracker(){
 useEffect(()=>{
  let cancelled=false;
  let timer=0;
  let idle=0;
  const record=()=>{
   if(cancelled||sessionGet(SESSION_KEY))return;
   fetch("/api/analytics",{method:"POST",keepalive:true})
    .then(response=>{if(response.ok)sessionSet(SESSION_KEY,"1")})
    .catch(()=>undefined);
  };
  const schedule=()=>{
   if(typeof window.requestIdleCallback==="function")idle=window.requestIdleCallback(record,{timeout:5200});
   else timer=window.setTimeout(record,3200);
  };
  if(document.readyState==="complete")schedule();
  else window.addEventListener("load",schedule,{once:true});
  return()=>{cancelled=true;window.clearTimeout(timer);if(idle&&typeof window.cancelIdleCallback==="function")window.cancelIdleCallback(idle);window.removeEventListener("load",schedule)};
 },[]);
 return null;
}
