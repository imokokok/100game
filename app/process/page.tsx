import type {Metadata} from "next";
import {cookies} from "next/headers";
import {EntryStudio} from "../entry-studio";

export const metadata:Metadata={
 title:"过程 / Process — HOW 100 PEOPLE CALL A GAME",
 description:"项目第 0—3 周的创作记录、原始文件与英文版本。",
 alternates:{canonical:"/process"},
};
export default async function ProcessPage(){
 const lang=(await cookies()).get("hundred-language")?.value==="en"?"en":"zh";
 return <EntryStudio initialPublicView="process" initialLang={lang}/>;
}
