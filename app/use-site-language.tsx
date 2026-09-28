"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {storageGet,storageSet} from "./client-compat";
export type SiteLanguage="zh"|"en";
type LanguageState=readonly [SiteLanguage,(value:SiteLanguage)=>void];
const LanguageContext=createContext<LanguageState|null>(null);
export function SiteLanguageProvider({initial,children}:{initial:SiteLanguage;children:ReactNode}){
 const state=useLanguageState(initial);
 return <LanguageContext.Provider value={state}>{children}</LanguageContext.Provider>;
}

/** Load preferences before persisting: mounting must never overwrite saved English with Chinese. */
function useLanguageState(initial:SiteLanguage){
 const [language,setLanguage]=useState<SiteLanguage>(initial);
 useEffect(()=>{
  const cookie=document.cookie.match(/(?:^|; )hundred-language=(zh|en)(?:;|$)/)?.[1];
  const saved=cookie||storageGet("hundred-language");
  if(saved==="zh"||saved==="en")setLanguage(saved);
  const sync=(event:StorageEvent)=>{if(event.key==="hundred-language"&&(event.newValue==="zh"||event.newValue==="en"))setLanguage(event.newValue)};
  window.addEventListener("storage",sync);return()=>window.removeEventListener("storage",sync);
 },[]);
 useEffect(()=>{document.documentElement.lang=language==="zh"?"zh-CN":"en";document.documentElement.dir="ltr"},[language]);
 const changeLanguage=(value:SiteLanguage)=>{
  setLanguage(value);storageSet("hundred-language",value);
  document.cookie=`hundred-language=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
 };
 return [language,changeLanguage] as const;
}
export function useSiteLanguage(_initial?:SiteLanguage):LanguageState{
 const state=useContext(LanguageContext);
 if(!state)throw new Error("SiteLanguageProvider is required");
 return state;
}
