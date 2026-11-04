// Resource arithmetic from Schieber/Differ PCMEDIA.PAS. IDs are original WAV IDs.
const clip = (folder, first, variants = 1) => ({ folder, first, variants });
const voiceFolder = voice => `STIMME${voice}`;
const cardsFolder = (voice, set) => `${set === 1 ? 'DEUTSCH' : 'FRANZ'}/STIMME${voice}`;

export function speechForAction(action, view, settings) {
  const voice = settings.voice, base = 5000 + (voice - 1) * 1000;
  if (!action) return [];
  if (action.command === 'cmdShift') return [clip(voiceFolder(voice), base + 800, 10)];
  if (action.command === 'cmdTrump') {
    const trump = action.data.fTrump;
    return [clip(trump < 5 ? cardsFolder(voice, settings.set) : voiceFolder(voice), base + 800 + trump * 10, 10)];
  }
  if (action.command === 'cmdCall') {
    const { fPlayer, fCall } = action.data;
    // Never announce a computer prediction that is still hidden on the table.
    if (view.calls?.[fPlayer] !== fCall) return [];
    return [...(fCall > 20 ? [clip(voiceFolder(voice), base + 8170, 10)] : []), clip(voiceFolder(voice), base + 8000 + fCall)];
  }
  return [];
}

export function speechForHint(hint, settings) {
  if (!hint) return [];
  const { command, data } = hint;
  if (command === 'cmdCard') return [clip(cardsFolder(1, settings.set), 3300 + data.fCard)];
  if (command === 'cmdShift') return [clip('STIMME1', 3180, 10)];
  if (command === 'cmdTrump') return [clip(data.fTrump < 5 ? cardsFolder(1, settings.set) : 'STIMME1', 3190 + (data.fTrump - 1) * 10, 10)];
  if (command === 'cmdCall') return [clip('STIMME1', 3001, data.fCall < 20 ? 1 : 4), clip('STIMME1', 3010 + data.fCall)];
  return [];
}
