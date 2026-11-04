import {graphicsUrl} from './graphics';
import React, { useEffect, useRef, useState } from 'react';
import { DefaultRules } from './engine/SWSBase';
import { DefaultRules as DifferRules } from './engine/DiffBase';
import {useDialogCatalog,formImage} from './dialogs/LegacyDialog';
const seats = [{p:1,name:'Nord',x:208,y:69},{p:2,name:'West',x:93,y:174},{p:4,name:'Ost',x:321,y:174}];
const strengths = ['Schwach','Mittel','Stark'];
const characterNames = ['Birgit','Beat','Stéphanie','Walter'];
const levels = [0,50,99];
const defaults = { characters:[0,0,2,0,3], strengths:[0,2,2,0,2], avatar:5208 };
function randomCharacters(){
  const remaining=new Set([0,1,2,3]),characters=[0,0,0,0,0];
  // DlgNew.SetupConfigs: choose a character, then advance to the next unused one.
  for(const p of [1,2,4]){
    let character=Math.floor(Math.random()*4);
    while(!remaining.has(character))character=(character+1)%4;
    characters[p]=character;remaining.delete(character);
  }
  return characters;
}
function savedSelection(kind) {
  try {
    const value = JSON.parse(localStorage.getItem(`sws-setup-${kind}`)||localStorage.getItem('sws-setup'));
    if (value && ['characters','strengths'].every(k=>Array.isArray(value[k])&&value[k].length===5&&value[k].every(n=>Number.isInteger(n)&&n>=0&&n<=(k==='characters'?3:2))) && value.avatar>=5200 && value.avatar<=5219) return value;
  } catch {}
  return {...defaults,characters:randomCharacters()};
}

export function NewJassSetup({ kind='schieber', onStart, onClose, renderRules }) {
  const {data:catalog}=useDialogCatalog();
  const differ=kind==='differ',offset=differ?-8:0;
  const dialog = useRef(null);
  const [selection,setSelection] = useState(()=>savedSelection(kind));
  const [rules,setRules] = useState(()=>{const fallback=differ?DifferRules():DefaultRules();try{return {...fallback,...JSON.parse(localStorage.getItem(`sws-rules-${kind}`)||'{}')};}catch{return fallback;}});
  const [editingRules,setEditingRules] = useState(false);
  const [picker,setPicker] = useState(null);
  const [name,setName] = useState(()=>{try{return localStorage.getItem('sws-player')||'Sie';}catch{return 'Sie';}});
  const [viewport,setViewport] = useState({width:innerWidth,height:innerHeight});
  const height=differ?431:439;
  const scale = Math.min(1,(viewport.width-24)/464,(viewport.height-24)/height);
  useEffect(()=>{dialog.current.showModal();const resize=()=>setViewport({width:innerWidth,height:innerHeight});window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
  const change = (key,p,value) => setSelection(s=>({...s,[key]:s[key].map((n,i)=>i===p?value:n)}));
  const start = e => {
    e.preventDefault();
    try {localStorage.setItem('sws-player',name);localStorage.setItem(`sws-setup-${kind}`,JSON.stringify(selection));localStorage.setItem(`sws-rules-${kind}`,JSON.stringify(rules));}catch{}
    // InitJassers registers Hacker 1, Hacker 2, Trashy1, Grumpy Junior in portrait order.
    const families=selection.characters.map((character,p)=>p===3?'grumpy':['hacker','hacker','trashy','grumpy'][character]);
    onStart({kind,...(differ?{families}:{}),rules,human:3,leading:3,names:selection.characters.map((character,p)=>p===0?'':p===3?name:characterNames[character]),level:99,
      levels:selection.strengths.map(n=>levels[n]),characters:selection.characters,avatar:selection.avatar,
      id:crypto.randomUUID(),seed:crypto.getRandomValues(new Uint32Array(1))[0]%2147483646+1});
  };
  return <>
    <dialog ref={dialog} className="legacy-new-jass" aria-label="Neuer Jass" onCancel={e=>{if(picker!==null){e.preventDefault();setPicker(null);}else onClose();}} style={{width:464*scale,height:height*scale,'--setup-button-top':`${386+offset}px`}}>
      <form onSubmit={start} className="legacy-setup-content" style={{height,transform:`scale(${scale})`}}>
        <header className="legacy-caption">{differ?'Neuer Differenzler':'Neuer Jass'}<button type="button" aria-label="Schliessen" onClick={onClose}>×</button></header>
        <div className="legacy-setup-board" style={{height:height-22,backgroundImage:`url(${differ?formImage(catalog,'differ','TDLGNEWJASS',rules.fNuPlayers===3?'Back3Image':'BackImage'):graphicsUrl('setup/schieber.png')})`,backgroundPosition:`0 ${offset}px`}}>
          {seats.filter(s=>!differ||s.p<=rules.fNuPlayers).map(({p,name:seat,x,y})=><div key={p} className="legacy-player" style={{left:x,top:y+offset}}>
            <button type="button" className="legacy-portrait" aria-label={`${seat}: Figur ${selection.characters[p]+1}, ${strengths[selection.strengths[p]]}. Spieler wählen`} onClick={()=>setPicker(p)}>
              <img src={graphicsUrl(`setup/${7006+1000*selection.characters[p]+selection.strengths[p]}.png`)} alt="" title={characterNames[selection.characters[p]]} draggable="false" />
            </button>
            <div className="legacy-scroll">
              <button type="button" aria-label={`${seat} stärker`} disabled={selection.strengths[p]===2} onClick={()=>change('strengths',p,selection.strengths[p]+1)}>◀</button>
              <input aria-label={`${seat} Spielstärke`} aria-valuetext={strengths[selection.strengths[p]]} type="range" min="0" max="2" value={2-selection.strengths[p]} onChange={e=>change('strengths',p,2-Number(e.target.value))} />
              <button type="button" aria-label={`${seat} schwächer`} disabled={selection.strengths[p]===0} onClick={()=>change('strengths',p,selection.strengths[p]-1)}>▶</button>
            </div>
          </div>)}
          <div className="legacy-player legacy-human" style={{left:208,top:210+offset}}>
            <img className="legacy-human-frame" src={graphicsUrl(`setup/5006.png`)} alt="Mensch" />
            <button type="button" className="legacy-avatar" aria-label="Ihr Spielerbild wählen" onClick={()=>setPicker(3)}><img src={graphicsUrl(`setup/${selection.avatar}.png`)} alt="" /></button>
            <input className="legacy-player-name" aria-label="Ihr Name" value={name} required maxLength={30} onChange={e=>setName(e.target.value)} />
          </div>
          <button className="legacy-ok legacy-bottom" type="submit" aria-label="Spielen"><span>✓</span>OK</button>
          <button className="legacy-cancel legacy-bottom" type="button" aria-label="Cancel" onClick={onClose}><span aria-hidden="true">✖</span>Cancel</button>
          <button className="legacy-random legacy-bottom" type="button" onClick={()=>{
            setSelection(s=>({...s,characters:randomCharacters()}));
          }}>Zufällig</button>
          <button className="legacy-rules legacy-bottom" type="button" onClick={()=>setEditingRules(true)}>Regeln…</button>
        </div>
        {picker!==null && <div className="legacy-picker" role="group" aria-label={picker===3?'Spielerbild auswählen':'Computer-Spieler auswählen'}>
          <p>{picker===3?'Ihr Spielerbild':'Computer-Spieler'}</p>
          <div>{Array.from({length:picker===3?20:4},(_,i)=>{
            const id=picker===3?5200+i:7008+i*1000;
            return <button type="button" key={id} aria-label={picker===3?`Spielerbild ${i+1}`:`Figur ${i+1}`} onClick={()=>{if(picker===3)setSelection(s=>({...s,avatar:id}));else change('characters',picker,i);setPicker(null);}}><img src={graphicsUrl(`setup/${id}.png`)} alt="" /></button>;
          })}</div>
          <button type="button" onClick={()=>setPicker(null)}>Zurück</button>
        </div>}
      </form>
    </dialog>
    {editingRules && renderRules(rules,value=>{setRules(value);setEditingRules(false);},()=>setEditingRules(false))}
  </>;
}
