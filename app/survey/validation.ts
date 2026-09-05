import type {Lang,Question} from "./questions";

export type Answers=Record<string,string|string[]>;
export function isRecord(value:unknown):value is Record<string,unknown>{
 return value!==null&&typeof value==="object"&&!Array.isArray(value);
}
export function questionVisible(q:Question,answers:Record<string,unknown>){
 if(!q.showWhen)return true;
 const value=answers[q.showWhen.id];
 return Array.isArray(value)?value.includes(q.showWhen.includes):value===q.showWhen.includes;
}
export function answerError(q:Question,value:unknown,lang:Lang):string{
 const label=lang==="zh"?q.zh:q.en;
 if(value===undefined)return q.required?(lang==="zh"?"请完成："+label:"Please complete: "+label):"";
 const validType=q.type==="multi"?Array.isArray(value)&&value.every(v=>typeof v==="string"):typeof value==="string";
 if(!validType)return lang==="zh"?"请重新填写："+label:"Please check: "+label;
 const missing=(typeof value==="string"&&!value.trim())||(Array.isArray(value)&&value.length===0);
 if(missing)return q.required?(lang==="zh"?"请完成："+label:"Please complete: "+label):"";
 const limit=q.id==="wechatName"?40:q.id==="npcName"?80:undefined;
 if(limit&&typeof value==="string"&&value.trim().length>limit)return lang==="zh"?label+"（最多 "+limit+" 个字符）":label+" (maximum "+limit+" characters)";
 if(q.options){
  const values=Array.isArray(value)?value:[value];
  if(values.some(v=>!q.options!.some(o=>o.value===v)))return lang==="zh"?"请选择有效选项："+label:"Choose a valid option: "+label;
 }
 if(q.placeholderValues&&typeof value==="string"){
  const normalize=(text:string)=>text.trim().toLowerCase().replace(/[\s，。！？、,.!?/]/g,"");
  if(!normalize(value)||q.placeholderValues.some(v=>normalize(v)===normalize(value)))return lang==="zh"?"请为 NPC 填写一个确定的名字。":"Please enter one definite name for the NPC.";
 }
 return "";
}
export function restoreDraft(raw:string,questions:Question[],groupCount:number){
 const parsed:unknown=JSON.parse(raw);
 if(!isRecord(parsed))return {answers:{} as Answers,currentSection:0};
 const source=isRecord(parsed.answers)?parsed.answers:parsed;
 const answers:Answers={};
 for(const q of questions){
  const value=source[q.id];
  if(q.type==="multi"&&Array.isArray(value))answers[q.id]=value.filter((v):v is string=>typeof v==="string"&&!!q.options?.some(o=>o.value===v));
  else if(q.type!=="multi"&&typeof value==="string"&&(!q.options||q.options.some(o=>o.value===value)))answers[q.id]=value;
 }
 const section=typeof parsed.currentSection==="number"&&Number.isFinite(parsed.currentSection)?Math.floor(parsed.currentSection):0;
 return {answers,currentSection:Math.min(Math.max(section,0),groupCount-1)};
}
