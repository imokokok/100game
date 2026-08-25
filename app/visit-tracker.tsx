"use client";

import {useEffect} from "react";
import {sessionGet,sessionSet} from "./client-compat";

const SESSION_KEY="w100-visit-recorded";

export function VisitTracker(){
 useEffect(()=>{
  if(sessionGet(SESSION_KEY))return;
  fetch("/api/analytics",{method:"POST",keepalive:true})
   .then(response=>{if(response.ok)sessionSet(SESSION_KEY,"1")})
   .catch(()=>undefined);
 },[]);
 return null;
}
