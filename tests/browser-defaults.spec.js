import {test,expect} from '@playwright/test';

async function start(page){
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Wähle deinen Trumpf!',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
}
async function browserMenu(page){
  const toggle=page.getByRole('button',{name:'Menu',exact:true});
  if(await toggle.count())await toggle.click();
  await page.getByRole('button',{name:'Browser',exact:true}).click();
}

test('Browser settings reset on every load, ignoring old saved choices',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:0})));
  await page.goto('/');
  await page.evaluate(()=>localStorage.setItem('sws-display',JSON.stringify({resolution:'fixed',fit:false,viewMode:'mobile-horizontal',artwork:'original',lowLevel:true,cardSet:2})));
  await page.reload();
  await start(page);
  const canvas=page.locator('.scene-frame > canvas');
  await expect(canvas).toHaveAttribute('data-resolution','adaptive');
  await expect(canvas).toHaveAttribute('data-artwork','enhanced');
  await browserMenu(page);
  for(const name of ['Adaptive resolution','Auto view','Verbesserte Grafik'])await expect(page.getByRole('button',{name,exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Lowlevel menu',exact:true})).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Fixed resolution',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-resolution','fixed');
  await browserMenu(page);await page.getByRole('button',{name:'Originalgrafik',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-artwork','original');
  await browserMenu(page);await page.getByRole('button',{name:'Lowlevel menu',exact:true}).click();
  await expect(page.locator('.game-actions')).toBeVisible();
  await browserMenu(page);await page.getByRole('button',{name:'Mobile vertical',exact:true}).click();
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-vertical');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sws-display')))).toEqual({cardSet:2});
  await page.reload();await start(page);
  await expect(canvas).toHaveAttribute('data-resolution','adaptive');
  await expect(canvas).toHaveAttribute('data-artwork','enhanced');
  await expect(page.locator('.game-actions')).toHaveCount(0);
  await browserMenu(page);
  await expect(page.getByRole('button',{name:'Auto view',exact:true})).toHaveAttribute('aria-pressed','true');
});
