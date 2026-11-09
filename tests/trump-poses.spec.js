import {test,expect} from '@playwright/test';

for(const mode of ['original','enhanced'])test(`idle trump board preserves original felt and up arrow (${mode})`,async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('sws-preferences',JSON.stringify({viewBubbleS:0})));
  await page.goto('/');
  await page.getByRole('button',{name:'Neuer Schieber…',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Spielen',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Wähle deinen Trumpf!',exact:true});
  await expect(dialog).toBeVisible();
  await page.evaluate(async mode=>{const {setGraphics}=await import('/src/graphics');setGraphics(mode);},mode);
  await page.mouse.move(0,0);
  await expect.poll(()=>page.evaluate(async()=>{
    const {loadImage}=await import('/src/table.js');
    const {drawBitmap}=await import('/src/graphics');
    const board=document.querySelector('.trump-board'),canvas=board.querySelector('canvas');
    const src=board.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
    const atlas=await loadImage(src),expected=document.createElement('canvas');
    expected.width=canvas.width;expected.height=canvas.height;
    const ctx=expected.getContext('2d'),scale=canvas.width/225;ctx.scale(scale,scale);
    drawBitmap(ctx,atlas,0,0,225,235,0,0,225,235);
    const actual=canvas.getContext('2d').getImageData(65*scale,80*scale,92*scale,121*scale).data;
    const wanted=ctx.getImageData(65*scale,80*scale,92*scale,121*scale).data;
    return actual.every((n,i)=>n===wanted[i]);
  })).toBe(true);
  await expect(dialog.locator('.trump-joker-symbol')).toHaveCSS('opacity','0');
  await dialog.getByRole('button',{name:'Tipp',exact:true}).hover();
  await expect(dialog.locator('.trump-joker-symbol')).toHaveCSS('opacity','1');
  await expect(dialog.locator('.trump-joker-symbol')).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)');
  await expect(dialog.locator('.trump-joker-symbol')).toHaveCSS('filter','brightness(1.15)');
  await dialog.screenshot({path:`artifacts/browser/trump-joker-hover-${mode}.png`});
  await page.mouse.move(0,0);
  await expect(dialog.locator('.trump-joker-symbol')).toHaveCSS('opacity','0');
  await dialog.screenshot({path:`artifacts/browser/trump-clean-background-${mode}.png`});
  await page.evaluate(async()=>{
    const {default:React}=await import('/node_modules/.vite/deps/react.js');
    const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
    const {TrumpCanvas}=await import('/src/dialogs/TrumpCanvas.jsx');
    const board=document.querySelector('.trump-board'),src=board.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
    const host=document.createElement('div');host.id='shifted-preview';host.style.cssText='position:relative;width:225px;height:235px';board.appendChild(host);
    createRoot(host).render(React.createElement(TrumpCanvas,{src,selected:null,suggested:null,shift:false,partner:7000,name:'Beat',factors:[0,1,1,1,1,1,1],rects:[]}));
  });
  await expect.poll(()=>page.locator('#shifted-preview canvas').first().evaluate(canvas=>{
    const scale=canvas.width/225,p=canvas.getContext('2d').getImageData(95*scale,33*scale,34*scale,32*scale).data;
    return Array.from({length:p.length/4},(_,i)=>p[i*4+1]>p[i*4]*1.3&&p[i*4+1]>p[i*4+2]*1.3).every(Boolean);
  })).toBe(true);
  await page.locator('#shifted-preview').screenshot({path:`artifacts/browser/trump-shifted-text-only-${mode}.png`});
});

for(const mode of ['original','enhanced'])test(`all seven original joker patches in all card styles (${mode})`,async({page})=>{
  await page.goto('/');
  await page.evaluate(async mode=>{
    const {default:React}=await import('/node_modules/.vite/deps/react.js');
    const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');
    const {TrumpCanvas}=await import('/src/dialogs/TrumpCanvas.jsx');
    // Reuse Vite's current module URL, including its HMR version.
    const source=await (await fetch('/src/dialogs/TrumpCanvas.jsx')).text();
    const graphics=source.match(/from "(\/src\/graphics[^"]+)"/)[1];
    const {setGraphics}=await import(graphics);setGraphics(mode);
    const {looseImage}=await import('/src/dialogs/LegacyDialog.jsx');
    const catalog=await (await fetch('/assets/dialogs/manifest.json')).json();
    document.querySelector('.application').style.display='none';
    const host=document.createElement('div');host.id='poses';host.style.cssText='display:grid;grid-template-columns:repeat(7,225px)';document.body.appendChild(host);
    const rects=[[156,57,48,51],[25,56,51,59],[166,117,45,42],[19,116,44,49],[159,161,44,49],[39,161,40,51],[91,17,57,64]];
    createRoot(host).render(React.createElement(React.Fragment,null,...['trumpd.bmp','trumpf2.bmp','trumpf4.bmp'].flatMap(file=>Array.from({length:7},(_,i)=>React.createElement('div',{key:file+i,style:{position:'relative',width:225,height:235},'data-atlas':looseImage(catalog,file)},React.createElement(TrumpCanvas,{src:looseImage(catalog,file),rects,selected:null,suggested:i,shift:true,factors:[0,1,1,1,1,1,1],partner:7000,name:'Partner'}))))));
  },mode);
  // Compare the full original composite patches, excluding the partner portrait
  // and arrow which the original paints over the Schieben patch afterward.
  await expect.poll(()=>page.evaluate(async()=>{
    const {loadImage}=await import('/src/table.js');
    const {drawBitmap}=await import('/src/graphics');
    const patches=[[274,196,145,157,60,49],[225,0,145,157,20,49],[420,196,162,157,60,49],[128,235,145,125,20,81],[477,0,140,136,60,79],[0,235,127,134,38,81],[371,0,105,195,60,11]];
    const tiles=[...document.querySelectorAll('#poses > div')];if(tiles.length!==21)return false;
    for(const tile of tiles){
      const art=tile.querySelector('.trump-art'),pose=Number(art.dataset.hintPose),canvas=art.firstElementChild;
      const [x,y,w,h,dx,dy]=patches[pose],expected=document.createElement('canvas'),scale=canvas.width/225;expected.width=canvas.width;expected.height=canvas.height;const ctx=expected.getContext('2d');ctx.scale(scale,scale);
      drawBitmap(ctx,await loadImage(tile.dataset.atlas),x,y,w,h,dx,dy,w,h);
      const actual=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data,wanted=ctx.getImageData(0,0,expected.width,expected.height).data;
      for(let py=(dy+1)*scale;py<(dy+h-1)*scale;py++)for(let px=(dx+1)*scale;px<(dx+w-1)*scale;px++){
        if(px>=93*scale&&px<=129*scale&&py<=65*scale)continue;
        const n=4*(py*canvas.width+px);for(let c=0;c<4;c++)if(actual[n+c]!==wanted[n+c])return {pose,px,py,c,actual:actual[n+c],wanted:wanted[n+c],atlas:tile.dataset.atlas};
      }
    }
    return true;
  })).toBe(true);
  await page.setViewportSize({width:1580,height:730});
  await page.locator('#poses').screenshot({path:`artifacts/browser/trump-poses-${mode}.png`});
});
