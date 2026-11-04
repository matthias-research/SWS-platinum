import React,{useEffect,useRef,useState} from 'react';
import {LegacyDialog} from './LegacyDialog';
import {loadCardManifest,loadCardSheet,drawCard} from '../cards';

function ReplayTable({view,setId,rotation}){
  const ref=useRef(null);
  useEffect(()=>{let live=true;loadCardManifest().then(m=>Promise.all(['V','H'].map(o=>loadCardSheet(m,setId,1,o)))).then(([V,H])=>{
    if(!live)return;const ctx=ref.current.getContext('2d');ctx.fillStyle='#08782d';ctx.fillRect(0,0,545,329);ctx.font='12px Arial';ctx.fillStyle='white';
    for(let p=1;p<=view.count;p++){
      const seat=(p-1+rotation)%4+1,horizontal=seat%2===0,hand=view.allHands[p];
      const x=seat===2?5:seat===4?422:142,y=seat===1?4:seat===3?207:80;
      hand.forEach((card,i)=>drawCard(ctx,horizontal?H:V,card,{x:x+(horizontal?0:i*18),y:y+(horizontal?i*13:0),width:horizontal?118:75,height:horizontal?75:118}));
      ctx.fillText(view.names[p],seat===4?430:x,seat===1?136:seat===3?202:74);
      const card=view.trick.fPlayed[p];if(card)drawCard(ctx,horizontal?H:V,card,{x:seat===2?165:seat===4?273:235,y:seat===1?88:seat===3?136:125,width:horizontal?118:75,height:horizontal?75:118});
    }
  });return()=>{live=false;};},[view,setId,rotation]);
  return <canvas ref={ref} width={545} height={329} role="img" aria-label="Archiv-Spieltisch mit allen Händen"/>;
}
export function ReplayDialog({replay:r,setId,onClose,scale}){
  const [playing,setPlaying]=useState(false),[rotation,setRotation]=useState(0);
  const max=r.game.rounds[r.round].plays.length;
  useEffect(()=>{if(!playing)return;if(r.step>=max){setPlaying(false);return;}const timer=setTimeout(()=>r.setStep(r.step+1),650);return()=>clearTimeout(timer);},[playing,r.step,max]);
  const actions={rrButton:()=>r.setStep(0),rButton:()=>r.setStep(Math.max(0,r.step-1)),fButton:()=>r.setStep(Math.min(max,r.step+1)),ffButton:()=>r.setStep(max),autoButton:()=>setPlaying(true),stopButton:()=>setPlaying(false),turnButton:()=>setRotation(n=>(n+1)%4)};
  const labels={rrButton:'Anfang',rButton:'Zurück',fButton:'Weiter',ffButton:'Ende',autoButton:'Abspielen',stopButton:'Stopp',turnButton:'Tisch drehen'};
  return <LegacyDialog kind={r.game.kind} form="TREPFORM" width={585} height={425} title={`Archiv · ${r.game.title}`} scale={scale} onClose={onClose} values={{rndL1:r.round+1,rndL2:r.game.rounds.length,ptsL1:`Nord & Süd: ${r.view.scores[1]}`,ptsL2:`West & Ost: ${r.view.scores[2]}`,ComboBox:String(r.round+1)}} overrides={{...Object.fromEntries(Object.entries(labels).map(([name,label])=>[name,{'aria-label':label}])),ComboBox:{Style:'csDropDownList','aria-label':'Archiv-Runde','Items.Strings':r.game.rounds.map((_,i)=>String(i+1))}}} onChange={(n,v)=>{r.setRound(Number(v)-1);r.setStep(0);setPlaying(false);}} onAction={n=>actions[n]?.()} render={c=>c.name==='tableBox'?<ReplayTable view={r.view} setId={setId} rotation={rotation}/>:undefined}/>;
}
