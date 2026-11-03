import { useEffect, useRef, useState } from 'react';
import { soundForAction, stopAudio } from './audio';
export function useGame() {
  const worker = useRef(null), latest = useRef(null), sequence = useRef(0);
  const [view, setView] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [automatic, setAutomatic] = useState(false), [speed, setSpeed] = useState(650);
  const [paused, setPaused] = useState(false), [hint, setHint] = useState(null);
  const [sound, setSound] = useState({ enabled: false, volume: 0.6, voice: 3, set: 1 });
  const soundRef = useRef(sound); soundRef.current = sound;
  function send(message, restart = false) {
    if (restart || !worker.current) {
      if (restart) { setView(null); setHint(null); setPaused(false); }
      worker.current?.terminate(); worker.current = new Worker(new URL('./game.worker.js', import.meta.url), { type: 'module' });
      worker.current.onmessage = ({ data }) => {
        setBusy(false);
        if (data.error) { setError(data.error); setAutomatic(false); return; }
        setView(data.view); latest.current = data.saved;
        setHint(data.hint);
        soundForAction(data.soundAction, data.view, soundRef.current);
        try {
          localStorage.setItem('sws-game', JSON.stringify(data.saved));
          if (data.view.phase === 'done' && data.saved.options.id) {
            const history = JSON.parse(localStorage.getItem('sws-history') || '[]');
            if (!history.some(h=>h.id===data.saved.options.id)) {
              history.unshift({id:data.saved.options.id,date:new Date().toISOString(),kind:data.view.kind,names:data.view.names,scores:data.view.scores,ranks:data.view.ranks,winner:data.view.winner,
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
  useEffect(() => () => worker.current?.terminate(), []);
  useEffect(() => {
    if (!view || busy || error || paused) return;
    let message;
    if (view.phase === 'done') return;
    if (view.phase === 'deal' && automatic) message = { type: 'action', action: { type: 'deal' } };
    else if (view.pause && automatic) message = { type: 'action', action: { type: 'continue' } };
    else if (view.request && (automatic || view.request.player !== view.human)) message = { type: 'computer' };
    if (message) { const timer = setTimeout(() => send(message), speed); return () => clearTimeout(timer); }
  }, [view, busy, automatic, speed, error, paused]);
  return { view, busy, error, automatic, setAutomatic, speed, setSpeed, paused, setPaused, hint,
    sound, setSound: value => { if (!value.enabled) stopAudio(); setSound(value); },
    getHint: () => send({type:'hint'}), undo: () => { setAutomatic(false); send({type:'undo'}); },
    start: options => { setAutomatic(false); setPaused(false); send({ type: 'new', options }, true); },
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
