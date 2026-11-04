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
import {GameFeed} from './GameFeed';
import { parseLegacy } from './engine/legacy';
import { LegacyReplay, useLegacyReplay } from './LegacyReplay';
import {PreferencesDialog} from './dialogs/PreferencesDialog';
import {LegacyDialog} from './dialogs/LegacyDialog';
import {PuzzleDialog} from './dialogs/PuzzleDialog';
import {ProfileDialog,SeedDialog,AboutDialog,ResultsDialog,HighScoresDialog,StatisticsDialog,ConversationDialog,ConfirmDialog,AutoPlayDialog,AssetLibraryDialog,ArchiveDialog,FastPlayDialog,HighNameDialog} from './dialogs/SupportingDialogs';
import {DefaultRules as SchieberRules} from './engine/SWSBase';
import {DefaultRules as DifferRules} from './engine/DiffBase';

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
  const [activeDialog,setActiveDialog]=useState(null),[dealSeed,setDealSeed]=useState(null),[messages,setMessages]=useState([]);
  const previousPause=useRef(false);
  const [preferences,setPreferences]=useState(()=>{try{return JSON.parse(localStorage.getItem('sws-preferences')||'{}');}catch{return {};}});
  const openDialog=name=>{previousPause.current=game.paused;game.setPaused(true);setActiveDialog(name);};
  const closeDialog=()=>{setActiveDialog(null);game.setPaused(previousPause.current);};
  const activeKind=game.view?.kind||'schieber';
  const cardNames=['Deutsch','Französisch','Französisch (4 Farben)','Französisch 3D','Französisch 3D (4 Farben)'];
  const [cardSet, setCardSet] = useState(() => Math.max(1,Math.min(5,displayPreference('cardSet',1)))), [cardSize, setCardSize] = useState(() => displayPreference('cardSize',1)===2?2:1);
  const [sheets, setSheets] = useState({});
  useEffect(() => { game.setSound({ ...game.sound, set: cardSet }); }, [cardSet]);
  const openFile = useRef(null);
  const [assets, setAssets] = useState(null);
  const [error, setError] = useState('');
  const [artwork, setArtwork] = useState(() => displayPreference('artwork','enhanced')==='original'?'original':'enhanced');
  const [requestedScale, setRequestedScale] = useState(() => Math.max(1,Math.min(3,displayPreference('scale',DISPLAY.scale))));
  const [fit, setFit] = useState(() => displayPreference('fit',DISPLAY.fitToWindow));
  const [viewport, setViewport] = useState({ width: document.documentElement.getBoundingClientRect().width, height: innerHeight, dpr: devicePixelRatio });
  const [menu, setMenu] = useState(null);
  const canvas = useRef(null);
  const navigation = useRef(null);
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
    const resize = () => setViewport({ width: document.documentElement.getBoundingClientRect().width, height: innerHeight, dpr: devicePixelRatio });
    window.addEventListener('resize', resize);
    return () => { active = false; window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => {
    if (assets && canvas.current) {
      drawTable(canvas.current, (replay.view || game.view)?.kind === 'differ' ? assets.differ : assets, artwork, scale, viewport.dpr, reviewEnabled ? review.sheet?.cards[0].rect.height : sheets.V?.cards[0].rect.height);
      if (reviewEnabled && review.sheet) drawHand(canvas.current, review.sheet, review.cards, review.selected);
      if (!reviewEnabled && (replay.view || game.view)) drawGame(canvas.current, replay.view || game.view, sheets, cardSet);
    }
  }, [assets, artwork, scale, viewport.dpr, review.sheet, review.cards, review.selected, game.view, sheets, cardSet, replay.games, replay.selected, replay.round, replay.step, preferences]);

  useEffect(() => {
    const outside = e => { if (!navigation.current?.contains(e.target)) setMenu(null); };
    const escape = e => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, []);

  const settings={...preferences,cardSet,viewCardsBox:cardNames[cardSet-1],viewThinkS:game.speed,genNoise:game.sound.enabled&&game.sound.noise!==false,genCalls:game.sound.enabled&&game.sound.calls!==false,genHint:game.sound.enabled&&game.sound.hints!==false,genOwn:game.sound.own!==false};
  const applySettings=value=>{setPreferences(value);try{localStorage.setItem('sws-preferences',JSON.stringify(value));}catch{}if(cardNames.includes(value.viewCardsBox))setCardSet(cardNames.indexOf(value.viewCardsBox)+1);if(value.viewThinkS)game.setSpeed(value.viewThinkS);game.setSound({...game.sound,enabled:Boolean(value.genNoise||value.genCalls||value.genHint),noise:value.genNoise,calls:value.genCalls,hints:value.genHint,own:value.genOwn});};

  const act = action => { action(); setMenu(null); };
  const item = (label, action, selected) => <button type="button" className="menu-item" onClick={() => act(action)}
    aria-pressed={selected} key={label}><span className="check">{selected ? '✓' : ''}</span>{label}</button>;
  const menus = {
    Datei: <>{item('Spiel öffnen…', () => openFile.current.click())}{item('Spiel speichern…', game.download)}{item('Letztes Spiel fortsetzen', () => {replay.close();game.resume();})}{game.view&&item('Archivieren…',()=>openDialog('archive'))}{item('Spielerdaten…',()=>openDialog('profile'))}{item('Einstellungen…',()=>openDialog('preferences'))}{item('Beenden…',()=>openDialog('exit'))}</>,
    Jass: <>{item('Neuer Schieber…', () => setNewGame('schieber'))}{item('Neuer Differenzler…', () => setNewGame('differ'))}{item('Kartenverteilungen…',()=>openDialog('seed'))}{game.view&&<>{item('Computer Schnellspiel…',()=>openDialog('auto'))}{item('Gespräche…',()=>openDialog('say'))}{item('Spielstand…',()=>openDialog('results'))}{game.view.phase==='done'&&item('Revanche…',()=>openDialog('rematch'))}</>}{item('Gespielte Jass…', () => setMatchHistory(true))}{item('Bestenliste…',()=>openDialog('highscores'))}{activeKind==='differ'&&item('Ranglistenname…',()=>openDialog('highname'))}{item('Statistik…',()=>openDialog('statistics'))}</>,
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
    Hilfe: <>{item('Über Stöck Wyys Stich…', () => openDialog('about'))}{item('Entwicklungsteam…',()=>openDialog('team'))}{item('Herausgeber…',()=>openDialog('publisher'))}{item('Titelbild…',()=>openDialog('intro'))}{item('Originalbilder…',()=>openDialog('art'))}{item('Puzzle…',()=>openDialog('puzzle'))}</>,
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
      {!reviewEnabled&&!replay.view&&game.view&&<GameFeed key={game.saved()?.options.id||'game'} view={game.view} scale={scale} setId={cardSet} cardHeight={sheets.V?.cards[0].rect.height} messages={messages} duration={preferences.viewBubbleS??5}/>}
      {!reviewEnabled&&!replay.view&&game.view?.pause&&!['deal','done'].includes(game.view.phase)&&!game.busy&&!game.paused&&!game.automatic&&<button type="button" className="trick-clear-target" aria-label="Stich auf dem Tisch abräumen" onClick={()=>game.action({type:'continue'})}/>}
      {!assets && !error && <p className="loading" role="status">Tisch wird geladen…</p>}
    </div>
    {!reviewEnabled && (replay.view ? <LegacyReplay replay={replay} setId={cardSet} /> : <GameControls key={game.view?(game.saved()?.options.id||game.view.kind):'idle'} game={game} onNew={setNewGame} onDialog={openDialog} displayScale={requestedScale}/>)}

    {newGame && <GameSetup key={newGame} kind={newGame} setId={cardSet} settings={settings} onSettings={applySettings} displayScale={requestedScale} onClose={() => setNewGame(null)} onStart={options => { replay.close();game.start({...options,...(dealSeed!==null?{seed:dealSeed}:{})});setMessages([]); setNewGame(null); }} />}
    {matchHistory && <MatchHistory onClose={() => setMatchHistory(false)} />}
    <input type="file" ref={openFile} hidden accept=".json,.sws.json,.jss,.jar" onChange={async e => {
      const file = e.target.files[0]; e.target.value = '';
      if (!file) return;
      try {
        if (file.size > 5000000) throw new Error('Die Spiel-Datei ist zu gross.');
        if (/\.(jss|jar)$/i.test(file.name)) { replay.open(parseLegacy(new TextDecoder('windows-1252').decode(await file.arrayBuffer()))); game.setPaused(true); }
        else { const saved=JSON.parse(await file.text());if(saved.format==='sws-archive'){replay.open(parseLegacy(saved.text));game.setPaused(true);}else{replay.close();game.restore(saved);} }
      }
      catch (error) { setError(error.message); }
    }} />
    {error && <p role="alert" className="error">{error}</p>}
    {activeDialog==='preferences'&&<PreferencesDialog kind={activeKind} rules={game.view?.rules||(activeKind==='differ'?DifferRules():SchieberRules())} locked={Boolean(game.view&&game.view.phase!=='done')} initialTab={0} settings={settings} onSettings={applySettings} onApply={rules=>{try{localStorage.setItem(`sws-rules-${activeKind}`,JSON.stringify(rules));}catch{}closeDialog();}} onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='profile'&&<ProfileDialog kind={activeKind} onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='seed'&&<SeedDialog kind={activeKind} seed={dealSeed} onClose={closeDialog} onApply={seed=>{setDealSeed(seed);closeDialog();}} scale={requestedScale}/>}
    {['about','exit'].includes(activeDialog)&&<AboutDialog kind={activeKind} exit={activeDialog==='exit'} onSave={game.download} onEnd={()=>{closeDialog();replay.close();game.end();}} onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='results'&&<ResultsDialog game={game} onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='highscores'&&<HighScoresDialog kind={activeKind} onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='statistics'&&<StatisticsDialog kind={activeKind} game={game} onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='say'&&<ConversationDialog kind={activeKind} onSay={text=>setMessages(m=>m.concat({id:crypto.randomUUID(),kind:'say',player:game.view.human,text,after:game.view.feed.at(-1)?.id||0}))} onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='archive'&&<ArchiveDialog kind={activeKind} game={game} onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='auto'&&<AutoPlayDialog kind={activeKind} onApply={(count,speed)=>{closeDialog();game.setSpeed(speed);game.setPaused(false);game.playSeries(count);if(speed<=50)setActiveDialog('fast');}} onClose={closeDialog} scale={requestedScale}/>}
    {['forfeit','rematch'].includes(activeDialog)&&<ConfirmDialog kind={activeKind} action={activeDialog} onConfirm={()=>{closeDialog();if(activeDialog==='forfeit')game.action({type:'forfeit'});else game.start({...game.saved().options,id:crypto.randomUUID(),seed:crypto.getRandomValues(new Uint32Array(1))[0]%2147483646+1});}} onClose={closeDialog} scale={requestedScale}/>}
    {['team','publisher','intro'].includes(activeDialog)&&<LegacyDialog kind={activeKind} form={{team:'TTEAMDLG',publisher:'THPDLG',intro:'TINTRODLG'}[activeDialog]} title={{team:'Entwicklungsteam',publisher:'Herausgeber',intro:'Stöck Wyys Stich'}[activeDialog]} onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='puzzle'&&<PuzzleDialog onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='highname'&&<HighNameDialog onClose={closeDialog} scale={requestedScale}/>}
    {activeDialog==='fast'&&game.view&&<FastPlayDialog game={game} onClose={()=>{setActiveDialog(null);game.setAutomatic(false);}} scale={requestedScale}/>}
    {activeDialog==='art'&&<AssetLibraryDialog onClose={closeDialog} scale={requestedScale}/>}
  </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
