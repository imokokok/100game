"use client";

import {useEffect} from "react";

const SESSION_KEY="w100-visit-recorded";

export function VisitTracker(){
 useEffect(()=>{
  try{if(sessionStorage.getItem(SESSION_KEY))return}catch{}
  const record=()=>fetch("/api/analytics",{method:"POST",keepalive:true})
   .then(response=>{if(response.ok)try{sessionStorage.setItem(SESSION_KEY,"1")}catch{}})
   .catch(()=>undefined);
  const timer=window.setTimeout(record,1200);
  return()=>window.clearTimeout(timer);
 },[]);
 return null;
}
