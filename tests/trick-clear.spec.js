import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';
import {DifferAI} from '../src/ai/differ.js';

async function lastCardPosition(kind='schieber'){
  const ai=kind==='schieber'?new SchieberAI(await readFile('public/assets/ai/RUGD7000.DAT')):new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT'));
  const game=new Game({kind,id:'trick-layout-test',seed:37,human:3,rules:{fPointPlay:false,fRoundLimit:2,fSuitsEnabled:false}},ai);
  for(let i=0;i<300;i++){
    const req=game.request();
    if(req?.player===3&&req.command==='cmdPlay'&&game.view().trick.fPlayed.filter(Boolean).length===3)return {saved:game.save(),card:req.data.fLegal.find(Boolean)};
    if(game.phase==='deal')game.act({type:'deal'});else if(game.pause)game.act({type:'continue'});else game.computer();
  }
  throw new Error('No last-card human turn found');
}
for(const kind of ['schieber','differ'])test(`${kind}: table stays fixed across the last card and clears a trick from any table position`,async({page})=>{
  const {saved,card}=await lastCardPosition(kind);
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:0})));
  await page.goto('/');await page.locator('input[type=file]').setInputFiles({name:'test.sws.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  const target=page.locator(`.card-target[data-card-id="${card}"]`);await expect(target).toBeEnabled();
  const frame=page.locator('.scene-frame'),before=await frame.boundingBox();
  await target.click();await expect(page.getByRole('button',{name:'Stich abräumen',exact:true})).toBeEnabled();
  const waiting=await frame.boundingBox();
  expect(waiting.x).toBeCloseTo(before.x,1);expect(waiting.width).toBeCloseTo(before.width,1);
  await frame.click({position:{x:30,y:80}});
  await expect(page.getByRole('button',{name:'Stich abräumen',exact:true})).toHaveCount(0);
  const after=await frame.boundingBox();expect(after.x).toBeCloseTo(before.x,1);expect(after.width).toBeCloseTo(before.width,1);
});
test('table alignment is independent of control wrapping and scrollbar visibility',async({page})=>{
  const {saved,card}=await lastCardPosition();await page.goto('/');
  for(const [width,height] of [[1186,867],[1920,1080],[900,700],[390,844]]){
    await page.setViewportSize({width,height});await page.locator('input[type=file]').setInputFiles({name:'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
    const target=page.locator(`.card-target[data-card-id="${card}"]`);await expect(target).toBeEnabled();
    const frame=page.locator('.scene-frame'),before=await frame.boundingBox();
    await target.click();await expect(page.getByRole('button',{name:'Stich auf dem Tisch abräumen',exact:true})).toBeVisible();
    const waiting=await frame.boundingBox();expect(waiting.x).toBeCloseTo(before.x,1);expect(waiting.width).toBeCloseTo(before.width,1);
    // Even changing the page's vertical overflow must not move the centered table.
    await page.evaluate(()=>document.documentElement.style.overflowY='scroll');
    expect((await frame.boundingBox()).x).toBeCloseTo(before.x,1);
    await frame.click({position:{x:waiting.width-20,y:waiting.height-20}});
    await expect(page.getByRole('button',{name:'Stich auf dem Tisch abräumen',exact:true})).toHaveCount(0);
    const after=await frame.boundingBox();expect(after.x).toBeCloseTo(before.x,1);expect(after.width).toBeCloseTo(before.width,1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.evaluate(()=>document.documentElement.style.overflowY='');
  }
});
