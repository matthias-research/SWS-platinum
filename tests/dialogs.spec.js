import {test,expect} from '@playwright/test';
async function menu(page,group,name){await page.getByRole('button',{name:group,exact:true}).click();await page.getByRole('button',{name,exact:true}).click();}
test('original rules, profile, credits and auxiliary dialogs load with live controls',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('sws-display',JSON.stringify({scale:1})));
  await page.goto('/');
  await menu(page,'Datei','Spielerdaten…');
  let dialog=page.getByRole('dialog');
  await dialog.getByRole('textbox',{name:'Übername',exact:true}).fill('Matthi');
  await dialog.getByRole('textbox',{name:'Voller Name',exact:true}).fill('Testspieler');
  await dialog.screenshot({path:'artifacts/browser/dialog-profile.png'});
  await dialog.getByRole('button',{name:'OK',exact:true}).click();
  expect(await page.evaluate(()=>localStorage.getItem('sws-player'))).toBe('Matthi');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await dialog.getByRole('button',{name:'Regeln…',exact:true}).click();
  const rules=page.getByRole('dialog',{name:'Spielregeln'});
  await rules.getByRole('radio',{name:'Anzahl Spiele',exact:true}).check();
  await rules.getByRole('spinbutton',{name:'Runden',exact:true}).fill('2');
  await rules.screenshot({path:'artifacts/browser/dialog-rules-schieber.png'});
  await rules.getByRole('button',{name:'OK',exact:true}).click();
  await page.getByRole('dialog',{name:'Neuer Jass'}).getByRole('button',{name:'Cancel',exact:true}).click();
  for(const [group,name,title] of [['Hilfe','Über Stöck Wyys Stich…','Über Stöck Wyys Stich'],['Hilfe','Entwicklungsteam…','Entwicklungsteam'],['Hilfe','Graphik design…','Graphik design'],['Jass','Kartenverteilungen…','Kartenverteilungen'],['Jass','Bestenliste…','Bestenliste'],['Jass','Statistik…','Jass Statistik']]){
    await menu(page,group,name);dialog=page.getByRole('dialog',{name:title,exact:true});await expect(dialog).toBeVisible();await dialog.screenshot({path:`artifacts/browser/dialog-${title.replace(/[^a-z]/gi,'')}.png`});await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});
test('original puzzle and credits use their recovered bitmaps',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
  await menu(page,'Hilfe','Puzzle…');let dialog=page.getByRole('dialog',{name:'Puzzle',exact:true});
  await expect(dialog.locator('.sliding-puzzle button')).toHaveCount(9);
  await dialog.getByRole('combobox',{name:'Puzzleteile'}).selectOption('4 x 4');
  await expect(dialog.locator('.sliding-puzzle button')).toHaveCount(16);
  await dialog.getByRole('button',{name:'Fertig',exact:true}).click();await expect(dialog.getByRole('group',{name:'Puzzle gelöst'})).toBeVisible();
  await dialog.screenshot({path:'artifacts/browser/dialog-puzzle.png'});await page.keyboard.press('Escape');
  await menu(page,'Hilfe','Über Stöck Wyys Stich…');dialog=page.getByRole('dialog');
  await dialog.getByRole('button',{name:'Porträt 5',exact:true}).click();await expect(dialog.getByRole('img',{name:'Porträt 5',exact:true})).toBeVisible();
  await dialog.getByRole('button',{name:'Porträt schliessen'}).click();
  for(let i=0;i<3;i++)await dialog.getByRole('button',{name:'Nächstes Bild'}).click({position:{x:5,y:5}});
  await expect(dialog.getByRole('img',{name:'Originaler Abspann'})).toBeVisible();expect(errors).toEqual([]);
});
test('Differenzler illustrated setup switches to three players through original rules',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  const setup=page.getByRole('dialog',{name:'Neuer Jass'});
  await setup.getByRole('button',{name:'Regeln…',exact:true}).click();
  const rules=page.getByRole('dialog',{name:'Spielregeln'});
  await rules.getByRole('radio',{name:'3 Spieler',exact:true}).check();
  await rules.getByRole('combobox',{name:'Runden',exact:true}).selectOption('1');
  await rules.screenshot({path:'artifacts/browser/dialog-rules-differ.png'});
  await rules.getByRole('button',{name:'OK',exact:true}).click();
  await expect(setup.getByRole('button',{name:/^Ost:/})).toHaveCount(0);
  await setup.screenshot({path:'artifacts/browser/dialog-setup-differ.png'});
  await setup.getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:/sagt an/})).toBeVisible();
  await page.getByRole('dialog',{name:/sagt an/}).screenshot({path:'artifacts/browser/dialog-call.png'});
});

test('archive dialog exports a playable snapshot and fast-play dialog can stop a series',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:/sagt an/})).toBeVisible();await page.keyboard.press('Escape');
  await menu(page,'Datei','Archivieren…');const archive=page.getByRole('dialog',{name:'Archivieren',exact:true});
  await archive.getByRole('textbox',{name:'Bezeichnung',exact:true}).fill('Testarchiv');
  const downloadPromise=page.waitForEvent('download');await archive.getByRole('button',{name:'OK',exact:true}).click();
  const download=await downloadPromise;const {readFile}=await import('node:fs/promises');const saved=await readFile(await download.path());
  expect(JSON.parse(saved).text).toContain('### Title: Testarchiv');
  await page.locator('input[type=file]').setInputFiles({name:'snapshot.sws-archive.json',mimeType:'application/json',buffer:saved});
  await expect(page.getByRole('region',{name:'Archiv-Wiedergabe'})).toBeVisible();
  await page.getByRole('button',{name:'Archiv schliessen'}).click();
  await menu(page,'Jass','Computer Schnellspiel…');const auto=page.getByRole('dialog',{name:'Spiel starten'});
  await auto.getByRole('spinbutton',{name:'Anzahl Spiele'}).fill('2');await auto.getByRole('radio',{name:'keine',exact:true}).check();await auto.getByRole('button',{name:'OK',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Schnellspiel abbrechen',exact:true}).click();
  await expect(page.getByRole('button',{name:'Schnellspiel abbrechen',exact:true})).toHaveCount(0);
});
