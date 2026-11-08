import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({genSayBefore:false})));});
for(const kind of ['Schieber','Differenzler'])test(kind+': table click reopens a cancelled choice and keeps joker available',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Neuer '+kind+'…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const choice=page.getByRole('dialog',{name:kind==='Schieber'?'Wähle deinen Trumpf!':'Deine Ansage…',exact:true});
  await expect(choice).toBeVisible();
  await choice.getByRole('button',{name:'Abbrechen',exact:true}).click();
  const resume=page.getByRole('button',{name:'Spiel fortsetzen: Auswahl wieder öffnen',exact:true});await expect(resume).toBeVisible();
  await resume.click();await expect(choice).toBeVisible();await expect(resume).toHaveCount(0);
  await page.keyboard.press('Escape');await expect(resume).toBeVisible();
  await page.getByRole('button',{name:'Joker: Ratschlag',exact:true}).click();
  if(kind==='Schieber'){await expect(choice).toBeVisible();await expect(choice.getByRole('button',{name:'Tipp',exact:true})).toBeEnabled();}
  else {await expect(choice).toBeVisible();await expect(page.getByRole('dialog',{name:'Ratschlag',exact:true})).toHaveCount(0);}
  await expect(choice).toBeVisible();
  if(kind==='Schieber')await choice.getByRole('button',{name:'Schellen',exact:true}).click();
  else await choice.getByRole('button',{name:'OK',exact:true}).click();
  await expect(choice).toHaveCount(0);await expect(resume).toHaveCount(0);
});
