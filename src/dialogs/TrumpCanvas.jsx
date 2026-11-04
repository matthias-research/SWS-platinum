import {graphicsUrl,useGraphics,bitmapContext,drawBitmap} from '../graphics';
import React,{useEffect,useRef} from 'react';
import {loadImage} from '../table';
import {drawMaskedSprite} from '../raster';
const pressed=[[206,361,59,57,148,53],[89,371,51,61,26,56],[266,361,58,48,164,113],[43,371,45,56,20,111],[336,361,53,55,154,156],[0,371,42,57,38,157],[141,361,64,66,82,14]];
export function TrumpCanvas({src,selected,shift,factors,partner,name,rects,hovered,suggested}){
  const ref=useRef(null),symbols=useRef([]),graphics=useGraphics();
  const artRects=[...rects,[65,80,92,121]];
  useEffect(()=>{let live=true;Promise.all([loadImage(src),loadImage(graphicsUrl(`setup/${partner}.png`))]).then(([atlas,portrait])=>{
    if(!live)return;const ctx=bitmapContext(ref.current,225,235),piece=([x,y,w,h,dx,dy])=>drawBitmap(ctx,atlas,x,y,w,h,dx,dy,w,h);drawBitmap(ctx,atlas,0,0,225,235,0,0,225,235);
    if(selected!==null)piece(pressed[selected]);
    if(!factors[5])piece([433,354,46,50,159,162]);if(!factors[6])piece([390,354,42,48,40,164]);
    if(!shift){piece([480,354,53,62,94,19]);ctx.font='10px Arial';ctx.textAlign='center';ctx.fillStyle='white';ctx.fillText(`${name} hat geschoben`,112,29);}
    else{drawBitmap(ctx,portrait,94,19,34,45);if(selected===6)drawMaskedSprite(ctx,atlas,{x:534,y:354,width:8,height:14},{x:543,y:354,width:8,height:14},94,43);}
    // Extract the symbols into small transparent layers. Green felt is keyed out
    // only in the overlay; the untouched original board remains underneath.
    artRects.forEach(([x,y,w,h],i)=>{
      const tile=symbols.current[i];if(!tile)return;
      const out=bitmapContext(tile,w,h),s=ref.current.width/225;
      out.save();
      if(i===7){
        // Exclude the adjacent shield's shadow from the joker layer.
        const edge=[[65,113],[91,113],[99,94],[104,80],[130,80],[138,111],[157,120],[157,144],[136,144],[136,201],[96,201],[96,143],[65,143]];
        out.beginPath();edge.forEach(([px,py],n)=>n?out.lineTo(px-x,py-y):out.moveTo(px-x,py-y));out.closePath();out.clip();
      }
      out.drawImage(ref.current,x*s,y*s,w*s,h*s,0,0,w,h);
      out.restore();
      const pixels=out.getImageData(0,0,tile.width,tile.height),p=pixels.data;
      for(let n=0;n<p.length;n+=4)if(p[n+1]>p[n]*1.3&&p[n+1]>p[n+2]*1.3)p[n+3]=0;
      out.putImageData(pixels,0,0);
    });
    // Remove the baked-in joker beneath its permanent transparent layer.
    // Interpolate the clean felt at either side, preserving the row shading.
    const s=ref.current.width/225,board=ctx.getImageData(0,0,ref.current.width,ref.current.height),pixels=board.data;
    const left=Math.round(65*s),right=Math.round(157*s);
    for(let y=Math.round(80*s);y<Math.round(201*s);y++){
      const a=4*(y*board.width+Math.round(10*s)),b=4*(y*board.width+Math.round(215*s));
      for(let x=left;x<right;x++)for(let c=0;c<3;c++)pixels[4*(y*board.width+x)+c]=Math.round(pixels[a+c]+(pixels[b+c]-pixels[a+c])*(x-left)/(right-left));
    }
    ctx.putImageData(board,0,0);
  });return()=>{live=false;};},[src,selected,shift,factors,partner,name,graphics]);
  return <div className="trump-art" aria-hidden="true"><canvas ref={ref} width={225} height={235}/>
    {artRects.map(([x,y,w,h],i)=><canvas key={i} ref={el=>{symbols.current[i]=el;}} width={w} height={h}
      className={`trump-symbol ${i===7?'trump-joker-symbol':''} ${suggested===i?'suggested':hovered===i||selected===i?'hovered':''}`}
      style={{left:x,top:y,width:w,height:h}}/>)}</div>;
}
