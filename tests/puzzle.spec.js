import {test,expect} from '@playwright/test';

test('puzzle tiles slide into the gap, reject diagonal moves and support all original sizes',async({page})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Hilfe',exact:true}).click();
  await page.getByRole('button',{name:'Puzzle…',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Puzzle',exact:true}),board=dialog.locator('.sliding-puzzle');
  for(const [size,columns,count] of [['3 x 3',3,9],['3 x 4',4,12],['4 x 4',4,16]]){
    await dialog.getByRole('combobox',{name:'Puzzleteile'}).selectOption(size);
    await expect(board.locator('button')).toHaveCount(count);
    const gap=Number(await board.locator('[data-empty="true"]').getAttribute('data-position'));
    const row=Math.floor(gap/columns),column=gap%columns;
    const invalid=(row===0?columns:0)+(column===0?1:0);
    await board.locator(`[data-position="${invalid}"]`).click({force:true});
    await expect(board.locator('[data-empty="true"]')).toHaveAttribute('data-position',String(gap));
    const target=row*columns+(column<columns/2?columns-1:0);
    const moving=board.locator(`[data-position="${target}"]`),name=await moving.getAttribute('aria-label');
    await moving.click();
    await expect(board.locator('[data-empty="true"]')).toHaveAttribute('data-position',String(target));
    const tile=board.getByRole('button',{name,exact:true});
    await expect(tile).toHaveAttribute('data-position',String(target+(target>gap?-1:1)));
    await expect(tile).toHaveAttribute('aria-disabled','false');
    await dialog.getByRole('button',{name:'Fertig',exact:true}).click();
    await expect(dialog.getByRole('group',{name:'Puzzle gelöst',exact:true})).toBeVisible();
    await expect(board.locator('[data-empty="true"]')).toHaveCount(0);
    await board.getByRole('button',{name:'Puzzleteil 1',exact:true}).click();
    await expect(board.locator('[data-empty="true"]')).toHaveCount(1);
  }
  await page.screenshot({path:'artifacts/browser/puzzle-sliding.png'});
  await dialog.getByRole('button',{name:'OK',exact:true}).click();
  await expect(dialog).toHaveCount(0);
});
