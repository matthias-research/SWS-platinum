import React,{useId,useState} from 'react';
import {graphicsUrl,useGraphics} from './graphics';

const choices=[{kind:'schieber',label:'Neuer Schieber…',image:'ImgSchieber',left:105,top:252},{kind:'differ',label:'Neuer Differenzler…',image:'ImgDiffer',left:272,top:297}];
export function WelcomePanel({onNew,onResume,scale}){
  useGraphics();const id=useId().replace(/:/g,''),[hover,setHover]=useState(null),[pressed,setPressed]=useState(null);
  const canResume=Boolean(localStorage.getItem('sws-game'));
  return <section className="welcome-panel" aria-label="Jass auswählen">
    <div style={{position:'relative',width:430*scale,height:432*scale}}>
      <div className="welcome-art" style={{transform:`scale(${scale})`,clipPath:`url(#${id})`}}>
        <svg width="0" height="0" aria-hidden="true"><defs><clipPath id={id} clipPathUnits="userSpaceOnUse"><rect x="14" y="1" width="350" height="430" rx="20"/><rect x="272" y="297" width="155" height="99" rx="7.5"/><polygon points="14,404 0,343 14,339"/></clipPath></defs></svg>
        <img className="welcome-background" src={graphicsUrl('panel/ImgBack.png')} alt="Stöck Wyys Stich Platinum" width="430" height="432"/>
        {choices.map(({kind,label,image,left,top})=><button key={kind} type="button" aria-label={label} style={{left,top}} onPointerEnter={()=>setHover(kind)} onPointerLeave={()=>{setHover(null);setPressed(null);}} onPointerDown={()=>setPressed(kind)} onPointerUp={()=>setPressed(null)} onFocus={()=>setHover(kind)} onBlur={()=>{setHover(null);setPressed(null);}} onClick={()=>onNew(kind)}>
          <img src={graphicsUrl(`panel/${image}${pressed===kind?'Pressed':hover===kind?'Over':''}.png`)} alt="" width="153" height="98"/>
        </button>)}
      </div>
    </div>
    {canResume&&<button className="welcome-resume" onClick={onResume}>Spiel fortsetzen</button>}
  </section>;
}
