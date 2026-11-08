import {graphicsUrl,graphicsScale,useGraphics,bitmapContext,drawBitmap} from '../graphics';
import React,{useEffect,useRef} from 'react';
import {loadImage} from '../table';
import {drawMaskedSprite} from '../raster';
import {formImage,looseImage} from './LegacyDialog';

// Retain Delphi's channel-wise SRCAND/SRCPAINT compositing, including nonbinary masks.
export function PredictionCanvas({data,value,hintPose=0}) {
  const ref=useRef(null),graphics=useGraphics();
  useEffect(()=>{let live=true;Promise.all([
    loadImage(formImage(data,'differ','TCALLDLG','BackGround')),
    loadImage(formImage(data,'differ','TCALLDLG',`Gloon${hintPose}`)),
    loadImage(graphicsUrl(`differ-pieces.bmp`)),
    fetch(`${import.meta.env.BASE_URL}assets/differ-pieces.json`).then(r=>r.json()),
  ]).then(([back,gloon,pieces,m])=>{if(!live)return;const ctx=bitmapContext(ref.current,209,257);ctx.clearRect(0,0,209,257);drawBitmap(ctx,back,0,0);drawBitmap(ctx,gloon,0,42);
    const y=206-(value<=80?value:80+44*(value-80)/77),r=m.rects[126];ctx.fillStyle='blue';ctx.fillRect(144,y,11,206-y);drawMaskedSprite(ctx,pieces,r,m.rects[127],155-r.width,Math.round(y-r.height/2));
  });return()=>{live=false;};},[data,value,graphics,hintPose]);
  return <canvas ref={ref} width={209} height={257} aria-hidden="true" data-hint-pose={hintPose}/>;
}

export function HintArm({data,kind}) {
  const ref=useRef(null),graphics=useGraphics();
  useEffect(()=>{let live=true;Promise.all(['Arm','ArmM'].map(n=>loadImage(formImage(data,kind,'THINTDLG',n)))).then(([arm,mask])=>{
    if(!live)return;const ctx=bitmapContext(ref.current,80,16),s=graphicsScale();ctx.imageSmoothingEnabled=false;drawBitmap(ctx,mask.maskSource||mask,0,0);const pixels=ctx.getImageData(0,0,80*s,16*s);ctx.clearRect(0,0,80,16);drawBitmap(ctx,arm,0,0);const fg=ctx.getImageData(0,0,80*s,16*s);
    // These two original arm masks use black/white pixels only.
    for(let i=0;i<fg.data.length;i+=4)fg.data[i+3]=255-pixels.data[i];ctx.putImageData(fg,0,0);
  });return()=>{live=false;};},[data,kind,graphics]);
  return <canvas ref={ref} width={80} height={16} style={{position:'absolute',left:7,top:66,pointerEvents:'none'}}/>;
}

export function CreditsCanvas({data,kind,exit}) {
  const ref=useRef(null),graphics=useGraphics();
  useEffect(()=>{let live=true,timer;Promise.all([loadImage(looseImage(data,exit?'wollen6.bmp':'about6.bmp')),...['floatText','floatMask'].map(n=>loadImage(formImage(data,kind,'TABOUTDLG',n)))]).then(([cover,text,mask])=>{
    if(!live)return;const atlas=document.createElement('canvas');atlas.width=text.width;atlas.height=text.height*2;const a=atlas.getContext('2d');a.drawImage(text,0,0);a.drawImage(mask,0,text.height);atlas.assetScale=text.assetScale;const h=text.height/text.assetScale;const original=document.createElement('canvas');original.width=text.width/text.assetScale;original.height=h*2;original.getContext('2d').drawImage(mask.maskSource||mask,0,h);if(text.assetScale===2)atlas.maskSource=original;let position=0;
    const paint=()=>{const ctx=bitmapContext(ref.current,120,84);drawBitmap(ctx,cover,87,57,120,84,0,0,120,84);drawMaskedSprite(ctx,atlas,{x:0,y:0,width:120,height:h},{x:0,y:h,width:120,height:h},0,84-position);position=(position+1)%(h+84);};paint();timer=setInterval(paint,50);
  });return()=>{live=false;clearInterval(timer);};},[data,kind,exit,graphics]);
  return <canvas ref={ref} width={120} height={84} style={{position:'absolute',left:194,top:229,pointerEvents:'none',zIndex:2}} role="img" aria-label="Originaler Abspann"/>;
}
