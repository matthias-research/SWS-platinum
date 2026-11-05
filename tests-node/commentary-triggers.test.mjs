import assert from 'node:assert/strict';
import {CommentaryTriggers,COMMENT_REPLIES} from '../src/commentaryTriggers.js';

function harness(kind='schieber',count=4){
  const calls=[],pending=new Map();
  const commentary={pending,isFemale:p=>p===2,say(...args){calls.push(args);pending.set(args[0],args);return true;}};
  const triggers=new CommentaryTriggers({kind,count,human:3,random:()=>0},commentary);
  return {triggers,calls,pending,clear(){calls.length=0;pending.clear();}};
}
{
  const h=harness();h.triggers.notify('cmdNew',{}, {talkMode:2});
  assert.deepEqual(h.calls.map(c=>c[0]),[1,2,4]);
  assert(h.calls.every(c=>c[1]===0&&c[3]===1));
  h.clear();h.triggers.notify('cmdNew',{}, {talkMode:2});assert.equal(h.calls.length,0,'no repeat greetings within handler lifetime');
  h.triggers.notify('cmdDeal',{fPoints:[0,0,0]},{talkMode:2,leading:3});
  assert.deepEqual(h.calls.map(c=>c.slice(0,4)),[[2,300,4,0.05],[4,300,2,0.05]]);
  h.clear();h.triggers.notify('cmdDeal',{fPoints:[0,0,0]},{talkMode:0});assert.equal(h.calls.length,0);
  h.triggers.notify('cmdTrump',{fPlayer:2,fTrump:1});
  h.triggers.notify('cmdCard',{fPlayer:2,fCard:1},{talkMode:4});
  assert.deepEqual(h.calls.map(c=>c.slice(0,6)),[[1,4850,2,0.05,3,2],[4,4850,2,0.05,0,2]],'gender-specific first-trump comments and partner mood');
}
{
  const h=harness();h.triggers.notify('cmdDeal',{fPoints:[0,400,0]},{talkMode:0});h.clear();
  h.triggers.notify('cmdCount',{fPoints:[0,120,37],fSuitPts:[0,0,0],fMatchBy:0},{talkMode:8});
  assert.deepEqual(h.calls.map(c=>c.slice(0,5)),[[1,4500,3,0.33,4],[2,4600,4,0.66,0],[4,4600,2,0.66,0]]);
  h.clear();h.triggers.notify('cmdBPrice',{fTeam:1},{talkMode:1});
  assert.deepEqual(h.calls.map(c=>c[1]),[4000,4050,4050]);
  h.clear();h.triggers.notify('cmdWinner',{fTeam:1},{talkMode:1});assert.deepEqual(h.calls.map(c=>c[1]),[4100,4150,4150]);
}
{
  const h=harness('differ',3);
  h.triggers.notify('cmdDeal',{fDrawn:1,fTotal:[0,0,0,0,0]},{talkMode:0});
  h.triggers.notify('cmdCall',{fPlayer:1,fCall:40},{recipients:[1]});
  h.triggers.notify('cmdCard',{fPlayer:1,fCard:1},{talkMode:4});
  assert.deepEqual(h.calls.map(c=>c.slice(0,5)),[[1,8300,1,0.1,2]]);
  h.clear();h.triggers.notify('cmdCard',{fPlayer:2,fCard:2},{talkMode:4});
  assert.deepEqual(h.calls.map(c=>c.slice(0,5)),[[2,550,2,0.02,2]]);
  h.clear();h.triggers.notify('cmdCard',{fPlayer:3,fCard:9},{talkMode:0});
  assert.equal(h.triggers.cardCount,0);assert.equal(h.triggers.players[3].points,11);
  h.triggers.notify('cmdCount',{fCall:[0,40,50,67],fMade:[0,40,75,42],fBonus:[0,0,0,0],fCounts:[0,1,1,1]},{talkMode:8});
  assert.deepEqual(h.calls.map(c=>c.slice(0,5)),[[1,4200,1,0.75,4],[2,4700,1,0.4,2]]);
  h.clear();h.triggers.notify('cmdWinner',{fTable:[0,1,3,2]},{talkMode:1});
  assert.deepEqual(h.calls.map(c=>c.slice(0,5)),[[1,4200,1,1,4],[2,4700,1,0.4,2]]);
}
{
  const h=harness();h.triggers.notify('cmdCount',{fPoints:[0,0,0],fSuitPts:[0,0,0],fMatchBy:0},{talkMode:0,elapsedMinutes:61});
  assert(h.calls.every(c=>c[1]===4860),'elapsed-time category is independent in original');
  assert.equal(h.calls.length,3);
  assert.deepEqual(COMMENT_REPLIES[4450],[4900,1,0.8]);
}
{
  const h=harness('differ',3),count={fCall:[0,30,40,87],fMade:[0,40,35,82],fBonus:[0,0,0,0],fCounts:[0,1,1,1]};
  h.triggers.notify('cmdDeal',{fDrawn:1,fTotal:[0,100,200,300,0]},{talkMode:0});
  h.triggers.notify('cmdCount',count,{talkMode:0});
  assert.equal(h.triggers.players[1].rounds,0);
  assert.equal(h.triggers.players[1].total[1],100,'original only updates averages when after-round branch runs');
  h.pending.set(1,{});
  h.triggers.notify('cmdCount',count,{talkMode:8});
  assert.equal(h.triggers.players[1].rounds,0,'pending commentary also skips original round counter');
  assert.equal(h.triggers.players[2].rounds,1);
  assert.equal(h.triggers.players[2].total[1],110);
}
{
  const h=harness('differ',3);
  h.triggers.notify('cmdDeal',{fDrawn:10,fTotal:[0,0,0,0,0]},{talkMode:0});
  for(const [player,card] of [[1,1],[2,9],[3,2]])h.triggers.notify('cmdCard',{fPlayer:player,fCard:card},{talkMode:0});
  assert.equal(h.triggers.players[2].picked,true);
  assert.equal(h.triggers.players[2].points,11);
  h.triggers.notify('cmdCard',{fPlayer:2,fCard:3},{talkMode:4});
  assert.equal(h.triggers.players[2].picked,true,'original leaves picked set across trick boundaries');
  assert.equal(h.calls[0][1],550);
  h.clear();
  h.triggers.notify('cmdDeal',{fDrawn:10,fTotal:[0,0,0,0,0]},{talkMode:0});
  h.triggers.notify('cmdCall',{fPlayer:2,fCall:5},{recipients:[2]});
  for(const [player,card] of [[1,1],[2,9]])h.triggers.notify('cmdCard',{fPlayer:player,fCard:card},{talkMode:0});
  h.triggers.notify('cmdCard',{fPlayer:3,fCard:2},{talkMode:4});
  assert.equal(h.calls.some(c=>c[0]===2&&c[1]===8250),false,'need-this check uses points before crediting the trick');
  assert.equal(h.triggers.players[2].points,11);
}
console.log('Original commentary trigger rules passed.');
