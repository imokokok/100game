import type {Metadata} from "next";
import {ConceptPage} from "./concept-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata:Metadata={title:"Concept — WHAT 100 PEOPLE DO TO A GAME",description:"一项由一百位参与者共同改变游戏的持续性参与式艺术计划。",openGraph:{title:"Concept — WHAT 100 PEOPLE DO TO A GAME",description:"一项由一百位参与者共同改变游戏的持续性参与式艺术计划。",images:[]},twitter:{title:"Concept — WHAT 100 PEOPLE DO TO A GAME",description:"一项由一百位参与者共同改变游戏的持续性参与式艺术计划。",images:[]}};

export default function Page(){return <ConceptPage/>}
