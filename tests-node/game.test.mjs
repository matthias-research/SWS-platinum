import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/engine/game.js';
import { SchieberAI } from '../src/ai/schieber.js';
import { DifferAI } from '../src/ai/differ.js';
const schieber = await readFile('public/assets/ai/RUGD7000.DAT');
const differ = await readFile('public/assets/ai/RGDIFF.DAT');
const tables = { call: await readFile('public/assets/ai/Hcall.dat'), play: await readFile('public/assets/ai/HPLAY.DAT'), trashy: await readFile('public/assets/ai/TRASHY.DAT') };
const factory = kind => kind === 'schieber' ? new SchieberAI(schieber) : new DifferAI(differ);

for(const mode of [0,1,2])test(`public feed respects Differenzler prediction visibility mode ${mode}`,()=>{
  const game=new Game({kind:'differ',seed:37,human:3,rules:{fCallMode:mode,fRoundLimit:1}},factory('differ'));
  game.act({type:'deal'});let calls=0;
  while(game.phase==='call'){
    game.computer();calls++;
    const published=game.view().feed.filter(e=>e.kind==='call');
    if(mode===0||mode===1&&game.phase==='call')assert.ok(published.every(e=>e.player===3));
    else assert.equal(published.length,calls);
  }
  while(game.phase!=='done'){if(game.pause)game.act({type:'continue'});else game.computer();}
  assert.equal(game.view().feed.filter(e=>e.kind==='call').length,4);
  assert.deepEqual(Game.restore(JSON.parse(JSON.stringify(game.save())),factory('differ')).view().feed,game.view().feed);
});

test('individual setup strengths reach the AI and survive save restoration', () => {
  const levels=[0,0,50,0,99], seen=[];
  const ai={notify:(command,data)=>seen.push({command,data})};
  const game=new Game({kind:'schieber',levels},ai);
  assert.deepEqual(seen[0].data.fLevel,levels);
  const restored=[];
  Game.restore(JSON.parse(JSON.stringify(game.save())),{notify:(command,data)=>restored.push({command,data})});
  assert.deepEqual(restored[0].data.fLevel,levels);
  assert.throws(()=>new Game({kind:'schieber',levels:[0,0,50,0,100]},ai),/Spielstärken/);
});

for (const kind of ['schieber', 'differ']) for (const count of kind === 'differ' ? [3, 4] : [4]) {
  test(`${kind}, ${count} players: original AI completes a match; save/replay stays exact`, () => {
    const game = new Game({ kind, seed: 37, leading: 3, level: 66,
      rules: { fPointPlay: false, fRoundLimit: 3, fNuPlayers: count } }, factory(kind));
    let actions = 0;
    while (game.phase !== 'done') {
      if (game.phase === 'deal') game.act({ type: 'deal' });
      else if (game.pause) game.act({ type: 'continue' });
      else game.computer();
      assert(++actions < 500);
    }
    assert.equal(game.history.length, 3);
    assert.equal(game.journal.filter(a => a.command === 'cmdCard').length, 108);
    const saved = JSON.parse(JSON.stringify(game.save()));
    const restored = Game.restore(saved, factory(kind));
    assert.deepEqual(restored.view(), game.view());
  });
}

test('command boundary rejects out-of-turn cards and repeated dealing without mutation', () => {
  const game = new Game({kind:'schieber'}, factory('schieber'));
  game.act({type:'deal'});
  const before = structuredClone(game.state);
  assert.throws(() => game.act({type:'deal'}));
  assert.throws(() => game.submit('cmdCard',{fPlayer:2,fCard:1}));
  assert.deepEqual(game.state,before);
});

for (const kind of ['schieber', 'differ']) for (const level of [33, 99]) test(`${kind}: original AI level ${level}, ten varied rounds`, () => {
  const game = new Game({ kind, seed: 1279 + level, level, rules: { fRoundLimit: 10, fPointPlay: false, fCallMode: 2 } }, factory(kind));
  let steps = 0;
  while (game.phase !== 'done') {
    if (game.phase === 'deal') game.act({type:'deal'});
    else if (game.pause) game.act({type:'continue'});
    else game.computer();
    assert(++steps < 1000);
  }
  assert.equal(game.history.length, 10);
});

for (const kind of ['schieber', 'differ']) test(`${kind}: restoring mid-round also restores future AI decisions`, () => {
  const game = new Game({kind,seed:138,level:99,rules:{fPointPlay:false,fRoundLimit:2}},factory(kind));
  game.act({type:'deal'});
  while(game.journal.filter(a=>a.command==='cmdCard').length<13) {
    if(game.pause) game.act({type:'continue'}); else game.computer();
  }
  const restored=Game.restore(JSON.parse(JSON.stringify(game.save())),factory(kind));
  while(game.phase!=='done') {
    if(game.phase==='deal') {game.act({type:'deal'});restored.act({type:'deal'});}
    else if(game.pause) {game.act({type:'continue'});restored.act({type:'continue'});}
    else {game.computer();restored.computer();}
    assert.deepEqual(restored.view(),game.view());
  }
});

for (const family of ['hacker','trashy']) for (const count of [3,4]) for (const mode of [0,1,2]) test(`${family}: ${count} players, call mode ${mode}`, () => {
  const game = new Game({kind:'differ',family,seed:789+mode,level:99,rules:{fNuPlayers:count,fCallMode:mode,fRoundLimit:4}},new DifferAI(differ,family,tables));
  let steps=0;
  while(game.phase!=='done') {
    if(game.phase==='deal') game.act({type:'deal'});
    else if(game.pause) game.act({type:'continue'});
    else game.computer();
    assert(++steps<600);
  }
  assert.equal(game.history.length,4);
});

for(const kind of ['schieber','differ']) test(`${kind}: forfeiting completes the round once and can replay`,()=>{
  const game=new Game({kind,rules:{fPointPlay:false,fRoundLimit:1}},factory(kind));
  game.act({type:'deal'});game.act({type:'forfeit'});
  assert.equal(game.phase,'done');assert.equal(game.history.length,1);
  if(kind==='differ') assert.equal(game.state.fTotal[3],39);
  else assert(game.state.fPoints[2]>game.state.fPoints[1]);
  assert.deepEqual(Game.restore(JSON.parse(JSON.stringify(game.save())),factory(kind)).view(),game.view());
});
