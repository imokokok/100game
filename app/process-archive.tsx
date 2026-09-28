"use client";

import {useEffect,useRef,useState} from "react";
import type {EditorialLang} from "./public-home/content";
import {SmoothDisclosure} from "./public-home/smooth-disclosure";
import meetingMinutes from "./public-home/meeting-minutes.json";

type ProcessEntry={date:string;type:string;title:string;body:string;author:string;image:string|null;file:string|null;zhFile:string|null;enFile:string|null;minutes?:boolean};
export function ProcessArchive({lang}:{lang:EditorialLang}){
 const zh=lang==="zh";
 const [preview,setPreview]=useState<string|null>(null);
 const closeButton=useRef<HTMLButtonElement>(null),returnFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  if(!preview)return;
  returnFocus.current=document.activeElement as HTMLElement;
  const previous=document.body.style.overflow;
  document.body.style.overflow="hidden";closeButton.current?.focus();
  const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setPreview(null);if(e.key==="Tab"){e.preventDefault();closeButton.current?.focus()}};
  window.addEventListener("keydown",onKey);
  return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",onKey);returnFocus.current?.focus()};
 },[preview]);
 const weeks:{week:number;entries:ProcessEntry[]}[]=[
  {week:0,entries:[
   {date:"2026.09.03",type:zh?"会议纪要":"MEETING MINUTES",title:zh?"策划团队会议纪要":"Planning team meeting minutes",body:zh?"本次会议的讨论结论与后续安排。":"Conclusions and next steps from the first planning meeting.",author:"HuieChen 陈慧娥",image:null,file:"/process/week0-meeting-minutes.docx",zhFile:null,enFile:null,minutes:true},
   {date:"2026.09.03",type:zh?"策划会议":"PLANNING MEETING",title:zh?"第一次策划团队会议":"First planning team meeting",body:zh?"围绕概念与目标、故事与世界观、角色设计、机制与玩法、参考与风格、制作落地与分工展开讨论。":"A first working agenda covering concept, story world, characters, mechanics, references, production, and roles.",author:"HuieChen 陈慧娥",image:"/process/week0-planning-meeting.jpg",file:null,zhFile:null,enFile:null},
   {date:"2026.09.03",type:zh?"项目制度":"PROJECT RECORD",title:zh?"贡献记录与最终署名规则":"Contribution records and final credit rules",body:zh?"记录项目中实际完成的工作、职责范围与过程版本；最终署名以可核对的过程记录和实际贡献为准。":"A record of completed work, responsibilities, and project versions; final credits follow verifiable process records and actual contributions.",author:"HuieChen 陈慧娥",image:null,file:"/process/week0-contribution-records.docx",zhFile:null,enFile:null},
   {date:"2026.09.04",type:zh?"项目提案":"DIGITAL PROPOSAL",title:zh?"早期数字项目提案":"Early digital proposal",body:zh?"记录项目网站与数字协作方式的早期提案，保留为后续迭代可核对的过程版本。":"The early proposal for the project's digital form and collaboration workflow, retained as a traceable process version.",author:"HuieChen 陈慧娥",image:null,file:"/process/week0-digital-proposal.docx",zhFile:null,enFile:null},
  ]},
  {week:1,entries:[
   {date:"2026.09.09",type:zh?"剧情版本":"STORY VERSION",title:zh?"七日寻声":"Seven Days of Listening",body:zh?"以雾镇、陈远留下的磁带与河底录音为线索，展开 A 与 B 平行追寻同一段旧故事的七日主线。":"A seven-day mystery in which A and B follow different traces left by Chen Yuan, two cassettes and recordings hidden beneath Wuzhen's river.",author:"赤睦",image:null,file:null,zhFile:"/process/week1-seven-days-listening.txt",enFile:"/process/week1-seven-days-listening-en.txt"},
   {date:"2026.09.09",type:zh?"故事大纲":"STORY OUTLINE",title:zh?"雾港故事大纲":"Mist Harbor story outline",body:zh?"建立雾港的历史、永居制度、七天结构、八组玩法及双主角与资源系统之间的关系。":"Defines Mist Harbor's history, residency process, seven-day arc, eight activity groups and the two protagonists' relationship to time and resources.",author:"熊韬炀",image:null,file:null,zhFile:"/process/week1-mist-harbor-story-outline.docx",enFile:"/process/week1-mist-harbor-story-outline-en.docx"},
   {date:"2026.09.09",type:zh?"故事修改":"STORY REVISION",title:zh?"雾港背景故事修改版":"Mist Harbor setting revision",body:zh?"将雾港进一步调整为带有南法海岸、薰衣草田、旧铁路与石灰岩小镇气质的完整背景版本。":"Reworks Mist Harbor as a coastal town shaped by lavender fields, limestone, an abandoned railway and the rhythms of southern France.",author:"熊韬炀",image:null,file:null,zhFile:"/process/week1-mist-harbor-story-revision.docx",enFile:"/process/week1-mist-harbor-story-revision-en.docx"},
   {date:"2026.09.10",type:zh?"故事大纲":"STORY OUTLINE",title:zh?"Solmere 故事大纲":"Solmere story outline",body:zh?"确立 Solmere 的传媒产业、小镇尺度、七天试居、双主角职业背景及贯穿玩法的平行叙事。":"Establishes Solmere's creative industries, small-town scale, seven-day residency, parallel protagonists and activity-led narrative.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week1-solmere-story-outline.docx",enFile:"/process/week1-solmere-story-outline-en.docx"},
   {date:"2026.09.09",type:zh?"游戏文本":"GAME NARRATIVE",title:zh?"游戏文本设计 1.0":"Game narrative design 1.0",body:zh?"建立海岛小镇、七天申请流程、双主角平行动线、人物处境与偏魔幻现实主义的叙事基调。":"Defines the island town, seven-day application, parallel protagonists, their different circumstances and the magical-realist narrative tone.",author:"咸鱼",image:null,file:null,zhFile:"/process/week1-game-narrative-design.docx",enFile:"/process/week1-game-narrative-design-en.docx"},
   {date:"2026.09.10",type:zh?"主线叙事":"MAIN NARRATIVE",title:zh?"主线叙事结构":"Main narrative structure",body:zh?"以十五个叙事阶段梳理两位主角抵达小镇、建立关系、面对误解与等待评定结果的完整推进。":"A fifteen-stage narrative map tracing both protagonists from their arrival through relationships, misunderstandings and the residency decision.",author:"山梨之星",image:null,file:null,zhFile:"/process/week1-main-narrative.xls",enFile:"/process/week1-main-narrative-en.xlsx"},
   {date:"2026.09.11",type:zh?"系统草稿":"SYSTEM DRAFT",title:zh?"小镇地图与游戏流程草稿":"Town map and game flow draft",body:zh?"整理小镇地点、双主角路线、核心玩法入口与从序章到周日的章节推进。":"A working map of the town, the two protagonist routes, core activities and the chapter flow from the prologue to Sunday.",author:"咸蛋黄",image:null,file:null,zhFile:"/process/week1-town-flow-draft.docx",enFile:"/process/week1-town-flow-draft-en.docx"},
   {date:"WEEK 1",type:zh?"项目提案":"DIGITAL PROPOSAL",title:zh?"100 项目 Digital Proposal":"100 Project Digital Proposal",body:zh?"关于双角色叙事、日程、100 个 NPC、互动与玩法方向的第一版完整提案。":"The first full proposal for dual-character narrative, routines, one hundred NPCs, interactions, and gameplay direction.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week1-digital-proposal.docx",enFile:"/process/week1-digital-proposal-en.docx"},
  ]},
  {week:2,entries:[
   {date:"2026.09.14",type:zh?"人物剧本":"CHARACTER SCREENPLAY",title:zh?"A · 来到 Solmere 之前":"A · Before Solmere",body:zh?"通过家庭、暑假与一次游戏项目，写出 A 的行动力、选择欲与项目结束后的空白。":"A screenplay about family, an unstructured summer and a game project that reveals A's appetite for decisions and the emptiness after completion.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week2-solmere-script-a.pdf",enFile:"/process/week2-solmere-script-a-en.pdf"},
   {date:"2026.09.14",type:zh?"人物剧本":"CHARACTER SCREENPLAY",title:zh?"B · 来到 Solmere 之前":"B · Before Solmere",body:zh?"通过家庭、音乐与制作管理工作，建立 B 对稳定、责任、野心与个人兴趣之间的拉扯。":"A screenplay about family, music and production management, establishing B's tension between stability, responsibility, ambition and private desire.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week2-solmere-script-b.pdf",enFile:"/process/week2-solmere-script-b-en.pdf"},
   {date:"2026.09.17",type:zh?"尾声":"EPILOGUE",title:zh?"尾声":"Epilogue",body:zh?"A 与 B 带着各自的文件走出审核，在唱片店因为一张写着 B 名字的 CD 第一次真正看见彼此。":"A and B leave the review with their documents and finally see one another in the record shop through a CD carrying B's name.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week2-epilogue.pdf",enFile:"/process/week2-epilogue-en.pdf"},
   {date:"WEEK 2",type:zh?"开发记录":"DEVELOPMENT UPDATE",title:zh?"Week 2 开发进度及 Week 3 开发安排":"Week 2 development update and Week 3 plan",body:zh?"记录本周整体推进、主线档案系统、双角色设计、主要 NPC、小游戏与交互系统，并整理下一周的开发安排。":"A record of the week's progress across the main archive system, dual protagonists, key NPCs, minigames and interactions, followed by the Week 3 development plan.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week2-development-update-week3-plan.docx",enFile:"/process/week2-development-update-week3-plan-en.docx"},
  ]},
  {week:3,entries:[
   {date:"WEEK 3",type:zh?"架构调整":"STRUCTURE REVISION",title:zh?"SOLMERE 架构调整说明":"SOLMERE structure revision",body:zh?"说明项目从七天调整为五天后的双线叙事、人物骨架、时间结构、NPC 关系及第五天交叉体验。":"The revised five-day structure, dual narrative, character foundations, time design, NPC relationships and the Day 5 crossover.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week3-architecture-adjustment.docx",enFile:"/process/week3-architecture-adjustment-en.docx"},
   {date:"WEEK 3",type:zh?"主体机制":"CORE MECHANICS",title:zh?"SOLMERE 主体机制与系统设计":"SOLMERE core mechanics and system design",body:zh?"在架构调整之后，进一步说明由状态、时间和金钱共同驱动的日程管理主体机制。":"Following the structure revision, this document defines the schedule-management core driven by status, time and money systems.",author:"HuieChen 陈慧娥",image:null,file:null,zhFile:"/process/week3-core-mechanics-system-design.docx",enFile:"/process/week3-core-mechanics-system-design-en.docx"},
   {date:"2026.09.25",type:zh?"文本设计":"NARRATIVE DESIGN",title:zh?"Maya 书店交互文本设计":"Maya bookshop interaction design",body:zh?"以书店 NPC Maya 为例，拆解初见、闲聊、关系互动与任务认可的文本分支。":"A branching dialogue map for the bookshop NPC Maya, covering first contact, small talk, relationship scenes and task recognition.",author:"山梨之心",image:null,file:null,zhFile:"/process/week3-text-design-2.pdf",enFile:"/process/week3-text-design-2-en.pdf"},
   {date:"2026.09.25",type:zh?"文本示例":"DIALOGUE SAMPLE",title:zh?"石泳琪交互文本示例":"Shiyongqi interaction sample",body:zh?"从初次见面到深入交流与获取认可，展示餐厅角色石泳琪的完整互动语气与触发结构。":"A complete interaction sample for the restaurant character Shiyongqi, from first meeting to deeper conversation and earned recognition.",author:"熊韬炀",image:null,file:null,zhFile:"/process/week3-text-design-example.docx",enFile:"/process/week3-text-design-example-en.docx"},
  ]},
 ];
 return <section className="editorialProcessArchive" aria-labelledby="processArchiveTitle">
  <header><div><p className="editorialEyebrow">{zh?"项目档案 · 第 0—3 周":"PROJECT ARCHIVE · WEEKS 0–3"}</p><h1 id="processArchiveTitle">{zh?"过程":"Process"}</h1></div><p>{zh?"从第一次会议到每一次修改，记录作品如何逐渐形成。":"From the first meeting to each revision: a record of the work taking shape."}</p></header>
  <nav className="archiveWeekNav" aria-label={zh?"按周浏览":"Browse by week"}>
   {weeks.map(group=><a href={`#week-${group.week}`} key={group.week}><span>{zh?`第 ${group.week} 周`:`Week ${group.week}`}</span><small>{group.entries.length} {zh?"项":"records"}</small></a>)}
  </nav>
  <div className="processArchiveList">{weeks.map(group=><section className="processWeekGroup" id={`week-${group.week}`} key={group.week} aria-labelledby={`processWeek${group.week}`}>
   <header className="processWeekHeader"><span aria-hidden="true">{String(group.week).padStart(2,"0")}</span><h2 id={`processWeek${group.week}`}>{zh?`第 ${group.week} 周`:`Week ${group.week}`}</h2><small>{group.entries.length} {zh?"项记录":"records"}</small></header>
   {group.entries.map((entry,index)=><article className={`processArchiveEntry ${entry.image?"hasImage":""}`} key={entry.zhFile||entry.file||entry.image||entry.title}>
    <div className="processArchiveNumber">{String(index+1).padStart(2,"0")}</div><time dateTime={/^\d{4}\./.test(entry.date)?entry.date.replace(/\./g,"-"):undefined}>{entry.date.startsWith("WEEK")?(zh?`第 ${group.week} 周`:`Week ${group.week}`):entry.date}</time>
    <div className="processArchiveCopy"><span>{entry.type}</span><h3>{entry.title}</h3><p className="processArchiveAuthor">{zh?"署名":"By"} · <b>{entry.author}</b></p><p>{entry.body}</p>
     {entry.minutes&&<SmoothDisclosure closedLabel={zh?"阅读会议纪要":"Read original meeting minutes"} openLabel={zh?"收起会议纪要":"Close meeting minutes"}><div className="meetingMinutes" lang="zh">{meetingMinutes.map((text,i)=>/^[一二三四五六七八九十]+、/.test(text)?<h4 key={i}>{text}</h4>:<p key={i}>{text}</p>)}</div></SmoothDisclosure>}
     <div className="processArchiveDownloads">{entry.file&&<a href={entry.file} download><span>{zh?"下载中文原件":"Chinese original"}</span><small>{entry.file.split(".").pop()?.toUpperCase()}</small></a>}{entry.zhFile&&<a href={entry.zhFile} download><span>{zh?"中文原件":"Chinese original"}</span><small>{entry.zhFile.split(".").pop()?.toUpperCase()}</small></a>}{entry.enFile&&<a href={entry.enFile} download><span>{zh?"英文版":"English edition"}</span><small>{entry.enFile.split(".").pop()?.toUpperCase()}</small></a>}</div>
     {entry.image&&<button className="archiveImageButton" onClick={()=>setPreview(entry.image)} aria-label={zh?"放大会议图片":"Enlarge meeting image"}><img src={entry.image} alt={zh?"2026 年 9 月 3 日策划会议议程":"Planning meeting agenda, 3 September 2026"} loading="lazy" decoding="async" width="1536" height="1024"/><span>{zh?"查看大图":"View image"}</span></button>}
    </div>
   </article>)}
  </section>)}</div>
  {preview&&<div className="archiveLightbox" role="dialog" aria-modal="true" aria-label={zh?"会议图片":"Meeting image"} onClick={e=>{if(e.target===e.currentTarget)setPreview(null)}}><button ref={closeButton} onClick={()=>setPreview(null)}>{zh?"关闭图片":"Close image"} ×</button><img src={preview} alt={zh?"策划会议议程":"Planning meeting agenda"}/></div>}
 </section>;
}
