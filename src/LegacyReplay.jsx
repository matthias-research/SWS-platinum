import React, {useState} from 'react';
import {legacyView} from './engine/legacy';
import {cardName} from './gameDrawing';
import {ReplayDialog} from './dialogs/ReplayDialog';

export function useLegacyReplay() {
  const [games,setGames]=useState(null),[selected,setSelected]=useState(0),[round,setRound]=useState(0),[step,setStep]=useState(0);
  const game=games?.[selected];
  return {games,selected,setSelected,round,setRound,step,setStep,game,
    open:games=>{setGames(games);setSelected(0);setRound(0);setStep(0);},close:()=>setGames(null),
    view:game?legacyView(game,round,step):null};
}
export function LegacyReplay({replay:r,setId}) {
  const [original,setOriginal]=useState(false);
  const max=r.game.rounds[r.round].plays.length;
  return <section className="game-controls" aria-label="Archiv-Wiedergabe">
    <p>Archiv-Wiedergabe · {r.game.title}</p>
    <div className="game-actions">
      <label>Jass <select value={r.selected} onChange={e=>{r.setSelected(+e.target.value);r.setRound(0);r.setStep(0);}}>{r.games.map((g,i)=><option key={i} value={i}>{g.title}</option>)}</select></label>
      <label>Runde <select value={r.round} onChange={e=>{r.setRound(+e.target.value);r.setStep(0);}}>{r.game.rounds.map((_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label>
      <button disabled={!r.step} onClick={()=>r.setStep(r.step-1)}>Zurück</button>
      <input aria-label="Spielzug" type="range" min={0} max={max} value={r.step} onChange={e=>r.setStep(+e.target.value)} />
      <button disabled={r.step===max} onClick={()=>r.setStep(r.step+1)}>Weiter</button><output>{r.step} / {max}</output>
      <button onClick={r.close}>Archiv schliessen</button>
      <button onClick={()=>setOriginal(true)}>Archivfenster…</button>
    </div>
    <details><summary>Alle Karten zeigen</summary>{r.view.allHands.slice(1,r.game.count+1).map((hand,i)=><p key={i}>{r.game.names[i+1]}: {hand.map(c=>cardName(c,setId)).join(', ')}</p>)}</details>
    {original&&<ReplayDialog replay={r} setId={setId} onClose={()=>setOriginal(false)}/>}
  </section>;
}
