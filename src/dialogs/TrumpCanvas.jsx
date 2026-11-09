import {graphicsUrl,useGraphics,bitmapContext,drawBitmap} from '../graphics';
import React,{useEffect,useRef} from 'react';
import {loadImage} from '../table';
import {drawMaskedSprite} from '../raster';
const pressed=[[206,361,59,57,148,53],[89,371,51,61,26,56],[266,361,58,48,164,113],[43,371,45,56,20,111],[336,361,53,55,154,156],[0,371,42,57,38,157],[141,361,64,66,82,14]];
// Original DlgTrump.kPieceInfo entries 8-14: each patch includes the pointing
// joker and the reshaped symbol, including the felt that replaces the old pose.
const hints=[[274,196,145,157,60,49],[225,0,145,157,20,49],[420,196,162,157,60,49],[128,235,145,125,20,81],[477,0,140,136,60,79],[0,235,127,134,38,81],[371,0,105,195,60,11]];
// The atlas bakes in a white portrait placeholder and its shadow. Reconstruct
// only that area from the felt on either side, blending into its actual edges.
function clearPartnerPlaceholder(ctx,canvas){
  const scale=canvas.width/225,board=ctx.getImageData(0,0,canvas.width,canvas.height),p=board.data;
  const left=Math.round(85*scale),right=Math.round(154*scale),top=Math.round(14*scale),bottom=Math.round(82*scale);
  for(let y=top;y<bottom;y++){
    const a=4*(y*board.width+left),b=4*(y*board.width+right);
    for(let x=left+1;x<right;x++){
      const blend=Math.min(1,(x-left)/(6*scale),(right-x)/(6*scale),(y-top)/(4*scale),(bottom-y)/(4*scale));
      const i=4*(y*board.width+x),t=(x-left)/(right-left);
      for(let c=0;c<3;c++)p[i+c]=Math.round(p[i+c]*(1-blend)+(p[a+c]*(1-t)+p[b+c]*t)*blend);
    }
  }
  ctx.putImageData(board,0,0);
}
export function TrumpCanvas({src,selected,shift,factors,partner,name,rects,hovered,suggested}){
  const ref=useRef(null),symbols=useRef([]),graphics=useGraphics();
  const artRects=[...rects,[65,80,92,121]];
  useEffect(()=>{let live=true;Promise.all([loadImage(src),loadImage(graphicsUrl(`setup/${partner}.png`))]).then(([atlas,portrait])=>{
    if(!live)return;const ctx=bitmapContext(ref.current,225,235),piece=([x,y,w,h,dx,dy])=>drawBitmap(ctx,atlas,x,y,w,h,dx,dy,w,h);drawBitmap(ctx,atlas,0,0,225,235,0,0,225,235);
    if(selected!==null)piece(pressed[selected]);
    if(suggested!==null)piece(hints[suggested]);
    if(!factors[5])piece([433,354,46,50,159,162]);if(!factors[6])piece([390,354,42,48,40,164]);
    if(!shift){clearPartnerPlaceholder(ctx,ref.current);ctx.font='10px Arial';ctx.textAlign='center';ctx.fillStyle='white';ctx.fillText(`${name} hat geschoben`,112,29);}
    else{drawBitmap(ctx,portrait,94,19,34,45);if(selected===6||suggested===6)drawMaskedSprite(ctx,atlas,{x:534,y:354,width:8,height:14},{x:543,y:354,width:8,height:14},94,43);}
    // Keep the original composite intact while the joker points.
    if(suggested!==null)return;
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
    // Preserve the original felt, joker and adjacent arrow on the base bitmap.
    // The transparent joker layer, like the symbols, is only shown on hover.
  });return()=>{live=false;};},[src,selected,shift,factors,partner,name,graphics,suggested]);
  return <div className="trump-art" aria-hidden="true" data-hint-pose={suggested??undefined}><canvas ref={ref} width={225} height={235}/>
    {artRects.map(([x,y,w,h],i)=><canvas key={i} ref={el=>{symbols.current[i]=el;}} width={w} height={h}
      className={`trump-symbol ${i===7?'trump-joker-symbol':''} ${suggested===i?'suggested':hovered===i||selected===i?'hovered':''}`}
      style={{left:x,top:y,width:w,height:h,visibility:suggested!==null?'hidden':undefined}}/>)}</div>;
}
