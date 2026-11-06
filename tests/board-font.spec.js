import {test,expect} from '@playwright/test';

for(const kind of ['Schieber','Differenzler'])for(const mode of ['desktop','mobile-vertical'])test(`${kind} ${mode}: board uses the chalk atlas and player names`,async({page})=>{
  await page.addInitScript(mode=>localStorage.setItem('sws-display',JSON.stringify({viewMode:mode})),mode);
  if(mode==='mobile-vertical')await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>{
    localStorage.setItem('sws-player','Anna');
    localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:0}));
    window.chalkGlyphs=0;window.boardText=[];
    const draw=CanvasRenderingContext2D.prototype.drawImage,fill=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
      if(source instanceof HTMLCanvasElement&&source.dataset.boardFont==='true')window.chalkGlyphs++;
      return draw.call(this,source,...args);
    };
    CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.boardText.push(String(text));return fill.call(this,text,...args);};
  });
  await page.goto('/');
  await page.getByRole('button',{name:`Neuer ${kind}…`,exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  await expect(page.locator('.card-target')).toHaveCount(9);
  await expect.poll(()=>page.evaluate(()=>window.chalkGlyphs)).toBeGreaterThan(10);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>window.boardText)).not.toEqual(expect.arrayContaining(['West & Ost','Nord & Süd']));
  await page.screenshot({path:`test-results/board-font-${kind}-${mode}.png`});
});

test('atlas preserves upper/lowercase and transparent background; long names fit',async({page})=>{
  await page.goto('/');
  const result=await page.evaluate(async()=>{
    const {boardFontGlyphs}=await import('/src/boardFontGlyphs.js');
    const {prepareBoardFont,drawBoardText}=await import('/src/boardFont.js');
    const image=new Image();image.src='/assets/fonts/board-font.png';await image.decode();
    const atlas=prepareBoardFont(image),pixels=atlas.getContext('2d').getImageData(0,0,atlas.width,atlas.height).data;
    const canvas=document.createElement('canvas');canvas.width=250;canvas.height=80;
    const ctx=canvas.getContext('2d');drawBoardText(ctx,atlas,'Stéphanie ÄÖÜ Anna-Maria',10,10,{size:24,maxWidth:100});
    const out=ctx.getImageData(111,0,139,80).data;
    return {count:Object.keys(boardFontGlyphs).length,upper:boardFontGlyphs.A,lower:boardFontGlyphs.a,
      transparent:pixels.some((n,i)=>i%4===3&&n===0),chalk:pixels.some((n,i)=>i%4===3&&n>200),overflow:out.some((n,i)=>i%4===3&&n>0)};
  });
  expect(result.count).toBe(74);
  expect(result.upper).not.toEqual(result.lower);
  expect(result).toMatchObject({transparent:true,chalk:true,overflow:false});
});
