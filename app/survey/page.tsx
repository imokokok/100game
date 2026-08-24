import type { Metadata } from "next";
import { SurveyHub } from "./survey-hub";
export const metadata: Metadata={title:"项目问卷 / Project Surveys",description:"WHAT 100 PEOPLE DO TO A GAME 项目问卷中心"};
export default function SurveyPage(){return <SurveyHub/>}
