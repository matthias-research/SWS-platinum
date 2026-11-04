import React,{useState} from 'react';
import {LegacyDialog} from './LegacyDialog';
import {trumpLabels} from '../gameDrawing';
import {DialogCards} from './DecisionDialogs';
const simple={winLimit:'fLimit',winCut:'fCut',winRoundLimit:'fRoundLimit',suitEnabled:'fSuitsEnabled',suitFour:'fSuitAllFourEqs',suitCross:'fSuitCrossingOn',suitPoints:'fSuitsIncrement',matchBonus:'fMatchBonus',rulesNrRounds:'fRoundLimit',rulesCallBonus:'fSCallBonus'};
const radios={winPoints:['fPointPlay',true],winRounds:['fPointPlay',false],trickFirst:['fSuitsComeFirst',false],suitFirst:['fSuitsComeFirst',true],beginLooser:['fLooserBegins',true],beginNext:['fLooserBegins',false],rules3Players:['fNuPlayers',3],rules4Players:['fNuPlayers',4],rulesHideHide:['fCallMode',0],rulesHideShow:['fCallMode',1],rulesShowShow:['fCallMode',2],rulesAddDiffs:['fSumUpRanks',false],rulesAddRanks:['fSumUpRanks',true],rulesStockingsNo:['fStockings',0],rulesStockingsAdd:['fStockings',1],rulesStockingsSub:['fStockings',2]};
export function PreferencesDialog({kind,rules,onClose,onApply,settings={},onSettings,initialTab=1,locked=false,scale}) {
  const [draft,setDraft]=useState(()=>structuredClone(rules)),[prefs,setPrefs]=useState({...settings}),[error,setError]=useState('');
  const values={...prefs,runningLabel:locked?'Spiel läuft, keine Regeländerungen möglich':'',rulesBonus:draft.fDZeroBonus>0};
  for(const [control,key] of Object.entries(simple))values[control]=draft[key];
  for(const [control,[key,value]] of Object.entries(radios))values[control]=draft[key]===value;
  for(let i=1;i<=6;i++)values[`Fact${i}`]=draft.fTrumpFactor?.[i]??1;
  const change=(name,value)=>{
    if(simple[name])setDraft(r=>({...r,[simple[name]]:typeof r[simple[name]]==='boolean'?value:Number(value)}));
    else if(radios[name])setDraft(r=>({...r,[radios[name][0]]:radios[name][1]}));
    else if(name==='rulesBonus')setDraft(r=>({...r,fDZeroBonus:value?10:0}));
    else if(/^Fact\d$/.test(name))setDraft(r=>({...r,fTrumpFactor:r.fTrumpFactor.map((n,i)=>i===Number(name.slice(-1))?Number(value):n)}));
    else if(['viewAscending','viewDescending'].includes(name))setPrefs(p=>({...p,viewAscending:name==='viewAscending',viewDescending:name==='viewDescending'}));
    else setPrefs(p=>({...p,[name]:value}));
  };
  const overrides={runningLabel:{Visible:locked},winPoints:{'aria-label':'Auf Punkte spielen'},winRoundLimit:{'aria-label':'Runden'},rulesNrRounds:{'aria-label':'Runden','Items.Strings':Array.from({length:48},(_,i)=>String(i+1))},winLimit:{'aria-label':'Zielpunkte'},winCut:{'aria-label':'Bergpreis'},suitEnabled:{'aria-label':'Weis und Stöck'},viewCardsBox:{Style:'csDropDownList'},viewBackBox:{Style:'csDropDownList'},mViewTable:{Style:'csDropDownList',Enabled:false}};
  for(const name of [...Object.keys(simple),...Object.keys(radios),'rulesBonus',...Array.from({length:6},(_,i)=>`Fact${i+1}`)])overrides[name]={...overrides[name],Enabled:!locked};
  for(const name of ['genSavePrefs','genVoice','genSayBefore','genSayDuring','genSayAfter','genSayWin','genAviShow','viewAviShow','genIntroSound','viewSlideS','viewBackBox','viewInfoRound','viewInfoWin','viewInfoMatch','genInfoRound','genInfoGame','viewGoepf'])overrides[name]={...overrides[name],Enabled:false};
  const apply=()=>{
    if(!locked&&Object.values(draft).some(n=>typeof n==='number'&&(!Number.isInteger(n)||n<0||n>100000))){setError('Bitte ganze Zahlen zwischen 0 und 100000 eingeben.');return;}
    if(!locked && (!Number.isInteger(draft.fRoundLimit)||draft.fRoundLimit<1||draft.fRoundLimit>48||kind==='schieber'&&(!Number.isInteger(draft.fLimit)||draft.fLimit<1||draft.fTrumpFactor.some(n=>!Number.isInteger(n)||n<0||n>10)||!draft.fTrumpFactor.some(n=>n>0)))){setError('Bitte gültige Spielregeln eingeben (1–48 Spiele, positive Zielpunkte).');return;}
    onSettings?.(prefs);onApply(draft);
  };
  return <LegacyDialog kind={kind} form="TPREFDLG" title={initialTab===1?'Spielregeln':'Einstellungen'} onClose={onClose} scale={scale} values={values} initialTab={initialTab} overrides={overrides} onChange={change} onAction={name=>name==='OKBtn'?apply():onClose()} render={(c,p,data)=>{
    if(/^Fact\d$/.test(c.name))return <select aria-label={`${trumpLabels(settings.cardSet||1)[Number(c.name.slice(-1))]} Faktor`} disabled={locked} value={values[c.name]} onChange={e=>change(c.name,e.target.value)}>{Array.from({length:11},(_,i)=><option value={i} key={i}>{i===0?'Nicht gespielt':`${i}×`}</option>)}</select>;
    if(/^TrumpBox\d$/.test(c.name))return <img width="26" height="26" alt={trumpLabels(settings.cardSet||1)[p.Tag]} src={`${import.meta.env.BASE_URL}assets/dialogs/symbols/${settings.cardSet||1}-${p.Tag}.png`}/>;
    if(c.name==='viewPaint')return <DialogCards width={p.Width} height={p.Height} setId={Math.max(1,['Deutsch','Französisch','Französisch (4 Farben)','Französisch 3D','Französisch 3D (4 Farben)'].indexOf(prefs.viewCardsBox)+1)} rows={[prefs.viewDescending?[9,8,7,6,5,4,3,2,1]:[1,2,3,4,5,6,7,8,9]]}/>;
    if(c.name==='viewBubbleS')return <input aria-label="Sprechblasen Dauer" type="range" min="0" max="20" value={prefs.viewBubbleS??5} onChange={e=>change(c.name,Number(e.target.value))}/>;
    if(c.name==='viewBubbleL')return <span>{prefs.viewBubbleS===0?'Aus':`${prefs.viewBubbleS??5} s`}</span>;
    if(c.name==='viewThinkS')return <input aria-label="Spielverzögerung" type="range" min="50" max="2000" step="50" value={prefs.viewThinkS||650} onChange={e=>change(c.name,Number(e.target.value))}/>;
    if(c.name==='viewThinkL')return <span>{((prefs.viewThinkS||650)/1000).toFixed(2)} s</span>;
  }}>{error&&<p role="alert" className="original-error">{error}</p>}</LegacyDialog>;
}
