import {migratePlayerLabel} from './germanText';
import {loadRules,saveRules} from './settingsStorage';
import {WelcomePanel} from './WelcomePanel';
import {TablePlayers} from './TablePlayers';
import {roundInformation} from './informationWindows';
import {InformationDialog} from './dialogs/SupportingDialogs';
import {useGraphics,setGraphics} from './graphics';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DISPLAY, fitScale } from './config';
import { drawTable, loadAssets, jokerRect, drawTableJoker } from './table';
import './style.css';
import { drawHand, loadCardManifest, loadCardSheet } from './cards';
import { CardReviewControls, CardTargets, useCardReview } from './CardReview';
import { useGame } from './useGame';
import { GameSetup, GameControls, GameCardTargets, MatchHistory } from './GameControls';
import {CardMotionLayer} from './CardMotionLayer';
import { drawGame } from './gameDrawing';
import {GameFeed} from './GameFeed';
import {DifferPoints} from './DifferPoints';
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

migratePlayerLabel();

function App() {
  const review = useCardReview(reviewEnabled);
  const game = useGame();
  const replay = useLegacyReplay();
  const displayView = replay.view || game.view;
  const [newGame, setNewGame] = useState(null);
  const [startingKind,setStartingKind]=useState(null);
  const [matchHistory, setMatchHistory] = useState(false);
  const [activeDialog,setActiveDialog]=useState(null),[dealSeed,setDealSeed]=useState(null),[messages,setMessages]=useState([]);
  const previousPause=useRef(false);
  const [preferences,setPreferences]=useState(()=>{try{return JSON.parse(localStorage.getItem('sws-preferences')||'{}');}catch{return {};}});
  const openDialog=name=>{previousPause.current=game.paused;game.setPaused(true);setActiveDialog(name);};
  const closeDialog=()=>{setActiveDialog(null);game.setPaused(previousPause.current);};
  const closeGame=()=>{setStartingKind(null);setActiveDialog(null);setNewGame(null);setMessages([]);replay.close();game.end();};
  const showWelcome=!reviewEnabled&&!displayView&&!newGame&&!startingKind;
  const activeKind=displayView?.kind||newGame||startingKind||'schieber';
  const lastRoundNotice=useRef('');
  const lastPrizeNotice=useRef({id:null,team:0});
  const [information,setInformation]=useState([]);
  useEffect(()=>{
    const v=game.view;
    if(!v){lastRoundNotice.current='';lastPrizeNotice.current={id:null,team:0};setInformation([]);return;}
    if(game.animation)return;
    const id=game.saved()?.options.id,notices=[];
    if(lastPrizeNotice.current.id!==id)lastPrizeNotice.current={id,team:v.bPrice};
    if(v.kind==='schieber'&&v.bPrice!==lastPrizeNotice.current.team){
      if(v.bPrice&&preferences.viewInfoWin!==false&&!game.automatic)notices.push({type:'bp',team:v.bPrice});
      lastPrizeNotice.current={id,team:v.bPrice};
    }
    if(!v.pause&&v.history.length&&['deal','done'].includes(v.phase)){
      const key=`${id}:${v.history.length}`;
      if(lastRoundNotice.current!==key){
        lastRoundNotice.current=key;
        if(!game.automatic||(v.phase==='done'&&game.series<=1))notices.push(...roundInformation(v,preferences));
      }
    }
    if(notices.length)setInformation(old=>old.concat(notices.map(n=>({...n,view:v}))));
  },[game.view,game.automatic,game.series,game.animation,preferences]);
  useEffect(()=>{if(information.length&&!activeDialog)openDialog('information');},[information,activeDialog]);
  const nextInformation=()=>{
    const notice=information[0];
    setInformation(items=>items.slice(1));
    if(information.length<=1){
      closeDialog();
      if(['round','differ','match','conter'].includes(notice?.type)&&
        game.view?.phase==='deal'&&!game.view.pause&&!game.busy&&
        notice.view.roundNumber===game.view.roundNumber)game.action({type:'deal'});
    }
  };
  const cardNames=['Deutsch','Französisch','Französisch (4 Farben)','Französisch 3D','Französisch 3D (4 Farben)'];
  const [cardSet, setCardSet] = useState(() => Math.max(1,Math.min(5,displayPreference('cardSet',1))));
  const [sheets, setSheets] = useState({});
  useEffect(() => { game.setSound({ ...game.sound, set: cardSet }); }, [cardSet]);
  const openFile = useRef(null);
  const [assets, setAssets] = useState(null);
  const [error, setError] = useState('');
  const artwork=useGraphics(),setArtwork=setGraphics;
  const [fit, setFit] = useState(() => displayPreference('resolution','') ? displayPreference('resolution','')==='adaptive' : displayPreference('fit',DISPLAY.fitToWindow));
  const requestedScale=fit?Infinity:1;
  const [viewport, setViewport] = useState({ width: document.documentElement.getBoundingClientRect().width, height: innerHeight, dpr: devicePixelRatio });
  const [menu, setMenu] = useState(null);
  // Keep the auxiliary controls available for development; normal startup hides them.
  const [lowLevel,setLowLevel]=useState(false);
  const canvas = useRef(null),sceneRef=useRef(null);
  const jokerCanvas=useRef(null),[jokerPressed,setJokerPressed]=useState(false);
  const jokerAssets=game.view?.kind==='differ'?assets?.differ:assets;

  const canHint=Boolean(game.view?.request?.player===game.view?.human&&game.view?.request&&!game.busy&&!game.paused&&!game.automatic);
  const navigation = useRef(null);
  // Normal play needs only the menu, frame, margins and control padding.
  const reservedHeight = reviewEnabled ? 180 : lowLevel || replay.view ? 145 : 60;
  const tableSize=useMemo(()=>!fit&&!reviewEnabled
    ? {width:Math.max(640,Math.floor(viewport.width-16)),height:Math.max(480,Math.floor(viewport.height-reservedHeight))}
    : {width:DISPLAY.width,height:DISPLAY.height},[fit,reviewEnabled,viewport.width,viewport.height,reservedHeight]);
  const joker=game.view&&jokerAssets?jokerRect(jokerAssets,game.view.kind,sheets.V?.cards[0].rect.height,tableSize):null;
  const scale = fitScale(viewport.width - 16, viewport.height - reservedHeight, requestedScale, fit);
  // Adaptive scales the large cards; fixed mode follows Delphi's size threshold.
  const cardSize=fit||(tableSize.width>700&&tableSize.height>530)?2:1;
  useEffect(() => { try {localStorage.setItem('sws-display',JSON.stringify({cardSet,artwork,scale:1,fit,resolution:fit?'adaptive':'fixed'}));}catch{} },[cardSet,cardSize,artwork,requestedScale,fit]);

  useEffect(() => {
    let active = true;
    loadCardManifest().then(async manifest => {
      const [V, H] = await Promise.all(['V', 'H'].map(o => loadCardSheet(manifest, cardSet, cardSize, o)));
      if (active) setSheets({ V, H });
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [cardSet, cardSize, artwork]);

  useEffect(() => {
    let active = true;
    loadAssets(artwork).then(value => { if (active) setAssets(value); }).catch(e => { if (active) setError(e.message); });
    const resize = () => setViewport({ width: document.documentElement.getBoundingClientRect().width, height: innerHeight, dpr: devicePixelRatio });
    window.addEventListener('resize', resize);
    return () => { active = false; window.removeEventListener('resize', resize); };
  }, [artwork]);

  useLayoutEffect(() => {
    if (assets && canvas.current) {
      drawTable(canvas.current, activeKind === 'differ' ? assets.differ : assets, artwork, scale, viewport.dpr, reviewEnabled ? review.sheet?.cards[0].rect.height : sheets.V?.cards[0].rect.height,tableSize);
      if (reviewEnabled && review.sheet) drawHand(canvas.current, review.sheet, review.cards, review.selected);
      const animation=!reviewEnabled&&!replay.view?game.animation:null;
      if (!reviewEnabled && (replay.view || game.view)) drawGame(canvas.current, replay.view || game.view, sheets, cardSet,animation,tableSize);
      if(!reviewEnabled&&!replay.view&&game.view&&jokerCanvas.current)drawTableJoker(canvas.current,jokerCanvas.current,jokerAssets,game.view.kind,sheets.V?.cards[0].rect.height,jokerPressed&&canHint,tableSize);

    }
  }, [assets, artwork, scale, tableSize, activeKind, showWelcome, viewport.dpr, review.sheet, review.cards, review.selected, game.view, sheets, cardSet, replay.games, replay.selected, replay.round, replay.step, preferences,jokerPressed,canHint,game.animation]);

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
  const item = (label, action, selected, disabled=false) => <button type="button" className="menu-item" disabled={disabled} onClick={() => act(action)}
    aria-pressed={selected} key={label}><span className="check" aria-hidden="true">{selected ? '✓' : ''}</span>{label}</button>;
  const menus = {
    Datei: <>{displayView&&item('Spiel schliessen',closeGame)}{item('Spiel öffnen…', () => openFile.current.click())}{item('Spiel speichern…', game.download)}{item('Letztes Spiel fortsetzen', () => {replay.close();game.resume();})}{game.view&&item('Archivieren…',()=>openDialog('archive'))}{item('Spielerdaten…',()=>openDialog('profile'))}{item('Beenden…',()=>openDialog('exit'))}</>,
    Jass: <>{item('Neuer Schieber…', () => setNewGame('schieber'))}{item('Neuer Differenzler…', () => setNewGame('differ'))}{item('Kartenverteilungen…',()=>openDialog('seed'))}{game.view&&<>{item('Computer Schnellspiel…',()=>openDialog('auto'))}{item('Gespräche…',()=>openDialog('say'))}{item('Spielstand…',()=>openDialog('results'))}{game.view.phase==='done'&&item('Revanche…',()=>openDialog('rematch'))}</>}{item('Gespielte Jass…', () => setMatchHistory(true))}{item('Bestenliste…',()=>openDialog('highscores'))}{activeKind==='differ'&&item('Ranglistenname…',()=>openDialog('highname'))}{item('Statistik…',()=>openDialog('statistics'))}</>,
    Einstellungen: <>{item('Allgemein…',()=>openDialog('preferences-general'))}{item('Regeln…',()=>openDialog('preferences-rules'),undefined,Boolean(game.view&&game.view.phase!=='done'))}{item('Darstellungen…',()=>openDialog('preferences-display'))}</>,
    Browser: <>
      {item('Lowlevel menu',()=>setLowLevel(value=>!value),lowLevel)}
      <hr />
      {item('Verbesserte Grafik', () => setArtwork('enhanced'), artwork === 'enhanced')}
      {item('Originalgrafik', () => setArtwork('original'), artwork === 'original')}
      <hr />
      {item('Adaptive resolution', () => setFit(true), fit)}
      {item('Fixed resolution',()=>setFit(false),!fit)}
    </>,
    Hilfe: <>{item('Über Stöck Wyys Stich…', () => openDialog('about'))}{item('Entwicklungsteam…',()=>openDialog('team'))}{item('Graphik design…',()=>openDialog('publisher'))}{item('Herausgeber…',()=>window.open('https://www.optobyte.ch','_blank','noopener,noreferrer'))}{item('Puzzle…',()=>openDialog('puzzle'))}</>,
  };

  return <main className="application" style={{ '--scene-width': `${tableSize.width * scale}px` }}>
    {!showWelcome&&<nav className="menu-bar" aria-label="Hauptmenü" ref={navigation}>
      {Object.entries(menus).map(([name, content]) => <div className="menu" key={name}>
        <button type="button" className={`menu-title ${menu === name ? 'active' : ''}`} aria-expanded={menu === name}
          aria-controls={`menu-${name}`} onClick={() => setMenu(menu === name ? null : name)}>{name}</button>
        {menu === name && <div id={`menu-${name}`} className="menu-popup" aria-label={name}>{content}</div>}
      </div>)}
    </nav>}
    {reviewEnabled && <CardReviewControls review={review} />}
    {showWelcome?<WelcomePanel lowLevel={lowLevel} onNew={setNewGame} onResume={game.resume} scale={fit?Math.min((viewport.width-24)/430,(viewport.height-(lowLevel?70:24))/432):1}/>:<div ref={sceneRef} className="scene-frame" style={{ width: tableSize.width * scale + 4, height: tableSize.height * scale + 4 }}>
      <canvas ref={canvas} data-animation={game.animation?.type||'none'} data-ready={Boolean(assets && (!reviewEnabled || review.sheet))} data-artwork={artwork} data-game-kind={activeKind} data-scale={scale} data-resolution={fit?'adaptive':'fixed'} data-card-size={cardSize}
        style={{ width: tableSize.width * scale, height: tableSize.height * scale }}
        role="img" aria-label={reviewEnabled ? "Schieber-Spieltisch mit Karten-Vorschau" : displayView ? `${displayView.kind === 'differ' ? 'Differenzler' : 'Schieber'}-Spieltisch, Runde ${displayView.roundNumber}` : `${activeKind==='differ'?'Differenzler':'Schieber'}-Spieltisch`}>
        Schieber-Spieltisch mit Schreibblock und Spieltafel.
      </canvas>
      {!reviewEnabled&&!replay.view&&game.animation&&<CardMotionLayer animation={game.animation} sheets={sheets} size={tableSize} scale={scale} pixelRatio={viewport.dpr} onComplete={game.finishAnimation}/>}
      {reviewEnabled && assets && <CardTargets review={review} scale={scale} canvas={canvas} />}
      {!reviewEnabled && !replay.view && game.view && <GameCardTargets game={game} sheet={sheets.V} scale={scale} size={tableSize} setId={cardSet} />}
      {!reviewEnabled&&!replay.view&&game.view&&<TablePlayers view={game.animation?.type==='collect'?game.animation.before:game.view} scale={scale} size={tableSize}/>}
      {!reviewEnabled&&!replay.view&&game.view&&<DifferPoints view={game.view} scale={scale} size={tableSize}/>}
      {!reviewEnabled&&!replay.view&&game.view&&<GameFeed key={game.saved()?.options.id||'game'} view={game.view} scale={scale} size={tableSize} setId={cardSet} cardHeight={sheets.V?.cards[0].rect.height} messages={messages} duration={preferences.viewBubbleS??5}/>}
      {!reviewEnabled&&!replay.view&&joker&&<button type="button" className="table-joker" aria-label="Joker: Ratschlag" title="Ratschlag" disabled={!canHint} style={{left:joker.x*scale,top:joker.y*scale,width:joker.width*scale,height:joker.height*scale}} onPointerDown={()=>setJokerPressed(true)} onPointerUp={()=>setJokerPressed(false)} onPointerLeave={()=>setJokerPressed(false)} onPointerCancel={()=>setJokerPressed(false)} onClick={()=>{setJokerPressed(false);game.getHint();}}><canvas ref={jokerCanvas} aria-hidden="true" style={{width:'100%',height:'100%'}}/></button>}
      {!reviewEnabled&&!replay.view&&game.view?.pause&&!game.busy&&!game.paused&&!game.automatic&&<button type="button" className="trick-clear-target" aria-label="Stich auf dem Tisch abräumen" onClick={()=>game.action({type:'continue'})}/>}
      {!reviewEnabled&&!replay.view&&game.view?.phase==='deal'&&!game.view.pause&&!game.busy&&!game.paused&&!game.automatic&&<button type="button" className="trick-clear-target" aria-label="Nächste Runde durch Klick auf den Tisch" onClick={()=>game.action({type:'deal'})}/>}
      {!assets && !error && <p className="loading" role="status">Tisch wird geladen…</p>}
    </div>}
    {!reviewEnabled && !showWelcome && (replay.view ? <LegacyReplay lowLevel={lowLevel} replay={replay} setId={cardSet} /> : <GameControls sceneRef={sceneRef} lowLevel={lowLevel} key={game.view?(game.saved()?.options.id||game.view.kind):'idle'} game={game} onNew={setNewGame} onDialog={openDialog} displayScale={scale}/>)}

    {newGame && <GameSetup key={newGame} kind={newGame} setId={cardSet} settings={settings} onSettings={applySettings} displayScale={scale} onClose={() => setNewGame(null)} onStart={options => { setStartingKind(options.kind);replay.close();game.start({...options,...(dealSeed!==null?{seed:dealSeed}:{})});setMessages([]); setNewGame(null); }} />}
    {matchHistory && <MatchHistory scale={scale} onClose={() => setMatchHistory(false)} />}
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
    {activeDialog?.startsWith('preferences-')&&<PreferencesDialog key={activeDialog} title={{'preferences-general':'Allgemein','preferences-rules':'Regeln','preferences-display':'Darstellungen'}[activeDialog]} kind={activeKind} rules={game.view&&game.view.phase!=='done'?game.view.rules:loadRules(activeKind,activeKind==='differ'?DifferRules():SchieberRules())} locked={Boolean(game.view&&game.view.phase!=='done')} initialTab={{'preferences-general':0,'preferences-rules':1,'preferences-display':2}[activeDialog]} settings={settings} onSettings={applySettings} onApply={rules=>{if(activeDialog==='preferences-rules')saveRules(activeKind,rules);closeDialog();}} onClose={closeDialog} scale={scale}/>}
    {activeDialog==='profile'&&<ProfileDialog kind={activeKind} onClose={closeDialog} scale={scale}/>}
    {activeDialog==='seed'&&<SeedDialog kind={activeKind} seed={dealSeed} onClose={closeDialog} onApply={seed=>{setDealSeed(seed);closeDialog();}} scale={scale}/>}
    {['about','exit'].includes(activeDialog)&&<AboutDialog kind={activeKind} exit={activeDialog==='exit'} onSave={game.download} onEnd={closeGame} onClose={closeDialog} scale={scale}/>}
    {activeDialog==='results'&&<ResultsDialog game={game} onClose={closeDialog} scale={scale}/>}
    {activeDialog==='information'&&information[0]&&<InformationDialog key={`${information[0].type}/${information[0].view.roundNumber}`} notice={information[0]} onClose={nextInformation} scale={scale}/>}
    {activeDialog==='highscores'&&<HighScoresDialog kind={activeKind} onClose={closeDialog} scale={scale}/>}
    {activeDialog==='statistics'&&<StatisticsDialog kind={activeKind} game={game} onClose={closeDialog} scale={scale}/>}
    {activeDialog==='say'&&<ConversationDialog kind={activeKind} onSay={text=>setMessages(m=>m.concat({id:crypto.randomUUID(),kind:'say',player:game.view.human,text,after:game.view.feed.at(-1)?.id||0}))} onClose={closeDialog} scale={scale}/>}
    {activeDialog==='archive'&&<ArchiveDialog kind={activeKind} game={game} onClose={closeDialog} scale={scale}/>}
    {activeDialog==='auto'&&<AutoPlayDialog kind={activeKind} onApply={(count,speed)=>{closeDialog();game.setSpeed(speed);game.setPaused(false);game.playSeries(count);if(speed<=50)setActiveDialog('fast');}} onClose={closeDialog} scale={scale}/>}
    {['forfeit','rematch'].includes(activeDialog)&&<ConfirmDialog kind={activeKind} action={activeDialog} onConfirm={()=>{closeDialog();if(activeDialog==='forfeit')game.action({type:'forfeit'});else game.start({...game.saved().options,id:crypto.randomUUID(),seed:crypto.getRandomValues(new Uint32Array(1))[0]%2147483646+1});}} onClose={closeDialog} scale={scale}/>}
    {['team','publisher','intro'].includes(activeDialog)&&<LegacyDialog kind={activeKind} form={{team:'TTEAMDLG',publisher:'THPDLG',intro:'TINTRODLG'}[activeDialog]} title={{team:'Entwicklungsteam',publisher:'Graphik design',intro:'Stöck Wyys Stich'}[activeDialog]} onClose={closeDialog} scale={scale}/>}
    {activeDialog==='puzzle'&&<PuzzleDialog onClose={closeDialog} scale={scale}/>}
    {activeDialog==='highname'&&<HighNameDialog onClose={closeDialog} scale={scale}/>}
    {activeDialog==='fast'&&game.view&&<FastPlayDialog game={game} onClose={()=>{setActiveDialog(null);game.setAutomatic(false);}} scale={scale}/>}
    {activeDialog==='art'&&<AssetLibraryDialog onClose={closeDialog} scale={scale}/>}
  </main>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
