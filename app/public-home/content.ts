export type EditorialLang="zh"|"en";

const zh={
 ui:{
  language:"语言",project:"项目",about:"理念",process:"过程",stories:"故事",survey:"参与者问卷",creator:"创作入口",
  pending:"待录入",projectEyebrow:"THE PROJECTS",projectEmpty:"成品内容将在这里发布。",processEyebrow:"PHOTOJOURNAL",processEmpty:"项目过程与 Photojournal 内容将在整理后发布。",
  creatorKicker:"CREATOR ACCESS · 创作协作区",creatorTitle:"进入创作协作区",
  creatorIntro:"项目成员与主策划从这里进入。参与者请填写微信群聊名及邀请码。",
  name:"微信群聊名",namePlaceholder:"填写你的微信群聊名",code:"邀请码",codePlaceholder:"填写邀请码",
  enter:"验证并进入",entering:"正在进入…",close:"关闭",required:"请填写微信群聊名。",
  soundOff:"点按开启声音",soundOn:"声音已开启",
  error:"邀请码无效、已过期，或当前网络暂时不可用。",footer:"一百个人怎么做游戏 · 共同创作项目",
 },
 hero:{
  eyebrow:"AN INDEPENDENT COLLECTIVE GAME PROJECT",titleLabel:"WHAT 100 PEOPLE DO TO A GAME",
  lineOne:"WHAT",lineTwoPrefix:"100",lineTwoSuffix:"PEOPLE",lineThreePrefix:"DO TO A",lineThreeAccent:"GAME",
  subtitle:"一百个人，做一件不普通的事。",note:"DIFFERENT PEOPLE. A WIDER TOMORROW.",
 },
 question:{
  eyebrow:"A QUESTION",title:"游戏是什么？",
  statements:["是选择。","是规则。","是限制。","是可能性。"],
  body:["它可以是一段记忆，一段关系，一种日常经验，也可以是一个社会议题、一个问题或一种行动。","只要有人被邀请进入选择与体验，很多东西都可以成为游戏。"],
  margin:["A MEMORY","A RELATIONSHIP","A SOCIAL ISSUE","A DAILY LIFE","ANYTHING"],
 },
 why:{
  eyebrow:"WHY 100",title:"为什么是\n100个人？",
  body:"一个人当然可以设计一个游戏。但这个项目想观察的是：当没有任何一个人完全拥有一个作品，当不同背景、经验、能力、媒介和观点的人持续介入，同一个游戏最后会变成什么？",
  counts:["100 BACKGROUNDS","100 WAYS OF UNDERSTANDING","100 DISAGREEMENTS","100 INTERVENTIONS","100 POSSIBILITIES","→ ONE GAME"],
 },
 process:{
  eyebrow:"THE PROCESS",title:"我们如何\n一起做一个游戏？",
  steps:[
   {number:"01",title:"提出",body:"每个人带着自己的想法、问题、经验、兴趣和想表达的东西进入项目。"},
   {number:"02",title:"碰撞",body:"不同的观点、经验、媒介和背景开始互相影响。"},
   {number:"03",title:"创作",body:"策划、美术、程序、音乐、写作、研究与测试逐渐进入同一个作品。"},
   {number:"04",title:"改变",body:"作品不断被其他人理解、修改、继承、否定和重构。"},
   {number:"05",title:"成为",body:"最终留下的游戏，是所有介入共同作用之后形成的作品。"},
  ],
  aside:"A PROCESS\nTHAT\nBELONGS\nTO\nEVERYONE.",
 },
 world:{eyebrow:"THE GAME",title:"我们正在\n构建的世界"},
 people:{
  eyebrow:"THE PEOPLE",title:"来自100个\n真实的人",
  body:["参与者来自不同年龄、地区、职业、学习背景和创作经验。有人熟悉游戏制作，也有人第一次接触游戏创作。","有人擅长美术，有人写作、程序、音乐或研究，也有人只是带着一个问题来到这里。重点不是谁更专业，而是这些不同的人，正在共同进入同一个作品。"],
  imageAlt:"不同参与者的手、笔记与创作材料组成的黑白纸张拼贴",
 },
 inspiration:{
  eyebrow:"STORIES",title:"希望这个项目\n能激励你——",
  body:["创作不一定要从“我已经会了”开始。一个问题，一段经历，一个很小的念头，或一个暂时不知道如何实现的想法，都可以成为开始。","愿你相信自己的感受值得被表达，也愿意去试、去做、去犯错，把一个原本只存在于脑海里的东西，慢慢变成可以被别人看见、听见、玩到或感受到的东西。"],
 },
 closing:{
  eyebrow:"A WIDER TOMORROW",title:"不同的你\n共同的好奇\n更大的可能",
  body:"游戏只是一个开始。带着自己的经验、问题、想象和感受，继续去创造、去表达、去尝试。",
  aside:"SAME GAME\nA BRIGHTER\nTOMORROW.",
 },
};

const en={
 ui:{
  language:"Language",project:"Projects",about:"Concept",process:"Process",stories:"Stories",survey:"Participant questionnaire",creator:"Creator access",
  pending:"Coming soon",projectEyebrow:"THE PROJECTS",projectEmpty:"Finished works will be published here.",processEyebrow:"PHOTOJOURNAL",processEmpty:"Project process and Photojournal entries will appear here after editing.",
  creatorKicker:"CREATOR ACCESS",creatorTitle:"Enter the collaboration space",
  creatorIntro:"Project members and the Lead Designer enter here. Participants should provide their WeChat group name and invitation code.",
  name:"WeChat group name",namePlaceholder:"Your WeChat group name",code:"Invitation code",codePlaceholder:"Enter invitation code",
  enter:"Verify and enter",entering:"Entering…",close:"Close",required:"Please provide your WeChat group name.",
  soundOff:"Tap for sound",soundOn:"Sound on",
  error:"The invitation is invalid, expired, or the network is temporarily unavailable.",footer:"WHAT 100 PEOPLE DO TO A GAME · COLLECTIVE PROJECT",
 },
 hero:{
  eyebrow:"AN INDEPENDENT COLLECTIVE GAME PROJECT",titleLabel:"WHAT 100 PEOPLE DO TO A GAME",
  lineOne:"WHAT",lineTwoPrefix:"100",lineTwoSuffix:"PEOPLE",lineThreePrefix:"DO TO A",lineThreeAccent:"GAME",
  subtitle:"One hundred people making something uncommon.",note:"DIFFERENT PEOPLE. A WIDER TOMORROW.",
 },
 question:{
  eyebrow:"A QUESTION",title:"What is a game?",
  statements:["A choice.","A rule.","A limit.","A possibility."],
  body:["It may be a memory, a relationship, an everyday experience, a social issue, a question, or an action.","When someone is invited to choose and experience, many things can become a game."],
  margin:["A MEMORY","A RELATIONSHIP","A SOCIAL ISSUE","A DAILY LIFE","ANYTHING"],
 },
 why:{
  eyebrow:"WHY 100",title:"Why one\nhundred people?",
  body:"One person can certainly design a game. This project asks what happens when no one completely owns a work, and different backgrounds, experiences, abilities, media and viewpoints keep entering the same game.",
  counts:["100 BACKGROUNDS","100 WAYS OF UNDERSTANDING","100 DISAGREEMENTS","100 INTERVENTIONS","100 POSSIBILITIES","→ ONE GAME"],
 },
 process:{
  eyebrow:"THE PROCESS",title:"How do we make\none game together?",
  steps:[
   {number:"01",title:"Propose",body:"Each person enters with an idea, question, experience, interest, or something they want to express."},
   {number:"02",title:"Collide",body:"Different viewpoints, experiences, media and backgrounds begin to affect one another."},
   {number:"03",title:"Create",body:"Planning, art, code, music, writing, research and testing gradually enter one shared work."},
   {number:"04",title:"Change",body:"The work is interpreted, revised, inherited, rejected and reconstructed by others."},
   {number:"05",title:"Become",body:"The final game is what remains after every intervention has acted upon it."},
  ],
  aside:"A PROCESS\nTHAT\nBELONGS\nTO\nEVERYONE.",
 },
 world:{eyebrow:"THE GAME",title:"The world\nwe are building"},
 people:{
  eyebrow:"THE PEOPLE",title:"One hundred\nreal people",
  body:["Participants come from different ages, regions, professions, studies and creative experiences. Some know game production; others are meeting it for the first time.","Some make art, write, code, compose or research. Others arrive with a question. The point is not who is more professional, but that different people are entering the same work together."],
  imageAlt:"Black-and-white paper collage of participants' hands, notes and creative materials",
 },
 inspiration:{
  eyebrow:"STORIES",title:"May this project\ninspire you—",
  body:["Creating does not have to begin with “I already know how.” A question, an experience, a small thought, or an idea whose form is still unknown can all become a beginning.","Trust that your feelings deserve expression. Try, make, make mistakes, and slowly turn what once existed only in your mind into something another person can see, hear, play or feel."],
 },
 closing:{
  eyebrow:"A WIDER TOMORROW",title:"Different people\nShared curiosity\nGreater possibility",
  body:"A game is only a beginning. Carry your experience, questions, imagination and feelings forward—keep creating, expressing and trying.",
  aside:"SAME GAME\nA BRIGHTER\nTOMORROW.",
 },
};

export const editorialContent={zh,en} as const;
