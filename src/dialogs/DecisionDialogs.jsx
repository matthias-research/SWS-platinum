import {useGraphics,bitmapContext,graphicsUrl} from '../graphics';
import React,{useEffect,useRef,useState} from 'react';
import {DialogFrame,LegacyDialog,useDialogCatalog,looseImage,formImage} from './LegacyDialog';
import {loadCardManifest,loadCardSheet,drawCard} from '../cards';
import {trumpLabels,cardName} from '../gameDrawing';
import * as S from '../engine/SWSBase';
import {PredictionCanvas,HintArm} from './BitmapCanvas';
import {TrumpCanvas} from './TrumpCanvas';
export function DialogCards({rows,setId=1,width=254,height=118}) {
  const ref=useRef(null),graphics=useGraphics();
  useEffect(()=>{let active=true;loadCardManifest().then(m=>loadCardSheet(m,setId,1,'V')).then(sheet=>{if(!active)return;const ctx=bitmapContext(ref.current,width,height);ctx.clearRect(0,0,width,height);rows.forEach((cards,row)=>cards.forEach((id,i)=>drawCard(ctx,sheet,id,{x:i*Math.min(37,(width-75)/Math.max(1,cards.length-1)),y:row*59,width:75,height:118})));});return()=>{active=false;};},[JSON.stringify(rows),setId,width,height,graphics]);
  return <canvas ref={ref} width={width} height={height} aria-label={rows.flat().map(c=>cardName(c,setId)).join(', ')} role="img"/>;
}
const trumpRects=[[156,57,48,51],[25,56,51,59],[166,117,45,42],[19,116,44,49],[159,161,44,49],[39,161,40,51],[91,17,57,64]];
export function GameDecisionDialog({game,onClose,scale}) {
  const v=game.view,req=v.request,setId=game.sound.set;
  const {data}=useDialogCatalog(),[call,setCall]=useState(50),[pressed,setPressed]=useState(null);
  const answer=(command,fields)=>{game.answer(command,fields);onClose();};
  if(!data)return null;
  if(['cmdTrump','cmdShift'].includes(req.command)) {
    const img=looseImage(data,setId===1?'trumpd.bmp':[3,5].includes(setId)?'trumpf4.bmp':'trumpf2.bmp');
    return <DialogFrame keepHandVisible title={`${v.names[v.human]}, wählen Sie den Trumpf!`} width={225} height={235} scale={scale} onClose={onClose}>
      <div className="trump-board" style={{backgroundImage:`url(${img})`}}>
        <TrumpCanvas src={img} selected={pressed} shift={req.command!=='cmdShift'} factors={v.rules.fTrumpFactor} partner={7000+1000*(game.saved()?.options.characters?.[1]||0)} name={v.names[1]}/>
        {trumpRects.map(([x,y,w,h],i)=><button type="button" key={i} className="picture-hit" style={{left:x,top:y,width:w,height:h}} aria-label={i===6?'Schieben':trumpLabels(setId)[i+1]} disabled={game.busy||(i===6?req.command==='cmdShift':!v.rules.fTrumpFactor[i+1])} onPointerDown={()=>setPressed(i)} onPointerUp={()=>setPressed(null)} onPointerLeave={()=>setPressed(null)} onClick={()=>i===6?answer('cmdShift',{}):answer('cmdTrump',{fTrump:i+1})}/>)}
        <button type="button" className="picture-hit" style={{left:77,top:84,width:70,height:115}} aria-label="Tipp" disabled={game.busy} onClick={game.getHint}/>
        <button type="button" style={{position:'absolute',left:64,top:202,width:100,height:25}} onClick={onClose}>Abbrechen</button>
      </div>
    </DialogFrame>;
  }
  if(req.command==='cmdCall') {
    const y=206-(call<=80?call:80+44*(call-80)/77);
    return <LegacyDialog kind="differ" form="TCALLDLG" keepHandVisible title={`${v.names[v.human]} sagt an…`} onClose={onClose} scale={scale} hide={['BackGround','Gloon0','Gloon1','Gloon2','Gloon3']} values={{Edit:call}} overrides={{Edit:{Left:142,Top:31,Width:38,Height:20,'aria-label':'Ansage'}}} onChange={(n,value)=>{if(n==='Edit')setCall(Math.max(0,Math.min(157,Number(value)||0)));}} onAction={n=>n==='BitBtn1'?answer('cmdCall',{fCall:call}):onClose()} render={c=>c.name==='PaintBox'?<div className="prediction-board" style={{backgroundImage:`url(${formImage(data,'differ','TCALLDLG','BackGround')})`}}>
      <PredictionCanvas data={data} value={call}/>
      <button type="button" className="gloon-hint" aria-label="Tipp" onClick={game.getHint}/>
      <input className="prediction-slider" aria-label="Ansage-Schieber" type="range" min="0" max="124" value={206-y} onChange={e=>{const h=Number(e.target.value);setCall(Math.round(h<=80?h:80+(h-80)*77/44));}}/>
    </div>:undefined}/>;
  }
  const extra=req.command==='cmdSuit'?Math.max(0,req.data.fSuit.fCount-1)*59:0;
  if(req.command==='cmdSuit')return <LegacyDialog kind="schieber" form="TSUITDLG" height={188+extra} title={`${v.names[v.human]}, wollen Sie weisen?`} onClose={onClose} scale={scale} overrides={{Panel:{Height:134+extra},PaintBox:{Height:118+extra},CancelButton:{Top:152+extra},DontSuitButton:{Top:152+extra},SuitButton:{Top:152+extra,Caption:`${S.ValueOfSuit(v.trump,false,req.data.fSuit)} Weis`}}} onAction={n=>n==='CancelButton'?onClose():answer('cmdSuit',{accept:n==='SuitButton'})} render={c=>c.name==='PaintBox'?<DialogCards height={118+extra} setId={setId} rows={req.data.fSuit.fCalls.slice(0,req.data.fSuit.fCount).map(s=>[...s.fCards].sort((a,b)=>a-b))}/>:undefined}/>;
  if(req.command==='cmdStockings')return <LegacyDialog kind="differ" form="TSTOCKINGSDLG" onClose={onClose} scale={scale} overrides={{BtnSub:{Enabled:v.rules.fStockings===2}}} onAction={n=>answer('cmdStockings',{fStockings:n==='BtnAdd'?1:n==='BtnSub'?2:0})} render={c=>c.name==='PaintBox'?<DialogCards width={115} setId={setId} rows={[[9*(v.trump-1)+7,9*(v.trump-1)+8]]}/>:undefined}/>;
  return null;
}
export function HintDialog({game,onClose,scale}) {
  const {data}=useDialogCatalog();if(!data||!game.hint)return null;
  const hint=game.hint,kind=game.view.kind;
  const description=hint.command==='cmdCard'?cardName(hint.data.fCard,game.sound.set):hint.command==='cmdCall'?`${hint.data.fCall} Punkte`:hint.command==='cmdTrump'?trumpLabels(game.sound.set)[hint.data.fTrump]:hint.command==='cmdShift'?'Schieben':'Weisen';
  if(['cmdCard','cmdTrump','cmdShift'].includes(hint.command))return <DialogFrame title="Ratschlag" keepHandVisible width={182} height={hint.command==='cmdCard'?170:126} onClose={onClose}>
    <div style={{height:hint.command==='cmdCard'?134:90,display:'grid',placeItems:'center',fontSize:20}}>
      {hint.command==='cmdCard'?<DialogCards width={75} height={118} setId={game.sound.set} rows={[[hint.data.fCard]]}/>:hint.command==='cmdShift'?'Schieben':<img src={graphicsUrl(`dialogs/symbols/${game.sound.set}-${hint.data.fTrump}.png`)} alt={description} width={52} height={52}/>}
    </div>
    <div style={{display:'flex',justifyContent:'center',gap:8}}>
      <button type="button" style={{width:68,height:25}} disabled={game.busy} onClick={()=>{game.answer(hint.command,hint.data);onClose();}}>OK</button>
      <button type="button" style={{width:88,height:25}} onClick={onClose}>Abbrechen</button>
    </div>
  </DialogFrame>;
  return <LegacyDialog kind={kind} form="THINTDLG" keepHandVisible onClose={onClose} scale={scale} hide={['BackG','Arm','ArmM','CallBox']} onAction={name=>{if(name==='Button1')game.answer(hint.command,hint.command==='cmdSuit'?{accept:true}:hint.data);onClose();}}>
    <div className="hint-picture" style={{backgroundImage:`url(${formImage(data,kind,'THINTDLG','BackG')})`}}>
      <div style={{position:'absolute',left:66,top:21,width:96,height:60,backgroundImage:`url(${formImage(data,kind,'THINTDLG','CallBox')})`,display:'grid',placeItems:'center'}}>{description}</div>
      <HintArm data={data} kind={kind}/>
    </div>
  </LegacyDialog>;
}
