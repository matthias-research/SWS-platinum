// PCMedia.pas resource IDs. Recordings are fetched only when requested.
const base = `${import.meta.env.BASE_URL}assets/audio/`;
let files;
let generation = 0;
const playing = new Set();
async function available() {
  if (!files) files = fetch(`${base}index.json`).then(r => r.json()).then(paths => new Set(paths));
  return files;
}
export function stopAudio() { generation++; for (const audio of playing) audio.pause(); playing.clear(); }
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
  else if (action.command === 'cmdTrump' || action.command === 'cmdShift') {
    const voice = settings.voice, trump = action.data.fTrump ?? 0;
    const folder = trump > 0 && trump < 5 ? `${settings.set === 1 ? 'DEUTSCH' : 'FRANZ'}/STIMME${voice}` : `STIMME${voice}`;
    playOriginal(folder, 5000 + (voice - 1) * 1000 + 800 + trump * 10, 10, settings.volume);
  }
}
