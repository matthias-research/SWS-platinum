import {useLayoutEffect,useState} from 'react';

// Modal dialogs live in the browser top layer, so use viewport coordinates for
// the canvas center rather than relying on the browser's default modal center.
export function useCanvasDialogPosition(width,height,enabled=true){
  const [position,setPosition]=useState(null);
  useLayoutEffect(()=>{
    if(!enabled)return;
    const canvas=document.querySelector('.scene-frame > canvas');
    if(!canvas)return;
    const measure=()=>{
      const rect=canvas.getBoundingClientRect();
      // Fixed positioning starts inside the root's reserved scrollbar gutter.
      const gutter=document.documentElement.getBoundingClientRect().left;
      const next={left:Math.max(8,Math.min(innerWidth-width-8,rect.left+(rect.width-width)/2))-gutter,
        top:Math.max(8,Math.min(innerHeight-height-8,rect.top+(rect.height-height)/2))};
      setPosition(old=>old?.left===next.left&&old?.top===next.top?old:next);
    };
    measure();
    const observer=new ResizeObserver(measure);observer.observe(canvas);
    window.addEventListener('resize',measure);
    window.addEventListener('scroll',measure,true);
    return()=>{observer.disconnect();window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure,true);};
  },[width,height,enabled]);
  return enabled&&position?{position:'fixed',inset:'auto',margin:0,...position}:{};
}
