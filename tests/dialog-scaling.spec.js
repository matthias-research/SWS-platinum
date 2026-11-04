import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';

async function expectScale(page,dialog){
  await expect.poll(()=>dialog.locator('.original-dialog-content').evaluate(el=>{
    const scale=Number(document.querySelector('.scene-frame > canvas').dataset.scale);
    const w=parseFloat(el.style.width),h=parseFloat(el.style.height);
    const expected=Math.min(scale,(innerWidth-20)/w,(innerHeight-20)/h);
    return Math.abs(new DOMMatrix(getComputedStyle(el).transform).a-expected);
  })).toBeLessThan(0.01);
}
for(const mode of ['adaptive','fixed'])test('Weis and settings follow '+mode+' scaling',async({page})=>{
  const bytes=await readFile('public/assets/ai/RUGD7000.DAT');let saved;
  for(let seed=1;seed<20&&!saved;seed++){
    const game=new Game({kind:'schieber',seed,id:'weis-scale',rules:{fPointPlay:false,fRoundLimit:1}},new SchieberAI(bytes));
    game.act({type:'deal'});
    while(!['deal','done'].includes(game.phase)){
      if(game.request()?.command==='cmdSuit'){saved=structuredClone(game.save());saved.options.human=game.request().player;break;}
      if(game.pause)game.act({type:'continue'});else game.computer();
    }
  }
  expect(saved).toBeTruthy();
  await page.addInitScript(mode=>localStorage.setItem('sws-display',JSON.stringify({resolution:mode})),mode);
  await page.setViewportSize({width:1400,height:1000});await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'weis.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  const weis=page.getByRole('dialog',{name:/Möchtest du weisen/});await expect(weis).toBeVisible();await expectScale(page,weis);
  await weis.getByRole('button',{name:'Abbrechen',exact:true}).click();
  await page.getByRole('button',{name:'Spiel fortsetzen: Auswahl wieder öffnen',exact:true}).click();
  await expect(weis).toBeVisible();
  await weis.getByRole('button',{name:'Abbrechen',exact:true}).click();
  for(const title of ['Allgemein','Darstellungen']){
    await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
    await page.getByRole('button',{name:title+'…',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:title,exact:true});await expectScale(page,dialog);
    await page.setViewportSize({width:700,height:600});await expectScale(page,dialog);
    await dialog.getByRole('button',{name:'Abbrechen',exact:true}).click();await page.setViewportSize({width:1400,height:1000});
  }
});
for(const mode of ['adaptive','fixed'])test('new-game dialog follows '+mode+' scaling',async({page})=>{
  await page.addInitScript(mode=>localStorage.setItem('sws-display',JSON.stringify({resolution:mode})),mode);
  await page.setViewportSize({width:1400,height:1000});await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  const content=page.locator('.legacy-setup-content');
  const scale=Number(await page.locator('.scene-frame > canvas').getAttribute('data-scale'));
  const actual=await content.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
  expect(actual).toBeCloseTo(scale,3);
});
