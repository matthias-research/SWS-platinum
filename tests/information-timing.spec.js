import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';
import {DifferAI} from '../src/ai/differ.js';

const recordings=JSON.parse(await readFile('public/assets/audio/index.json','utf8'));
const sound=Number(recordings.find(p=>p.startsWith('STIMME3/')).match(/\/(\d+)\.mp3/)[1]);

for(const kind of ['schieber','differ'])for(const first of ['speech','bubbles'])test(`${kind} result waits for both speech and bubbles (${first} finishes first)`,async({page})=>{
  const bytes=await readFile(`public/assets/ai/${kind==='schieber'?'RUGD7000.DAT':'RGDIFF.DAT'}`);
  const game=new Game({kind,seed:1,id:`timing-${kind}`,rules:{fPointPlay:false,fRoundLimit:1}},kind==='schieber'?new SchieberAI(bytes):new DifferAI(bytes));
  game.act({type:'deal'});
  while(game.phase!=='done'){if(game.pause)game.act({type:'continue'});else game.computer();}
  if(game.pause)game.act({type:'continue'});
  await page.addInitScript(({sound})=>{
    localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:1,viewSlideS:0}));
    localStorage.setItem('sws-sound',JSON.stringify({enabled:true,comments:true,calls:false,own:false,noise:false}));
    window.clips=[];window.releaseSpeech=false;
    window.Audio=class{play(){window.clips.push(this);if(window.releaseSpeech)setTimeout(()=>this.onended?.(),0);return Promise.resolve();}pause(){}};
    // Supply a final comment with a real recording on the restored result view.
    const NativeWorker=window.Worker;
    window.Worker=class extends NativeWorker{
      set onmessage(handler){super.onmessage=event=>{
        const data=event.data;
        if(data.view&&['deal','done'].includes(data.view.phase)){
          const id=(data.view.feed.at(-1)?.id||0)+1;
          data.view.feed.push({id,kind:'say',player:1,text:'Final round comment',voice:3,sound});
          data.view.commentaryIds=[id];data.soundAction={type:'continue'};
        }
        handler(event);
      };}
    };
  },{sound});
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'round.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(game.save()))});
  await expect(page.locator('.player-bubble')).toHaveCount(1);
  await expect.poll(()=>page.evaluate(()=>window.clips.length)).toBeGreaterThan(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const release=()=>page.evaluate(()=>{window.releaseSpeech=true;window.clips.forEach(clip=>clip.onended?.());});
  if(first==='speech'){
    await release();
    await expect.poll(()=>page.evaluate(async()=>(await import('/src/audio.js')).speechBusy())).toBe(false);
    await expect(page.locator('.player-bubble')).toHaveCount(1);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }else{
    await expect(page.locator('.player-bubble')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await release();
  }
  await expect(page.locator('.player-bubble')).toHaveCount(0);
  await expect(page.getByRole('dialog').first()).toBeVisible();
  if(kind==='differ'){
    const table=page.getByRole('table',{name:'Rundenresultat',exact:true});
    await expect(table.getByRole('row')).toHaveCount(4);
    await expect(table.locator('canvas')).toHaveCount(8);
    await expect.poll(()=>table.locator('canvas').first().evaluate(canvas=>canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data.some((v,i)=>i%4===3&&v>0))).toBe(true);
    await expect(table.locator('[style*="yellow"]')).toHaveCount(0);
    await page.getByRole('dialog').first().screenshot({path:`artifacts/browser/differ-simple-results-${first}.png`});
  }
});
