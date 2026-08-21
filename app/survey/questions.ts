export type Lang = "zh" | "en";
export type Question = { id: string; type: "text"|"textarea"|"single"|"multi"; zh: string; en: string; required?: boolean; options?: {value:string;zh:string;en:string}[]; showWhen?: {id:string;includes:string}; placeholderZh?: string; placeholderEn?: string };
const opt=(value:string,zh:string,en:string)=>({value,zh,en});
export const questions: Question[] = [
 {id:"wechatName",type:"text",required:true,zh:"你的微信群聊名",en:"Your WeChat group name",placeholderZh:"请填写群聊中正在使用的名字",placeholderEn:"Use the name currently shown in the group"},
 {id:"gameDefinition",type:"textarea",required:true,zh:"对你来说，什么是“游戏”？",en:"What is a “game” to you?"},
 {id:"likedGenres",type:"multi",required:true,zh:"你喜欢或愿意推荐哪些游戏类型？",en:"What kinds of games do you enjoy or recommend?",options:[opt("narrative","叙事 / 角色扮演","Narrative / RPG"),opt("strategy","策略 / 模拟","Strategy / simulation"),opt("action","动作 / 竞技","Action / competitive"),opt("puzzle","解谜 / 益智","Puzzle"),opt("social","社交 / 聚会","Social / party"),opt("experimental","实验 / 艺术游戏","Experimental / art game"),opt("tabletop","桌游 / 线下游戏","Tabletop / physical"),opt("other","其他","Other")]},
 {id:"recommendations",type:"textarea",zh:"请推荐 1–3 个具体游戏，并说说原因",en:"Recommend 1–3 specific games and tell us why"},
 {id:"wantGenres",type:"multi",required:true,zh:"你最想参与制作哪些类型？",en:"What kinds of games would you most like to make?",options:[opt("narrative","叙事","Narrative"),opt("strategy","策略 / 模拟","Strategy / simulation"),opt("action","动作 / 竞技","Action / competitive"),opt("puzzle","解谜","Puzzle"),opt("social","社交 / 聚会","Social / party"),opt("experimental","实验 / 艺术","Experimental / art"),opt("tabletop","桌游 / 现场","Tabletop / live"),opt("hybrid","跨媒介混合","Cross-media hybrid")]},
 {id:"avoidGenres",type:"textarea",zh:"有哪些类型你不想做？为什么？",en:"What kinds would you rather not make, and why?"},
 {id:"likedConcepts",type:"textarea",required:true,zh:"你喜欢怎样的 concept、主题或体验？",en:"What concepts, themes, or experiences attract you?"},
 {id:"dislikedConcepts",type:"textarea",zh:"你讨厌或反感怎样的 concept？",en:"What concepts do you dislike or resist?"},
 {id:"viewpoint",type:"textarea",zh:"你希望作品表达、追问或倡导什么观点？",en:"What should the work express, question, or advocate?"},
 {id:"mediaPreferences",type:"multi",zh:"你偏好哪些媒介？",en:"Which media do you gravitate toward?",options:[opt("film","电影 / 影像","Film / moving image"),opt("music","音乐 / 声音","Music / sound"),opt("literature","文学 / 写作","Literature / writing"),opt("visualart","绘画 / 摄影 / 视觉艺术","Painting / photography / visual art"),opt("performance","表演 / 舞蹈 / 剧场","Performance / dance / theatre"),opt("architecture","建筑 / 空间","Architecture / spatial practice"),opt("internet","互联网 / 社交媒体","Internet / social media"),opt("craft","手工 / 实体材料","Craft / physical materials")]},
 {id:"mediaToGame",type:"textarea",zh:"你想把什么媒介、方法或经验带进游戏？",en:"What medium, method, or experience would you bring into the game?"},
 {id:"references",type:"textarea",zh:"有没有想模仿、借鉴或反向学习的游戏、作品或风格？",en:"Any games, works, or styles you want to borrow from—or push against?"},
 {id:"redLines",type:"textarea",required:true,zh:"你绝对不想做、也不想在作品中看到什么？",en:"What do you absolutely not want to make or see in the work?"},
 {id:"gameIdea",type:"textarea",zh:"如果现在就提出一个具体游戏想法，它会是什么？",en:"If you proposed one concrete game idea now, what would it be?"},
 {id:"favoritePoint",type:"textarea",required:true,zh:"这个项目最吸引你的点是什么？",en:"What attracts you most to this project?"},
 {id:"concerns",type:"textarea",required:true,zh:"你最大的顾虑是什么？",en:"What is your biggest concern?"},
 {id:"wantToDo",type:"textarea",zh:"你最想在项目里做什么？",en:"What do you most want to do in the project?"},
 {id:"wantToGain",type:"textarea",zh:"你希望从项目中收获什么？",en:"What do you hope to gain from the project?"},
 {id:"planningLevel",type:"single",required:true,zh:"你希望怎样参与策划？",en:"How would you like to participate in planning?",options:[opt("deep","深度策划","Deep planning"),opt("basic","基础策划 + 测试反馈","Basic planning + playtest feedback")]},
 {id:"planningDetail",type:"textarea",zh:"你愿意承担哪些策划工作或投入多少时间？",en:"What planning work or time commitment feels realistic?",showWhen:{id:"planningLevel",includes:"deep"}},
 {id:"creativeRoles",type:"multi",zh:"你愿意参与哪些美术 / 视觉 / 声音实现？",en:"Which art / visual / sound implementation areas interest you?",options:[opt("visual","视觉设计 / 插画","Visual design / illustration"),opt("3d","3D / 动画","3D / animation"),opt("ui","UI / 动效","UI / motion"),opt("sound","声音 / 音乐","Sound / music"),opt("writing","写作 / 文本实现","Writing / text production"),opt("photo","摄影 / 影像","Photography / video"),opt("none","暂不参与实现","Not at this stage")]},
 {id:"technicalRoles",type:"multi",zh:"你愿意参与哪些技术实现？",en:"Which technical implementation areas interest you?",options:[opt("gameplay","玩法程序","Gameplay programming"),opt("web","网页 / 互动技术","Web / interaction"),opt("tools","工具 / 流程","Tools / pipeline"),opt("data","数据 / 研究技术","Data / research tech"),opt("hardware","硬件 / 装置","Hardware / installation"),opt("none","暂不参与技术","Not at this stage")]},
 {id:"participation",type:"single",required:true,zh:"你预计的整体参与度？",en:"What overall participation level do you expect?",options:[opt("core","核心投入（持续参与）","Core commitment (ongoing)"),opt("regular","稳定参与（按阶段投入）","Regular (phase-based)"),opt("occasional","轻量参与（反馈 / 单次任务）","Occasional (feedback / one-off tasks)")]},
];
