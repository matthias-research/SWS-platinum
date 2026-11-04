import { test, expect } from '@playwright/test';

test('Differenzler uses the AI choice saved in settings, without a setup dropdown',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Datei',exact:true}).click();
  await page.getByRole('button',{name:'Einstellungen…',exact:true}).click();
  const settings=page.getByRole('dialog',{name:'Einstellungen',exact:true});
  await settings.getByRole('combobox',{name:'Differenzler Computer-Spieler'}).selectOption('hacker');
  await settings.getByRole('button',{name:'OK',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  const setup=page.getByRole('dialog',{name:'Neuer Jass',exact:true});
  await expect(setup.getByRole('combobox')).toHaveCount(0);
  await setup.getByRole('button',{name:'Spielen',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sws-game'))?.options.family)).toBe('hacker');
});

test('original Schieber setup selects portraits, strengths and human profile before starting', async ({page}) => {
  await page.addInitScript(()=>localStorage.setItem('sws-display',JSON.stringify({scale:1})));
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Neuer Jass',exact:true});
  await expect(dialog).toBeVisible();
  await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.legacy-new-jass img')].map(i=>i.decode()));});
  await dialog.screenshot({path:'artifacts/browser/new-jass-original-layout.png'});
  await dialog.getByRole('button',{name:'Nord schwächer',exact:true}).click();
  await expect(dialog.getByRole('slider',{name:'Nord Spielstärke'})).toHaveValue('1');
  await dialog.getByRole('button',{name:/^Nord:.*Spieler wählen/}).click();
  await dialog.getByRole('button',{name:'Figur 2',exact:true}).click();
  await expect(dialog.getByRole('button',{name:/^Nord: Figur 2, Mittel/})).toBeVisible();
  await dialog.getByRole('button',{name:'Ihr Spielerbild wählen'}).click();
  await dialog.getByRole('button',{name:'Spielerbild 4',exact:true}).click();
  await dialog.getByRole('textbox',{name:'Ihr Name'}).fill('Matthi');
  await dialog.getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('button',{name:'Obenabe',exact:true})).toBeVisible();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sws-game')));
  expect(saved.options.levels[1]).toBe(50);
  expect(saved.options.characters[1]).toBe(1);
  expect(saved.options.avatar).toBe(5203);
  expect(saved.options.names[3]).toBe('Matthi');
  expect(saved.options.names).toEqual(['','Beat','Stéphanie','Matthi','Walter']);
});

test('setup fits a narrow screen and cancel leaves the current game untouched',async({page})=>{
  await page.setViewportSize({width:390,height:740});
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Neuer Jass'});
  const rect=await dialog.boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(390);
  await dialog.getByRole('button',{name:'Zufällig',exact:true}).click();
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(()=>localStorage.getItem('sws-game'))).toBeNull();
});
