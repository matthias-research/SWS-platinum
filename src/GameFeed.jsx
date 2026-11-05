import {graphicsUrl} from './graphics';
import React,{useEffect,useRef,useState} from 'react';
import {BASE_TABLE,tableOffset} from './tableGeometry';
import {layout} from './table';
import {trumpLabels} from './gameDrawing';
import {DialogCards} from './dialogs/DecisionDialogs';

const trumpAnnouncement=(event,view)=>event.player===view.human?'Du trumpfst':`${view.names[event.player]} trumpft`;

export function eventText(event,view,setId){
  const human=event.player===view.human,name=human?'Du':view.names[event.player]||'';
  switch(event.kind){
    case 'round':return `Spiel ${event.round}`;
    case 'drawn':return `Trumpfkarte · ${trumpLabels(setId)[event.trump]}`;
    case 'trump':return `${trumpAnnouncement(event,view)} ${trumpLabels(setId)[event.trump]}`;
    case 'shift':return human?'Du schiebst':`${name} schiebt`;
    case 'call':return `${name} ${human?'sagst':'sagt'} ${event.value}`;
    case 'suit':return `${name} weist: ${event.value}`;
    case 'stockings':return `${name}: Stöck ${event.subtract?'abziehen':'dazuzählen'}`;
    case 'say':return `${name}: ${event.text}`;
    case 'result':return view.kind==='schieber'?`${view.names[1]} & ${view.names[3]} ${event.points[1]} · ${view.names[2]} & ${view.names[4]} ${event.points[2]}`:view.names.slice(1,view.count+1).map((n,i)=>`${n} ${event.points[i+1]}`).join(' · ');
    default:return '';
  }
}
function EventContent({event,view,setId}){
  const cards=event.kind==='stockings'?[[9*(event.trump-1)+7,9*(event.trump-1)+8]]:event.cards?.filter(row=>row.length);
  const icon=event.icon??(event.player===view.human?5100+((view.avatar||5208)-5200):7101+1000*(view.characters?.[event.player]||0));
  return <>
    <div className="feed-line">{event.kind==='say'&&<img className="feed-portrait" src={graphicsUrl(`setup/${icon}.png`)} alt=""/>}<span>{event.kind==='trump'?trumpAnnouncement(event,view):eventText(event,view,setId)}</span>{event.kind==='trump'&&<img className="feed-trump" src={graphicsUrl(`dialogs/symbols/${setId}-${event.trump}.png`)} alt={trumpLabels(setId)[event.trump]}/>}</div>
    {cards?.length>0&&<div className="feed-cards"><DialogCards setId={setId} width={148} height={cards.length*59} rows={cards}/></div>}
  </>;
}
const positions={1:{left:310,top:38},2:{left:203,top:144},3:{left:310,top:280},4:{left:410,top:144}};
const noMessages=[];
export function GameFeed({view,scale,setId,cardHeight=118,messages=noMessages,duration=5,size=BASE_TABLE}){
  const entries=view.feed||[],last=entries.at(-1)?.id||0;
  const seen=useRef(last),seenMessage=useRef(messages.length),scroller=useRef(null),atBottom=useRef(true);
  const initial=useRef(true);
  const [bubbles,setBubbles]=useState({});
  const dismiss=player=>{setBubbles(b=>{const next={...b};delete next[player];return next;});};
  useEffect(()=>{
    if(last<seen.current)setBubbles({});
    const fresh=entries.filter(e=>e.id>seen.current||(initial.current&&view.commentaryIds?.includes(e.id))).concat(messages.slice(seenMessage.current));seen.current=last;seenMessage.current=messages.length;initial.current=false;
    if(fresh.some(e=>e.kind==='round'))setBubbles({});
    if(duration<=0){setBubbles({});return;}
    for(const event of fresh){if(!event.player)continue;setBubbles(b=>({...b,[event.player]:{...event,shownAt:Date.now()}}));}
  },[last,messages,duration]);
  // Recreate timers after effect cleanup (including StrictMode's mount replay).
  // Absolute deadlines keep other bubbles from gaining time on each update.
  useEffect(()=>{
    const timers=Object.entries(bubbles).map(([player,event])=>setTimeout(()=>dismiss(player),Math.max(0,event.shownAt+duration*1000-Date.now())));
    return()=>timers.forEach(clearTimeout);
  },[bubbles,duration]);
  useEffect(()=>{if(atBottom.current&&scroller.current)scroller.current.scrollTop=scroller.current.scrollHeight;},[last,messages,setId,cardHeight]);
  const {log}=layout(size.width,size.height,cardHeight,size),offset=tableOffset(size);
  const feed=[...entries.map(e=>({...e,order:e.id})),...messages.map((e,i)=>({...e,order:e.after+(i+1)/1000}))].sort((a,b)=>a.order-b.order);
  return <div className="game-presentation" style={{width:size.width,height:size.height,transform:`scale(${scale})`}}>
    {!size.hideFeed&&<div ref={scroller} className="illustrated-feed" role="log" aria-label="Spielverlauf" aria-live="off" tabIndex={0} style={{left:log.x+15,top:log.y+44,width:log.width-31,height:log.height-59}} onScroll={e=>{const el=e.currentTarget;atBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<8;}}>
      {feed.map(e=><div key={`${e.kind}-${e.id}`} className={`feed-entry feed-${e.kind}`}><EventContent event={e} view={view} setId={setId}/></div>)}
    </div>}
    <div aria-live="polite" aria-label="Spieler-Sprechblasen">{Object.entries(bubbles).map(([player,event])=><div key={player} role="group" className="player-bubble" style={{left:Math.max(4,Math.min(size.width-164,positions[player].left+offset.x)),top:positions[player].top+offset.y}} aria-label={eventText(event,view,setId)}>
      <button type="button" className="bubble-dismiss" aria-label={`Sprechblase von ${view.names[player]} schliessen`} onClick={()=>dismiss(player)}><EventContent event={event} view={view} setId={setId}/></button>
    </div>)}</div>
  </div>;
}
