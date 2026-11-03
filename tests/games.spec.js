import { test, expect } from '@playwright/test';

for (const kind of ['Schieber', 'Differenzler']) test(`${kind}: play a complete match in the browser`, async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: `Neuer ${kind}…`, exact: true }).click();
  const dialog = page.getByRole('dialog');
  if (kind === 'Schieber') await dialog.getByLabel('Auf Punkte spielen').uncheck();
  await dialog.getByLabel('Runden', { exact: true }).fill('1');
  await dialog.getByRole('button', { name: 'Spielen', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Ihre Karten' }).getByRole('button')).toHaveCount(9);
  await page.screenshot({ path: `artifacts/browser/${kind.toLowerCase()}-deal.png` });
  if (kind === 'Schieber') await page.getByRole('button', {name:'Obenabe',exact:true}).click();
  else { await page.getByRole('spinbutton', {name:'Ansage',exact:true}).fill('50'); await page.getByRole('button',{name:'Ansagen',exact:true}).click(); }
  await page.getByLabel('Tempo', { exact: true }).selectOption('50');
  await page.getByRole('button', { name: 'Computer weiterspielen lassen' }).click();
  await expect(page.getByRole('status')).toContainText('Jass beendet', { timeout: 30000 });
  await expect(page.getByRole('button', {name:'Neuer Jass',exact:true})).toBeVisible();
  await page.getByRole('button', {name:'Resultate',exact:true}).click();
  await expect(page.locator('.results tbody tr')).toHaveCount(1);
  await page.screenshot({ path: `artifacts/browser/${kind.toLowerCase()}-finished.png` });
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.reload();
  await page.getByRole('button',{name:'Spiel fortsetzen',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Jass beendet');
});

test('human cards, hint, undo and three-player Trashy stay usable', async ({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  const dialog=page.getByRole('dialog');
  await dialog.getByRole('combobox',{name:'Spieler',exact:true}).selectOption('3');
  await dialog.getByRole('combobox',{name:'Computer-Spieler',exact:true}).selectOption('trashy');
  await dialog.getByLabel('Runden',{exact:true}).fill('1');
  await dialog.getByRole('button',{name:'Spielen',exact:true}).click();
  const cards=page.getByRole('group',{name:'Ihre Karten'});
  await expect(cards.getByRole('button')).toHaveCount(12);
  await page.getByRole('button',{name:'Tipp',exact:true}).click();
  await expect(page.getByText(/^Tipp: \d+ Punkte ansagen/)).toBeVisible();
  await page.getByRole('button',{name:'Ansagen',exact:true}).click();
  await page.getByRole('button',{name:'Zurücknehmen',exact:true}).click();
  await expect(page.getByRole('button',{name:'Ansagen',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ansagen',exact:true}).click();
  await expect(cards.locator('button:not(:disabled)').first()).toBeEnabled();
  await cards.locator('button:not(:disabled)').first().press('Enter');
  await expect(cards.getByRole('button')).toHaveCount(11);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  await expect(cards.locator('button:not(:disabled)')).toHaveCount(0);
  await page.getByRole('button',{name:'Fortfahren',exact:true}).click();
  await page.getByLabel('Tempo',{exact:true}).selectOption('50');
  await page.getByRole('button',{name:'Computer weiterspielen lassen'}).click();
  await expect(page.locator('.game-status')).toContainText('Jass beendet',{timeout:30000});
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('legacy archive opens, steps through original cards, and shows its score',async({page})=>{
  const {readFile}=await import('node:fs/promises');
  const fixture=JSON.parse(await readFile('tests-node/fixtures/legacy-rounds.json','utf8'))[0];
  const text=`### Title: Bauer\n### Rules:\npointPlay 2500 1250 12 looserBegins\nsuitsOn allFourOn crossingOn suitsFirst 50 100\n2 2 1 1 3 3\n${fixture.excerpt}\n`;
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'reference.jar',mimeType:'text/plain',buffer:Buffer.from(text,'latin1')});
  await expect(page.getByRole('region',{name:'Archiv-Wiedergabe'})).toBeVisible();
  await page.getByRole('button',{name:'Weiter',exact:true}).click();
  await expect(page.locator('output')).toHaveText('1 / 36');
  await page.getByRole('slider',{name:'Spielzug'}).fill('36');
  await expect(page.locator('output')).toHaveText('36 / 36');
  await page.screenshot({path:'artifacts/browser/legacy-replay.png'});
  await page.getByRole('button',{name:'Archiv schliessen'}).click();
  await expect(page.getByRole('region',{name:'Archiv-Wiedergabe'})).toHaveCount(0);
});

test('original MP3 effects load on demand and decode',async({page})=>{
  const audioRequests=[];page.on('request',r=>{if(r.url().includes('/assets/audio/'))audioRequests.push(r.url());});
  await page.goto('/');await expect(page.getByRole('img')).toHaveAttribute('data-ready','true');
  expect(audioRequests).toEqual([]);
  const duration=await page.evaluate(async()=>{
    const audio=new Audio('/assets/audio/ANDERE/1100.mp3');
    return new Promise((resolve,reject)=>{audio.onloadedmetadata=()=>resolve(audio.duration);audio.onerror=()=>reject(new Error('MP3 decode failed'));});
  });
  expect(duration).toBeGreaterThan(0);
});

test('French card sets use their original suit labels for trump selection', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'Ansicht',exact:true}).click();
  await page.getByRole('button',{name:'Französisch 1',exact:true}).click();
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  for (const name of ['Karo','Herz','Kreuz','Pik']) await expect(page.getByRole('button',{name,exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Schellen',exact:true})).toHaveCount(0);
});
