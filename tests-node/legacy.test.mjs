import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseLegacy,legacyView,archiveText} from '../src/engine/legacy.js';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';
import {DifferAI} from '../src/ai/differ.js';
const fixtures=JSON.parse(await readFile(new URL('./fixtures/legacy-rounds.json',import.meta.url)));
for(const fixture of fixtures) test(`legacy ${fixture.game}: parse and replay archived cards and scores`,()=>{
  const rules=fixture.game==='schieber'?'pointPlay 2500 1250 12 looserBegins\nsuitsOn allFourOn crossingOn suitsFirst 50 100\n2 2 1 1 3 3':'4 2 delta 2 noBonus 0 1';
  const text=`### Title: Reference\n### Rules:\n${rules}\n${fixture.excerpt}\n`;
  const [game]=parseLegacy(text);
  assert.equal(game.rounds[0].plays.length,36);
  const initial=legacyView(game,0,0),final=legacyView(game,0,36);
  assert.equal(initial.hand.length,9);assert.equal(final.hand.length,0);
  assert.equal(new Set(game.rounds[0].plays.map(p=>p.card)).size,36);
  assert.equal(final.history.length,1);
  if(fixture.game==='schieber') assert.deepEqual(final.scores,[0,178,176]);
  else assert.deepEqual(final.scores,[0,12,15,7,9]);
  assert.equal(parseLegacy(text+text).length,2);
  assert.throws(()=>parseLegacy(text.replace(/->\s*\d+/, '-> 99')));
});
test('unrecognized archives fail explicitly',()=>assert.throws(()=>parseLegacy('Not an archive')));

for(const kind of ['schieber','differ'])test(`${kind}: new archives preserve complete and partial rounds`,async()=>{
  const ai=kind==='schieber'?new SchieberAI(await readFile('public/assets/ai/RUGD7000.DAT')):new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT'));
  const game=new Game({kind,seed:37,rules:{fPointPlay:false,fRoundLimit:2}},ai);
  assert.throws(()=>archiveText(game),/keine Runde/);
  game.act({type:'deal'});
  let checkedEmpty=false,checkedPartial=false,steps=0;
  while(game.phase!=='done'){
    if(game.round.fTrump&&!['deal','done'].includes(game.phase)){
      const parsed=parseLegacy(archiveText(game,'Round trip'))[0],last=parsed.rounds.at(-1);
      if(last.plays.length===0&&!checkedEmpty){assert.equal(legacyView(parsed,parsed.rounds.length-1,0).allHands.flat().filter(Boolean).length,36);checkedEmpty=true;}
      if(last.plays.length>0&&last.plays.length<36&&!checkedPartial){
        const view=legacyView(parsed,parsed.rounds.length-1,last.plays.length);
        for(let p=1;p<=game.count;p++)assert.deepEqual(view.allHands[p].sort((a,b)=>a-b),game.state.fHands[p].filter(Boolean).sort((a,b)=>a-b));checkedPartial=true;
      }
    }
    if(game.phase==='deal')game.act({type:'deal'});else if(game.pause)game.act({type:'continue'});else game.computer();assert(++steps<350);
  }
  const parsed=parseLegacy(archiveText(game))[0];assert.equal(parsed.rounds.length,2);
  assert.deepEqual(legacyView(parsed,1,36).scores,game.view().scores);
  assert.equal(parseLegacy(archiveText(game,'Last','lastRound'))[0].rounds.length,1);
  assert.ok(checkedEmpty&&checkedPartial);
});
