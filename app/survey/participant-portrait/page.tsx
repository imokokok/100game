import type { Metadata } from "next";
import { SurveyApp } from "../survey-app";
export const metadata: Metadata={title:"参与者创作画像 / Participant Creative Portrait",description:"WHAT 100 PEOPLE DO TO A GAME 项目参与者创作画像问卷"};
export default function ParticipantPortraitSurvey(){return <SurveyApp/>}
