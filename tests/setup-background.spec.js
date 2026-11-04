import {test,expect} from '@playwright/test';
for(const [kind,label] of [['schieber','Schieber'],['differ','Differenzler']])test(label+': selecting the panel opens setup over the game table',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer '+label+'…',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Neuer Jass',exact:true})).toBeVisible();
  await expect(page.locator('.welcome-panel')).toHaveCount(0);
  const table=page.locator('.scene-frame > canvas');
  await expect(table).toBeVisible();await expect(table).toHaveAttribute('data-game-kind',kind);
  await expect.poll(()=>table.evaluate(c=>c.getContext('2d').getImageData(c.width/2,c.height/2,1,1).data[3])).toBe(255);
  await page.getByRole('dialog',{name:'Neuer Jass',exact:true}).getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.locator('.welcome-panel')).toBeVisible();await expect(table).toHaveCount(0);
  await page.getByRole('button',{name:'Neuer '+label+'…',exact:true}).click();
  await page.getByRole('dialog',{name:'Neuer Jass',exact:true}).getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(table).toBeVisible();await expect(table).toHaveAttribute('data-game-kind',kind);
  await expect(page.locator('.welcome-panel')).toHaveCount(0);
});

