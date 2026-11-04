import {test,expect} from '@playwright/test';

test('graphics switch covers portraits, dialogs and every card sheet without changing layout',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  for(const mode of ['enhanced','original','enhanced']){
    await page.getByRole('button',{name:'Ansicht',exact:true}).click();
    await page.getByRole('button',{name:mode==='enhanced'?/Verbesserte Grafik$/:/Originalgrafik$/}).click();
    await expect(page.locator('html')).toHaveAttribute('data-graphics',mode);
    await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
    const setup=page.getByRole('dialog',{name:'Neuer Jass',exact:true});
    await setup.locator('img').first().evaluate(img=>img.decode());
    const dimensions=await setup.locator('.legacy-portrait img').first().evaluate(img=>({src:img.src,width:img.naturalWidth,layout:img.clientWidth}));
    expect(dimensions.src.includes('/assets/enhanced/')).toBe(mode==='enhanced');
    expect(dimensions.width).toBe(mode==='enhanced'?134:67);expect(dimensions.layout).toBe(67);
    await setup.getByRole('button',{name:'Cancel',exact:true}).click();
    const sheets=await page.evaluate(async()=>{
      const {loadCardManifest,loadCardSheet}=await import('/src/cards.js');const m=await loadCardManifest();const result=[];
      for(let set=1;set<=5;set++)for(const size of [1,2])for(const o of ['V','H']){
        const s=await loadCardSheet(m,set,size,o);result.push({scale:s.assetScale,src:s.image.src});
      }return result;
    });
    expect(sheets).toHaveLength(20);
    for(const s of sheets){expect(s.scale).toBe(mode==='enhanced'?2:1);expect(s.src.includes('/assets/enhanced/')).toBe(mode==='enhanced');}
  }
  await page.reload();await expect(page.locator('html')).toHaveAttribute('data-graphics','enhanced');
  expect(errors).toEqual([]);
});

test('enhanced canvas crops and glyphs retain logical dimensions',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('button',{name:'Spielen',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:/wählen Sie den Trumpf/});
  await expect(dialog).toBeVisible();
  await expect.poll(()=>dialog.locator('canvas').evaluate(c=>c.width)).toBe(450);
  expect(await dialog.locator('canvas').evaluate(c=>c.style.width)).toBe('225px');
  await dialog.screenshot({path:'artifacts/browser/enhanced-trump.png'});
});
