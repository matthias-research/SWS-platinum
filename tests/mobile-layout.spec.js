import {test,expect,devices} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {Game} from '../src/engine/game.js';
import {SchieberAI} from '../src/ai/schieber.js';
import {DifferAI} from '../src/ai/differ.js';

async function start(page,kind='Schieber'){
  await page.goto('/');
  await page.getByRole('button',{name:`Neuer ${kind}…`,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.locator('.card-target')).toHaveCount(9);
}
async function fits(page){
  await expect(async()=>{
  const bounds=await page.locator('.scene-frame').boundingBox();
  const viewport=page.viewportSize();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x+bounds.width).toBeLessThanOrEqual(viewport.width+1);
  expect(bounds.y+bounds.height).toBeLessThanOrEqual(viewport.height+1);
  for(const card of await page.locator('.card-target').all()){
    const r=await card.boundingBox();
    expect(r.x).toBeGreaterThanOrEqual(bounds.x);
    expect(r.x+r.width).toBeLessThanOrEqual(bounds.x+bounds.width+1);
  }
  }).toPass({timeout:3000});
}
test('manual modes fit a narrow desktop browser and reset on reload',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await start(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('main')).toHaveAttribute('data-view','desktop');
  await page.getByRole('button',{name:'Browser',exact:true}).click();
  await page.getByRole('button',{name:'Mobile vertical',exact:true}).click();
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-vertical');
  await expect(page.getByRole('log')).toHaveCount(0);
  await fits(page);
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('data-view','desktop');
});

test('phone auto view rotates, preserves cards, and opens landscape menus beside the table',async({browser})=>{
  const {defaultBrowserType,...phone}=devices['iPhone 13'];
  const context=await browser.newContext(phone);
  const page=await context.newPage();
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:0,viewSlideS:0})));
  await start(page);
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-vertical');
  await page.keyboard.press('Escape');
  await fits(page);
  const cards=await page.locator('.card-target').evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')));
  await page.screenshot({path:'test-results/mobile-portrait.png'});
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-horizontal');
  await page.getByRole('dialog',{name:'Vollbild einschalten?',exact:true}).getByRole('button',{name:'Nicht jetzt',exact:true}).click();
  await fits(page);
  expect(await page.locator('.card-target').evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')))).toEqual(cards);
  const nav=await page.getByRole('navigation').boundingBox(),canvas=await page.locator('.scene-frame').boundingBox();
  expect(nav.x).toBeGreaterThanOrEqual(canvas.x);
  expect(Math.abs(nav.y-canvas.y)).toBeLessThan(3);
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.getByRole('button',{name:'Browser',exact:true}).click();
  const popup=page.locator('#menu-Browser');await expect(popup).toBeVisible();
  const menu=await page.locator('#compact-menu').boundingBox();
  expect(menu.x).toBeGreaterThanOrEqual(canvas.x);
  expect(menu.y+menu.height).toBeLessThanOrEqual(390);
  await page.screenshot({path:'test-results/mobile-landscape.png'});
  await context.close();
});

for(const kind of ['schieber','differ'])test(`${kind}: mobile hand can play cards in portrait and landscape`,async({page})=>{
  const ai=kind==='schieber'?new SchieberAI(await readFile('public/assets/ai/RUGD7000.DAT')):new DifferAI(await readFile('public/assets/ai/RGDIFF.DAT'));
  const game=new Game({kind,seed:1,id:'mobile-'+kind,rules:{fNuPlayers:3,fSuitsEnabled:false}},ai);
  game.act({type:'deal'});
  while(game.request()?.command!=='cmdPlay')game.computer();
  const saved=game.save();saved.options.human=game.request().player;
  await page.addInitScript(()=>{
    localStorage.setItem('sws-display',JSON.stringify({viewMode:'mobile-vertical',resolution:'fixed'}));
    localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:0,viewSlideS:30}));
  });
  await page.setViewportSize({width:320,height:640});await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({name:'mobile.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});
  await expect(page.locator('.card-target')).toHaveCount(kind==='differ'?12:9);
  await fits(page);
  await page.locator('.card-target:enabled').first().click();
  await expect(page.locator('.scene-frame > canvas')).toHaveAttribute('data-animation','play');
  await expect(page.locator('.card-target')).toHaveCount(kind==='differ'?11:8);
  await page.getByRole('button',{name:'Browser',exact:true}).click();
  await page.getByRole('button',{name:'Mobile horizontal',exact:true}).click();
  await page.getByRole('dialog',{name:'Vollbild einschalten?',exact:true}).getByRole('button',{name:'Nicht jetzt',exact:true}).click();
  await page.setViewportSize({width:667,height:375});
  await fits(page);
  await expect(page.getByRole('log')).toHaveCount(1);
});

test('landscape Menu overlays the canvas without moving it and dismisses after use',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('sws-display',JSON.stringify({viewMode:'mobile-horizontal'}));
    localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:0}));
    Object.defineProperty(document,'fullscreenEnabled',{get:()=>false});
  });
  await page.setViewportSize({width:844,height:390});
  await start(page);
  await expect(page.getByRole('dialog',{name:'Wähle deinen Trumpf!'})).toBeVisible();
  await page.keyboard.press('Escape');
  const canvas=page.locator('.scene-frame');
  const before=await canvas.boundingBox();
  expect(before.y).toBeLessThan(10);
  await expect(page.getByRole('button',{name:'Browser',exact:true})).toHaveCount(0);
  const toggle=page.getByRole('button',{name:'Menu',exact:true});
  await toggle.click();
  const dropdown=page.locator('#compact-menu');
  await expect(dropdown).toBeVisible();
  expect(await canvas.boundingBox()).toEqual(before);
  const bounds=await dropdown.boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(before.x);
  expect(bounds.x+bounds.width).toBeLessThan(before.x+before.width);
  expect(bounds.y).toBeLessThan(before.y+before.height);
  await page.getByRole('button',{name:'Browser',exact:true}).click();
  await page.getByRole('button',{name:'Originalgrafik',exact:true}).click();
  await expect(dropdown).toHaveCount(0);
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(dropdown).toHaveCount(0);
  await toggle.click();
  await page.screenshot({path:'test-results/landscape-menu.png'});
  const current=await canvas.boundingBox();
  await page.mouse.click(current.x+current.width-20,current.y+100);
  await expect(dropdown).toHaveCount(0);
});
