import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {DifferAI} from '../src/ai/differ.js';
import {ValueOfTrick} from '../src/engine/DiffBase.js';

for(const count of [3,4])test(`Differenzler ${count}: original plates show predictions and update collected points after clearing`,async({page})=>{
  const game=new Game({kind:'differ',id:`plates-${count}`,seed:37,rules:{fNuPlayers:count,fCallMode:0,fRoundLimit:2,fStockings:0}},new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT')));
  game.act({type:'deal'});while(!game.pause)game.computer();
  const winner=game.lastTrick.winner,points=ValueOfTrick(game.round.fTrump,game.lastTrick),saved=game.save();
  await page.goto('/');await page.locator('input[type=file]').setInputFiles({name:'plates.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  const plates=page.locator('.points-plate');await expect(plates).toHaveCount(count);
  await expect(page.locator('.table-portrait')).toHaveCount(count);
  await expect(page.locator('.collected-trick')).toHaveCount(0);
  for(let p=1;p<=count;p++){
    const plate=plates.filter({has:page.locator(`span.points-plate-name`,{hasText:game.names[p]})});
    await expect(plate).toHaveAttribute('data-collected','0');
    await expect(plate).toHaveAttribute('data-call',p===3?String(game.round.fCall[3]):'?');
  }
  await page.getByRole('button',{name:'Stich auf dem Tisch abräumen',exact:true}).click();
  await expect(page.locator(`.points-plate[data-player="${winner}"]`)).toHaveAttribute('data-collected',String(points));
  await expect(page.locator(`.collected-tricks[data-player="${winner}"]`)).toHaveAttribute('data-count','1');
  await expect(page.locator('.collected-trick')).toHaveCount(1);
  await page.screenshot({path:`artifacts/browser/differ-points-${count}.png`});
  await page.setViewportSize({width:390,height:844});
  await expect(plates).toHaveCount(count);
  expect(await plates.first().evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('differ-pieces.bmp');
});
