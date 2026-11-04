import {test,expect} from '@playwright/test';
for(const kind of ['Schieber','Differenzler'])test(kind+': table click reopens a cancelled choice and keeps joker available',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Neuer '+kind+'…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const choice=page.getByRole('dialog',{name:kind==='Schieber'?'Wähle deinen Trumpf!':'Deine Ansage…',exact:true});
  await expect(choice).toBeVisible();
  await choice.getByRole('button',{name:'Abbrechen',exact:true}).click();
  const resume=page.getByRole('button',{name:'Spiel fortsetzen: Auswahl wieder öffnen',exact:true});await expect(resume).toBeVisible();
  await resume.click({position:{x:200,y:200}});await expect(choice).toBeVisible();await expect(resume).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(resume).toBeVisible();
  await page.getByRole('button',{name:'Joker: Ratschlag',exact:true}).click();
  if(kind==='Schieber'){await expect(choice.locator('[data-suggested=true]')).toHaveCount(1);}
  else {const hint=page.getByRole('dialog',{name:'Ratschlag',exact:true});await expect(hint).toBeVisible();await hint.getByRole('button',{name:'Abbrechen',exact:true}).click();await resume.click();}
  await expect(choice).toBeVisible();
  if(kind==='Schieber')await choice.getByRole('button',{name:'Schellen',exact:true}).click();
  else await choice.getByRole('button',{name:'OK',exact:true}).click();
  await expect(choice).toHaveCount(0);await expect(resume).toHaveCount(0);
});
