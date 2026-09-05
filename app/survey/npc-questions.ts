import type {Question} from "./questions";

const opt=(value:string,zh:string,en:string)=>({value,zh,en});

export const npcQuestions:Question[]=[
 {id:"wechatName",type:"text",required:true,zh:"你的微信群昵称是？",en:"What is your WeChat group nickname?",placeholderZh:"用于确认提交人",placeholderEn:"Used to identify your response"},
 {id:"npcName",type:"text",required:true,zh:"你想让这个 NPC 叫什么？",en:"What would you like this NPC to be called?",placeholderZh:"请直接填写一个确定的名字",placeholderEn:"Enter one definite name",placeholderValues:["待定","不知道","没想好","暂定","tbd","n/a","na"]},
 {id:"routine",type:"textarea",zh:"你平时大概几点起床、几点睡？一天里有没有固定会去的地方和时间？",en:"What time do you usually wake up and sleep? Are there places you go at regular times?",placeholderZh:"例如：17:30 去篮球场、晚上 9 点遛狗；没有可写“没有”",placeholderEn:"For example: basketball at 17:30, walking the dog at 9pm. Write “none” if not applicable."},
 {id:"favouritePlace",type:"textarea",zh:"你最喜欢待在哪里？平时最常做什么？",en:"Where do you most like to be, and what do you do most often?",placeholderZh:"可以写兴趣，也可以写很具体的事",placeholderEn:"An interest or a very specific everyday activity is welcome."},
 {id:"quirk",type:"textarea",zh:"你有没有什么自己觉得正常，但别人会觉得有点奇怪的习惯？",en:"Do you have a habit that feels normal to you but a little unusual to others?"},
 {id:"firstImpression",type:"textarea",zh:"别人第一次见你通常会觉得你是什么样的人？熟了以后会发现什么不一样？",en:"What do people usually think you are like at first, and what changes once they know you?"},
 {id:"catchphrase",type:"textarea",zh:"你最常说的口头禅、语气词或者一句废话是什么？",en:"What phrase, filler, or throwaway line do you say most often?"},
 {id:"conversation",type:"textarea",zh:"如果你在游戏里是一个可以聊天的 NPC，你想是什么样的？平时会和玩家聊什么？",en:"If you were a chatty NPC in the game, what would you be like and what would you talk about?"},
 {id:"interaction",type:"textarea",zh:"如果你有一个小互动或者小游戏，你最想让玩家和你一起干什么？",en:"If you had a small interaction or mini-game, what would you most want to do with the player?",placeholderZh:"例如下棋、钓鱼、做饭；没有可写“没有”",placeholderEn:"For example chess, fishing, cooking. Write “none” if not applicable."},
 {id:"npcRole",type:"multi",required:true,zh:"如果把你放进游戏里，你更想是哪种 NPC？",en:"If you were placed in the game, what kind of NPC would you prefer to be?",options:[
  opt("resident","普通居民","Everyday resident"),opt("chat","可以反复聊天的人","Someone players can talk to repeatedly"),opt("schedule","有固定日程的人","Someone with a regular schedule"),opt("minigame","有小游戏的人","Someone with a mini-game"),opt("quest","会给玩家任务的人","Someone who gives players tasks"),opt("shop","开店或提供某种功能的人","A shopkeeper or service provider"),opt("story","有一点自己的小剧情","Someone with a small personal story"),opt("passerby","偶尔出现一下的路人","An occasional passer-by"),opt("any","都可以，看最后怎么安排","Anything works; decide in the final arrangement")
 ]},
];

export const npcSections={
 wechatName:{n:"01",zh:"确认身份",en:"Identify your response",noteZh:"昵称与 NPC 名字",noteEn:"Your nickname and NPC name"},
 routine:{n:"02",zh:"日常与习惯",en:"Routine & habits",noteZh:"时间、地点和生活里的小细节",noteEn:"Times, places, and small everyday details"},
 firstImpression:{n:"03",zh:"说话与相处",en:"Voice & company",noteZh:"第一印象、口头禅和聊天方式",noteEn:"First impressions, phrases, and conversation"},
 interaction:{n:"04",zh:"游戏里的你",en:"You in the game",noteZh:"互动方式与角色类型",noteEn:"Interactions and NPC role"},
};

export const npcGroups=[["wechatName","npcName"],["routine","favouritePlace","quirk"],["firstImpression","catchphrase","conversation"],["interaction","npcRole"]];
export const npcSectionStarts=["wechatName","routine","firstImpression","interaction"];
