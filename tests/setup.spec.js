import { test, expect } from '@playwright/test';

test('settings menu opens three separate dialogs without tabs',async({page})=>{
  await page.goto('/');
  for(const title of ['Allgemein','Regeln','Darstellungen']){
    await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
    await page.getByRole('button',{name:`${title}…`,exact:true}).click();
    const dialog=page.getByRole('dialog',{name:title,exact:true});
    await expect(dialog).toBeVisible();await expect(dialog.getByRole('tablist')).toHaveCount(0);
    expect((await dialog.boundingBox()).width).toBeLessThan(450);
    if(title==='Allgemein')await expect(dialog.getByRole('combobox',{name:'Differenzler Computer-Spieler'})).toHaveCount(0);
    if(title==='Regeln')await expect(dialog.getByRole('radio',{name:'Auf Punkte spielen'})).toBeVisible();
    if(title==='Darstellungen')await expect(dialog.getByRole('slider',{name:'Sprechblasen Dauer'})).toBeVisible();
    await dialog.getByRole('button',{name:'Abbrechen',exact:true}).click();
  }
});

test('Differenzler binds AI to portraits, ignores the old global setting and remembers the lineup',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({differFamily:'grumpy'})));
  await page.goto('/');
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Allgemein…',exact:true}).click();
  const settings=page.getByRole('dialog',{name:'Allgemein',exact:true});
  await expect(settings.getByRole('combobox',{name:'Differenzler Computer-Spieler'})).toHaveCount(0);
  await expect(settings.getByText('Computer-Spieler',{exact:true})).toHaveCount(0);
  await settings.getByRole('button',{name:'OK',exact:true}).click();
  await page.reload();
  await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  const setup=page.getByRole('dialog',{name:'Neuer Jass',exact:true});
  await expect(setup.getByRole('combobox')).toHaveCount(0);
  const initial=await setup.locator('.legacy-portrait').evaluateAll(buttons=>buttons.map(b=>b.getAttribute('aria-label').match(/Figur (\d)/)[1]));
  expect(new Set(initial).size).toBe(3);
  for(const [seat,figure] of [['Nord',1],['West',3],['Ost',4]]){
    await setup.getByRole('button',{name:new RegExp(`^${seat}:`)}).click();
    await setup.getByRole('button',{name:`Figur ${figure}`,exact:true}).click();
  }
  await setup.getByRole('button',{name:'Spielen',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sws-game'))?.options.families)).toEqual(['hacker','hacker','trashy','grumpy','grumpy']);
  await page.reload();
  await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  for(const [seat,figure] of [['Nord',1],['West',3],['Ost',4]])await expect(setup.getByRole('button',{name:new RegExp(`^${seat}: Figur ${figure},`)})).toBeVisible();
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
  expect(saved.options.names).toEqual(saved.options.characters.map((c,p)=>p===0?'':p===3?'Matthi':['Birgit','Beat','Stéphanie','Walter'][c]));
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
