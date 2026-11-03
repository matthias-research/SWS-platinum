import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DISPLAY, fitScale } from './config';
import { drawTable, loadAssets } from './table';
import './style.css';
import { drawHand, loadCardManifest, loadCardSheet } from './cards';
import { CardReviewControls, CardTargets, useCardReview } from './CardReview';
import { useGame } from './useGame';
import { GameSetup, GameControls, GameCardTargets, MatchHistory } from './GameControls';
import { drawGame } from './gameDrawing';
import { parseLegacy } from './engine/legacy';
import { LegacyReplay, useLegacyReplay } from './LegacyReplay';

const reviewEnabled = new URLSearchParams(location.search).get('review') === 'cards';
function displayPreference(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem('sws-display') || '{}')[key]; return typeof value === typeof fallback ? value : fallback; } catch { return fallback; }
}

function App() {
  const review = useCardReview(reviewEnabled);
  const game = useGame();
  const replay = useLegacyReplay();
  const displayView = replay.view || game.view;
  const [newGame, setNewGame] = useState(null);
  const [matchHistory, setMatchHistory] = useState(false);
  const [cardSet, setCardSet] = useState(() => Math.max(1,Math.min(5,displayPreference('cardSet',1)))), [cardSize, setCardSize] = useState(() => displayPreference('cardSize',1)===2?2:1);
  const [sheets, setSheets] = useState({});
  useEffect(() => { game.setSound({ ...game.sound, set: cardSet }); }, [cardSet]);
  const openFile = useRef(null);
  const [assets, setAssets] = useState(null);
  const [error, setError] = useState('');
  const [artwork, setArtwork] = useState(() => displayPreference('artwork','enhanced')==='original'?'original':'enhanced');
  const [requestedScale, setRequestedScale] = useState(() => Math.max(1,Math.min(3,displayPreference('scale',DISPLAY.scale))));
  const [fit, setFit] = useState(() => displayPreference('fit',DISPLAY.fitToWindow));
  const [viewport, setViewport] = useState({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio });
  const [menu, setMenu] = useState(null);
  const [about, setAbout] = useState(false);
  const canvas = useRef(null);
  const navigation = useRef(null);
  const dialog = useRef(null);
  const scale = fitScale(viewport.width - 16, viewport.height - (reviewEnabled ? 180 : 145), requestedScale, fit);
  useEffect(() => { try {localStorage.setItem('sws-display',JSON.stringify({cardSet,cardSize,artwork,scale:requestedScale,fit}));}catch{} },[cardSet,cardSize,artwork,requestedScale,fit]);

  useEffect(() => {
    let active = true;
    loadCardManifest().then(async manifest => {
      const [V, H] = await Promise.all(['V', 'H'].map(o => loadCardSheet(manifest, cardSet, cardSize, o)));
      if (active) setSheets({ V, H });
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [cardSet, cardSize]);

  useEffect(() => {
    let active = true;
    loadAssets().then(value => { if (active) setAssets(value); }).catch(e => { if (active) setError(e.message); });
    const resize = () => setViewport({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio });
    window.addEventListener('resize', resize);
    return () => { active = false; window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => {
    if (assets && canvas.current) {
      drawTable(canvas.current, (replay.view || game.view)?.kind === 'differ' ? assets.differ : assets, artwork, scale, viewport.dpr, reviewEnabled ? review.sheet?.cards[0].rect.height : sheets.V?.cards[0].rect.height);
      if (reviewEnabled && review.sheet) drawHand(canvas.current, review.sheet, review.cards, review.selected);
      if (!reviewEnabled && (replay.view || game.view)) drawGame(canvas.current, replay.view || game.view, sheets, cardSet);
    }
  }, [assets, artwork, scale, viewport.dpr, review.sheet, review.cards, review.selected, game.view, sheets, cardSet, replay.games, replay.selected, replay.round, replay.step]);

  useEffect(() => {
    const outside = e => { if (!navigation.current?.contains(e.target)) setMenu(null); };
    const escape = e => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);

  useEffect(() => {
    if (about) dialog.current.showModal();
    else if (dialog.current.open) dialog.current.close();
  }, [about]);

  const act = action => { action(); setMenu(null); };
  const item = (label, action, selected) => <button type="button" className="menu-item" onClick={() => act(action)}
    aria-pressed={selected} key={label}><span className="check">{selected ? '✓' : ''}</span>{label}</button>;
  const menus = {
    Datei: <>{item('Spiel öffnen…', () => openFile.current.click())}{item('Spiel speichern…', game.download)}{item('Letztes Spiel fortsetzen', () => {replay.close();game.resume();})}</>,
    Jass: <>{item('Neuer Schieber…', () => setNewGame('schieber'))}{item('Neuer Differenzler…', () => setNewGame('differ'))}{item('Gespielte Jass…', () => setMatchHistory(true))}</>,
    Ansicht: <>
      {item('Verbesserte Tischgrafik', () => setArtwork('enhanced'), artwork === 'enhanced')}
      {item('Originalgrafik', () => setArtwork('original'), artwork === 'original')}
      <hr />
      {item('Karten mittel', () => setCardSize(1), cardSize === 1)}
      {item('Karten gross', () => setCardSize(2), cardSize === 2)}
      {['Deutsch', 'Französisch 1', 'Französisch 2 · vierfarbig', 'Französisch 3', 'Französisch 4 · vierfarbig'].map((name, i) => item(name, () => setCardSet(i + 1), cardSet === i + 1))}
      <hr />
      {item('An Fenster anpassen', () => setFit(!fit), fit)}
      {[1, 2, 3].map(value => item(`${value}× Vergrösserung`, () => setRequestedScale(value), requestedScale === value))}
    </>,
    Fenster: item('Vollbild', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
      catch { setError('Vollbild ist in diesem Browser nicht verfügbar.'); }
    }),
    Hilfe: item('Über Stöck Wyys Stich…', () => setAbout(true)),
  };

  return <main className="application" style={{ '--scene-width': `${DISPLAY.width * scale}px` }}>
    <nav className="menu-bar" aria-label="Hauptmenü" ref={navigation}>
      {Object.entries(menus).map(([name, content]) => <div className="menu" key={name}>
        <button type="button" className={`menu-title ${menu === name ? 'active' : ''}`} aria-expanded={menu === name}
          aria-controls={`menu-${name}`} onClick={() => setMenu(menu === name ? null : name)}>{name}</button>
        {menu === name && <div id={`menu-${name}`} className="menu-popup" aria-label={name}>{content}</div>}
      </div>)}
    </nav>
    {reviewEnabled && <CardReviewControls review={review} />}
    <div className="scene-frame" style={{ width: DISPLAY.width * scale + 4, height: DISPLAY.height * scale + 4 }}>
      <canvas ref={canvas} data-ready={Boolean(assets && (!reviewEnabled || review.sheet))} data-artwork={artwork} data-scale={scale}
        style={{ width: DISPLAY.width * scale, height: DISPLAY.height * scale }}
        role="img" aria-label={reviewEnabled ? "Schieber-Spieltisch mit Karten-Vorschau" : displayView ? `${displayView.kind === 'differ' ? 'Differenzler' : 'Schieber'}-Spieltisch, Runde ${displayView.roundNumber}` : "Schieber-Spieltisch: grüner Filz auf blauem Glastisch, links ein leerer Schreibblock, rechts die Spieltafel für West und Ost sowie Nord und Süd."}>
        Schieber-Spieltisch mit Schreibblock und Spieltafel.
      </canvas>
      {reviewEnabled && assets && <CardTargets review={review} scale={scale} canvas={canvas} />}
      {!reviewEnabled && !replay.view && game.view && <GameCardTargets game={game} sheet={sheets.V} scale={scale} setId={cardSet} />}
      {!assets && !error && <p className="loading" role="status">Tisch wird geladen…</p>}
    </div>
    {!reviewEnabled && (replay.view ? <LegacyReplay replay={replay} setId={cardSet} /> : <GameControls game={game} onNew={setNewGame} />)}
    {newGame && <GameSetup key={newGame} kind={newGame} setId={cardSet} onClose={() => setNewGame(null)} onStart={options => { replay.close();game.start(options); setNewGame(null); }} />}
    {matchHistory && <MatchHistory onClose={() => setMatchHistory(false)} />}
    <input type="file" ref={openFile} hidden accept=".json,.sws.json,.jss,.jar" onChange={async e => {
      const file = e.target.files[0]; e.target.value = '';
      if (!file) return;
      try {
        if (file.size > 5000000) throw new Error('Die Spiel-Datei ist zu gross.');
        if (/\.(jss|jar)$/i.test(file.name)) { replay.open(parseLegacy(new TextDecoder('windows-1252').decode(await file.arrayBuffer()))); game.setPaused(true); }
        else { replay.close(); game.restore(JSON.parse(await file.text())); }
      }
      catch (error) { setError(error.message); }
    }} />
    {error && <p role="alert" className="error">{error}</p>}
    <dialog ref={dialog} onCancel={() => setAbout(false)} onClose={() => setAbout(false)}>
      <h1>Stöck Wyys Stich</h1>
      <p>Die Originalspiele kehren in den Browser zurück.</p>
      <p>Schieber und Differenzler mit den ursprünglichen Spielregeln und Computer-Spielern.</p>
      <p>Spiele werden automatisch im Browser gesichert. Unter «Datei» können Sie sie als SWS-JSON-Datei speichern und wieder öffnen.</p>
      <p>Unter «Ansicht» können Sie die Originalgrafik vergleichen und die Vergrösserung wählen.</p>
      <p><a href={`${import.meta.env.BASE_URL}licenses/pas2js/LICENSE`} target="_blank" rel="noreferrer">pas2js Runtime-Lizenz</a></p>
      <button type="button" onClick={() => setAbout(false)} autoFocus>OK</button>
    </dialog>
  </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
