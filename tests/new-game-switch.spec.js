import {test,expect} from '@playwright/test';

async function choose(page,kind){
  const dialog=page.locator('dialog.decision-dialog[open]');await expect(dialog).toBeVisible();
  if(kind==='Schieber')await dialog.getByRole('button',{name:'Schellen',exact:true}).click();
  else{await dialog.getByRole('textbox',{name:'Ansage',exact:true}).fill('50');await dialog.getByRole('button',{name:'OK',exact:true}).click();}
  await expect(page.getByRole('log',{name:'Spielverlauf'})).toContainText(kind==='Schieber'?'Sie trumpft':'Sie sagt 50');
  if((await page.locator('.game-status').textContent()).includes('weist.')){await expect(page.getByRole('dialog',{name:/wollen Sie weisen/})).toBeVisible();await page.keyboard.press('Escape');}
}
for(const first of ['Schieber','Differenzler'])for(const next of ['Schieber','Differenzler'])test(`${first} to ${next}: starting another game keeps the application alive`,async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.getByRole('button',{name:`Neuer ${first}…`,exact:true}).click();await page.getByRole('dialog',{name:'Neuer Jass'}).getByRole('button',{name:'Spielen',exact:true}).click();
  await choose(page,first);
  await page.getByRole('button',{name:'Jass',exact:true}).click();await page.getByRole('button',{name:`Neuer ${next}…`,exact:true}).click();
  await page.getByRole('dialog',{name:'Neuer Jass'}).getByRole('button',{name:'Spielen',exact:true}).click();
  expect(errors).toEqual([]);await expect(page.locator('main')).toBeVisible();
  await choose(page,next);await expect(page.locator('.scene-frame')).toBeVisible();expect(errors).toEqual([]);
});
