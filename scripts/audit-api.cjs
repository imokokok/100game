const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript');
const root=path.resolve(__dirname,'..'),cache=new Map(),writes=[];
function load(relative){
 const filename=path.resolve(root,relative);
 if(cache.has(filename))return cache.get(filename);
 const module={exports:{}};cache.set(filename,module.exports);
 const code=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 function imported(id){
  if(id==='next/server')return {NextResponse:{json:(body,options={})=>({status:options.status||200,body})}};
  if(id==='../_shared')return {d1:()=>({prepare:()=>({bind:(...values)=>({run:async()=>writes.push(values)})})})};
  return load(path.relative(root,path.resolve(path.dirname(filename),id+'.ts')));
 }
 vm.runInNewContext(code,{module,exports:module.exports,require:imported,crypto:require('node:crypto').webcrypto,console},{filename});
 cache.set(filename,module.exports);return module.exports;
}
(async()=>{
 const {POST}=load('app/api/questionnaire/route.ts');
 const {questions}=load('app/survey/questions.ts');
 const {restoreDraft}=load('app/survey/validation.ts');
 const call=body=>POST({json:async()=>body});
 const answers={};
 for(const q of questions.filter(q=>q.required))answers[q.id]=q.type==='multi'?[q.options[0].value]:q.type==='single'?q.options[0].value:'test answer';
 answers.wechatName='  Local QA  ';
 assert.equal((await call({answers})).status,200);
 assert.equal(writes[0][1],'Local QA');
 const npc={wechatName:'Local QA',npcName:'Resident A',npcRole:['resident']};
 assert.equal((await call({surveyType:'npc-design',answers:npc})).status,200);
 assert.equal(JSON.parse(writes[1][3])._surveyType,'npc-design');
 const rejected=[
  {answers:{wechatName:'QA'}},
  {surveyType:'npc-design',answers:{...npc,npcRole:[]}},
  {surveyType:'npc-design',answers:{...npc,npcName:'T B D'}},
  {surveyType:'npc-design',answers:{...npc,npcName:'n/a'}},
  {surveyType:'npc-design',answers:{...npc,wechatName:'x'.repeat(41)}},
  {surveyType:'npc-design',answers:{...npc,wechatName:{name:'invalid'}}},
  {surveyType:'npc-design',answers:{...npc,npcRole:['invalid']}},
  {surveyType:'npc-design',answers:{...npc,routine:[]}},
  {surveyType:'unknown',answers},
  null,
 ];
 for(const body of rejected)assert.equal((await call(body)).status,400);
 assert.equal(writes.length,2,'invalid requests must never write');
 assert.equal((await POST({json:async()=>{throw Error('bad json')}})).status,400);
 const restored=restoreDraft(JSON.stringify({answers:{wechatName:{bad:true},likedGenres:['invalid','narrative']},currentSection:1.9}),questions,5);
 assert.equal(restored.currentSection,1);
 assert.equal(restored.answers.wechatName,undefined);
 assert.equal(restored.answers.likedGenres.join(','),'narrative');
 console.log('PASS: both complete surveys save; 10 invalid payload cases rejected without writes; malformed draft sanitized.');
})().catch(error=>{console.error(error);process.exitCode=1});
