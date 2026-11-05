import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Commentary,entryInfo,talkMode} from '../src/commentary.js';
import catalogs from '../src/commentaryData.js';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';
import {DifferAI} from '../src/ai/differ.js';
const options={kind:'schieber',count:4,human:3,seed:37,characters:[0,0,1,0,2],names:['','Birgit','Beat','Du','Stéphanie']};
const settings={set:1,date:{monthDay:1105,time:1400,weekday:3},elapsedMinutes:0};
const paths=new Set(JSON.parse(await readFile('public/assets/audio/index.json','utf8')));

test('original dialogue uses matching recordings, character voices and mood portraits',()=>{
  const comments=new Commentary(options,settings);comments.notify('cmdNew');
  const greetings=comments.drain();assert.equal(greetings.length,3);
  for(const event of greetings){
    assert.notEqual(event.player,3);assert(!event.text.includes('['));assert(!event.text.includes('@'));
    assert(paths.has(`STIMME${event.voice}/${event.sound}.mp3`));
    assert.equal(event.icon,7102+options.characters[event.player]*1000);
  }
});
test('selection honors game-specific exclusions, gender, time, date, cardset and repetition history',()=>{
  assert.equal(entryInfo('Text [xd]','schieber').disabled,false);
  assert.equal(entryInfo('Text [xd]','differ').disabled,true);
  assert.equal(entryInfo('Text [xs]','schieber').disabled,true);
  const c=new Commentary(options,settings,()=>0);
  assert.equal(c.eligible(entryInfo('Text [f]','schieber'),2,1),true);
  assert.equal(c.eligible(entryInfo('Text [m]','schieber'),2,1),false);
  assert.equal(c.eligible(entryInfo('Text [i2200-0400]','schieber'),1,0),false);
  assert.equal(c.eligible(entryInfo('Text [d1201-1221]','schieber'),1,0),false);
  assert.equal(c.eligible(entryInfo('Text [cf]','schieber'),1,0),false);
  assert.equal(c.eligible(entryInfo('Text [w0123]','schieber'),1,0),true);
  assert.equal(c.eligible(entryInfo('Text [t0n]','schieber'),1,0),false);
  c.triggers.trump=1;
  assert.equal(c.eligible(entryInfo('Text [t0n]','schieber'),1,0),true);
  const selected=[];
  for(let i=0;i<10;i++){assert(c.say(1,0,0,1,3));selected.push(c.pending.get(1).sound);}
  assert.equal(new Set(selected).size,10);
});
test('target substitution and original reply categories preserve the selected voice',()=>{
  const c=new Commentary(options,settings,()=>0);
  const lines=catalogs.schieber[11400];
  // Exercise the original substitution grammar even though this catalog's
  // recorded lines do not use its optional name placeholders.
  lines.push('Danke @0!');
  try{assert(c.say(1,4400,2,1,3,lines.length));}finally{lines.pop();}
  const line=c.pending.get(1);assert(line.text.includes('Beat'));assert(!line.text.includes('@'));
  c.pending.clear();c.reply(2,{fFrom:1,fTo:[2],category:4400,info:{}});
  assert.equal(c.pending.get(2).category,4800);
  assert.equal(c.pending.get(2).voice,4);
});
test('category switches operate independently of spoken-comment preference',()=>{
  assert.equal(talkMode({before:false,during:false,after:false,results:false}),0);
  assert.equal(talkMode({before:false}),13);
  const muted=new Commentary(options,{...settings,comments:false});muted.notify('cmdNew');assert.equal(muted.drain().length,3);
  const disabled=new Commentary(options,{...settings,before:false});disabled.notify('cmdNew');assert.equal(disabled.drain().length,0);
});
for(const kind of ['schieber','differ'])test(`${kind}: commentary leaves deals, AI decisions and scores unchanged and restores deterministically`,async()=>{
  const bytes=await readFile(`public/assets/ai/${kind==='schieber'?'RUGD7000.DAT':'RGDIFF.DAT'}`);
  const ai=()=>kind==='schieber'?new SchieberAI(bytes):new DifferAI(bytes);
  const opts={...options,kind,rules:{fPointPlay:false,fRoundLimit:2}};
  const game=new Game(opts,ai(),settings),silent=new Game(opts,ai());
  let comments=0,last=0;
  while(game.phase!=='done'){
    for(const g of [game,silent]){
      if(g.pause)g.act({type:'continue'});
      else if(g.phase==='deal')g.act({type:'deal'});
      else g.computer();
    }
    comments+=game.feed.filter(e=>e.kind==='say'&&e.id>last).length;last=game.feedSequence;
    assert.deepEqual(game.state,silent.state);
    assert.deepEqual(game.save(),silent.save());
  }
  assert(comments>3);
  const restored=Game.restore(game.save(),ai(),settings);
  assert.deepEqual(restored.view(),game.view());
});
