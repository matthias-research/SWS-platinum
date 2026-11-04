import {graphicsUrl} from './graphics';
import React from 'react';
import {BASE_TABLE,pointsRect} from './tableGeometry';

// Table.DefaultFloaters / PictureRect for the 768x528 one-player table.
// prFloater (123): original/Differ/JassBmps.pas, rectangle 384,351,78,45.
export function DifferPoints({view,scale,size=BASE_TABLE}){
  if(view.kind!=='differ'||!view.collected)return null;
  return <div className="differ-points" style={{transform:`scale(${scale})`}} role="group" aria-label="Ansagen und gesammelte Punkte">
    {Array.from({length:view.count},(_,i)=>i+1).map(p=>{
      const call=view.calls?.[p]>=0?view.calls[p]:'?',made=view.collected[p],bonus=view.bonuses?.[p]||0;
      return <div key={p} className="points-plate" style={{...pointsRect(p,size),backgroundSize:'510px 603px',backgroundImage:`url(${graphicsUrl('differ-pieces.bmp')})`}} role="img" aria-label={`${view.names[p]}: angesagt ${call==='?'?'verdeckt':call}, gesammelt ${made}${bonus>0?`, Bonus ${bonus}`:''}`} data-player={p} data-call={call} data-collected={made}>
        <span className="points-plate-name">{view.names[p]}</span>
        <span className="points-plate-value">{call}:{made}{bonus>0&&<small>−{bonus}</small>}</span>
      </div>;
    })}
  </div>;
}
