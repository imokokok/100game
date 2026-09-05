import type {Metadata} from "next";
import {SurveyApp,type SurveyDefinition} from "../survey-app";
import {npcGroups,npcQuestions,npcSections,npcSectionStarts} from "../npc-questions";

export const metadata:Metadata={title:"NPC设计问卷 / NPC Design Survey",description:"WHAT 100 PEOPLE DO TO A GAME NPC 设计问卷"};

const npcDefinition:SurveyDefinition={
 id:"npc-design",titleZh:"NPC设计问卷",titleEn:"NPC Design Survey",eyebrowZh:"NPC DESIGN · NPC 设计",eyebrowEn:"NPC DESIGN SURVEY",
 questions:npcQuestions,sections:npcSections,groups:npcGroups,sectionStarts:npcSectionStarts,
 intro:{
  zh:<>为游戏里的 <em>100 个 NPC</em><br/>留下你的日常与小细节。</>,
  en:<>Bring everyday details into<br/><em>one hundred NPCs.</em></>,
  detailZh:["这份问卷会用来设计游戏里的 100 个 NPC。不会直接照搬本人，主要参考大家的日常、兴趣、习惯和一些小细节。没有的可以直接写“没有”。","并不是所有 NPC 都会拥有独立、完整的具体形象和剧情。我们会根据游戏结构、内容适配度和实际制作情况，选择一部分角色进行更完整的视觉形象、对白、剧情或互动设计；其他 NPC 也可能通过日程、行为、短对白、互动或环境细节出现。不同呈现方式不代表贡献多少或重要程度不同。"],
  detailEn:["This survey helps design the game’s 100 NPCs. It will not copy anyone directly; it draws from everyday routines, interests, habits, and small details. Write “none” where you have nothing to add.","Not every NPC will have a complete individual look or story. According to game structure, fit, and production realities, some characters may receive fuller visuals, dialogue, story, or interactions; others may appear through schedules, behaviours, short lines, interactions, or environmental details. Different forms of appearance do not reflect the value or importance of anyone’s contribution."],
 },
 complete:{zh:<>已收到<br/>你的 NPC 正在进入这个世界</>,en:<>Received<br/>Your NPC is entering this world</>},
};

export default function NpcDesignSurvey(){return <SurveyApp definition={npcDefinition}/>}
