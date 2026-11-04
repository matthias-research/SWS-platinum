import { useEffect, useRef, useState } from 'react';
import { soundForAction, soundForHint, stopAudio } from './audio';
function soundPreferences() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem('sws-sound') || '{}'); } catch {}
  return { enabled: saved?.enabled === true, volume: Number.isFinite(saved?.volume) ? Math.max(0, Math.min(1, saved.volume)) : 0.6,
    voice: [3, 4, 5, 6].includes(saved?.voice) ? saved.voice : 3, set: 1,
    noise:saved?.noise!==false,calls:saved?.calls!==false,hints:saved?.hints!==false,own:saved?.own!==false };
}
export function useGame() {
  const worker = useRef(null), latest = useRef(null), sequence = useRef(0);
  const [view, setView] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [automatic, setAutomatic] = useState(false), [speed, setSpeed] = useState(650);
  const [series,setSeries]=useState(1);
  const [paused, setPaused] = useState(false), [hint, setHint] = useState(null);
  const [sound, setSound] = useState(soundPreferences);
  useEffect(() => { try { localStorage.setItem('sws-sound', JSON.stringify(sound)); } catch {} }, [sound]);
  const soundRef = useRef(sound); soundRef.current = sound;
  function send(message, restart = false) {
    if (restart || !worker.current) {
      if (restart) { stopAudio(); setView(null); setHint(null); setPaused(false); }
      worker.current?.terminate(); worker.current = new Worker(new URL('./game.worker.js', import.meta.url), { type: 'module' });
      worker.current.onmessage = ({ data }) => {
        setBusy(false);
        if(data.archive){const url=URL.createObjectURL(new Blob([JSON.stringify(data.archive)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='jass.sws-archive.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
        if (data.error) { setError(data.error); setAutomatic(false); return; }
        setView(data.view); latest.current = data.saved;
        setHint(data.hint);
        soundForAction(data.soundAction, data.view, soundRef.current);
        if (data.hint) soundForHint(data.hint, soundRef.current);
        try {
          localStorage.setItem('sws-game', JSON.stringify(data.saved));
          if (data.view.phase === 'done' && data.saved.options.id) {
            const history = JSON.parse(localStorage.getItem('sws-history') || '[]');
            if (!history.some(h=>h.id===data.saved.options.id)) {
              history.unshift({id:data.saved.options.id,date:new Date().toISOString(),kind:data.view.kind,names:data.view.names,scores:data.view.scores,ranks:data.view.ranks,winner:data.view.winner,rounds:data.view.history,
                computerAssisted:data.saved.actions.some(a=>a.source==='computer'&&a.data?.fPlayer===data.view.human)});
              localStorage.setItem('sws-history',JSON.stringify(history.slice(0,100)));
            }
          }
        } catch { /* Manual export remains available. */ }
      };
      worker.current.onerror = e => { setError(e.message || 'Der Computer-Spieler konnte nicht geladen werden.'); setBusy(false); setAutomatic(false); };
    }
    setBusy(true); setError(''); worker.current.postMessage({ ...message, id: ++sequence.current,
      assetBase: new URL(`${import.meta.env.BASE_URL}assets/ai/`, document.baseURI).href });
  }
  useEffect(() => () => { worker.current?.terminate(); stopAudio(); }, []);
  useEffect(() => {
    if (!view || busy || error || paused) return;
    let message;
    if (view.phase === 'done') {
      if(automatic&&series>1){const timer=setTimeout(()=>{setSeries(n=>n-1);send({type:'new',options:{...latest.current.options,id:crypto.randomUUID(),seed:crypto.getRandomValues(new Uint32Array(1))[0]%2147483646+1}},true);},speed);return()=>clearTimeout(timer);}
      return;
    }
    if (view.phase === 'deal' && automatic) message = { type: 'action', action: { type: 'deal' } };
    else if (view.pause && automatic) message = { type: 'action', action: { type: 'continue' } };
    else if (view.request && (automatic || view.request.player !== view.human)) message = { type: 'computer' };
    if (message) { const timer = setTimeout(() => send(message), speed); return () => clearTimeout(timer); }
  }, [view, busy, automatic, speed, error, paused,series]);
  return { view, busy, error, automatic, setAutomatic, speed, setSpeed, paused, setPaused, hint,series,
    end:()=>{worker.current?.terminate();worker.current=null;stopAudio();setView(null);setHint(null);setAutomatic(false);setPaused(false);},
    saved: () => latest.current,
    archive: (title,scope) => send({type:'archive',title,scope}),
    playSeries: count=>{setSeries(count);setAutomatic(true);},
    sound, setSound: value => { if (!value.enabled) stopAudio(); setSound(value); },
    getHint: () => send({type:'hint'}), undo: () => { stopAudio(); setAutomatic(false); send({type:'undo'}); },
    start: options => { setSeries(1);setAutomatic(false); setPaused(false); send({ type: 'new', options }, true); },
    action: action => send({ type: 'action', action }),
    answer: (command, data = {}) => send({ type: 'action', action: { type: 'answer', command, data: { fPlayer: view.request.player, ...data } } }),
    restore: saved => { setAutomatic(false); send({ type: 'restore', saved }, true); },
    resume: () => { try { const saved = JSON.parse(localStorage.getItem('sws-game')); if (!saved) throw new Error('Kein gespeichertes Spiel vorhanden.'); send({ type: 'restore', saved }, true); } catch (e) { setError(e.message); } },
    download: () => {
      if (!latest.current) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify(latest.current)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `${view.kind}.sws.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } };
}
