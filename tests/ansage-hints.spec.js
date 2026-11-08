import {test,expect} from '@playwright/test';

for(const hint of [0,52,53,105,106,157])test(`Ansage joker pose and value for ${hint}`,async({page})=>{
  await page.addInitScript(hint=>{
    localStorage.setItem('sws-preferences',JSON.stringify({genSayBefore:false}));
    const send=Worker.prototype.postMessage;
    Worker.prototype.postMessage=function(message,...args){
      if(message.type==='hint')setTimeout(()=>this.onmessage({data:{hint:{command:'cmdCall',data:{fCall:hint}}}}),30);
      else send.call(this,message,...args);
    };
  },hint);
  await page.goto('/');await page.getByRole('button',{name:'Neuer Differenzler…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Deine Ansage…',exact:true}),joker=dialog.getByRole('button',{name:'Tipp',exact:true}),canvas=dialog.locator('.prediction-board canvas');
  await expect(canvas).toHaveAttribute('data-hint-pose','0');
  await joker.hover();await page.mouse.down();
  await expect(canvas).toHaveAttribute('data-hint-pose',String(Math.floor(hint*3/158)+1));
  await expect(dialog.getByRole('textbox',{name:'Ansage',exact:true})).toHaveValue(String(hint));
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await dialog.screenshot({path:`artifacts/browser/ansage-hint-${hint}.png`});
  await page.mouse.up();await expect(canvas).toHaveAttribute('data-hint-pose','0');
  await expect(dialog.getByRole('textbox',{name:'Ansage',exact:true})).toHaveValue(String(hint));
  await joker.focus();await page.keyboard.down('Space');await expect(canvas).not.toHaveAttribute('data-hint-pose','0');
  await page.keyboard.up('Space');await expect(canvas).toHaveAttribute('data-hint-pose','0');
  await dialog.getByRole('button',{name:'OK',exact:true}).click();
  await expect(dialog).toHaveCount(0);
});
