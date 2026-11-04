import {test,expect} from '@playwright/test';

for(const kind of ['Schieber','Differenzler'])test(`${kind} table joker opens advice`,async({page})=>{
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

test('joker suggests trump with a clean symbol or Schieben and lets the player accept or cancel',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const choice=page.getByRole('dialog',{name:/wählen Sie den Trumpf/});
  await choice.getByRole('button',{name:'Tipp',exact:true}).click();
  const advice=page.getByRole('dialog',{name:'Ratschlag',exact:true});
  await expect(advice).toBeVisible();
  await expect(advice.locator('.hint-picture')).toHaveCount(0);
  if(await advice.locator('img').count()){
    await expect(advice.locator('img')).toHaveAttribute('src',/dialogs\/symbols\/\d-\d\.png$/);
    await expect.poll(()=>advice.locator('img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  }else await expect(advice).toContainText('Schieben');
  await advice.getByRole('button',{name:'Abbrechen',exact:true}).click();
  await expect(advice).toHaveCount(0);
  await choice.getByRole('button',{name:'Tipp',exact:true}).click();
  await expect(advice).toBeVisible();
  await advice.getByRole('button',{name:'OK',exact:true}).click();
  await expect(advice).toHaveCount(0);
  await expect(choice).toHaveCount(0);
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
  if(kind==='Schieber')await expect(page.getByRole('log',{name:'Spielverlauf'})).toContainText('Sie trumpft');
  else{await expect(page.locator('.points-plate[data-player="3"]')).toHaveAttribute('data-call','60');await expect(page.getByRole('log',{name:'Spielverlauf'})).not.toContainText('Sie sagt 60');}
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
