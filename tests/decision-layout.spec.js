import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:0})));
});

async function expectEnlargedDecision(page,dialog){
  await expect.poll(()=>dialog.evaluate(el=>{
    const scene=document.querySelector('.scene-frame > canvas').getBoundingClientRect();
    const cards=[...document.querySelectorAll('.card-target')].map(c=>c.getBoundingClientRect());
    const content=el.querySelector('.original-dialog-content');
    const width=parseFloat(content.style.width),height=parseFloat(content.style.height);
    const preferred=Number(document.querySelector('.scene-frame > canvas').dataset.scale)*1.5;
    const above=Math.min(innerHeight-8,Math.min(...cards.map(c=>c.top))-10)-Math.max(8,scene.top+6);
    const below=innerHeight-8-Math.max(8,Math.max(...cards.map(c=>c.bottom))+10);
    const mobile=document.querySelector('.application').dataset.view.startsWith('mobile-');
    const expected=Math.min(preferred,(innerWidth-20)/width,(mobile?Math.max(above,below):above)/height);
    return Math.abs(new DOMMatrix(getComputedStyle(content).transform).a-expected);
  })).toBeLessThan(0.01);
}

test('auto view keeps desktop trump dialog above the hand in a tall narrow window',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-display',JSON.stringify({viewMode:'auto'})));
  await page.setViewportSize({width:900,height:1400});await page.goto('/');
  await expect(page.locator('.application')).toHaveAttribute('data-view','desktop');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Wähle deinen Trumpf!',exact:true});
  await expect(dialog).toBeVisible();
  await expect.poll(()=>dialog.evaluate(el=>{
    const scene=document.querySelector('.scene-frame > canvas').getBoundingClientRect();
    const handTop=Math.min(...[...document.querySelectorAll('.card-target')].map(c=>c.getBoundingClientRect().top));
    const rect=el.getBoundingClientRect();
    return rect.top>=scene.top&&rect.bottom<=handTop;
  })).toBe(true);
});

test('mobile auto view preserves decision sizing and keeps the hand visible',async({page})=>{
  await page.addInitScript(()=>{
    const original=window.matchMedia.bind(window);
    window.matchMedia=q=>q==='(pointer: coarse)'?{matches:true,addEventListener(){},removeEventListener(){}}:original(q);
    Object.defineProperty(screen,'width',{value:390});
    Object.defineProperty(document,'fullscreenEnabled',{value:false});
  });
  await page.setViewportSize({width:390,height:1000});await page.goto('/');
  await expect(page.locator('.application')).toHaveAttribute('data-view','mobile-vertical');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Wähle deinen Trumpf!',exact:true});
  await expect(dialog).toBeVisible();
  await checkHandVisible(page);
  await expectEnlargedDecision(page,dialog);
});

for(const kind of ['Differenzler'])test(`${kind} table joker opens advice`,async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:`Neuer ${kind}…`,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Abbrechen',exact:true}).click();
  const joker=page.getByRole('button',{name:'Joker: Ratschlag',exact:true});
  await expect(joker).toBeEnabled();
  await expect.poll(()=>joker.locator('canvas').evaluate(c=>c.width)).toBeGreaterThan(0);
  await joker.click();
  await expect(page.getByRole('dialog',{name:'Ratschlag',exact:true})).toBeVisible();
  await page.getByRole('dialog',{name:'Ratschlag',exact:true}).getByRole('button',{name:'Abbrechen',exact:true}).click();
  await expect(joker).toBeEnabled();
  await page.screenshot({path:`artifacts/browser/${kind.toLowerCase()}-table-joker.png`});
});

async function checkHandVisible(page){
  const dialog=page.locator('dialog.decision-dialog[open]');await expect(dialog).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>{
    const dialog=document.querySelector('dialog.decision-dialog[open]').getBoundingClientRect();
    return [...document.querySelectorAll('.card-target')].every(card=>{const r=card.getBoundingClientRect();return dialog.bottom<=r.top||dialog.top>=r.bottom||dialog.right<=r.left||dialog.left>=r.right;});
  })).toBe(true);
  expect(await dialog.evaluate(el=>getComputedStyle(el,'::backdrop').backgroundColor)).toBe('rgba(0, 0, 0, 0)');
}
for(const kind of ['Schieber','Differenzler'])test(`${kind} decision leaves the whole hand visible with large cards and on mobile`,async({page})=>{
  await page.setViewportSize({width:1280,height:900});await page.goto('/');
  await page.getByRole('button',{name:`Neuer ${kind}…`,exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await checkHandVisible(page);
  await page.screenshot({path:`artifacts/browser/${kind.toLowerCase()}-decision-visible-hand.png`});
  await page.setViewportSize({width:390,height:844});await checkHandVisible(page);
  await page.screenshot({path:`artifacts/browser/${kind.toLowerCase()}-decision-mobile.png`});
  if(kind==='Schieber')await page.getByRole('dialog').getByRole('button',{name:'Schellen',exact:true}).click();
  else{await page.getByRole('textbox',{name:'Ansage',exact:true}).fill('60');await page.getByRole('dialog').getByRole('button',{name:'OK',exact:true}).click();}
  if(kind==='Schieber')await expect(page.getByRole('log',{name:'Spielverlauf'})).toContainText('Du trumpfst');
  else{await expect(page.locator('.points-plate[data-player="3"]')).toHaveAttribute('data-call','60');await expect(page.getByRole('log',{name:'Spielverlauf'})).not.toContainText('Du sagst 60');}
});

test('all six trump symbols use the original card-sheet pixels in all four carpet corners',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {drawTrumpCorners}=await import('/src/gameDrawing.js');
    const {loadCardManifest,loadCardSheet}=await import('/src/cards.js');
    const manifest=await loadCardManifest(),failures=[];
    for(let set=1;set<=5;set++)for(const size of [1,2]){
      const sheet=await loadCardSheet(manifest,set,size,'V'),canvas=document.createElement('canvas');canvas.width=768;canvas.height=528;const ctx=canvas.getContext('2d');
      const expected=document.createElement('canvas');expected.width=22;expected.height=22;const ec=expected.getContext('2d');
      for(let trump=1;trump<=6;trump++){
        ctx.clearRect(0,0,768,528);ec.clearRect(0,0,22,22);
        const s=sheet.assetScale;
        drawTrumpCorners(ctx,sheet,trump);ec.drawImage(sheet.image,(trump-1)*22*s,4*(sheet.cards[0].rect.height-1)*s,22*s,22*s,0,0,22,22);
        const pixels=ec.getImageData(0,0,22,22).data;
        for(const x of [269,479])for(const y of [52,262])if(!ctx.getImageData(x,y,22,22).data.every((n,i)=>Math.abs(n-pixels[i])<=1))failures.push({set,size,trump,x,y});
      }
      ctx.clearRect(0,0,768,528);drawTrumpCorners(ctx,sheet,0);if(ctx.getImageData(269,52,22,22).data.some(Boolean))failures.push('No-trump should be blank');
    }
    return failures;
  });
  expect(result).toEqual([]);
});

for(const mode of ['adaptive','fixed'])test('trump dialog follows '+mode+' resolution',async({page})=>{
  await page.addInitScript(mode=>localStorage.setItem('sws-display',JSON.stringify({resolution:mode})),mode);
  await page.setViewportSize({width:1400,height:1000});await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:/Wähle deinen Trumpf/}),table=page.locator('.scene-frame > canvas');
  await checkHandVisible(page);
  const scale=Number(await table.getAttribute('data-scale'));
  if(mode==='adaptive')expect(scale).toBeGreaterThan(1.5);else expect(scale).toBe(1);
  await expectEnlargedDecision(page,dialog);
  await page.setViewportSize({width:1000,height:750});await checkHandVisible(page);
  await expectEnlargedDecision(page,dialog);
});

for(const kind of ['Schieber','Differenzler'])test(`${kind}: portrait board width and enlarged decision`,async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-display',JSON.stringify({viewMode:'mobile-vertical',resolution:'adaptive'})));
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.getByRole('button',{name:`Neuer ${kind}…`,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const dialog=page.locator('dialog.decision-dialog');
  await checkHandVisible(page);
  await expectEnlargedDecision(page,dialog);
  const ratio=await page.locator('.scene-frame > canvas').evaluate(el=>{const r=el.getBoundingClientRect();return r.width/r.height;});
  expect(ratio).toBeCloseTo((kind==='Schieber'?520:580)/620,3);
  const tableScale=Number(await page.locator('.scene-frame > canvas').getAttribute('data-scale'));
  const zoom=await dialog.locator('.original-dialog-content').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
  const uiScale=Math.min(tableScale,zoom);
  expect((await dialog.getByRole('button',{name:'Abbrechen',exact:true}).boundingBox()).width).toBeCloseTo(100*uiScale,0);
  expect((await dialog.locator('.original-caption').boundingBox()).height).toBeCloseTo(22*uiScale,0);
  expect(await dialog.evaluate(el=>getComputedStyle(el).borderTopWidth)).toBe('1px');
});
