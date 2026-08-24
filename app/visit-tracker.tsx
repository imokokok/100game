"use client";

import {useEffect} from "react";

const SESSION_KEY="w100-visit-recorded";

export function VisitTracker(){
 useEffect(()=>{
  if(sessionStorage.getItem(SESSION_KEY))return;
  fetch("/api/analytics",{method:"POST",keepalive:true})
   .then(response=>{if(response.ok)sessionStorage.setItem(SESSION_KEY,"1")})
   .catch(()=>undefined);
 },[]);
 return null;
}
