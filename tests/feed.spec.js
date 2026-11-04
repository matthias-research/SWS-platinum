import {test,expect} from '@playwright/test';
test('original trump artwork appears in the feed and dismissible player bubbles',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:20})));
  await page.goto('/');await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Schellen',exact:true}).click();
  if(await page.getByRole('dialog').count())await page.keyboard.press('Escape');
  const feed=page.getByRole('log',{name:'Spielverlauf'});
  await expect(feed.getByRole('img',{name:'Schellen',exact:true})).toBeVisible();
  const bubble=page.getByRole('group',{name:'Du trumpfst Schellen',exact:true});await expect(bubble).toBeVisible();
  expect(await feed.getByRole('img',{name:'Schellen',exact:true}).evaluate(img=>img.complete&&img.naturalWidth===26)).toBe(true);
  await page.screenshot({path:'artifacts/browser/speech-bubbles-feed.png'});
  await bubble.getByRole('button').click();await expect(bubble).toHaveCount(0);await expect(feed).toContainText('Du trumpfst');
});
test('bubbles expire independently while the illustrated feed remains',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:1})));
  await page.goto('/');await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await page.getByRole('textbox',{name:'Ansage',exact:true}).fill('50');await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();
  await expect(page.getByRole('group',{name:'Du sagst 50',exact:true})).toBeVisible();
  await expect(page.getByRole('group',{name:'Du sagst 50',exact:true})).toHaveCount(0,{timeout:4000});
  const feed=page.getByRole('log',{name:'Spielverlauf'});await expect(feed).toContainText('Du sagst 50');await expect(feed.locator('canvas')).toHaveCount(1);
});

test('local player messages appear with original portraits in the feed and bubble',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:/sagt an/})).toBeVisible();await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Jass',exact:true}).click();await page.getByRole('button',{name:'Gespräche…',exact:true}).click();
  await page.getByRole('textbox',{name:'Nachricht',exact:true}).fill('Guet Jass!');await page.getByRole('button',{name:"Sag's",exact:true}).click();await page.keyboard.press('Escape');
  await expect(page.getByRole('log',{name:'Spielverlauf'})).toContainText('Guet Jass!');
  await expect(page.getByRole('group',{name:'Sie: Guet Jass!',exact:true})).toBeVisible();
  const portrait=page.getByRole('log',{name:'Spielverlauf'}).locator('.feed-portrait');await expect(portrait).toHaveAttribute('src',/\/setup\/51\d\d\.png$/);
});
