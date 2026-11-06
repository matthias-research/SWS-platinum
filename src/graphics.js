import {useSyncExternalStore} from 'react';

let mode='enhanced';
const listeners=new Set();
export const graphicsScale=()=>mode==='enhanced'?2:1;
export const graphicsUrl=(path,selected=mode)=>`${import.meta.env.BASE_URL}assets/${selected==='enhanced'?'enhanced/':''}${path}`;
export function setGraphics(value){mode=value;document.documentElement.dataset.graphics=mode;for(const listener of listeners)listener();}
export function useGraphics(){return useSyncExternalStore(listener=>{listeners.add(listener);return()=>listeners.delete(listener);},()=>mode);}
document.documentElement.dataset.graphics=mode;

export function bitmapContext(canvas,width,height){
  const scale=graphicsScale();canvas.width=width*scale;canvas.height=height*scale;
  canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
  const ctx=canvas.getContext('2d');ctx.scale(scale,scale);return ctx;
}
export function drawBitmap(ctx,image,...args){
  const scale=image.assetScale||1;
  if(args.length===2)ctx.drawImage(image,...args,image.width/scale,image.height/scale);
  else if(args.length===8)ctx.drawImage(image,...args.slice(0,4).map(n=>n*scale),...args.slice(4));
  else ctx.drawImage(image,...args);
}
