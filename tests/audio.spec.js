import {enableLowlevel} from './lowlevel';
import { test, expect } from '@playwright/test';

test('audio defaults enable all voices and hints but leave noises off',async({page})=>{
  await page.goto('/?review=cards');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sws-sound')))).toMatchObject({enabled:true,own:true,calls:true,comments:true,hints:true,noise:false});
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Allgemein…',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Allgemein',exact:true});
  await expect(dialog.getByRole('checkbox',{name:'Eigene Stimme',exact:true})).toBeChecked();
  await expect(dialog.getByRole('checkbox',{name:'Kommentare von Spielern',exact:true})).toBeChecked();
  await expect(dialog.getByRole('checkbox',{name:'Geräusche',exact:true})).not.toBeChecked();
});

test('saved audio choices override the new defaults',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-sound',JSON.stringify({enabled:false,own:false,calls:false,comments:false,hints:false,noise:true})));
  await page.goto('/?review=cards');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sws-sound')))).toMatchObject({enabled:false,own:false,calls:false,comments:false,hints:false,noise:true});
});

test('Eigene Stimme alone enables human announcements without computer voices',async({page})=>{
  await page.addInitScript(()=>{
    window.recordings=[];
    window.Audio=class{constructor(src){this.src=src;}play(){window.recordings.push(this.src);setTimeout(()=>this.onended?.(),10);return Promise.resolve();}pause(){}};
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:/^Deine Ansage/})).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
  await page.getByRole('button',{name:'Allgemein…',exact:true}).click();
  const settings=page.getByRole('dialog',{name:'Allgemein',exact:true});
  await expect(settings.getByRole('checkbox',{name:'Eigene Stimme',exact:true})).not.toBeChecked();
  await settings.getByRole('checkbox',{name:'Eigene Stimme',exact:true}).check();
  await settings.getByRole('button',{name:'OK',exact:true}).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sws-sound')))).toMatchObject({enabled:true,own:true,calls:false,comments:false,noise:false,hints:false});
  await page.getByRole('button',{name:'Spiel fortsetzen: Auswahl wieder öffnen',exact:true}).click({position:{x:300,y:250}});
  const call=page.getByRole('dialog',{name:/^Deine Ansage/});
  await call.getByRole('textbox',{name:'Ansage',exact:true}).fill('50');
  await call.getByRole('button',{name:'OK',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.recordings)).toEqual([
    expect.stringMatching(/STIMME2\/467\d\.mp3$/),expect.stringMatching(/STIMME2\/4550\.mp3$/),
  ]);
  await page.evaluate(async()=>{
    const audio=await import('/src/audio.js');
    const settings={enabled:true,own:true,calls:false,noise:false,voice:3,set:1,volume:0.6};
    audio.soundForAction({command:'cmdCall',data:{fPlayer:1,fCall:50}},{human:3,characters:[0,1,0,0,2],calls:[0,50]},settings);
  });
  expect(await page.evaluate(()=>window.recordings.length)).toBe(2);
});

test('general settings enable commentary independently of calls and retain comment categories',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Wähle deinen Trumpf!',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  const open=async()=>{
    await page.getByRole('button',{name:'Einstellungen',exact:true}).click();
    await page.getByRole('button',{name:'Allgemein…',exact:true}).click();
  };
  await open();
  const dialog=page.getByRole('dialog',{name:'Allgemein',exact:true});
  const comments=dialog.getByRole('checkbox',{name:'Kommentare von Spielern',exact:true});
  await expect(comments).toBeEnabled();await expect(comments).not.toBeChecked();
  for(const name of ['vor einem Spiel','während einem Spiel','nach einem Spiel','zum Sieg']) {
    await expect(dialog.getByRole('checkbox',{name,exact:true})).toBeEnabled();
    await expect(dialog.getByRole('checkbox',{name,exact:true})).toBeChecked();
  }
  await comments.check();
  await dialog.getByRole('checkbox',{name:'während einem Spiel',exact:true}).uncheck();
  await dialog.getByRole('button',{name:'OK',exact:true}).click();
  const sound=await page.evaluate(()=>JSON.parse(localStorage.getItem('sws-sound')));
  expect(sound).toMatchObject({enabled:true,comments:true,calls:false,noise:false,hints:false});
  await open();
  await expect(comments).toBeChecked();
  await expect(dialog.getByRole('checkbox',{name:'während einem Spiel',exact:true})).not.toBeChecked();
  await expect(dialog.getByRole('checkbox',{name:'vor einem Spiel',exact:true})).toBeChecked();
});

test('comments queue behind announcements, survive card actions, and cancel when disabled',async({page})=>{
  await page.addInitScript(()=>{
    window.recordings=[];
    window.Audio=class {
      constructor(src){this.src=src;this.paused=false;}
      play(){window.recordings.push(this);return Promise.resolve();}
      pause(){this.paused=true;}
    };
  });
  await page.goto('/');
  await page.evaluate(async()=>{
    window.audio=await import('/src/audio.js');
    window.audioSettings={enabled:true,comments:true,calls:true,noise:false,voice:3,set:1,volume:0.6};
    window.audio.soundForAction({command:'cmdTrump',data:{fPlayer:1,fTrump:1}},{human:3,characters:[0,1,0,0,2]},window.audioSettings);
    window.audio.soundForComments([{kind:'say',voice:3,sound:7001},{kind:'say',voice:4,sound:8004}],window.audioSettings);
  });
  await expect.poll(()=>page.evaluate(()=>window.recordings.length)).toBe(1);
  await page.evaluate(()=>window.audio.soundForAction({command:'cmdCard',data:{fPlayer:1}},{human:3},window.audioSettings));
  expect(await page.evaluate(()=>window.recordings[0].paused)).toBe(false);
  expect(await page.evaluate(()=>window.audio.speechBusy())).toBe(true);
  await page.evaluate(()=>window.recordings[0].onended());
  await expect.poll(()=>page.evaluate(()=>window.recordings.map(a=>a.src))).toEqual([
    expect.stringMatching(/DEUTSCH\/STIMME4\/881\d\.mp3$/),expect.stringMatching(/STIMME3\/7001\.mp3$/),
  ]);
  await page.evaluate(()=>window.audio.configureAudio({...window.audioSettings,comments:false}));
  await expect.poll(()=>page.evaluate(()=>window.audio.speechBusy())).toBe(false);
  expect(await page.evaluate(()=>window.recordings.every(a=>a.paused))).toBe(true);
  expect(await page.evaluate(()=>window.recordings.length)).toBe(2);
  await page.evaluate(()=>{
    window.audio.soundForComments([{kind:'say',voice:4,sound:8004}],window.audioSettings);
    window.audio.stopAudio();
  });
  await expect.poll(()=>page.evaluate(()=>window.audio.speechBusy())).toBe(false);
  expect(await page.evaluate(()=>window.recordings.length)).toBe(2);
});

test('spoken hints play in order, mute cancels them, and voice preferences persist', async ({page}) => {
  await page.addInitScript(() => {
    window.recordings = [];
    window.Audio = class {
      constructor(src) { this.src = src; this.paused = false; }
      play() { window.recordings.push(this); return Promise.resolve(); }
      pause() { this.paused = true; }
    };
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Deine Ansage…',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await enableLowlevel(page);
  await expect(page.getByRole('button',{name:'Tipp',exact:true})).toBeEnabled();
  await page.getByRole('checkbox',{name:'Ton',exact:true}).check();
  await page.getByRole('combobox',{name:'Stimme',exact:true}).selectOption('6');
  await page.getByRole('button',{name:'Tipp',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.recordings.map(a=>a.src))).toEqual([expect.stringMatching(/STIMME1\/300[1-4]\.mp3$/)]);
  await page.evaluate(()=>window.recordings[0].onended());
  await expect.poll(()=>page.evaluate(()=>window.recordings.length)).toBe(2);
  await page.keyboard.press('Escape');
  await page.getByRole('checkbox',{name:'Ton',exact:true}).uncheck();
  expect(await page.evaluate(()=>window.recordings.every(a=>a.paused))).toBe(true);
  const saved=await page.evaluate(()=>localStorage.getItem('sws-game'));
  await page.reload();
  await page.locator('input[type=file]').setInputFiles({name:'resume.json',mimeType:'application/json',buffer:Buffer.from(saved)});
  await expect(page.getByRole('dialog',{name:'Deine Ansage…',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await enableLowlevel(page);
  await expect(page.getByRole('checkbox',{name:'Ton',exact:true})).not.toBeChecked();
  await page.getByRole('checkbox',{name:'Ton',exact:true}).check();
  await expect(page.getByRole('combobox',{name:'Stimme',exact:true})).toHaveValue('6');
});
