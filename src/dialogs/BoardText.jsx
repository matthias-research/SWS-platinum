import React,{useEffect,useRef} from 'react';
import {loadBoardFont,drawBoardText} from '../boardFont';

export function BoardText({lines,width=155,lineHeight=26,size=18,scale=1}){
  const ref=useRef(null),text=lines.join('\n');
  useEffect(()=>{
    let active=true;
    loadBoardFont().then(atlas=>{
      if(!active)return;
      const canvas=ref.current,ratio=Math.max(1,devicePixelRatio*scale);
      canvas.width=Math.ceil(width*ratio);canvas.height=Math.ceil(lines.length*lineHeight*ratio);
      const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
      lines.forEach((line,i)=>drawBoardText(ctx,atlas,line,2,i*lineHeight+2,{size,maxWidth:width-4}));
    }).catch(()=>{/* The canvas fallback still exposes the result text. */});
    return()=>{active=false;};
  },[text,width,lineHeight,size,scale]);
  return <canvas ref={ref} role="img" aria-label={lines.join(', ')} style={{width,height:lines.length*lineHeight}}>{text}</canvas>;
}
