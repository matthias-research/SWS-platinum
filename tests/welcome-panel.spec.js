import {test,expect} from '@playwright/test';

for(const kind of ['Schieber','Differenzler'])test(`${kind}: welcome panel starts, cancels, closes and resumes games`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');
  const panel=page.getByRole('region',{name:'Jass auswählen'});
  await expect(panel).toBeVisible();await expect(page.locator('.scene-frame')).toHaveCount(0);
  const choice=panel.getByRole('button',{name:`Neuer ${kind}…`,exact:true});
  await choice.hover();await expect(choice.locator('img')).toHaveAttribute('src',/Over\.png$/);
  await choice.click();
  await page.getByRole('dialog',{name:'Neuer Jass',exact:true}).getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(panel).toBeVisible();
  await choice.click();await page.getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(panel).toHaveCount(0);await expect(page.locator('.scene-frame')).toBeVisible();
  await expect(page.locator('dialog.decision-dialog')).toBeVisible();
  await page.locator('dialog.decision-dialog').getByRole('button',{name:'Schliessen',exact:true}).click();
  await page.getByRole('button',{name:'Datei',exact:true}).click();
  await page.getByRole('button',{name:'Spiel schliessen',exact:true}).click();
  await expect(panel).toBeVisible();await expect(page.locator('.scene-frame')).toHaveCount(0);
  await panel.getByRole('button',{name:'Spiel fortsetzen',exact:true}).click();
  await expect(panel).toHaveCount(0);await expect(page.locator('.scene-frame')).toBeVisible();
  expect(errors).toEqual([]);
});

test('welcome panel uses both graphics modes and fits a phone',async({page})=>{
  await page.goto('/');
  const panel=page.getByRole('region',{name:'Jass auswählen'});
  await expect(panel.locator('.welcome-background')).toHaveAttribute('src',/enhanced\/panel\/ImgBack.png$/);
  await panel.locator('.welcome-background').evaluate(img=>img.decode());
  await page.screenshot({path:'artifacts/browser/welcome-panel-enhanced.png'});
  await page.getByRole('button',{name:'Ansicht',exact:true}).click();
  await page.getByRole('button',{name:/Originalgrafik$/}).click();
  await expect(panel.locator('.welcome-background')).toHaveAttribute('src','/assets/panel/ImgBack.png');
  await page.setViewportSize({width:390,height:844});
  const rect=await panel.locator('.welcome-art').boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(390);
  await page.screenshot({path:'artifacts/browser/welcome-panel-mobile.png'});
});
