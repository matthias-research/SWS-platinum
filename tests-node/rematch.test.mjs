import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rematchOptions} from '../src/rematch.js';

test('Schieber starter follows next/losers rule for every seat and winning team',()=>{
  for(const leading of [1,2,3,4])for(const winner of [0,1,2])for(const losers of [true,false]){
    const options={kind:'schieber',id:'old',seed:7,leading,human:3,characters:[0,0,1,0,3],levels:[0,99,66,99,33],avatar:5208};
    const view={kind:'schieber',count:4,winner,rules:{fLooserBegins:losers},names:['','A','B','C','D']};
    const result=rematchOptions(options,view);
    let expected=leading%4+1;
    if(losers&&winner&&(expected%2?1:2)===winner)expected=expected%4+1;
    assert.equal(result.leading,expected);
    assert.deepEqual(result.characters,options.characters);assert.deepEqual(result.levels,options.levels);
    assert.deepEqual(result.rules,view.rules);assert.deepEqual(result.names,view.names);
    assert.equal(result.human,3);assert.equal(result.avatar,5208);
    assert.notEqual(result.id,options.id);assert.ok(result.seed>0&&result.seed<=2147483646);
    assert.equal(options.leading,leading);
  }
});
test('Differenzler rotates within its three or four players',()=>{
  for(const count of [3,4])for(let leading=1;leading<=count;leading++){
    const view={kind:'differ',count,rules:{fNuPlayers:count},names:['','A','B','C','D']};
    assert.equal(rematchOptions({kind:'differ',leading},view).leading,leading%count+1);
  }
});
