import {graphicsUrl} from '../graphics';
import React,{useState} from 'react';
import {LegacyDialog,DialogFrame,useDialogCatalog,formImage,looseImage,imageUrl} from './LegacyDialog';
import * as D from '../engine/DiffBase';
import {CreditsCanvas} from './BitmapCanvas';
import differPieces from '../../public/assets/differ-pieces.json';
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
export function downloadJSON(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function ProfileDialog({kind,onClose,scale}){
  const saved=read('sws-profile',{}),selection=read('sws-setup',{});
  const [values,setValues]=useState({NickEdit:localStorage.getItem('sws-player')||'Sie',NameEdit:saved.fullName||'',MaleRadio:saved.gender!=='female',FemaleRadio:saved.gender==='female',IconScroll:(selection.avatar||5208)-5200});
  const [error,setError]=useState('');
  return <LegacyDialog kind={kind} form="TPROFILEDLG" onClose={onClose} scale={scale} values={values} overrides={{NickEdit:{'aria-label':'Übername',MaxLength:30},NameEdit:{'aria-label':'Voller Name',MaxLength:80},IconScroll:{Max:19,'aria-label':'Spielerbild'}}} onChange={(n,v)=>setValues(s=>({...s,[n]:v,...(n==='MaleRadio'?{FemaleRadio:false}:n==='FemaleRadio'?{MaleRadio:false}:{})}))} onAction={n=>{if(n==='BitBtn1'){if(!values.NickEdit.trim()){setError('Bitte einen Übernamen eingeben.');return;}localStorage.setItem('sws-player',values.NickEdit.trim());localStorage.setItem('sws-profile',JSON.stringify({fullName:values.NameEdit,gender:values.FemaleRadio?'female':'male'}));localStorage.setItem('sws-setup',JSON.stringify({...selection,characters:selection.characters||[0,0,2,0,3],strengths:selection.strengths||[0,2,2,0,2],avatar:5200+values.IconScroll}));}onClose();}} render={c=>c.name==='IconBox'?<img width="41" height="47" src={graphicsUrl(`setup/${5100+values.IconScroll}.png`)} alt="Gewähltes Spielerbild"/>:undefined}>{error&&<p role="alert" className="original-error">{error}</p>}</LegacyDialog>;
}
export function SeedDialog({kind,seed,onClose,onApply,scale}){
  const [value,setValue]=useState(String(seed||1)),[error,setError]=useState('');
  return <LegacyDialog kind={kind} form="TRNDDLG" onClose={onClose} scale={scale} values={{edit:value}} overrides={{edit:{'aria-label':'Verteilungscode'}}} onChange={(n,v)=>setValue(v)} onAction={n=>{if(n==='CancelBtn'){onClose();return;}if(n==='BitBtn2'){onApply(null);return;}const seed=Number(value);if(!Number.isInteger(seed)||seed<1||seed>2147483646){setError('Code zwischen 1 und 2147483646 eingeben.');return;}onApply(seed);}}>{error&&<p role="alert" className="original-error">{error}</p>}</LegacyDialog>;
}
export function AboutDialog({kind,onClose,scale,exit=false,onSave,onEnd}){
  const {data}=useDialogCatalog(),[portrait,setPortrait]=useState(0),[detail,setDetail]=useState(null),[face,setFace]=useState(null);
  if(!data)return null;
  return <><LegacyDialog kind={kind} form="TABOUTDLG" title={exit?'Stöck Wyys Stich beenden':'Über Stöck Wyys Stich'} onClose={onClose} scale={scale} hide={['floatMask','floatText','paintBox',...(!exit?['QuitBtn','SaveBtn']:[])]} onAction={n=>n==='SaveBtn'?onSave?.():n==='QuitBtn'?onEnd?.():onClose()}>
    <img className="original-background" src={looseImage(data,exit?'wollen0.bmp':'about0.bmp')} alt=""/>
    <img style={{position:'absolute',left:106,top:171,width:249,height:214,pointerEvents:'none'}} src={looseImage(data,`${exit?'wollen':'about'}${[1,4,6,6][portrait%4]}.bmp`)} alt=""/>
    <button className="picture-hit" style={{left:106,top:171,width:249,height:214,zIndex:1}} aria-label="Nächstes Bild" onClick={()=>setPortrait(p=>p+1)}/>
    {portrait%4===3&&<CreditsCanvas data={data} kind={kind} exit={exit}/>}
    {portrait%4<2&&[[84,116,149,128],[84,127,154,137],[150,118,216,128],[154,127,208,137],[82,73,112,118],[111,73,143,116],[144,72,178,116],[181,71,213,119]].filter((_,i)=>portrait%4===0?i<4:i>=4).flatMap(([l,t,r,b],i)=>portrait%4===0?[{l,t,r:(l+r)/2,b,n:5+2*i},{l:(l+r)/2,t,r,b,n:6+2*i}]:[{l,t,r,b,n:i+1}]).map(({l,t,r,b,n})=><button key={n} type="button" className="picture-hit" style={{left:106+l,top:171+t,width:r-l,height:b-t,zIndex:3}} aria-label={`Porträt ${n}`} onClick={()=>setFace(n)}/>)}
    {face&&<button type="button" onClick={()=>setFace(null)} aria-label="Porträt schliessen" style={{position:'absolute',left:50,top:30,zIndex:4,padding:0}}><img style={{maxWidth:340,maxHeight:360}} src={looseImage(data,`a${String(face).padStart(2,'0')}.bmp`)} alt={`Porträt ${face}`}/></button>}
    <button style={{position:'absolute',left:12,top:400,height:24,zIndex:2}} onClick={()=>setDetail('TTEAMDLG')}>Entwicklungsteam</button>
    <button style={{position:'absolute',left:178,top:400,height:24,zIndex:2}} onClick={()=>setDetail('THPDLG')}>Herausgeber</button>
    <a style={{position:'absolute',left:8,top:445,fontSize:10,zIndex:2}} href={`${import.meta.env.BASE_URL}licenses/pas2js/LICENSE`} target="_blank" rel="noreferrer">Browser-Port · pas2js Lizenz</a>
  </LegacyDialog>{detail&&<LegacyDialog kind={kind} form={detail} title={detail==='THPDLG'?'Herausgeber':'Entwicklungsteam'} scale={scale} onClose={()=>setDetail(null)}/>}</>;
}
export function ResultsDialog({game,onClose,scale}){
  const {data}=useDialogCatalog();if(!data||!game.view)return null;
  const v=game.view,kind=v.kind;
  if(kind==='differ')return <DifferRoundDialog view={v} onClose={onClose} scale={scale}/>;
  if(kind==='schieber'&&v.history.length)return <SchieberRoundDialog view={v} onClose={onClose} scale={scale}/>;
  const background=kind==='differ'?formImage(data,kind,'TROUNDDLG','BackImg'):looseImage(data,v.phase==='done'?v.winner===1?'win1.bmp':'win2.bmp':'round1.bmp');
  return <LegacyDialog kind={kind} form={kind==='differ'?'TROUNDDLG':'TINFODLG'} title={v.phase==='done'?'Jass beendet':'Spielstand'} onClose={onClose} scale={scale} render={c=>c.name==='PaintBox'?null:undefined}>
    <img className="original-background" src={background} alt=""/>
    <div className="original-result-table results"><table><caption>Rundenresultate</caption><thead><tr><th>Runde</th>{kind==='schieber'?<><th>Nord & Süd</th><th>West & Ost</th></>:v.names.slice(1,v.count+1).map((n,i)=><th key={i}>{n}<br/>Ansage / Punkte / Differenz</th>)}</tr></thead><tbody>{v.history.map((r,i)=><tr key={i}><td>{i+1}</td>{kind==='schieber'?<><td>{r.pts[1]}</td><td>{r.pts[2]}</td></>:Array.from({length:v.count},(_,j)=><td key={j}>{r.call[j+1]} / {r.made[j+1]} / {D.DeltaOf(r.call[j+1],r.made[j+1],r.bonus[j+1])}</td>)}</tr>)}</tbody></table></div>
  </LegacyDialog>;
}
function SchieberRoundDialog({view:v,onClose,scale,notice}){
  const {data}=useDialogCatalog(),[stage,setStage]=useState(notice?.type||'round');
  if(!data)return null;
  const round=v.history.at(-1),win=stage==='win',winner=v.winner,team=round.pts[1]>=round.pts[2]?1:2;
  const next=()=>{if(!notice&&!win&&v.phase==='done'&&winner)setStage('win');else onClose();};
  const portraits=win?(winner===1?[[1,357,58],[3,451,58]]:[[2,357,58],[4,451,58]]):[[2,304,152],[4,388,153],[1,304,258],[3,392,258]];
  const factor=Math.max(1,v.rules.fTrumpFactor[round.trump]);
  return <LegacyDialog kind="schieber" form="TINFODLG" title={win?'Sieg':'Ende der Runde'} onClose={next} onAction={next} scale={scale} render={c=>c.name==='PaintBox'?null:undefined}>
    <img className="original-background" src={looseImage(data,win?'win2.bmp':'round2.bmp')} alt=""/>
    {portraits.map(([p,left,top])=>{const happy=(p===1||p===3?1:2)===(win?winner:team),icon=p===v.human?(v.avatar||5208):7009+1000*(v.characters?.[p]||0)+(happy?2:0);return <img key={p} src={graphicsUrl(`setup/${icon}.png`)} alt={v.names[p]} title={v.names[p]} style={{position:'absolute',left,top,width:56,height:72}}/>;})}
    {[2,1].map((t,i)=><div key={t} role="group" aria-label={`${v.names[t===1?1:2]} & ${v.names[t===1?3:4]}`} style={{position:'absolute',left:win?367:99,top:win?180+i*80.5:135+i*90,width:win?134:155,height:win?80.5:90,fontFamily:'Arial',textAlign:'center'}}>
      {!win&&<div style={{height:45,display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:13.333}}>{factor}×(<span style={{fontSize:21.333}}>{(round.pts[t]-round.suitPts[t])/factor}</span>+{round.suitPts[t]/factor})={round.pts[t]}</div>}
      <div style={{height:win?80.5:45,display:'flex',alignItems:'center',justifyContent:'center',color:'yellow',fontSize:21.333}}>{v.scores[t]}</div>
    </div>)}
  </LegacyDialog>;
}
export function InformationDialog({notice,onClose,scale}){
  const {data}=useDialogCatalog();if(!data)return null;
  const v=notice.view,type=notice.type;
  if(type==='differ')return <DifferRoundDialog view={v} onClose={onClose} scale={scale}/>;
  if(type==='round'||type==='win')return <SchieberRoundDialog view={v} notice={notice} onClose={onClose} scale={scale}/>;
  const bp=type==='bp',round=v.history.at(-1),team=notice.team,players=team===1?[1,3]:[2,4];
  const positions=bp?[[93,161],[167,156]]:[[279,335],[360,335]];
  const scores=bp&&!['deal','done'].includes(v.phase)?v.liveScores||v.scores:v.scores;
  return <LegacyDialog kind="schieber" form="TINFODLG" title={bp?'Bergpreis':type==='match'?'Match':'Contermatch'} onClose={onClose} onAction={onClose} scale={scale} render={c=>c.name==='PaintBox'?null:undefined}>
    <img className="original-background" src={looseImage(data,`${type}2.bmp`)} alt=""/>
    {type!=='conter'&&players.map((p,i)=><img key={p} src={graphicsUrl(`setup/${p===v.human?(v.avatar||5208):7011+1000*(v.characters?.[p]||0)}.png`)} alt={v.names[p]} style={{position:'absolute',left:positions[i][0],top:positions[i][1],width:56,height:72}}/>)}
    {bp?<div style={{position:'absolute',left:319,top:153,width:88,height:122,color:'yellow',font:'21px Arial',textAlign:'center'}}>{[2,1].map(t=><div key={t} style={{height:61,display:'grid',placeItems:'center'}}>{scores[t]}</div>)}</div>:
      <div style={{position:'absolute',left:type==='match'?310:206,top:type==='match'?231:64,width:type==='match'?129:252,height:type==='match'?78:199,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',font:'29px Arial',color:'white'}}>
        <div>{round.pts[team]-round.suitPts[team]}{round.suitPts[team]>0?`+${round.suitPts[team]}`:''}</div><div style={{color:'yellow',fontSize:21,marginTop:10}}>{scores[2]}:{scores[1]}</div>
      </div>}
  </LegacyDialog>;
}
function DifferRoundDialog({view:v,onClose,scale}){
  const {data}=useDialogCatalog();if(!data)return null;
  const round=v.history.at(-1),players=Array.from({length:v.count},(_,i)=>i+1);
  const total=p=>v.history.reduce((sum,r)=>sum+D.DeltaOf(r.call[p],r.made[p],r.bonus[p]),0);
  players.sort((a,b)=>total(a)-total(b));
  const digit=(id,left,top)=>{const r=differPieces.rects[id];return <span style={{position:'absolute',left,top,width:r.width,height:r.height,backgroundImage:`url(${graphicsUrl('differ-pieces.bmp')})`,backgroundSize:'510px 603px',backgroundPosition:`-${r.x}px -${r.y}px`}}/>;};
  return <LegacyDialog kind="differ" form="TROUNDDLG" title={v.phase==='done'?'Jass beendet':'Spielstand'} onClose={onClose} scale={scale}>
    <img className="original-background" src={formImage(data,'differ','TROUNDDLG','BackImg')} alt=""/>
    {round&&<div role="table" aria-label="Rundenresultat" style={{position:'absolute',left:279,top:138,width:295,height:230,color:'white',font:'11px Arial'}}>
      {players.map((p,i)=>{const h=Math.floor(230/v.count),y=i*h+Math.floor(h/2),level=i===0?2:i===1?1:0,icon=p===v.human?5100+(v.avatar||5208)-5200:7100+1000*(v.characters?.[p]||0)+level;
        return <div role="row" key={p} aria-label={`${i+1}. ${v.names[p]}`}>
          {digit(94+i,5,y-7)}{digit(103,5+differPieces.rects[94+i].width,y-7)}
          <img src={graphicsUrl(`setup/${icon}.png`)} alt={v.names[p]} style={{position:'absolute',left:25,top:y-23,width:41,height:47}}/>
          <span role="cell" style={{position:'absolute',left:71,top:y-6,width:70,overflow:'hidden',whiteSpace:'nowrap'}}>{v.names[p]}</span>
          <span role="cell" style={{position:'absolute',left:146,top:y-6}}>{round.call[p]}:{round.made[p]}{round.bonus[p]>0?`-${round.bonus[p]}`:''}</span>
          <span role="cell" style={{position:'absolute',left:196,top:y-6}}>= {D.DeltaOf(round.call[p],round.made[p],round.bonus[p])}</span>
          <span role="cell" style={{position:'absolute',left:236,top:y-6,color:'yellow',whiteSpace:'nowrap'}}>{total(p)} ({(total(p)/v.history.length).toFixed(1)})</span>
        </div>;
      })}
    </div>}
  </LegacyDialog>;
}
export function HighScoresDialog({kind,onClose,scale}){
  const {data}=useDialogCatalog(),[filter,setFilter]=useState('Alle Spiele');if(!data)return null;
  const rows=read('sws-history',[]).filter(h=>h.kind===kind&&(filter!=='Ohne Computerhilfe'||!h.computerAssisted)).sort((a,b)=>kind==='differ'?a.scores[3]-b.scores[3]:b.scores[1]-a.scores[1]);
  return <LegacyDialog kind={kind} form="THIGHDLG" onClose={onClose} scale={scale} values={{ComboBox:filter}} overrides={{ComboBox:{Style:'csDropDownList','Items.Strings':['Alle Spiele','Ohne Computerhilfe'],'aria-label':'Bestenliste filtern'}}} onChange={(n,v)=>setFilter(v)}>
    <img className="original-background" src={formImage(data,kind,'THIGHDLG','BackgImg')||looseImage(data,'ratings.bmp')} alt=""/>
    <div className="original-result-table results"><table><caption>Bestenliste in diesem Browser</caption><thead><tr><th>Rang</th><th>Name</th><th>Punkte</th><th>Datum</th></tr></thead><tbody>{rows.map((h,i)=><tr key={h.id}><td>{i+1}</td><td>{h.names[3]}</td><td>{h.scores[kind==='differ'?3:1]}</td><td>{new Date(h.date).toLocaleDateString('de-CH')}</td></tr>)}</tbody></table>{!rows.length&&<p>Noch keine abgeschlossenen Spiele.</p>}</div>
  </LegacyDialog>;
}
function Plot({values,label}){
  const max=Math.max(1,...values.map(Math.abs)),n=Math.max(1,values.length);
  return <svg viewBox="0 0 240 150" width="100%" height="100%" role="img" aria-label={label}><path d="M 5 5 V 145 H 238" stroke="#333" fill="none"/>{values.map((v,i)=><rect key={i} x={8+i*225/n} y={140-125*Math.abs(v)/max} width={Math.max(1,220/n-1)} height={125*Math.abs(v)/max} fill={v<0?'#b12a26':'#237342'}/>)}</svg>;
}
function histogram(values,low,high,bins=24){const result=Array(bins).fill(0);for(const value of values)result[Math.max(0,Math.min(bins-1,Math.floor((value-low)/(high-low+1)*bins)))]++;return result;}
export function StatisticsDialog({kind,game,onClose,scale}){
  const {data}=useDialogCatalog(),[player,setPlayer]=useState(3);if(!data)return null;
  const completed=read('sws-history',[]).filter(h=>h.kind===kind),rounds=completed.flatMap(h=>h.rounds||[]),current=game.view?.kind===kind?game.view.history:[];
  const all=game.view?.phase==='done'?rounds:rounds.concat(current),names=game.view?.kind===kind?game.view.names:completed[0]?.names||['','Nord','West','Sie','Ost'];
  const diffs=kind==='differ'?all.map(r=>D.DeltaOf(r.call[player],r.made[player],r.bonus[player])):all.map(r=>r.pts[1]-r.pts[2]);
  const avg=values=>values.length?(values.reduce((a,b)=>a+b,0)/values.length).toFixed(1):'0';
  const def=data.forms[kind].TSTATISTICSDLG,values={};
  for(const c of def.components)if(c.className==='TLabel'&&/^[-\d.%]+$/.test(String(c.properties.Caption)))values[c.name]='—';
  Object.assign(values,{numJasses:completed.length,numRounds:all.length,diffAvg:avg(diffs),comboBox:String(player),DiffMin:diffs.length?Math.min(...diffs):0,DiffMax:diffs.length?Math.max(...diffs):0});
  if(kind==='schieber'){
    for(let t=1;t<=2;t++){
      const team=t===1?`${names[1]} + ${names[3]}`:`${names[2]} + ${names[4]}`;
      for(const prefix of ['gen','pts','trump'])values[`${prefix}Team${t}`]=team;
      values[`genL${t}1`]=all.filter(r=>r.matchBy===t).length;values[`genL${t}4`]=completed.filter(h=>h.winner===t).length;
      const recorded=all.filter(r=>r.suitPts);values[`ptsL${t}1`]=avg(recorded.map(r=>r.pts[t]-r.suitPts[t]));values[`ptsL${t}2`]=avg(recorded.map(r=>r.suitPts[t]));
    }
    values.ptsL15=avg(diffs);values.ptsMax=diffs.length?Math.max(...diffs):0;values.ptsMin=diffs.length?Math.min(...diffs):0;
    const measured=all.filter(r=>r.suitPts);values.ptsL14=avg(measured.map(r=>r.suitPts[1]-r.suitPts[2]));values.ptsL13=avg(measured.map(r=>r.pts[1]-r.pts[2]-r.suitPts[1]+r.suitPts[2]));values.ptsWinTeam=Number(values.ptsL15)>=0?values.ptsTeam1:values.ptsTeam2;
  }
  const calls=kind==='differ'?all.map(r=>r.call[player]):[],errors=kind==='differ'?all.map(r=>r.made[player]-r.call[player]):[];
  const graphs={ptsBox:diffs.slice(-30),DiffHistBox:diffs.slice(-30),diffDistBox:histogram(errors,-157,157),callDistBox:histogram(calls,0,157),callDiffBox:Array.from({length:16},(_,i)=>Number(avg(diffs.filter((_,j)=>Math.floor(calls[j]/10)===i))))};
  return <LegacyDialog kind={kind} form="TSTATISTICSDLG" onClose={onClose} scale={scale} values={values} overrides={{comboBox:{Style:'csDropDownList','Items.Strings':names.slice(1).map((_,i)=>String(i+1)),'aria-label':'Spieler'}}} onChange={(n,v)=>setPlayer(Number(v))} render={(c,p)=>c.name.startsWith('trumpBox')?<img width="26" height="26" src={graphicsUrl(`dialogs/symbols/${game.sound.set}-${p.Tag}.png`)} alt="Trumpf"/>:c.className==='TPaintBox'?<Plot values={graphs[c.name]||[]} label={c.name}/>:undefined}/>;
}
export function ConversationDialog({kind,onClose,onSay,scale}){
  const [values,setValues]=useState({edit:'',Radio3:true,ScrollBar:3});
  const mood=Number(Object.keys(values).find(k=>/^Radio/.test(k)&&values[k])?.slice(-1)||3);
  return <LegacyDialog kind={kind} form="TSAYDLG" onClose={onClose} scale={scale} values={values} overrides={{edit:{'aria-label':'Nachricht',MaxLength:160},ScrollBar:{Max:4}}} onChange={(n,v)=>setValues(s=>({...s,...(/^Radio/.test(n)?{Radio1:false,Radio2:false,Radio3:false,Radio4:false,Radio5:false}:{}),[n]:v}))} onAction={n=>{if(n==='sayButton'&&values.edit.trim()){onSay(values.edit.trim());setValues(s=>({...s,edit:''}));}else if(n!=='sayButton')onClose();}} render={c=>/iconbox/i.test(c.name)?<img src={graphicsUrl(`setup/${5105+(kind==='schieber'?mood-1:values.ScrollBar)}.png`)} width="41" height="47" alt="Stimmung"/>:undefined}/>;
}
export function ConfirmDialog({kind,action,onClose,onConfirm,scale}){
  const form=action==='rematch'?'TREVDLG':kind==='schieber'?'TDIRTYDLG':'TREVDLG';
  return <LegacyDialog kind={kind} form={form} title={action==='rematch'?'Revanche':'Runde aufgeben'} onClose={onClose} scale={scale} hide={['againCheck','SaveBtn']} overrides={{Label1:{Caption:action==='rematch'?'Wollen Sie eine Revanche?':'Wollen Sie diese Runde aufgeben?'},YesBtn:{Caption:'Ja'},NoBtn:{Caption:'Nein'}}} onAction={(n,v,c)=>{if(['OKBtn','YesBtn'].includes(n)||c.properties.Kind==='bkYes')onConfirm();else onClose();}}/>;
}
export function AutoPlayDialog({kind,onClose,onApply,scale}){
  const [values,setValues]=useState({SpinEdit:1,maximalRadio:true,offRadio:false,minimalRadio:false,reducedRadio:false});
  return <LegacyDialog kind={kind} form="TDLGAUTOASK" onClose={onClose} scale={scale} values={values} overrides={{SpinEdit:{MinValue:1,MaxValue:100,'aria-label':'Anzahl Spiele'}}} onChange={(n,v)=>setValues(s=>({...s,...(n.endsWith('Radio')?{offRadio:false,minimalRadio:false,reducedRadio:false,maximalRadio:false}:{}),[n]:v}))} onAction={n=>{if(n==='OKBtn')onApply(Math.max(1,Math.min(100,Math.floor(values.SpinEdit||1))),values.maximalRadio?650:values.reducedRadio?250:50);else onClose();}}/>;
}
export function AssetLibraryDialog({onClose,scale}){
  const {data}=useDialogCatalog(),[selected,setSelected]=useState('');if(!data)return null;
  const files=[...Object.entries(data.loose),...Object.entries(data.forms).flatMap(([kind,forms])=>Object.entries(forms).flatMap(([name,form])=>form.components.flatMap(c=>Object.entries(c.images).map(([property,id])=>[`${kind}/${name}/${c.name}/${property}`,id]))))];
  return <DialogFrame title="Originalbilder" width={680} height={490} onClose={onClose} scale={scale}><div className="asset-browser"><select aria-label="Originalbild" size="20" value={selected} onChange={e=>setSelected(e.target.value)}>{files.map(([name,id])=><option key={name} value={id}>{name}</option>)}</select>{selected&&<img src={imageUrl(data,selected)} alt="Gewähltes Originalbild"/>}</div></DialogFrame>;
}

export function ArchiveDialog({kind,game,onClose,scale}){
  const [values,setValues]=useState({nameEdit:'Jass',thisJass:true,thisRound:false,lastRound:false,lastJass:false});
  return <LegacyDialog kind={kind} form="TSNAPDLG" onClose={onClose} scale={scale} values={values} overrides={{nameEdit:{'aria-label':'Bezeichnung',MaxLength:80},lastJass:{Enabled:false},lastRound:{Enabled:Boolean(game.view?.history.length)}}} onChange={(n,v)=>setValues(s=>({...s,...(n!=='nameEdit'?{thisJass:false,thisRound:false,lastRound:false,lastJass:false}:{}),[n]:v}))} onAction={n=>{if(n==='OKBtn')game.archive(values.nameEdit,Object.keys(values).find(k=>k!=='nameEdit'&&values[k]));onClose();}}/>;
}

export function FastPlayDialog({game,onClose,scale}){
  return <LegacyDialog kind={game.view.kind} form="TFASTDLG" onClose={onClose} scale={scale} values={{Label1:game.view.phase==='done'&&game.series===1?'Schnellspiel beendet':`Noch ${game.series} Jass · Spiel ${game.view.roundNumber}`}} onAction={onClose}/>;
}

export function HighNameDialog({onClose,scale}){
  const entries=read('sws-history',[]),latest=entries.find(h=>h.kind==='differ');
  const [name,setName]=useState(latest?.names[3]||localStorage.getItem('sws-player')||'Sie');
  const rank=latest?entries.filter(h=>h.kind==='differ'&&h.scores[3]<latest.scores[3]).length+1:0;
  return <LegacyDialog kind="differ" form="THIGHNAMEDLG" onClose={onClose} scale={scale} values={{Edit:name,IndexLabel:rank?`${rank}. Rang`:'Noch kein Spiel'}} overrides={{Edit:{'aria-label':'Ranglistenname',MaxLength:30},Button1:{Enabled:!!latest&&!!name.trim()}}} onChange={(n,v)=>setName(v)} onAction={()=>{if(latest&&name.trim()){latest.names[3]=name.trim();localStorage.setItem('sws-history',JSON.stringify(entries));onClose();}}}/>;
}
