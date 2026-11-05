import {test,expect} from '@playwright/test';

for(const duration of [5,1])test(`initial player bubbles expire after the configured ${duration} seconds`,async({page})=>{
  await page.addInitScript(duration=>{
    localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:duration}));
  },duration);
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.locator('.player-bubble')).toHaveCount(3);
  await page.waitForTimeout(duration*500);
  await expect(page.locator('.player-bubble')).toHaveCount(3);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.player-bubble')).toHaveCount(0,{timeout:duration*1000+1500});
  await expect(page.getByRole('dialog',{name:'Wähle deinen Trumpf!'})).toBeVisible();
  await expect(page.locator('.feed-say')).toHaveCount(3);
});

for(const kind of ['Schieber','Differenzler'])for(const duration of [0,1])test(`${kind} opening decision respects bubble duration ${duration}`,async({page})=>{
  await page.addInitScript(duration=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:duration})),duration);
  await page.goto('/');
  await page.getByRole('button',{name:`Neuer ${kind}…`,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.locator('.feed-say')).toHaveCount(3);
  if(duration){
    await expect(page.locator('.player-bubble')).toHaveCount(3);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await expect(page.getByRole('dialog',{name:kind==='Schieber'?'Wähle deinen Trumpf!':/^Deine Ansage/})).toBeVisible();
  await expect(page.locator('.player-bubble')).toHaveCount(0);
});

test('switching bubble duration to off removes existing bubbles',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:20})));
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.locator('.player-bubble')).toHaveCount(3);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Darstellungen…',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Darstellungen',exact:true});
  await dialog.getByRole('slider',{name:'Sprechblasen Dauer'}).fill('0');
  await dialog.getByRole('button',{name:'OK',exact:true}).click();
  await expect(page.locator('.player-bubble')).toHaveCount(0);
  await expect(page.locator('.feed-say')).toHaveCount(3);
});
