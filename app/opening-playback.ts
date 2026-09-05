type OpeningCallbacks={onStart:()=>void;onEnd:()=>void};
type OpeningClock={now:()=>number;every:(callback:()=>void,delay:number)=>number;clear:(id:number)=>void};

/** Readiness is not playback: only a real frame advance starts the intro. */
export function mountOpeningPlayback(media:HTMLVideoElement,callbacks:OpeningCallbacks,clock:OpeningClock={
 now:()=>Date.now(),every:(callback,delay)=>window.setInterval(callback,delay),clear:id=>window.clearInterval(id),
}){
 let disposed=false,finished=false,started=false,lastTime=media.currentTime,lastProgress=clock.now(),loadingSince=lastProgress;
 let visibleSince=lastProgress;
 const finish=()=>{if(disposed||finished)return;finished=true;media.pause();callbacks.onEnd()};
 const attempt=()=>{
  if(disposed||finished||media.ended||!media.paused)return;
  try{
   const playback=media.play();
   if(playback&&typeof playback.catch==="function")void playback.catch(()=>{/* A later tap or ready event may allow playback. */});
  }catch{/* The progress watchdog releases an unsupported decoder. */}
 };
 const inspect=()=>{
  if(disposed||finished)return;
  const now=clock.now();
  if(media.ownerDocument.hidden){lastProgress=now;loadingSince=now;visibleSince=now;return}
  if(media.ended){finish();return}
  if(media.currentTime>lastTime+.01||(!started&&!media.paused&&media.currentTime>0)){
   lastTime=media.currentTime;lastProgress=now;
   if(!started){started=true;callbacks.onStart()}
  }
  if((!started&&now-loadingSince>=5000)||(started&&now-lastProgress>=3000)||now-visibleSince>=10000)finish();
 };
 const ready=()=>{attempt();inspect()};
 const restore=()=>{if(!media.ownerDocument.hidden){lastProgress=clock.now();loadingSince=lastProgress;visibleSince=lastProgress;attempt();inspect()}};
 media.defaultMuted=true;media.muted=true;media.playsInline=true;
 media.addEventListener("loadeddata",ready);media.addEventListener("canplay",ready);
 media.addEventListener("playing",inspect);media.addEventListener("timeupdate",inspect);
 media.addEventListener("ended",finish);media.addEventListener("error",finish);
 media.ownerDocument.addEventListener("visibilitychange",restore);
 const interval=clock.every(inspect,200);
 inspect();attempt();
 return()=>{
  disposed=true;clock.clear(interval);
  media.removeEventListener("loadeddata",ready);media.removeEventListener("canplay",ready);
  media.removeEventListener("playing",inspect);media.removeEventListener("timeupdate",inspect);
  media.removeEventListener("ended",finish);media.removeEventListener("error",finish);
  media.ownerDocument.removeEventListener("visibilitychange",restore);
  media.pause();
 };
}

export async function enableOpeningSound(media:HTMLVideoElement){
 if(media.ended)return false;
 media.volume=1;media.muted=false;
 try{await media.play();return !media.muted}
 catch{
  media.muted=true;
  try{await media.play()}catch{/* The progress watchdog still releases the page. */}
  return false;
 }
}
