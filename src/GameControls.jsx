import React, { useEffect, useRef, useState } from 'react';
import * as S from './engine/SWSBase';
import * as D from './engine/DiffBase';
import { cardName, gameHand, trumpLabels } from './gameDrawing';
import { NewJassSetup } from './NewJassSetup';

export function GameSetup(props) {
  return props.kind === 'schieber' ? <NewJassSetup {...props} renderRules={(rules,onApply,onClose)=><GameSetupForm {...props} initialRules={rules} rulesOnly onClose={onClose} onStart={options=>onApply(options.rules)} />} /> : <GameSetupForm {...props} />;
}
export function GameSetupForm({ kind, onStart, onClose, setId = 1, initialRules, rulesOnly = false }) {
  const trumpNames = trumpLabels(setId);
  const dialog = useRef(null);
  const [rules, setRules] = useState(() => initialRules || (kind === 'schieber' ? S.DefaultRules() : D.DefaultRules()));
  const [level, setLevel] = useState(66);
  const [family, setFamily] = useState('grumpy');
  const [playerName, setPlayerName] = useState(() => { try { return localStorage.getItem('sws-player') || 'Sie'; } catch { return 'Sie'; } });
  const change = (key, value) => setRules(r => ({ ...r, [key]: value }));
  useEffect(() => { dialog.current.showModal(); }, []);
  const number = (key, label, min, max) => <label>{label}<input type="number" min={min} max={max} required value={rules[key]} onChange={e => change(key, Number(e.target.value))} /></label>;
  const check = (key, label) => <label className="checkbox"><input type="checkbox" checked={rules[key]} onChange={e => change(key, e.target.checked)} />{label}</label>;
  return <dialog ref={dialog} onCancel={onClose} className="game-setup">
    <form onSubmit={e => { e.preventDefault(); try { if (!rulesOnly) localStorage.setItem('sws-player', playerName); } catch {}
      onStart({ kind, rules, level, family, human: 3, leading: 3, names:['','Nord','West',playerName,'Ost'], id:crypto.randomUUID(), seed: crypto.getRandomValues(new Uint32Array(1))[0] % 2147483646 + 1 }); }}>
      <h1>{rulesOnly ? 'Schieber-Regeln' : `Neuer ${kind === 'schieber' ? 'Schieber' : 'Differenzler'}`}</h1>
      {!rulesOnly && <>
      <p>Sie spielen im Süden. {kind === 'schieber' ? 'Nord ist Ihr Partner.' : 'Jeder spielt für sich.'}</p>
      <label>Ihr Name<input value={playerName} required maxLength={30} onChange={e=>setPlayerName(e.target.value)} /></label>
      <label>Spielstärke<select value={level} onChange={e => setLevel(Number(e.target.value))}>
        <option value={33}>Schwach</option><option value={66}>Mittel</option><option value={99}>Stark</option>
      </select></label>
      {kind === 'differ' && <label>Computer-Spieler<select value={family} onChange={e => setFamily(e.target.value)}><option value="grumpy">Grumpy Junior</option><option value="hacker">Hacker</option><option value="trashy">Trashy</option></select></label>}
      </>}
      {kind === 'schieber' ? <>
        {check('fPointPlay', 'Auf Punkte spielen')}
        {rules.fPointPlay ? <>{number('fLimit', 'Zielpunkte', 1, 100000)}{number('fCut', 'Bergpreis', 0, rules.fLimit)}</> : number('fRoundLimit', 'Runden', 1, 48)}
        {check('fSuitsEnabled', 'Weis und Stöck')}
        <details><summary>Weitere Regeln</summary>
          {check('fSuitAllFourEqs', 'Alle vier Gleichen weisen')}
          {check('fSuitCrossingOn', 'Kreuzweis erlauben')}
          {check('fSuitsComeFirst', 'Weis vor Stich zählen')}
          {number('fSuitsIncrement', 'Zuschlag bei langen Folgen', 0, 100)}
          {number('fMatchBonus', 'Matchbonus', 0, 500)}
          {trumpNames.slice(1).map((name, i) => <label key={name}>{name} ×<input type="number" min={0} max={10} required value={rules.fTrumpFactor[i + 1]} onChange={e => change('fTrumpFactor', rules.fTrumpFactor.map((n, j) => j === i + 1 ? Number(e.target.value) : n))} /></label>)}
        </details>
      </> : <>
        <label>Spieler<select value={rules.fNuPlayers} onChange={e => change('fNuPlayers', Number(e.target.value))}><option value={4}>Vier Spieler</option><option value={3}>Drei Spieler</option></select></label>
        {number('fRoundLimit', 'Runden', 1, 48)}
        <label>Ansagen<select value={rules.fCallMode} onChange={e => change('fCallMode', Number(e.target.value))}><option value={0}>Verdeckt</option><option value={1}>Nach allen Ansagen aufdecken</option><option value={2}>Offen</option></select></label>
        <label>Stöck<select value={rules.fStockings} onChange={e => change('fStockings', Number(e.target.value))}><option value={0}>Ohne Stöck</option><option value={1}>20 Punkte addieren</option><option value={2}>20 Punkte abziehen</option></select></label>
        {check('fSumUpRanks', 'Rangpunkte addieren')}
        {check('fSCallBonus', 'Bonus für letzte offene Ansage')}
        {number('fDZeroBonus', 'Bonus bei genauer Ansage', 0, 100)}
      </>}
      <div className="dialog-actions"><button type="button" onClick={onClose}>Abbrechen</button><button type="submit">{rulesOnly ? 'Übernehmen' : 'Spielen'}</button></div>
    </form>
  </dialog>;
}

export function GameControls({ game, onNew }) {
  const trumpNames = trumpLabels(game.sound.set);
  const v = game.view, req = v?.request;
  const [call, setCall] = useState(50), [history, setHistory] = useState(false);
  const mine = req?.player === v?.human && !game.automatic && !game.paused;
  let status = !v ? 'Wählen Sie einen Jass.' : v.phase === 'done' ? (v.kind === 'schieber'
    ? `Jass beendet. ${v.winner === 1 ? 'Nord & Süd gewinnen.' : v.winner === 2 ? 'West & Ost gewinnen.' : 'Unentschieden.'}`
    : `Jass beendet. ${v.names.filter((_, p) => p && v.ranks[p] === 1).join(' und ')} gewinnen.`)
    : v.phase === 'deal' ? 'Runde beendet.' : v.pause ? `${v.names[v.trick.winner]} gewinnt den Stich.`
    : req ? `${v.names[req.player]} ${req.command === 'cmdPlay' ? 'spielt.' : req.command === 'cmdCall' ? 'sagt an.' : req.command === 'cmdSuit' ? 'weist.' : req.command === 'cmdStockings' ? 'meldet Stöck.' : 'wählt Trumpf.'}` : '';
  return <section className="game-controls" aria-label="Spielsteuerung">
    <div className="game-status" role="status">{status}{game.busy && ' …'}</div>
    <div className="game-actions">
      {!v && <><button onClick={() => onNew('schieber')}>Neuer Schieber…</button><button onClick={() => onNew('differ')}>Neuer Differenzler…</button><button onClick={game.resume}>Spiel fortsetzen</button></>}
      {v?.phase === 'done' && <button onClick={() => onNew(v.kind)}>Neuer Jass</button>}
      {v && !game.automatic && <>
        {v.phase === 'deal' && <button disabled={game.busy} onClick={() => game.action({ type: 'deal' })}>Nächste Runde</button>}
        {v.phase !== 'done' && v.phase !== 'deal' && v.pause && <button disabled={game.busy} onClick={() => game.action({ type: 'continue' })}>Stich abräumen</button>}
        {mine && ['cmdTrump', 'cmdShift'].includes(req.command) && <>
          {trumpNames.slice(1).map((name, i) => <button key={name} disabled={game.busy || !v.rules.fTrumpFactor[i + 1]} onClick={() => game.answer('cmdTrump', { fTrump: i + 1 })}>{name}</button>)}
          {req.command === 'cmdTrump' && <button disabled={game.busy} onClick={() => game.answer('cmdShift')}>Schieben</button>}
        </>}
        {mine && req.command === 'cmdSuit' && <>
          <button disabled={game.busy} onClick={() => game.answer('cmdSuit', { accept: true })}>{S.ValueOfSuit(v.trump, false, req.data.fSuit)} Weis</button>
          <button disabled={game.busy} onClick={() => game.answer('cmdSuit', { accept: false })}>Nicht weisen</button>
        </>}
        {mine && req.command === 'cmdCall' && <form onSubmit={e => { e.preventDefault(); game.answer('cmdCall', { fCall: call }); }}>
          <label>Ansage <input aria-label="Ansage" type="number" required min={0} max={157} value={call} onChange={e => setCall(Number(e.target.value))} /></label><button disabled={game.busy}>Ansagen</button>
        </form>}
        {mine && req.command === 'cmdStockings' && [0, 1, 2].map((choice) => <button key={choice} disabled={game.busy} onClick={() => game.answer('cmdStockings', { fStockings: choice })}>{['Keine Stöck', 'Stöck +20', 'Stöck −20'][choice]}</button>)}
      </>}
      {v && <>
        <button disabled={game.busy || v.phase === 'done'} onClick={() => game.setPaused(!game.paused)}>{game.paused ? 'Fortfahren' : 'Pause'}</button>
        <button disabled={game.busy || !mine || game.paused} onClick={game.getHint}>Tipp</button>
        <button disabled={game.busy} onClick={game.undo}>Zurücknehmen</button>
        <button disabled={game.busy || ['deal','done'].includes(v.phase)} onClick={()=>game.action({type:'forfeit'})}>Runde aufgeben</button>
        <button aria-pressed={game.automatic} disabled={v.phase === 'done'} onClick={() => game.setAutomatic(!game.automatic)}>{game.automatic ? 'Selbst spielen' : 'Computer weiterspielen lassen'}</button>
        <label>Tempo <select aria-label="Tempo" value={game.speed} onChange={e => game.setSpeed(Number(e.target.value))}><option value={1200}>Ruhig</option><option value={650}>Normal</option><option value={50}>Schnell</option></select></label>
        <button onClick={() => setHistory(!history)} aria-expanded={history}>Resultate</button>
        <label><input type="checkbox" checked={game.sound.enabled} onChange={e => game.setSound({ ...game.sound, enabled: e.target.checked })} /> Ton</label>
        {game.sound.enabled && <label>Lautstärke <input type="range" min={0} max={1} step={0.1} value={game.sound.volume} onChange={e => game.setSound({...game.sound,volume:Number(e.target.value)})} /></label>}
        {game.sound.enabled && <label>Stimme <select aria-label="Stimme" value={game.sound.voice} onChange={e => game.setSound({...game.sound,voice:Number(e.target.value)})}>
          {[3,4,5,6].map(voice => <option key={voice} value={voice}>Stimme {voice}</option>)}
        </select></label>}
      </>}
    </div>
    {game.error && <p role="alert" className="error">{game.error}</p>}
    {game.hint && <p role="status">Tipp: {game.hint.command === 'cmdCard' ? cardName(game.hint.data.fCard, game.sound.set) : game.hint.command === 'cmdTrump' ? trumpNames[game.hint.data.fTrump] : game.hint.command === 'cmdShift' ? 'Schieben' : game.hint.command === 'cmdCall' ? `${game.hint.data.fCall} Punkte ansagen` : game.hint.command === 'cmdSuit' ? 'Weisen' : ['Keine Stöck', 'Stöck +20', 'Stöck −20'][game.hint.data.fStockings ?? 0]}</p>}
    {history && v && <div className="results"><table><caption>Rundenresultate</caption><thead><tr><th>Runde</th>{v.kind === 'schieber' ? <><th>Nord & Süd</th><th>West & Ost</th></> : v.names.slice(1, v.count + 1).map(n => <th key={n}>{n}<br />Ansage / Punkte / Differenz</th>)}</tr></thead><tbody>
      {v.history.map((r, i) => <tr key={i}><td>{i + 1}</td>{v.kind === 'schieber' ? <><td>{r.pts[1]}</td><td>{r.pts[2]}</td></> : Array.from({ length: v.count }, (_, j) => j + 1).map(p => <td key={p}>{r.call[p]} / {r.made[p]} / {D.DeltaOf(r.call[p], r.made[p], r.bonus[p])}</td>)}</tr>)}
    </tbody></table></div>}
  </section>;
}

export function MatchHistory({ onClose }) {
  const dialog = useRef(null);
  const [matches] = useState(() => { try { const rows = JSON.parse(localStorage.getItem('sws-history') || '[]'); return Array.isArray(rows) ? rows : []; } catch { return []; } });
  useEffect(() => { dialog.current.showModal(); }, []);
  return <dialog ref={dialog} onCancel={onClose} className="game-setup">
    <h1>Gespielte Jass</h1>
    <p>Die letzten 100 abgeschlossenen Spiele in diesem Browser.</p>
    {!matches.length ? <p>Noch keine abgeschlossenen Spiele.</p> : <div className="results"><table>
      <thead><tr><th>Datum</th><th>Spiel</th><th>Resultat</th><th>Computerhilfe</th></tr></thead>
      <tbody>{matches.map(m => <tr key={m.id}><td>{new Date(m.date).toLocaleDateString('de-CH')}</td><td>{m.kind === 'schieber' ? 'Schieber' : 'Differenzler'}</td>
        <td>{m.kind === 'schieber' ? `Nord & Süd ${m.scores[1]} : ${m.scores[2]} West & Ost` : m.names.slice(1).filter((_,i) => m.ranks[i+1] > 0).map((name,i) => `${name}: ${m.scores[i+1]}`).join(' · ')}</td>
        <td>{m.computerAssisted ? 'Ja' : 'Nein'}</td></tr>)}</tbody>
    </table></div>}
    <button onClick={onClose} autoFocus>Schliessen</button>
  </dialog>;
}

export function GameCardTargets({ game, sheet, scale, setId }) {
  const v = game.view, cards = gameHand(v, sheet), req = v?.request;
  return <div className="card-targets" role="group" aria-label="Ihre Karten">
    {cards.map((card, i) => <button key={card.id} className="card-target" aria-label={cardName(card.id, setId)} data-card-id={card.id}
      disabled={game.busy || game.automatic || game.paused || req?.player !== v.human || req.command !== 'cmdPlay' || !req.data.fLegal.includes(card.id)}
      style={{ left: card.x * scale, top: card.y * scale, width: Math.min(card.width, cards[i + 1] ? cards[i + 1].x - card.x : card.width) * scale, height: card.height * scale }}
      onClick={() => game.answer('cmdCard', { fCard: card.id })} />)}
  </div>;
}
