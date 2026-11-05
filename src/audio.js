// PCMedia.pas resource IDs. Recordings are fetched only when requested.
import { speechForAction, speechForHint, speechForComment } from './audioCues';
const base = `${import.meta.env.BASE_URL}assets/audio/`;
let files;
let generation = 0;
const playing = new Set();
const speechQueue = [], speechListeners = new Set();
let activeSpeech = null, drainingSpeech = false;
export const speechBusy = () => Boolean(speechQueue.length || (activeSpeech && !activeSpeech.cancelled));
export const subscribeSpeech = listener => { speechListeners.add(listener); return () => speechListeners.delete(listener); };
const changedSpeech = () => { for (const listener of speechListeners) listener(); };
async function available() {
  if (!files) files = fetch(`${base}index.json`).then(r => r.json()).then(paths => new Set(paths));
  return files;
}
export function stopAudio() { generation++; stopSpeech(); for (const audio of playing) audio.pause(); playing.clear(); }
function stopSpeech(kind) {
  for (let i = speechQueue.length - 1; i >= 0; i--) if (!kind || speechQueue[i].kind === kind) speechQueue.splice(i, 1);
  if (activeSpeech && (!kind || activeSpeech.kind === kind)) { activeSpeech.cancelled = true; activeSpeech.finish?.(); }
  changedSpeech();
}
export function configureAudio(settings) {
  if (!settings.enabled) { stopAudio(); return; }
  if (settings.comments === false) stopSpeech('comment');
  if (settings.calls === false) stopSpeech('call');
  if (settings.own === false) stopSpeech('own');
  if (settings.hints === false) stopSpeech('hint');
}
async function drainSpeech() {
  if (drainingSpeech) return;
  drainingSpeech = true;
  try {
    while (speechQueue.length) {
      const job = activeSpeech = speechQueue.shift();
      try {
        const paths = await available();
        for (const cue of job.cues) {
          if (job.cancelled) break;
          const choices = Array.from({ length: cue.variants }, (_, i) => `${cue.folder}/${cue.first + i}.mp3`).filter(p => paths.has(p));
          if (!choices.length) continue;
          const audio = new Audio(base + choices[Math.floor(Math.random() * choices.length)]);
          audio.volume = job.volume;
          await new Promise(resolve => {
            const finish = () => { audio.pause(); job.finish = null; resolve(); };
            job.finish = finish; audio.onended = finish; audio.onerror = finish;
            audio.play().catch(finish);
          });
        }
      } catch { /* Optional speech must not interrupt the game. */ }
      activeSpeech = null;
    }
  } finally { activeSpeech = null; drainingSpeech = false; changedSpeech(); }
}
function speak(cues, volume, kind) {
  if (!cues.length) return;
  speechQueue.push({cues, volume, kind, cancelled:false});
  changedSpeech();
  void drainSpeech();
}
export function soundForHint(hint, settings) {
  if (settings.enabled&&settings.hints!==false) { stopSpeech(); speak(speechForHint(hint, settings), settings.volume, 'hint'); }
}
export function soundForComments(events, settings) {
  if (!settings.enabled || settings.comments === false) return;
  for (const event of events) speak(speechForComment(event), settings.volume, 'comment');
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
  if (settings.noise!==false) {
    if (action.type === 'deal') playOriginal('ANDERE', 1100, 10, settings.volume);
    else if (action.type === 'continue') playOriginal('ANDERE', 1250, 10, settings.volume);
    else if (action.command === 'cmdCard') playOriginal('ANDERE', view.phase === 'done' ? 1350 : 1200, 10, settings.volume);
  }
  const own=action.data?.fPlayer!==undefined&&action.data.fPlayer===view.human;
  speak((own?settings.own!==false:settings.calls!==false)?speechForAction(action, view, settings):[], settings.volume, own?'own':'call');
}
