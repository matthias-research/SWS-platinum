import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';
import {DifferAI} from '../src/ai/differ.js';

for(const kind of ['schieber','differ'])test(kind+': compositor animates cards without repainting the table and finishes by completion',async({page})=>{
  const ai=kind==='schieber'?new SchieberAI(await readFile('public/assets/ai/RUGD7000.DAT')):new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT'));
  const game=new Game({kind,seed:1,id:'motion-'+kind,rules:{fPointPlay:false,fRoundLimit:1,fSuitsEnabled:false}},ai);
  game.act({type:'deal'});let saved,card;
  while(!['deal','done'].includes(game.phase)){
    if(game.pause){game.act({type:'continue'});continue;}
    const before=structuredClone(game.save()),request=game.request();game.computer();
    if(game.pause&&game.phase==='done'){saved=before;saved.options.human=request.player;card=game.journal.at(-1).data.fCard;}
  }
  await page.addInitScript(()=>{
    localStorage.setItem('sws-preferences',JSON.stringify({viewSlideS:15,viewBubbleS:0}));
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(...args){const a=animate.apply(this,args);if(this.parentElement?.classList.contains('card-motion-layer'))a.pause();return a;};
    window.tableDraws=0;const draw=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas.parentElement?.classList.contains('scene-frame'))window.tableDraws++;return draw.apply(this,args);};
  });
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'motion.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  const table=page.locator('.scene-frame > canvas'),layer=page.locator('.card-motion-layer');
  await expect(table).toHaveAttribute('data-ready','true');
  await page.locator('.card-target[data-card-id="'+card+'"]').click();
  await expect(layer.locator('canvas')).toHaveCount(1);
  await expect(table).toHaveAttribute('data-animation','play');
  const result=await page.evaluate(async()=>{
    const a=document.querySelector('.card-motion-layer canvas').getAnimations()[0];
    const count=window.tableDraws;a.currentTime=30;const first=getComputedStyle(a.effect.target).transform;
    a.currentTime=180;const second=getComputedStyle(a.effect.target).transform;
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    return {first,second,repaints:window.tableDraws-count,properties:Object.keys(a.effect.getKeyframes()[0])};
  });
  expect(result.first).not.toBe(result.second);expect(result.repaints).toBe(0);
  expect(result.properties).toContain('transform');expect(result.properties).not.toContain('left');
  await page.waitForTimeout(400); // Longer than the animation duration: no timer may finish it.
  await expect(table).toHaveAttribute('data-animation','play');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Open a modal while a compositor card is still in flight.
  await page.getByRole('button',{name:'Datei',exact:true}).click();
  await page.getByRole('button',{name:'Spielerdaten…',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(el=>{
    const r=el.getBoundingClientRect();
    return {modal:el.matches(':modal'),composited:getComputedStyle(el).willChange,
      backdrop:getComputedStyle(el,'::backdrop').willChange,
      onTop:el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))};
  })).toEqual({modal:true,composited:'transform',backdrop:'transform',onTop:true});
  await expect(layer.locator('canvas')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.evaluate(()=>document.querySelector('.card-motion-layer canvas').getAnimations()[0].finish());
  const clear=page.getByRole('button',{name:'Stich auf dem Tisch abräumen',exact:true});await expect(clear).toBeVisible();
  await clear.click({position:{x:20,y:20}});
  await expect(table).toHaveAttribute('data-animation','collect');await expect(layer.locator('canvas')).toHaveCount(game.count);
  // A resize cancels the previous animation and starts it with fresh coordinates.
  await page.setViewportSize({width:1000,height:750});
  await expect.poll(()=>layer.locator('canvas').first().evaluate(c=>c.getAnimations().length)).toBe(1);
  await page.waitForTimeout(400);await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(()=>document.querySelectorAll('.card-motion-layer canvas').forEach(c=>c.getAnimations()[0].finish()));
  await expect(layer).toHaveCount(0);
  await expect(page.getByRole('dialog',{name:kind==='schieber'?'Ende der Runde':'Jass beendet',exact:true})).toBeVisible();
});
