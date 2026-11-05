import {test,expect} from '@playwright/test';

const portrait={width:390,height:844},landscape={width:844,height:390};
const prompt=page=>page.getByRole('dialog',{name:'Vollbild einschalten?',exact:true});

async function phone(browser,{result='success',enabled=true,fullscreen=false}={}){
  const context=await browser.newContext({viewport:portrait,screen:portrait,hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.addInitScript(({result,enabled,fullscreen})=>{
    let active=fullscreen;
    window.fullscreenRequests=[];window.fullscreenExits=0;
    window.setFullscreen=value=>{active=value;document.dispatchEvent(new Event('fullscreenchange'));};
    Object.defineProperty(document,'fullscreenEnabled',{get:()=>enabled});
    Object.defineProperty(document,'fullscreenElement',{get:()=>active?document.documentElement:null});
    Element.prototype.requestFullscreen=options=>{
      window.fullscreenRequests.push({options,active:navigator.userActivation.isActive,promptOpen:!!document.querySelector('dialog[aria-labelledby="fullscreen-title"][open]')});
      if(result==='throws')throw new Error('Unavailable');
      if(result==='rejected')return Promise.reject(new Error('Declined'));
      if(result==='delayed')return new Promise(resolve=>{window.finishFullscreen=()=>{window.setFullscreen(true);resolve();};});
      window.setFullscreen(true);return Promise.resolve();
    };
    document.exitFullscreen=()=>{window.fullscreenExits++;window.setFullscreen(false);return Promise.resolve();};
  },{result,enabled,fullscreen});
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-vertical');
  return {context,page};
}

for(const kind of ['Schieber','Differenzler'])test(`${kind}: choosing a game does not request fullscreen`,async({browser})=>{
  const {context,page}=await phone(browser);
  await page.getByRole('button',{name:`Neuer ${kind}…`,exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Neuer Jass',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.fullscreenRequests)).toEqual([]);
  await expect(prompt(page)).toHaveCount(0);
  await context.close();
});

for(const mode of ['auto','mobile-horizontal'])test(`${mode}: portrait startup never prompts, rotation to landscape does`,async({browser})=>{
  const {context,page}=await phone(browser);
  await page.evaluate(mode=>localStorage.setItem('sws-display',JSON.stringify({viewMode:mode})),mode);
  await page.reload();
  await expect(page.locator('main')).toHaveAttribute('data-view',mode==='auto'?'mobile-vertical':'mobile-horizontal');
  await expect(prompt(page)).toHaveCount(0);
  await page.setViewportSize(landscape);
  await expect(prompt(page)).toBeVisible();
  await prompt(page).getByRole('button',{name:'Vollbild einschalten',exact:true}).click();
  await page.setViewportSize(portrait);
  await expect.poll(()=>page.evaluate(()=>window.fullscreenExits)).toBe(1);
  await expect(prompt(page)).toHaveCount(0);
  await context.close();
});

for(const mode of ['auto','mobile-horizontal'])test(`${mode}: initial horizontal load asks once`,async({browser})=>{
  const context=await browser.newContext({viewport:landscape,screen:portrait,hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.addInitScript(mode=>{
    localStorage.setItem('sws-display',JSON.stringify({viewMode:mode}));
    Object.defineProperty(document,'fullscreenEnabled',{get:()=>true});
  },mode);
  await page.goto('/');
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-horizontal');
  await expect(prompt(page)).toBeVisible();
  await prompt(page).getByRole('button',{name:'Nicht jetzt',exact:true}).click();
  await page.setViewportSize({width:820,height:390});
  await expect(prompt(page)).toHaveCount(0);
  await page.reload();
  await expect(prompt(page)).toBeVisible();
  await context.close();
});

test('rotation prompts once, cancellation is respected, and a new entry prompts again',async({browser})=>{
  const {context,page}=await phone(browser);
  await page.setViewportSize(landscape);
  await expect(prompt(page)).toBeVisible();
  expect(await page.evaluate(()=>window.fullscreenRequests)).toEqual([]);
  await page.screenshot({path:'test-results/fullscreen-prompt.png'});
  await prompt(page).getByRole('button',{name:'Nicht jetzt',exact:true}).click();
  await page.setViewportSize({width:820,height:390});
  await expect(prompt(page)).toHaveCount(0);
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Neuer Jass',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>window.fullscreenRequests)).toEqual([]);
  await page.setViewportSize(portrait);
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-vertical');
  await page.setViewportSize(landscape);
  await expect(prompt(page)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(prompt(page)).toHaveCount(0);
  await expect(page.getByRole('dialog',{name:'Neuer Jass',exact:true})).toBeVisible();
  await context.close();
});

test('confirmation requests fullscreen in the click gesture and portrait exits it',async({browser})=>{
  const {context,page}=await phone(browser);
  await page.setViewportSize(landscape);
  await prompt(page).getByRole('button',{name:'Vollbild einschalten',exact:true}).click();
  await expect(prompt(page)).toHaveCount(0);
  expect(await page.evaluate(()=>window.fullscreenRequests)).toEqual([{options:{navigationUI:'hide'},active:true,promptOpen:false}]);
  await page.setViewportSize(portrait);
  await expect.poll(()=>page.evaluate(()=>window.fullscreenExits)).toBe(1);
  expect(await page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
  await context.close();
});

test('manual fullscreen exit does not reopen the prompt until the next horizontal entry',async({browser})=>{
  const {context,page}=await phone(browser);
  await page.setViewportSize(landscape);
  await prompt(page).getByRole('button',{name:'Vollbild einschalten',exact:true}).click();
  await page.evaluate(()=>window.setFullscreen(false));
  await page.setViewportSize({width:820,height:390});
  await expect(prompt(page)).toHaveCount(0);
  await page.setViewportSize(portrait);
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-vertical');
  await page.setViewportSize(landscape);
  await expect(prompt(page)).toBeVisible();
  await context.close();
});

for(const state of ['unsupported','already fullscreen'])test(`${state}: horizontal entry does not prompt`,async({browser})=>{
  const {context,page}=await phone(browser,{enabled:state!=='unsupported',fullscreen:state==='already fullscreen'});
  await page.setViewportSize(landscape);
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-horizontal');
  await expect(prompt(page)).toHaveCount(0);
  expect(await page.evaluate(()=>window.fullscreenRequests)).toEqual([]);
  await context.close();
});

test('leaving horizontal dismisses an unanswered prompt',async({browser})=>{
  const {context,page}=await phone(browser);
  await page.setViewportSize(landscape);
  await expect(prompt(page)).toBeVisible();
  await page.setViewportSize(portrait);
  await expect(prompt(page)).toHaveCount(0);
  expect(await page.evaluate(()=>window.fullscreenRequests)).toEqual([]);
  await context.close();
});

for(const result of ['rejected','throws'])test(`${result}: request failure allows continuing without fullscreen`,async({browser})=>{
  const {context,page}=await phone(browser,{result});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize(landscape);
  await prompt(page).getByRole('button',{name:'Vollbild einschalten',exact:true}).click();
  await expect(prompt(page).getByRole('alert')).toContainText('Vollbild konnte nicht aktiviert werden');
  await prompt(page).getByRole('button',{name:'Nicht jetzt',exact:true}).click();
  await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Neuer Jass',exact:true})).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test('fullscreen granted after rotating back is immediately exited',async({browser})=>{
  const {context,page}=await phone(browser,{result:'delayed'});
  await page.setViewportSize(landscape);
  await prompt(page).getByRole('button',{name:'Vollbild einschalten',exact:true}).click();
  await page.setViewportSize(portrait);
  await expect(page.locator('main')).toHaveAttribute('data-view','mobile-vertical');
  await page.evaluate(()=>window.finishFullscreen());
  await expect.poll(()=>page.evaluate(()=>window.fullscreenExits)).toBe(1);
  expect(await page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
  await expect(prompt(page)).toHaveCount(0);
  await context.close();
});

for(const target of ['Desktop view','Mobile vertical'])test(`manual horizontal selection prompts and ${target} exits real fullscreen`,async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog',{name:'Neuer Jass',exact:true}).getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.locator('.card-target')).toHaveCount(9);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Browser',exact:true}).click();
  await page.getByRole('button',{name:'Mobile horizontal',exact:true}).click();
  await prompt(page).getByRole('button',{name:'Vollbild einschalten',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
  await page.getByRole('button',{name:'Menu',exact:true}).click();
  await page.getByRole('button',{name:'Browser',exact:true}).click();
  await page.getByRole('button',{name:target,exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
  await expect(prompt(page)).toHaveCount(0);
});

test('real fullscreen preserves an open game setup dialog through rotation',async({browser})=>{
  const context=await browser.newContext({viewport:portrait,screen:portrait,hasTouch:true,isMobile:true});
  const page=await context.newPage();
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  const setup=page.getByRole('dialog',{name:'Neuer Jass',exact:true});
  await expect(setup).toBeVisible();
  await page.setViewportSize(landscape);
  await prompt(page).getByRole('button',{name:'Vollbild einschalten',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
  await expect(setup).toBeVisible();
  await page.setViewportSize(portrait);
  await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
  await setup.getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.locator('.card-target')).toHaveCount(9);
  await context.close();
});
