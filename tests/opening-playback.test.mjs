import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

const source=await readFile(new URL('../app/opening-playback.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2018}}).outputText;
const exports={};
vm.runInNewContext(compiled,{exports});
const {mountOpeningPlayback,enableOpeningSound}=exports;

function setup(overrides={}){
 const doc=new EventTarget();doc.hidden=false;
 const media=new EventTarget();
 Object.assign(media,{ownerDocument:doc,currentTime:0,paused:true,ended:false,muted:false,defaultMuted:false,playsInline:false,attempts:0,
  play(){this.attempts++;this.paused=false;return Promise.resolve()},pause(){this.paused=true},...overrides});
 let now=0,tick,starts=0,ends=0;
 const dispose=mountOpeningPlayback(media,{onStart(){starts++},onEnd(){ends++}},{now:()=>now,every(fn){tick=fn;return 1},clear(){tick=null}});
 return {media,doc,dispose,advance(ms){now+=ms;tick?.()},counts:()=>({starts,ends})};
}
test('mobile startup stays muted; readiness alone does not start the film timer',()=>{
 const h=setup();
 assert.equal(h.media.muted,true);assert.equal(h.media.playsInline,true);
 h.media.dispatchEvent(new Event('canplay'));h.advance(4000);
 assert.deepEqual(h.counts(),{starts:0,ends:0});
 h.media.currentTime=.1;h.advance(200);
 assert.deepEqual(h.counts(),{starts:1,ends:0});
 h.media.currentTime=1.4;h.advance(1600);
 assert.equal(h.counts().ends,0);h.dispose();
});
test('advancing frames recover a missing playing event and ended finishes once',()=>{
 const h=setup();h.media.currentTime=.4;h.advance(200);
 h.media.ended=true;h.media.dispatchEvent(new Event('ended'));h.advance(1000);
 assert.deepEqual(h.counts(),{starts:1,ends:1});assert.equal(h.media.paused,true);h.dispose();
});
test('already-ended server autoplay is adopted rather than replayed',()=>{
 const h=setup({ended:true,currentTime:2.2});
 assert.equal(h.counts().ends,1);assert.equal(h.media.attempts,0);h.dispose();
});
test('a rejected autoplay waits for readiness or a gesture, then exits if still blocked',()=>{
 const h=setup({play(){this.attempts++;return Promise.reject(new Error('NotAllowedError'))}});
 h.advance(1000);assert.equal(h.counts().ends,0);
 h.media.dispatchEvent(new Event('loadeddata'));assert.equal(h.media.attempts,2);
 h.advance(4000);assert.equal(h.counts().ends,1);h.dispose();
});
test('a stalled film releases the homepage and unmount removes the watchdog',()=>{
 const h=setup();h.media.currentTime=.2;h.advance(200);h.advance(2900);
 assert.equal(h.counts().ends,0);h.advance(100);assert.equal(h.counts().ends,1);
 h.dispose();h.advance(20000);assert.equal(h.counts().ends,1);
});
test('a hidden tab does not consume the startup window',()=>{
 const h=setup();h.doc.hidden=true;h.advance(30000);
 assert.equal(h.counts().ends,0);h.doc.hidden=false;h.doc.dispatchEvent(new Event('visibilitychange'));
 h.media.currentTime=.1;h.advance(200);assert.equal(h.counts().starts,1);h.dispose();
});
test('failed sound activation restores muted playback',async()=>{
 const h=setup({play(){this.attempts++;if(!this.muted)return Promise.reject(new Error('NotAllowedError'));this.paused=false;return Promise.resolve()}});
 assert.equal(await enableOpeningSound(h.media),false);assert.equal(h.media.muted,true);assert.equal(h.media.paused,false);h.dispose();
});
