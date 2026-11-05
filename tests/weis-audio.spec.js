import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';
import {speechForAction} from '../src/audioCues.js';

test('computer Weis is spoken from its public notification with own voice disabled',async({page})=>{
  const bytes=await readFile('public/assets/ai/RUGD7000.DAT');
  let saved,expected;
  for(let seed=1;seed<=20&&!saved;seed++){
    const game=new Game({kind:'schieber',seed,characters:[0,0,1,0,2],rules:{fPointPlay:false,fRoundLimit:1}},new SchieberAI(bytes));
    game.act({type:'deal'});
    while(!game.pause&&game.phase!=='done'){
      const request=game.request();if(!request)break;
      if(request.command==='cmdSuit'&&request.player!==game.human){
        saved=game.save();
        const suit={...request.data.fSuit,fCalls:request.data.fSuit.fCalls.map(c=>({...c,fCards:new Set()}))};
        expected=speechForAction({command:'cmdSuit',data:{fPlayer:request.player,fSuit:suit}},game.view(),{voice:6,set:1})[0];
        break;
      }
      game.computer();
    }
  }
  expect(saved).toBeTruthy();
  await page.addInitScript(()=>{
    localStorage.setItem('sws-sound',JSON.stringify({enabled:true,calls:true,own:false,comments:false,noise:false,hints:false}));
    localStorage.setItem('sws-preferences',JSON.stringify({viewSlideS:0,viewThinkS:50}));
    window.recordings=[];
    window.Audio=class{constructor(src){this.src=src;}play(){window.recordings.push(this.src);return Promise.resolve();}pause(){}};
  });
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'weis.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  await expect.poll(()=>page.evaluate(()=>window.recordings)).toEqual([expect.stringContaining(`/${expected.folder}/${expected.first}.mp3`)]);
  await expect(page.locator('.feed-suit').last()).toBeVisible();
  await expect(page.locator('.feed-suit').last().locator('canvas')).toHaveCount(0);
});
