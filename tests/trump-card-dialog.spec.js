import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {DifferAI} from '../src/ai/differ.js';

test.beforeEach(async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:0,viewSlideS:0})));
});

for(const setId of [1,2])test(`new Differenzler shows its drawn card before Ansage (card set ${setId})`,async({page})=>{
  await page.addInitScript(setId=>localStorage.setItem('sws-display',JSON.stringify({cardSet:setId})),setId);
  if(setId===2){
    await page.setViewportSize({width:390,height:844});
    await page.addInitScript(()=>{
      const original=window.matchMedia.bind(window);
      window.matchMedia=q=>q==='(pointer: coarse)'?{matches:true,addEventListener(){},removeEventListener(){}}:original(q);
      Object.defineProperty(screen,'width',{value:390});
      Object.defineProperty(document,'fullscreenEnabled',{value:false});
    });
  }
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Die Trumpkarte',exact:true});
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button')).toHaveCount(1);
  await expect(dialog.getByRole('button',{name:'OK',exact:true})).toBeVisible();
  const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('sws-game')));
  const restored=Game.restore(saved,new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT')));
  const expected=await page.evaluate(async({card,setId})=>(await import('/src/gameDrawing')).cardName(card,setId),{card:restored.round.fDrawn,setId});
  await expect(dialog.getByRole('img')).toHaveAttribute('aria-label',expected);
  await expect.poll(()=>dialog.locator('canvas').evaluate(canvas=>canvas.getContext('2d').getImageData(canvas.width/2,canvas.height/2,1,1).data[3])).toBe(255);
  await expect(page.getByRole('dialog',{name:'Deine Ansage…',exact:true})).toHaveCount(0);
  await dialog.screenshot({path:`artifacts/browser/trump-card-dialog-${setId}.png`});
  await dialog.getByRole('button',{name:'OK',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('dialog',{name:'Deine Ansage…',exact:true})).toBeVisible();
  const call=page.getByRole('dialog',{name:'Deine Ansage…',exact:true});
  const input=call.getByRole('textbox',{name:'Ansage',exact:true});
  await input.fill('157');
  const fits=await input.evaluate(el=>{
    const board=document.querySelector('.prediction-board').getBoundingClientRect(),rect=el.getBoundingClientRect(),scale=board.width/209;
    return rect.left>=board.left+133*scale&&rect.right<=board.left+165*scale&&rect.top>=board.top+22*scale&&rect.bottom<=board.top+44*scale&&el.scrollWidth<=el.clientWidth;
  });
  expect(fits).toBe(true);
  await call.screenshot({path:`artifacts/browser/ansage-input-fit-${setId}.png`});
});

test('next Differenzler round announces its new drawn card; restoring a round does not announce again',async({page})=>{
  const game=new Game({kind:'differ',seed:1,id:'drawn-rounds',rules:{fRoundLimit:2}},new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT')));
  game.act({type:'deal'});
  const initial=game.save();
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'initial.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(initial))});
  await expect(page.getByRole('dialog',{name:'Deine Ansage…',exact:true})).toBeVisible();
  await expect(page.getByRole('dialog',{name:'Die Trumpkarte',exact:true})).toHaveCount(0);
  while(game.phase!=='deal'){if(game.pause)game.act({type:'continue'});else game.computer();}
  if(game.pause)game.act({type:'continue'});
  await page.locator('input[type=file]').setInputFiles({name:'next.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(game.save()))});
  await page.getByRole('dialog',{name:'Spielstand',exact:true}).getByRole('button',{name:'Weiter',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Die Trumpkarte',exact:true});
  await expect(dialog).toBeVisible();
  await expect(page.locator('.feed-round').last()).toContainText('Spiel 2');
  await dialog.getByRole('button',{name:'OK',exact:true}).click();
  await expect(dialog).toHaveCount(0);
});
