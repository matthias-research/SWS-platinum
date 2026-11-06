import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';

for(const enabled of [true,false])test(`Sieg at the live target crossing, enabled=${enabled}`,async({page})=>{
  const game=new Game({kind:'schieber',id:'live-win',seed:1,names:['','Birgit','Beat','Anna','Walter'],rules:{fPointPlay:true,fLimit:20,fCut:0,fSuitsEnabled:false}},new SchieberAI(await readFile('public/assets/ai/RUGD7000.DAT')));
  game.act({type:'deal'});
  let saved,card;
  while(!game.view().winner){
    if(game.pause){game.act({type:'continue'});continue;}
    const before=structuredClone(game.save()),request=game.request();
    game.computer();
    if(game.view().winner){saved=before;saved.options.human=request.player;card=game.journal.at(-1).data.fCard;}
  }
  expect(game.history).toHaveLength(0);
  expect(game.phase).not.toBe('done');
  const expected=game.view();
  await page.addInitScript(enabled=>localStorage.setItem('sws-preferences',JSON.stringify({viewInfoWin:enabled,viewInfoRound:false,viewInfoMatch:false,viewSlideS:0,viewBubbleS:0,genSayBefore:false,genSayDuring:false,genSayAfter:false,genSayWin:false})),enabled);
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'live-win.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  await page.locator(`.card-target[data-card-id="${card}"]`).click();
  const win=page.getByRole('dialog',{name:'Sieg',exact:true});
  if(enabled){
    await expect(win).toBeVisible();
    await expect(page.getByRole('button',{name:'Stich auf dem Tisch abräumen',exact:true})).toHaveCount(0); // Paused by the notice.
    for(const [team,name] of [[1,'Birgit & Anna'],[2,'Beat & Walter']])await expect(win.getByRole('group',{name,exact:true})).toHaveText(String(expected.liveScores[team]));
    await win.screenshot({path:'test-results/live-victory.png'});
    await win.getByRole('button',{name:'Weiter',exact:true}).click();
  }
  await page.getByRole('button',{name:'Browser',exact:true}).click();
  await page.getByRole('button',{name:'Lowlevel menu',exact:true}).click();
  await page.getByRole('button',{name:'Computer weiterspielen lassen',exact:true}).click();
  await expect(page.locator('.game-status')).toContainText('Jass beendet',{timeout:20000});
  await expect(win).toHaveCount(0);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sws-game')).actions.length)).toBeGreaterThan(saved.actions.length+1);
});
