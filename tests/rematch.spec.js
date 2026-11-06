import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';

for(const losers of [true,false])for(const dialogs of [true,false])test(`automatic Revanche: losers=${losers}, dialogs=${dialogs}`,async({page})=>{
  const game=new Game({kind:'schieber',id:'prior-jass',seed:1,leading:3,names:['','Birgit','Beat','Anna','Walter'],characters:[0,0,1,0,3],rules:{fPointPlay:false,fRoundLimit:1,fLooserBegins:losers}},new SchieberAI(await readFile('public/assets/ai/RUGD7000.DAT')));
  game.act({type:'deal'});
  while(game.phase!=='done'){if(game.pause)game.act({type:'continue'});else game.computer();}
  const view=game.view(),saved=game.save();
  let leading=4;if(losers&&view.winner===2)leading=1;
  await page.addInitScript(dialogs=>localStorage.setItem('sws-preferences',JSON.stringify({viewInfoRound:dialogs,viewInfoMatch:dialogs,viewInfoWin:dialogs,viewBubbleS:0,viewSlideS:0,genSayBefore:false,genSayDuring:false,genSayAfter:false,genSayWin:false})),dialogs);
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'finished.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  const savedOptions=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sws-game')).options);
  await expect(page.getByRole('button',{name:'Stich auf dem Tisch abräumen',exact:true})).toBeVisible();
  expect((await savedOptions()).id).toBe('prior-jass');
  await page.getByRole('button',{name:'Stich auf dem Tisch abräumen',exact:true}).click({position:{x:20,y:20}});
  if(dialogs){
    const round=page.getByRole('dialog',{name:'Ende der Runde',exact:true});
    await expect(round).toBeVisible();expect((await savedOptions()).id).toBe('prior-jass');
    await round.getByRole('button',{name:'Weiter',exact:true}).click();
    const win=page.getByRole('dialog',{name:'Sieg',exact:true});
    await expect(win).toBeVisible();expect((await savedOptions()).id).toBe('prior-jass');
    await win.getByRole('button',{name:'Weiter',exact:true}).click();
  }
  await expect.poll(async()=>(await savedOptions()).id).not.toBe('prior-jass');
  const next=await savedOptions();
  expect(next.leading).toBe(leading);
  expect(next.names).toEqual(saved.options.names);
  expect(next.characters).toEqual(saved.options.characters);
  expect(next.rules).toEqual(view.rules);
  const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('sws-history')));
  expect(history.filter(h=>h.id==='prior-jass')).toHaveLength(1);
  expect(history.find(h=>h.id==='prior-jass').scores).toEqual(view.scores);
  const reset=await page.evaluate(async()=>{
    const {Game}=await import('/src/engine/game.js');
    const {SchieberAI}=await import('/src/ai/schieber.js');
    const ai=new SchieberAI(new Uint8Array(await (await fetch('/assets/ai/RUGD7000.DAT')).arrayBuffer()));
    return Game.restore(JSON.parse(localStorage.getItem('sws-game')),ai).view();
  });
  expect(reset.scores).toEqual([0,0,0]);expect(reset.bPrice).toBe(0);expect(reset.winner).toBe(0);
  expect(reset.roundNumber).toBe(1);expect(reset.history).toHaveLength(0);
});
