import {useLayoutEffect,useRef} from 'react';
import {drawCard} from './cards';
import {cardMotions} from './gameDrawing';

// Rasterize only the moving cards once. The compositor moves their transforms;
// the table canvas and React state stay untouched throughout the animation.
export function CardMotionLayer({animation,sheets,size,scale,pixelRatio,onComplete}){
  const host=useRef(null);
  useLayoutEffect(()=>{
    if(!sheets.V||!sheets.H)return;
    const container=host.current,motions=cardMotions(animation,sheets,size),running=[];
    let disposed=false;
    for(const {player,card,from,to} of motions){
      const tile=document.createElement('canvas');
      tile.width=Math.max(1,Math.ceil(from.width*scale*pixelRatio));
      tile.height=Math.max(1,Math.ceil(from.height*scale*pixelRatio));
      Object.assign(tile.style,{position:'absolute',left:'0',top:'0',width:`${from.width*scale}px`,height:`${from.height*scale}px`,transformOrigin:'0 0',willChange:'transform'});
      const ctx=tile.getContext('2d');
      ctx.setTransform(tile.width/from.width,0,0,tile.height/from.height,0,0);
      drawCard(ctx,player%2?sheets.V:sheets.H,card,{x:0,y:0,width:from.width,height:from.height});
      const transform=r=>`translate3d(${r.x*scale}px,${r.y*scale}px,0) scale(${r.width/from.width},${r.height/from.height})`;
      tile.style.transform=transform(from);
      container.appendChild(tile);
      running.push(tile.animate([{transform:transform(from)},{transform:transform(to)}],{
        duration:animation.duration,easing:'cubic-bezier(0.215, 0.61, 0.355, 1)',fill:'both',
      }));
    }
    Promise.all(running.map(a=>a.finished)).then(()=>{
      if(!disposed)onComplete(animation);
    }).catch(()=>{/* Cancellation on resize, game replacement or unmount. */});
    return ()=>{disposed=true;for(const a of running)a.cancel();container.replaceChildren();};
  },[animation,sheets,size,scale,pixelRatio,onComplete]);
  return <div ref={host} className="card-motion-layer" aria-hidden="true" data-motion={animation.type}/>;
}
