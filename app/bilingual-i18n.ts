export type Language = "zh" | "en";

import { replaceAllText } from "./client-compat";

export const languageOptions: { value: Language; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

export const translations = {
  zh: {
    language: "语言", creatorSignIn: "创作者登录", privacy: "私密空间", participant: "参与者 #042",
    nav: { overview:"概览", tasks:"任务", survey:"问卷", links:"试玩链接", journal:"照片日志", groups:"聊天", dashboard:"创作者台" },
    landing: { eyebrow:"一个开放的艺术计划 · 2026—", titleA:"一百个人，", titleB:"共同完成一场游戏。", subtitle:"一场由一百个人共同留下痕迹的游戏创作实验。", enter:"使用邀请进入", concept:"阅读计划理念", conceptLabel:"理念", conceptA:"每个人都不需要成为“玩家”。", conceptB:"你留下的声音、规则、照片与反馈，", conceptC:"本身就是作品的一部分。", invite:"邀请编号", join:"进入参与空间", noAccount:"无需注册 · 此链接只属于你" },
    overview: { label:"参与者 / PARTICIPANT 042", welcome:"你好，参与者 #042", gentle:"今天，只做一件事也很好。", done:"已完成", active:"进行中", waiting:"等待你", next:"接下来", items:"3 项", creator:"来自创作者", note:"“没有标准答案。慢慢来，你可以随时回来继续。”" },
    tasks: { title:"为陌生人设计一条规则", intro:"想象有一个你从未见过的人，将在不知道你的情况下遇见这条规则。", prompt:"你的规则", placeholder:"写下任何长度的答案……", auto:"离开输入框时自动保存", save:"保存并继续", saved:"已自动保存" },
    cards: [ {title:"记录一个你想留住的声音",meta:"约 5 分钟 · 音频 / 文字",status:"进行中"},{title:"为陌生人设计一条规则",meta:"约 10 分钟 · 文字",status:"待开始"},{title:"上传今天的一张照片",meta:"约 3 分钟 · 图片",status:"已完成"} ],
    survey: { label:"试玩反馈", title:"刚才的体验，像什么？", scale:"我知道下一步该做什么", moment:"最想保留的一个瞬间", submit:"提交反馈" },
    links: { label:"版本库", title:"试玩链接", current:"当前版本 · V0.7", open:"打开试玩", details:"查看说明与历史反馈", history:["V0.6 · 走动测试","V0.5 · 声音原型"] },
    journal: { label:"共同档案", title:"我们如何走到这里", place:"上海 · 2026", entries:["桌上的二十七张纸","第一次公开试玩","雨天收集到的声音","第 64 位参与者"] },
    groups: { label:"仅成员可见", title:"声音聊天", people:"8 人", member:"参与者 #027", you:"你 · #042", messageA:"我把昨晚车站的环境声放进群文件了。", messageB:"听到了，最后十秒特别像潮水。", placeholder:"写到聊天……", send:"发送", lock:"聊天组、消息与文件仅对组内成员可见。" },
    upload: { add:"拖放或选择文件", detail:"照片、音频、视频、文档 · 最大 50 MB" },
    dashboard: { label:"创作者面板 / 仅限 OWNER", title:"活跃度与贡献记录", lockedTitle:"创作者空间", locked:"活跃记录与贡献分只对 Owner 开放。", signIn:"以 Owner 身份登录", recorded:"已记录参与者", events:"活跃事件", total:"贡献总分", daily:"24h 活跃", manual:"手动贡献分", manualTitle:"由 Owner 记录贡献分", points:"贡献分", reason:"记录贡献原因", record:"记录分数", success:"贡献分已记录", failure:"记录失败，请确认你已以 Owner 身份登录", person:"匿名参与者", score:"贡献分", activity:"活跃次数", recent:"最近活跃", never:"尚无", group:"＋ 建立私密小组（仅 Owner）", editor:"实时内容编辑", editorIntro:"正在编辑当前语言的公开内容。保存后约 15 秒同步给所有访问者。", eyebrow:"页首小标题", headlineA:"主标题第一行", headlineB:"主标题第二行", subtitle:"首页简介", conceptA:"理念第一行", conceptB:"理念第二行", conceptC:"理念第三行", creatorNote:"创作者留言", copyrightLabel:"版权文字", saveContent:"保存并立即更新", saving:"正在保存…", contentSaved:"已保存，公开页面正在同步", contentFailed:"保存失败，请确认你已以 Owner 身份登录" },
    copyright:"© 2026 HuieChen. 版权所有。",
  },
  en: {
    language:"Language", creatorSignIn:"Creator sign in", privacy:"Private space", participant:"Participant #042",
    nav:{overview:"Overview",tasks:"Tasks",survey:"Survey",links:"Game links",journal:"Photo journal",groups:"Chat",dashboard:"Creator desk"},
    landing:{eyebrow:"AN OPEN ART PROJECT · 2026—",titleA:"One hundred people,",titleB:"making one game together.",subtitle:"A game-making experiment shaped by the traces of one hundred people.",enter:"Enter with invitation",concept:"Read the concept",conceptLabel:"CONCEPT",conceptA:"No one needs to become a “player.”",conceptB:"The sounds, rules, photographs and feedback you leave",conceptC:"are already part of the work.",invite:"Invitation code",join:"Enter participant space",noAccount:"No account required · This invitation belongs to you"},
    overview:{label:"PARTICIPANT 042",welcome:"Hello, Participant #042",gentle:"One thing today is enough.",done:"Completed",active:"In progress",waiting:"Waiting",next:"Up next",items:"3 ITEMS",creator:"FROM THE CREATOR",note:"“There is no standard answer. Take your time—you can always return.”"},
    tasks:{title:"Design a rule for a stranger",intro:"Imagine someone you have never met encountering this rule without knowing anything about you.",prompt:"Your rule",placeholder:"Write an answer of any length…",auto:"Autosaves when you leave the field",save:"Save and continue",saved:"Autosaved"},
    cards:[{title:"Record a sound you want to keep",meta:"About 5 min · Audio / text",status:"In progress"},{title:"Design a rule for a stranger",meta:"About 10 min · Text",status:"Not started"},{title:"Upload one photo from today",meta:"About 3 min · Image",status:"Completed"}],
    survey:{label:"PLAYTEST FEEDBACK",title:"What did that experience feel like?",scale:"I knew what to do next",moment:"One moment you most want to keep",submit:"Submit feedback"},
    links:{label:"BUILD LIBRARY",title:"Game links",current:"Current build · V0.7",open:"Open build",details:"View notes and feedback history",history:["V0.6 · Walking test","V0.5 · Sound prototype"]},
    journal:{label:"SHARED ARCHIVE",title:"How we arrived here",place:"Shanghai · 2026",entries:["Twenty-seven papers on a table","The first public playtest","Sounds gathered on a rainy day","Participant number 64"]},
    groups:{label:"MEMBERS ONLY",title:"Sound chat",people:"8 people",member:"Participant #027",you:"You · #042",messageA:"I added last night’s station ambience to the group files.",messageB:"I heard it—the last ten seconds feel like a tide.",placeholder:"Write to the chat…",send:"Send",lock:"Chat groups, messages, and files are visible only to their members."},
    upload:{add:"Drop or choose files",detail:"Photos, audio, video and documents · Up to 50 MB"},
    dashboard:{label:"CREATOR DASHBOARD / OWNER ONLY",title:"Activity & contribution records",lockedTitle:"Creator space",locked:"Activity records and contribution scores are available only to the Owner.",signIn:"Sign in as Owner",recorded:"Participants recorded",events:"Activity events",total:"Contribution total",daily:"Active in 24h",manual:"MANUAL CONTRIBUTION SCORE",manualTitle:"Recorded by the Owner",points:"Points",reason:"Reason for this contribution",record:"Record score",success:"Contribution score recorded",failure:"Could not record. Confirm that you are signed in as Owner.",person:"Anonymous participant",score:"Score",activity:"Activity",recent:"Last active",never:"No activity yet",group:"＋ Create private group (Owner only)",editor:"Live content editor",editorIntro:"You are editing public content in the current language. Changes sync to every visitor in about 15 seconds.",eyebrow:"Header eyebrow",headlineA:"Headline, line one",headlineB:"Headline, line two",subtitle:"Homepage introduction",conceptA:"Concept, line one",conceptB:"Concept, line two",conceptC:"Concept, line three",creatorNote:"Creator note",copyrightLabel:"Copyright text",saveContent:"Save and update now",saving:"Saving…",contentSaved:"Saved. The public page is syncing now.",contentFailed:"Could not save. Confirm that you are signed in as Owner."},
    copyright:"© 2026 HuieChen. All rights reserved.",
  },
} as const;

export type Translation = (typeof translations)[Language];

export function applyTranslationOverrides(base: Translation, values: Record<string, string>): Translation {
  const copy = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;
  const landing = copy.landing as Record<string, unknown>;
  const overview = copy.overview as Record<string, unknown>;
  for (const [path, value] of Object.entries(values)) {
    const [section, key] = path.split(".");
    if (section === "landing" && key && key in landing) landing[key] = value;
    if (section === "overview" && key === "note") overview.note = value;
    if (path === "copyright") copy.copyright = replaceAllText(value, "Huie Chen", "HuieChen");
  }
  return copy as unknown as Translation;
}
