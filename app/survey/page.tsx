import type { Metadata } from "next";
import { SurveyApp } from "./survey-app";
export const metadata: Metadata={title:"WHAT 100 PEOPLE DO TO A GAME — Survey",description:"一百个人怎么做游戏：参与者创作画像问卷"};
export default function SurveyPage(){return <SurveyApp/>}
