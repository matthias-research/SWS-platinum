import {graphicsUrl,useGraphics,bitmapContext,drawBitmap} from '../graphics';
import React,{useEffect,useRef} from 'react';
import {loadImage} from '../table';
import {drawMaskedSprite} from '../raster';
const pressed=[[206,361,59,57,148,53],[89,371,51,61,26,56],[266,361,58,48,164,113],[43,371,45,56,20,111],[336,361,53,55,154,156],[0,371,42,57,38,157],[141,361,64,66,82,14]];
export function TrumpCanvas({src,selected,shift,factors,partner,name}){
  const ref=useRef(null),graphics=useGraphics();
  useEffect(()=>{let live=true;Promise.all([loadImage(src),loadImage(graphicsUrl(`setup/${partner}.png`))]).then(([atlas,portrait])=>{
    if(!live)return;const ctx=bitmapContext(ref.current,225,235),piece=([x,y,w,h,dx,dy])=>drawBitmap(ctx,atlas,x,y,w,h,dx,dy,w,h);drawBitmap(ctx,atlas,0,0,225,235,0,0,225,235);
    if(selected!==null)piece(pressed[selected]);
    if(!factors[5])piece([433,354,46,50,159,162]);if(!factors[6])piece([390,354,42,48,40,164]);
    if(!shift){piece([480,354,53,62,94,19]);ctx.font='10px Arial';ctx.textAlign='center';ctx.fillStyle='white';ctx.fillText(`${name} hat geschoben`,112,29);}
    else{drawBitmap(ctx,portrait,94,19,34,45);if(selected===6)drawMaskedSprite(ctx,atlas,{x:534,y:354,width:8,height:14},{x:543,y:354,width:8,height:14},94,43);}
  });return()=>{live=false;};},[src,selected,shift,factors,partner,name,graphics]);
  return <canvas ref={ref} width={225} height={235} aria-hidden="true"/>;
}
