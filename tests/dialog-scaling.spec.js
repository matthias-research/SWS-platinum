import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';

async function expectCanvasCenter(dialog){
  await expect.poll(()=>dialog.evaluate(el=>{
    const canvas=document.querySelector('.scene-frame > canvas').getBoundingClientRect();
    const rect=el.getBoundingClientRect();
    const left=Math.max(8,Math.min(innerWidth-rect.width-8,canvas.left+(canvas.width-rect.width)/2));
    const top=Math.max(8,Math.min(innerHeight-rect.height-8,canvas.top+(canvas.height-rect.height)/2));
    return Math.max(Math.abs(rect.left-left),Math.abs(rect.top-top));
  })).toBeLessThan(1);
}

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
  await weis.getByRole('button',{name:'Schliessen',exact:true}).click();
  await page.getByRole('button',{name:'Spiel fortsetzen: Auswahl wieder öffnen',exact:true}).click();
  await expect(weis).toBeVisible();
  await weis.getByRole('button',{name:'Schliessen',exact:true}).click();
  for(const title of ['Allgemein','Darstellungen']){
    await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
    await page.getByRole('button',{name:title+'…',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:title,exact:true});await expectScale(page,dialog);await expectCanvasCenter(dialog);
    await page.setViewportSize({width:700,height:600});await expectScale(page,dialog);await expectCanvasCenter(dialog);
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
  const dialog=page.getByRole('dialog');
  await expectCanvasCenter(dialog);
  for(const viewport of [{width:1000,height:1000},{width:700,height:600},{width:1400,height:700}]){
    await page.setViewportSize(viewport);
    await expectCanvasCenter(dialog);
  }
});
