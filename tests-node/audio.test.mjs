import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { speechForAction, speechForHint, speechForComment } from '../src/audioCues.js';
const paths = new Set(JSON.parse(await readFile('public/assets/audio/index.json', 'utf8')));
const settings = {voice:3,set:1};

test('Weis calls conceal card details until revealed, with original voice and Stöck cues',()=>{
  const view={human:3,characters:[0,1,0,0,2],trump:1,rules:{fSuitsIncrement:50}};
  const suit=(fValue,cards)=>({fCount:1,fCalls:[{fValue,fCards:new Set(cards)}]});
  const announce=(fSuit,player=1,prefs=settings)=>speechForAction({command:'cmdSuit',data:{fPlayer:player,fSuit}},view,prefs);
  assert.deepEqual(announce(suit(154,[])),[{folder:'STIMME4',first:8963,variants:1}]);
  assert.deepEqual(announce(suit(154,[4,13,22,31])),[{folder:'DEUTSCH/STIMME4',first:8953,variants:1}]);
  assert.deepEqual(announce(suit(23,[1,2,3])),[{folder:'DEUTSCH/STIMME4',first:8940,variants:1}]);
  assert.deepEqual(announce(suit(22,[7,8])),[{folder:'STIMME4',first:8969,variants:1}]);
  assert.deepEqual(announce(suit(154,[]),3,{...settings,gender:'male'}),[{folder:'STIMME2',first:4793,variants:1}]);
  assert.deepEqual(announce(suit(154,[4,13,22,31]),3,{...settings,gender:'female',set:2}),[{folder:'FRANZ/STIMME2',first:4283,variants:1}]);
  assert.deepEqual(announce({fCount:0,fCalls:[]}),[]);
  const combined={fCount:2,fCalls:[{fValue:23,fCards:new Set([10,11,12])},{fValue:22,fCards:new Set([7,8])}]};
  const cues=announce(combined);
  assert.deepEqual(cues.map(c=>c.first),[8960,8911,8959,8969]);
  for(const cue of [...cues,...announce(suit(154,[])),...announce(suit(154,[4,13,22,31]))])assert(paths.has(`${cue.folder}/${cue.first}.mp3`),JSON.stringify(cue));
});

test('announcements follow each character regardless of seat or global fallback voice',()=>{
  for(const character of [0,1,2,3])for(const player of [1,2,4]){
    const characters=Array(5).fill(0);characters[player]=character;
    const view={human:3,characters,calls:[0,65,65,65,65]},voice=character+3,base=7000+character*1000;
    for(const set of [1,2]){
      const prefs={voice:6,set};
      assert.deepEqual(speechForAction({command:'cmdTrump',data:{fPlayer:player,fTrump:1}},view,prefs),[{folder:`${set===1?'DEUTSCH':'FRANZ'}/STIMME${voice}`,first:base+810,variants:10}]);
      assert.deepEqual(speechForAction({command:'cmdShift',data:{fPlayer:player}},view,prefs),[{folder:`STIMME${voice}`,first:base+800,variants:10}]);
      assert.deepEqual(speechForAction({command:'cmdCall',data:{fPlayer:player,fCall:65}},view,prefs),[{folder:`STIMME${voice}`,first:base+8170,variants:10},{folder:`STIMME${voice}`,first:base+8065,variants:1}]);
    }
  }
});
test('human announcements use original gender-specific recordings in STIMME2',()=>{
  const view={human:3,characters:[0,0,1,0,2],calls:[0,0,0,65]};
  for(const gender of ['female','male'])for(const set of [1,2]){
    const prefs={...settings,gender,set},base=gender==='female'?4000:4500;
    const trump=speechForAction({command:'cmdTrump',data:{fPlayer:3,fTrump:1}},view,prefs);
    assert.deepEqual(trump,[{folder:'STIMME2',first:base+190,variants:10},{folder:`${set===1?'DEUTSCH':'FRANZ'}/STIMME2`,first:base+200,variants:1}]);
    const call=speechForAction({command:'cmdCall',data:{fPlayer:3,fCall:65}},view,prefs);
    assert.deepEqual(call,[{folder:'STIMME2',first:base+170,variants:10},{folder:'STIMME2',first:base+65,variants:1}]);
    const shift=speechForAction({command:'cmdShift',data:{fPlayer:3}},view,prefs);
    assert.deepEqual(shift,[{folder:'STIMME2',first:base+180,variants:10}]);
    for(const cue of [...trump,...call,...shift])assert(Array.from({length:cue.variants},(_,i)=>paths.has(`${cue.folder}/${cue.first+i}.mp3`)).some(Boolean));
  }
});

test('commentary uses the exact text resource and original character voice',()=>{
  for(const voice of [3,4,5,6]) {
    const sound=5000+(voice-1)*1000+({3:1,4:4,5:2,6:3}[voice]);
    assert.deepEqual(speechForComment({kind:'say',voice,sound}),[{folder:`STIMME${voice}`,first:sound,variants:1}]);
    assert(paths.has(`STIMME${voice}/${sound}.mp3`));
  }
  assert.deepEqual(speechForComment({kind:'say',text:'Manual message'}),[]);
});

test('hidden predictions never produce speech; visible predictions retain phrase order', () => {
  const action={command:'cmdCall',data:{fPlayer:2,fCall:65}};
  assert.deepEqual(speechForAction(action,{calls:[0,-1,-1,50,-1]},settings),[]);
  assert.deepEqual(speechForAction(action,{calls:[0,-1,65,50,-1]},settings),[
    {folder:'STIMME3',first:15170,variants:10},{folder:'STIMME3',first:15065,variants:1}
  ]);
});

test('original hint resources preserve French/German folders and spoken number ordering', () => {
  assert.deepEqual(speechForHint({command:'cmdCard',data:{fCard:28}},settings),[{folder:'DEUTSCH/STIMME1',first:3328,variants:1}]);
  assert.deepEqual(speechForHint({command:'cmdTrump',data:{fTrump:4}},{...settings,set:2}),[{folder:'FRANZ/STIMME1',first:3220,variants:10}]);
  assert.deepEqual(speechForHint({command:'cmdCall',data:{fCall:19}},settings),[{folder:'STIMME1',first:3001,variants:1},{folder:'STIMME1',first:3029,variants:1}]);
});

test('mapped trump, prediction and card-hint groups have packaged recordings', () => {
  const check = cues => { for(const cue of cues) assert(Array.from({length:cue.variants},(_,i)=>`${cue.folder}/${cue.first+i}.mp3`).some(p=>paths.has(p)),JSON.stringify(cue)); };
  for(const voice of [3,4,5,6]) for(const set of [1,2]) {
    for(let trump=1;trump<=6;trump++) check(speechForAction({command:'cmdTrump',data:{fTrump:trump}},{},{voice,set}));
    for(let call=0;call<=157;call++) check(speechForAction({command:'cmdCall',data:{fPlayer:3,fCall:call}},{calls:[0,0,0,call]},{voice,set}));
    for(let card=1;card<=36;card++) check(speechForHint({command:'cmdCard',data:{fCard:card}},{voice,set}));
  }
});
