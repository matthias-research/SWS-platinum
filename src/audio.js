// PCMedia.pas resource IDs. Recordings are fetched only when requested.
import { speechForAction, speechForHint } from './audioCues';
const base = `${import.meta.env.BASE_URL}assets/audio/`;
let files;
let generation = 0;
const playing = new Set();
let speechGeneration = 0, cancelSpeech;
async function available() {
  if (!files) files = fetch(`${base}index.json`).then(r => r.json()).then(paths => new Set(paths));
  return files;
}
export function stopAudio() { generation++; stopSpeech(); for (const audio of playing) audio.pause(); playing.clear(); }
function stopSpeech() { speechGeneration++; cancelSpeech?.(); cancelSpeech = null; }
async function speak(cues, volume) {
  stopSpeech();
  const requested = speechGeneration;
  if (!cues.length) return;
  try {
    const paths = await available();
    for (const cue of cues) {
      if (requested !== speechGeneration) return;
      const choices = Array.from({ length: cue.variants }, (_, i) => `${cue.folder}/${cue.first + i}.mp3`).filter(p => paths.has(p));
      if (!choices.length) continue;
      const audio = new Audio(base + choices[Math.floor(Math.random() * choices.length)]);
      audio.volume = volume;
      await new Promise(resolve => {
        const finish = () => { audio.pause(); if (cancelSpeech === finish) cancelSpeech = null; resolve(); };
        cancelSpeech = finish; audio.onended = finish; audio.onerror = finish;
        audio.play().catch(finish);
      });
    }
  } catch { /* Optional speech must not interrupt the game. */ }
}
export function soundForHint(hint, settings) {
  if (settings.enabled) speak(speechForHint(hint, settings), settings.volume);
}
export async function playOriginal(folder, first, variants = 1, volume = 0.6) {
  const requestedGeneration = generation;
  try {
    const paths = await available();
    if (requestedGeneration !== generation) return;
    const choices = Array.from({ length: variants }, (_, i) => `${folder}/${first + i}.mp3`).filter(p => paths.has(p));
    if (!choices.length) return;
    const audio = new Audio(base + choices[Math.floor(Math.random() * choices.length)]);
    audio.volume = volume; playing.add(audio);
    audio.onended = () => playing.delete(audio); audio.onerror = () => playing.delete(audio);
    await audio.play();
  } catch { /* Browser audio policy or missing optional recording must never stop play. */ }
}
export function soundForAction(action, view, settings) {
  if (!settings.enabled || !action) return;
  if (action.type === 'deal') playOriginal('ANDERE', 1100, 10, settings.volume);
  else if (action.type === 'continue') playOriginal('ANDERE', 1250, 10, settings.volume);
  else if (action.command === 'cmdCard') playOriginal('ANDERE', view.phase === 'done' ? 1350 : 1200, 10, settings.volume);
  speak(speechForAction(action, view, settings), settings.volume);
}
