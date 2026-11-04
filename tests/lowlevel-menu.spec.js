import {test,expect} from '@playwright/test';

test('Lowlevel menu defaults off and toggles retained controls and title-screen resume',async({page})=>{
  await page.goto('/');
  const toggle=async expected=>{
    await page.getByRole('button',{name:'Browser',exact:true}).click();
    const item=page.getByRole('button',{name:'Lowlevel menu',exact:true});
    await expect(item).toHaveAttribute('aria-pressed',String(!expected));
    await item.click();
  };
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.getByRole('dialog',{name:/Wähle deinen Trumpf/})).toBeVisible();
  await page.getByRole('dialog').getByRole('button',{name:'Abbrechen',exact:true}).click();
  await expect(page.locator('.game-actions')).toHaveCount(0);
  await toggle(true);
  await expect(page.getByRole('button',{name:'Pause',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Schellen',exact:true})).toBeVisible();
  await toggle(false);
  await expect(page.locator('.game-actions')).toHaveCount(0);
  await page.getByRole('button',{name:'Datei',exact:true}).click();
  await page.getByRole('button',{name:'Spiel schliessen',exact:true}).click();
  await expect(page.getByRole('button',{name:'Spiel fortsetzen',exact:true})).toHaveCount(0);
  await toggle(true);
  await expect(page.getByRole('button',{name:'Spiel fortsetzen',exact:true})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button',{name:'Spiel fortsetzen',exact:true})).toHaveCount(0);
});
