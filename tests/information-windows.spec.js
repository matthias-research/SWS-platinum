import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';
import {DifferAI} from '../src/ai/differ.js';
import {roundInformation} from '../src/informationWindows.js';

test('information preferences select only applicable original notifications',()=>{
  const v={kind:'schieber',phase:'done',winner:2,history:[{matchBy:2,trumpedBy:2}]};
  expect(roundInformation(v)).toEqual([{type:'match',team:2},{type:'win',team:2}]);
  expect(roundInformation({...v,history:[{matchBy:2,trumpedBy:3}]})).toEqual([{type:'conter',team:2},{type:'win',team:2}]);
  expect(roundInformation(v,{viewInfoMatch:false,viewInfoWin:false})).toEqual([]);
  expect(roundInformation({...v,history:[{matchBy:0}]},{viewInfoRound:false})).toEqual([{type:'win',team:2}]);
  const d={kind:'differ',phase:'deal'};
  expect(roundInformation(d,{genInfoRound:false})).toEqual([]);
  expect(roundInformation({...d,phase:'done'},{genInfoRound:false})).toEqual([{type:'differ'}]);
  expect(roundInformation({...d,phase:'done'},{genInfoRound:false,genInfoGame:false})).toEqual([]);
});

test('Differenzler round and game information switches are enabled and persist',async({page})=>{
  const game=new Game({kind:'differ',seed:1,id:'differ-info',rules:{fRoundLimit:1}},new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT')));
  game.act({type:'deal'});while(game.phase!=='done'){if(game.pause)game.act({type:'continue'});else game.computer();}
  game.act({type:'continue'});
  const file={name:'differ.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(game.save()))};
  await page.goto('/');await page.locator('input[type=file]').setInputFiles(file);
  await page.getByRole('dialog',{name:'Jass beendet',exact:true}).getByRole('button',{name:'Weiter',exact:true}).click();
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Allgemein…',exact:true}).click();
  for(const name of ['Informationsfenster nach Rundenende','Informationsfenster nach Spielende']){
    const checkbox=page.getByRole('checkbox',{name,exact:true});await expect(checkbox).toBeChecked();await checkbox.uncheck();
  }
  await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await page.reload();await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.locator('.scene-frame')).toBeVisible();await expect(page.getByRole('dialog')).toHaveCount(0);
});

for(const [leading,title] of [[2,'Match'],[3,'Contermatch']])test(`${title} uses original artwork and obeys its checkbox`,async({page})=>{
  const game=new Game({kind:'schieber',leading,seed:37,id:`notice-${leading}`,rules:{fPointPlay:false,fRoundLimit:2}},new SchieberAI(await readFile('public/assets/ai/RUGD7000.DAT')));
  game.act({type:'deal'});game.act({type:'answer',command:'cmdTrump',data:{fPlayer:leading,fTrump:1}});game.act({type:'forfeit'});
  expect(roundInformation(game.view())[0].type).toBe(title==='Match'?'match':'conter');
  const file={name:'notice.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(game.save()))};
  await page.goto('/');await page.locator('input[type=file]').setInputFiles(file);
  const dialog=page.getByRole('dialog',{name:title,exact:true});await expect(dialog).toBeVisible();
  await dialog.locator('.original-background').evaluate(img=>img.decode());
  await dialog.screenshot({path:`artifacts/browser/information-${title}.png`});
  await dialog.getByRole('button',{name:'Weiter',exact:true}).click();
  // Continuing starts the next round, which may immediately ask for trump.
  await expect(page.locator('.feed-round').last()).toContainText('Spiel 2');
  const decision=page.getByRole('dialog',{name:'Wähle deinen Trumpf!',exact:true});
  if(await decision.isVisible())await decision.getByRole('button',{name:'Schliessen',exact:true}).click();
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Darstellungen…',exact:true}).click();
  for(const name of ['Rundenende','Bergpreis / Sieg','Match / Contermatch'])await expect(page.getByRole('checkbox',{name,exact:true})).toBeChecked();
  await page.getByRole('checkbox',{name:'Match / Contermatch',exact:true}).uncheck();
  await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await page.reload();await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.locator('.scene-frame')).toBeVisible();await expect(dialog).toHaveCount(0);
});

test('Bergpreis opens when the human crosses the threshold during play',async({page})=>{
  const bytes=await readFile('public/assets/ai/RUGD7000.DAT');let saved,card;
  for(let seed=1;seed<40&&!saved;seed++){
    const game=new Game({kind:'schieber',id:'bergpreis',seed,rules:{fCut:1,fLimit:2500,fSuitsEnabled:false}},new SchieberAI(bytes));
    game.act({type:'deal'});
    for(let i=0;i<100&&!game.view().bPrice;i++){
      if(game.pause){game.act({type:'continue'});continue;}
      const before=structuredClone(game.save()),request=game.request();game.computer();
      if(game.view().bPrice&&request.command==='cmdPlay'){saved=before;saved.options.human=request.player;card=game.journal.at(-1).data.fCard;}
    }
  }
  expect(saved).toBeTruthy();await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'bp.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  await page.locator(`.card-target[data-card-id="${card}"]`).click();
  const dialog=page.getByRole('dialog',{name:'Bergpreis',exact:true});await expect(dialog).toBeVisible({timeout:12000});
  await dialog.screenshot({path:'artifacts/browser/information-Bergpreis.png'});
  await dialog.getByRole('button',{name:'Weiter',exact:true}).click();await expect(dialog).toHaveCount(0);
});
