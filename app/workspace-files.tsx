"use client";

import { useEffect, useState } from "react";
import type { Language, Translation } from "./bilingual-i18n";
import { GroupFileGallery, LiveUpload } from "./live-flows";
import { WeekAnnouncementPage } from "./week-announcement";

type FileRow={id:string;name:string;content_type:string;size:number;created_at:number;participant_id:string};
type CategoryId="draft"|"process"|"final";

function beijingGreeting(lang:Language){
 const hour=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Shanghai",hour:"2-digit",hour12:false}).format(new Date()));
 if(lang==="zh")return hour<6?"夜深了":hour<11?"早上好":hour<14?"中午好":hour<18?"下午好":"晚上好";
 return hour<6?"LATE NIGHT":hour<11?"GOOD MORNING":hour<14?"GOOD AFTERNOON":hour<18?"GOOD AFTERNOON":"GOOD EVENING";
}

export function WorkspaceFiles({t,lang}:{t:Translation;lang:Language}){
 const zh=lang==="zh";
 const [week,setWeek]=useState<number|null>(null);
 const [openCategory,setOpenCategory]=useState<CategoryId|null>(null);
 const [openNotice,setOpenNotice]=useState(false);
 const [files,setFiles]=useState<Record<CategoryId,FileRow[]>>({draft:[],process:[],final:[]});
 const [loaded,setLoaded]=useState(false);
 const categories=[
  {id:"draft" as const,title:zh?"初稿":"Drafts",note:zh?"早期方案、草图、文字与尚未定稿的版本":"Early proposals, sketches, text, and unfinished versions"},
  {id:"process" as const,title:zh?"过程文件":"Work in progress",note:zh?"测试、迭代、中间版本及制作材料":"Tests, iterations, intermediate versions, and production material"},
  {id:"final" as const,title:zh?"成品文件":"Final works",note:zh?"确认完成、可供展示或交付的版本":"Approved files ready for presentation or delivery"}
 ];
 const load=(selectedWeek:number)=>{setLoaded(false);return fetch(`/api/uploads?week=${selectedWeek}`,{cache:"no-store"}).then(r=>r.ok?r.json():{files:[]}).then(data=>{const rows=(data.files||[]) as Array<FileRow&{category:CategoryId}>;setFiles({draft:rows.filter(file=>file.category==="draft"),process:rows.filter(file=>file.category==="process"),final:rows.filter(file=>file.category==="final")});setLoaded(true)}).catch(()=>setLoaded(true))};
 useEffect(()=>{if(week!==null)load(week)},[week]);
 const enterWeek=(value:number)=>{setWeek(value);setOpenCategory(null);setOpenNotice(false)};
 const back=()=>{if(openCategory)setOpenCategory(null);else if(openNotice)setOpenNotice(false);else setWeek(null)};
 const current=openCategory?categories.find(c=>c.id===openCategory):null;

 return <div className="page workspaceFiles">
  <header className="workspaceFilesHead"><div><span className="kicker">{beijingGreeting(lang)} · BEIJING TIME</span><h1>{zh?"创作资料库":"Creative Library"}</h1><p>{zh?"按周次进入资料夹，再查看该周公告或选择文件类别提交。所有内容会保留在对应周次中。":"Open a week to read its announcement or choose a file category. Everything remains filed under its project week."}</p></div>{week!==null&&<button className="libraryBack" onClick={back}>← {(openCategory||openNotice)?(zh?`返回 Week ${week}`:`Back to Week ${week}`):(zh?"全部周次":"All weeks")}</button>}</header>
  <nav className="libraryBreadcrumb" aria-label={zh?"资料库路径":"Library path"}><button onClick={()=>{setWeek(null);setOpenCategory(null);setOpenNotice(false)}}>{zh?"创作资料库":"Creative Library"}</button>{week!==null&&<><span>/</span><button onClick={()=>{setOpenCategory(null);setOpenNotice(false)}}>Week {week}</button></>}{current&&<><span>/</span><b>{current.title}</b></>}{openNotice&&<><span>/</span><b>{zh?"公告":"Announcement"}</b></>}</nav>
  {week===null?<section className="libraryWeeks"><div className="librarySectionTitle"><span className="kicker">PROJECT WEEKS</span><h2>{zh?"选择周次":"Choose a week"}</h2></div><div>{[0,1,2,3,4].map(value=><button className={`weekFolder week${value}`} key={value} onClick={()=>enterWeek(value)}><span>W{value}</span><div><b>Week {value}</b><small>{value===0?(zh?"开始前准备、公告与项目资料":"Preparation, notice, and project materials"):(zh?"本周公告、初稿、过程与成品":"Announcement, drafts, process and final work")}</small></div><i>→</i></button>)}</div></section>
  :openNotice?<section className="weekAnnouncementPage"><WeekAnnouncementPage lang={lang} week={week}/></section>
  :openCategory&&current?<section className={`libraryCategoryDetail ${current.id}`}><header><div><span className="kicker">WEEK {week} · {current.id.toUpperCase()}</span><h2>{current.title}</h2><p>{current.note}</p></div><b>{files[current.id].length}</b></header><LiveUpload t={t} lang={lang} category={current.id} week={week} onUploaded={()=>load(week)}/>{loaded&&files[current.id].length?<GroupFileGallery files={files[current.id]} lang={lang}/>:<div className="workspaceEmpty">{zh?"这个资料夹目前为空。可以在这里提交文件。":"This folder is empty. Submit files here when ready."}</div>}</section>
  :<section className="libraryCategories"><div className="librarySectionTitle"><span className="kicker">WEEK {week}</span><h2>{zh?"本周内容":"This week"}</h2></div><button className="weekNoticeCard" onClick={()=>setOpenNotice(true)}><span>{zh?"项目公告":"PROJECT NOTICE"}</span><div><b>{week===0?(zh?"项目开始前须知":"Before the project begins"):(zh?`Week ${week} 公告`:`Week ${week} announcement`)}</b><small>{week===0?(zh?"Top 5 已完成；查看本周其余安排":"Top 5 is complete; view the remaining Week 0 plan"):(zh?"进入查看本周安排":"Open this week's plan")}</small></div><i>→</i></button><div className="librarySectionTitle fileCategoryTitle"><span className="kicker">FILES</span><h2>{zh?"选择文件类别":"Choose a category"}</h2></div><div>{categories.map((category,index)=><button className={`categoryFolder ${category.id}`} key={category.id} onClick={()=>setOpenCategory(category.id)}><span>{String(index+1).padStart(2,"0")}</span><div><b>{category.title}</b><small>{category.note}</small></div><strong>{files[category.id].length}</strong><i>→</i></button>)}</div></section>}
 </div>;
}
