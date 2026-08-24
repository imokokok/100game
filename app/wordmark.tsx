export function Wordmark({stacked=false}:{stacked?:boolean}){
  if(stacked)return <span className="wordmark wordmarkStacked"><span>WHAT</span><strong>100</strong><span className="wordmarkPhrase"><strong>PEOPLE</strong><span> DO TO A </span><strong>GAME</strong></span></span>;
  return <span className="wordmark wordmarkInline"><span>WHAT </span><strong>100 PEOPLE</strong><span> DO TO A </span><strong>GAME</strong></span>;
}
