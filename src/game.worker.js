import { Game } from './engine/game.js';
import {archiveText} from './engine/legacy.js';
let game;
let assetBase;
async function createAI(kind, family) {
  const file = kind === 'schieber' ? 'RUGD7000.DAT' : 'RGDIFF.DAT';
  const response = await fetch(`${assetBase}${file}`);
  if (!response.ok) throw new Error(`Spieldaten fehlen: ${file}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const module = kind === 'schieber' ? await import('./ai/schieber.js') : await import('./ai/differ.js');
  const tables = {};
  const families=Array.isArray(family)?family:[family];
  const extra = [...(families.includes('hacker')?[['call','Hcall.dat'],['play','HPLAY.DAT']]:[]),...(families.includes('trashy')?[['trashy','TRASHY.DAT']]:[])];
  if (kind === 'differ') for (const [key, name] of extra) {
    const response = await fetch(`${assetBase}${name}`);
    if (!response.ok) throw new Error(`Spieldaten fehlen: ${name}`);
    tables[key] = new Uint8Array(await response.arrayBuffer());
  }
  return kind === 'schieber' ? new module.SchieberAI(bytes) : new module.DifferAI(bytes, family, tables);
}
self.onmessage = async ({ data: message }) => {
  try {
    assetBase = message.assetBase;
    if(message.type==='archive'){self.postMessage({id:message.id,archive:{format:'sws-archive',version:1,text:archiveText(game,message.title,message.scope)}});return;}
    let hint = null;
    if (message.type === 'new') {
      game = new Game(message.options, await createAI(message.options.kind, message.options.families??message.options.family));
      game.act({ type: 'deal' });
    } else if (message.type === 'restore') {
      game = Game.restore(message.saved, await createAI(message.saved.options.kind, message.saved.options.families??message.saved.options.family));
    } else if (message.type === 'hint') {
      const copy = Game.restore(game.save(), await createAI(game.kind, game.options.families??game.options.family));
      const request = copy.request();
      if (!request || request.player !== copy.human) throw new Error('Ein Tipp ist nur während Ihres Zuges möglich.');
      const answer = copy.ai.request(request.player, request.command, request.data);
      hint = { command: answer.command, data: { ...answer.data } };
    } else if (message.type === 'undo') {
      const saved = game.save();
      const last = saved.actions.findLastIndex(a => a.type === 'forfeit' || (a.type === 'answer' && a.data.fPlayer === game.human));
      if (last < 0) throw new Error('Es gibt noch keinen eigenen Zug zum Zurücknehmen.');
      saved.actions = saved.actions.slice(0, last);
      game = Game.restore(saved, await createAI(game.kind, game.options.families??game.options.family));
    } else if (message.type === 'computer') game.computer();
    else if (message.type === 'action') game.act(message.action);
    else throw new Error('Unbekannte Anfrage');
    self.postMessage({ id: message.id, view: game.view(), saved: game.save(), hint,
      soundAction: ['computer', 'action', 'new'].includes(message.type) ? game.journal.at(-1) : null });
  } catch (error) { self.postMessage({ id: message.id, error: error.message }); }
};
