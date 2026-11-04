import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { speechForAction, speechForHint } from '../src/audioCues.js';
const paths = new Set(JSON.parse(await readFile('public/assets/audio/index.json', 'utf8')));
const settings = {voice:3,set:1};

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
