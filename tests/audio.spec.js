import { test, expect } from '@playwright/test';

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
  await expect(page.getByRole('button',{name:'Tipp',exact:true})).toBeEnabled();
  await page.getByRole('checkbox',{name:'Ton',exact:true}).check();
  await page.getByRole('combobox',{name:'Stimme',exact:true}).selectOption('6');
  await page.getByRole('button',{name:'Tipp',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.recordings.map(a=>a.src))).toEqual([expect.stringMatching(/STIMME1\/300[1-4]\.mp3$/)]);
  await page.evaluate(()=>window.recordings[0].onended());
  await expect.poll(()=>page.evaluate(()=>window.recordings.length)).toBe(2);
  await page.getByRole('checkbox',{name:'Ton',exact:true}).uncheck();
  expect(await page.evaluate(()=>window.recordings.every(a=>a.paused))).toBe(true);
  await page.reload();
  await page.getByRole('button',{name:'Spiel fortsetzen',exact:true}).click();
  await expect(page.getByRole('checkbox',{name:'Ton',exact:true})).not.toBeChecked();
  await page.getByRole('checkbox',{name:'Ton',exact:true}).check();
  await expect(page.getByRole('combobox',{name:'Stimme',exact:true})).toHaveValue('6');
});
