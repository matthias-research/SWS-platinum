import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {DifferAI} from '../src/ai/differ.js';
import {SchieberAI} from '../src/ai/schieber.js';

for(const final of [false,true])test(`Schieber: original round results and victory (${final})`,async({page})=>{
  const game=new Game({kind:'schieber',id:`schieber-round-${final}`,seed:37,names:['','Birgit','Beat','Matthi','Walter'],characters:[0,0,1,0,3],rules:{fPointPlay:false,fRoundLimit:final?1:2}},new SchieberAI(await readFile('public/assets/ai/RUGD7000.DAT')));
  game.act({type:'deal'});
  while(!['deal','done'].includes(game.phase)){if(game.pause)game.act({type:'continue'});else game.computer();}
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'round.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(game.save()))});
  const dialog=page.getByRole('dialog',{name:'Ende der Runde',exact:true});
  await expect(dialog).toBeVisible();
  for(const name of game.names.slice(1))await expect(dialog.getByRole('img',{name,exact:true})).toBeVisible();
  await expect(dialog.getByRole('group',{name:'Birgit & Matthi'})).toContainText(String(game.view().scores[1]));
  await dialog.screenshot({path:`artifacts/browser/schieber-round-${final}.png`});
  await dialog.getByRole('button',{name:'Weiter',exact:true}).click();
  if(final){
    const victory=page.getByRole('dialog',{name:'Sieg',exact:true});
    await expect(victory).toBeVisible();
    await expect(victory.getByRole('img').filter({hasNot:page.locator('[alt=""]')})).toHaveCount(2);
    await victory.screenshot({path:'artifacts/browser/schieber-victory.png'});
    await victory.getByRole('button',{name:'Weiter',exact:true}).click();
    await expect(victory).toHaveCount(0);
  }else {
    await page.getByRole('button',{name:'Nächste Runde durch Klick auf den Tisch',exact:true}).click({position:{x:20,y:20}});
    await expect(page.getByRole('button',{name:'Nächste Runde durch Klick auf den Tisch',exact:true})).toHaveCount(0);
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sws-game')).actions.filter(a=>a.type==='deal').length)).toBe(2);
  }
});

for(const count of [3,4])test(`Differenzler ${count}: round results open with portraits and close with Weiter`,async({page})=>{
  const game=new Game({kind:'differ',id:`round-${count}`,seed:37,names:['','Birgit','Beat','Matthi','Walter'],characters:[0,0,1,0,3],rules:{fNuPlayers:count,fRoundLimit:2,fStockings:0}},new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT')));
  game.act({type:'deal'});
  while(game.phase!=='deal'){if(game.pause)game.act({type:'continue'});else game.computer();}
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'round.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(game.save()))});
  const dialog=page.getByRole('dialog',{name:'Spielstand',exact:true});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('row')).toHaveCount(count);
  const result=game.view().history.at(-1);
  for(let p=1;p<=count;p++){
    const row=dialog.getByRole('row',{name:new RegExp(game.names[p])});
    await expect(row.getByRole('img')).toHaveAttribute('alt',game.names[p]);
    await expect(row).toContainText(`${result.call[p]}:${result.made[p]}`);
  }
  await dialog.screenshot({path:`artifacts/browser/round-dialog-${count}.png`});
  await dialog.getByRole('button',{name:'Weiter',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button',{name:'Nächste Runde durch Klick auf den Tisch',exact:true}).click({position:{x:20,y:20}});
  await expect(page.getByRole('button',{name:'Nächste Runde durch Klick auf den Tisch',exact:true})).toHaveCount(0);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sws-game')).actions.filter(a=>a.type==='deal').length)).toBe(2);
  await expect(page.getByRole('dialog',{name:'Spielstand',exact:true})).toHaveCount(0);
});

