import {test,expect} from '@playwright/test';

for(const kind of ['Schieber','Differenzler'])test(`${kind}: original comments appear, speak, and obey Allgemein settings`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:20,viewSlideS:0}));
    localStorage.setItem('sws-sound',JSON.stringify({enabled:true,comments:true,calls:false,noise:false,hints:false}));
    const selection={characters:[0,0,1,0,2],strengths:[0,2,2,0,2],avatar:5208};
    localStorage.setItem('sws-setup-schieber',JSON.stringify(selection));
    localStorage.setItem('sws-setup-differ',JSON.stringify(selection));
    window.recordings=[];
    window.Audio=class{constructor(src){this.src=src;}play(){window.recordings.push(this.src);setTimeout(()=>this.onended?.(),10);return Promise.resolve();}pause(){}};
  });
  await page.goto('/');
  await page.getByRole('button',{name:`Neuer ${kind}…`,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Neuer Jass',exact:true})).toHaveCount(0);
  await expect(page.locator('.feed-say')).toHaveCount(3);
  await expect(page.locator('.player-bubble')).toHaveCount(3);
  await expect.poll(()=>page.evaluate(()=>window.recordings.length)).toBeGreaterThan(0);
  await expect.poll(()=>page.evaluate(async()=>(await import('/src/audio.js')).speechBusy())).toBe(false);
  expect(await page.locator('.feed-say').allTextContents()).not.toEqual(expect.arrayContaining([expect.stringMatching(/\[|@/)]));
  await page.keyboard.press('Escape');
  const recordingCount=await page.evaluate(()=>window.recordings.length);
  const saved=await page.evaluate(()=>localStorage.getItem('sws-game'));
  await page.locator('input[type=file]').setInputFiles({name:'resume.json',mimeType:'application/json',buffer:Buffer.from(saved)});
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.feed-say')).toHaveCount(3);
  await page.waitForTimeout(100);
  expect(await page.evaluate(()=>window.recordings.length)).toBe(recordingCount);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Allgemein…',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Allgemein',exact:true});
  const categories=kind==='Schieber'?['vor einem Spiel','während einem Spiel','nach einem Spiel','zum Sieg']:['Vor einem Spiel','Während einem Spiel','Nach einem Spiel','Sieg'];
  for(const name of ['Kommentare von Spielern',...categories]){
    const control=dialog.getByRole('checkbox',{name,exact:true});await expect(control).toBeEnabled();await expect(control).toBeChecked();await control.uncheck();
  }
  await dialog.getByRole('button',{name:'OK',exact:true}).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sws-sound')).comments)).toBe(false);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sws-preferences')).genSayBefore)).toBe(false);
  await page.getByRole('button',{name:'Jass',exact:true}).click();
  await page.getByRole('button',{name:`Neuer ${kind}…`,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Neuer Jass',exact:true})).toHaveCount(0);
  await expect(page.locator('.feed-say')).toHaveCount(0);
  expect(await page.evaluate(()=>window.recordings.length)).toBe(recordingCount);
  expect(errors).toEqual([]);
});
