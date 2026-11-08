import {test,expect} from '@playwright/test';

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
