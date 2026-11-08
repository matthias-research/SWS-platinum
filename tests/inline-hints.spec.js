import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({genSayBefore:false})));});
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';
import {DifferAI} from '../src/ai/differ.js';

test('trump joker points while held without opening advice or playing it',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const choice=page.getByRole('dialog',{name:'Wähle deinen Trumpf!',exact:true});
  const symbol=choice.getByRole('button',{name:'Schellen',exact:true});
  await symbol.hover();
  await expect(choice.locator('.trump-symbol.hovered')).toHaveCount(1);
  await expect.poll(()=>choice.locator('.trump-symbol.hovered').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a)).toBeCloseTo(1.25,2);
  expect(await symbol.evaluate(el=>getComputedStyle(el).boxShadow)).toBe('none');
  await page.screenshot({path:'artifacts/browser/trump-hover.png'});
  await choice.getByRole('button',{name:'Tipp',exact:true}).hover();
  await expect(choice.locator('.trump-joker-symbol.hovered')).toHaveCount(1);
  await expect.poll(()=>choice.locator('.trump-joker-symbol.hovered').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a)).toBeCloseTo(1.1,2);
  await page.screenshot({path:'artifacts/browser/trump-joker-hover.png'});
  await page.mouse.down();
  const suggestion=choice.locator('.picture-hit[data-suggested=true]');await expect(suggestion).toHaveCount(1);await expect(suggestion).toBeEnabled();await expect(choice.locator('.trump-symbol.suggested')).toHaveCount(1);
  await expect.poll(()=>choice.locator('.trump-symbol.suggested').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a)).toBeCloseTo(1,2);
  await expect(choice.locator('.trump-art')).toHaveAttribute('data-hint-pose',/^[0-6]$/);
  await page.screenshot({path:'artifacts/browser/trump-suggestion.png'});
  await expect(page.getByRole('dialog')).toHaveCount(1);await expect(page.getByRole('dialog',{name:'Ratschlag'})).toHaveCount(0);
  await page.mouse.up();await expect(suggestion).toHaveCount(0);
  await expect(choice).toBeVisible();await choice.getByRole('button',{name:'Abbrechen',exact:true}).click();
  await page.getByRole('button',{name:'Joker: Ratschlag',exact:true}).click();
  await expect(choice).toBeVisible();
  const joker=choice.getByRole('button',{name:'Tipp',exact:true});await joker.focus();await page.keyboard.down('Space');await expect(suggestion).toHaveCount(1);await page.keyboard.up('Space');await expect(suggestion).toHaveCount(0);
  await choice.getByRole('button',{name:'Schellen',exact:true}).click();await expect(choice).toHaveCount(0);
});
for(const kind of ['schieber','differ'])test(kind+': table joker highlights a legal card until the player chooses',async({page})=>{
  const ai=kind==='schieber'?new SchieberAI(await readFile('public/assets/ai/RUGD7000.DAT')):new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT'));
  const game=new Game({kind,seed:1,id:'inline-'+kind,rules:{fSuitsEnabled:false}},ai);game.act({type:'deal'});
  while(!(game.request()?.player===game.human&&game.request().command==='cmdPlay')){
    if(game.pause)game.act({type:'continue'});else game.computer();
  }
  await page.goto('/');await page.locator('input[type=file]').setInputFiles({name:'hint.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(game.save()))});
  const before=game.view().hand.filter(Boolean).length;await expect(page.locator('.card-target')).toHaveCount(before);
  await page.getByRole('button',{name:'Joker: Ratschlag',exact:true}).click();
  const card=page.locator('.card-target[data-suggested=true]');await expect(card).toHaveCount(1);await expect(card).toBeEnabled();
  expect(game.request().data.fLegal).toContain(Number(await card.getAttribute('data-card-id')));
  await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('.card-target')).toHaveCount(before);
  await card.click();await expect(page.locator('.card-target[data-suggested=true]')).toHaveCount(0);
  await expect(page.locator('.card-target')).toHaveCount(before-1);
});

test('trump advice keeps the dialog artwork and controls visually stable while waiting',async({page})=>{
  await page.addInitScript(()=>{
    const send=Worker.prototype.postMessage;
    Worker.prototype.postMessage=function(message,...args){
      if(message?.type==='hint')setTimeout(()=>send.call(this,message,...args),400);
      else send.call(this,message,...args);
    };
  });
  await page.goto('/');await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Wähle deinen Trumpf!',exact:true}),art=dialog.locator('.trump-art > canvas').first();
  await expect(art).toHaveAttribute('width','450');
  const before=await art.evaluate(c=>c.toDataURL());
  await page.evaluate(()=>{
    window.trumpPaints=0;const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas.parentElement?.classList.contains('trump-art'))window.trumpPaints++;return draw.apply(this,args);};
  });
  await dialog.getByRole('button',{name:'Tipp',exact:true}).click();
  await expect(dialog.getByRole('button',{name:'Tipp',exact:true})).toBeDisabled();
  for(const name of ['Tipp','Schellen'])expect(await dialog.getByRole('button',{name,exact:true}).evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  await expect(dialog.getByRole('button',{name:'Tipp',exact:true})).toBeEnabled();
  await expect(dialog.locator('[data-suggested=true]')).toHaveCount(0);
  expect(await art.evaluate(c=>c.toDataURL())).toBe(before);
  expect(await page.evaluate(()=>window.trumpPaints)).toBe(0);
});
