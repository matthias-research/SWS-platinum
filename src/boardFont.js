import {boardFontGlyphs} from './boardFontGlyphs';

let fontPromise;
export function loadBoardFont(){
  return fontPromise??=new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(prepareBoardFont(image));
    image.onerror=()=>reject(new Error('Die Tafelschrift konnte nicht geladen werden.'));
    image.src=`${import.meta.env.BASE_URL}assets/fonts/board-font.png`;
  });
}

export function prepareBoardFont(image){
  const atlas=document.createElement('canvas');
  atlas.dataset.boardFont='true';
  atlas.width=image.width;atlas.height=image.height;
  const ctx=atlas.getContext('2d');ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,atlas.width,atlas.height);
  // The supplied sheet has a dark paper background. Use the chalk brightness
  // as opacity so that the board texture remains visible between strokes.
  for(let i=0;i<pixels.data.length;i+=4){
    const light=Math.max(pixels.data[i],pixels.data[i+1],pixels.data[i+2]);
    pixels.data[i+3]*=Math.max(0,(light-90)/165);
    pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;
  }
  ctx.putImageData(pixels,0,0);
  return atlas;
}

// y is the top of the capital line; all atlas rows share a common baseline.
export function drawBoardText(ctx,atlas,text,x,y,{size=16,maxWidth=Infinity}={}){
  if(maxWidth<=0)return;
  ctx.save();ctx.fillStyle='#fff';ctx.font='38px cursive';ctx.textBaseline='alphabetic';
  const chars=Array.from(String(text).normalize('NFC'));
  const advance=char=>char===' '?12:(boardFontGlyphs[char]?.[2]??ctx.measureText(char).width);
  const width=chars.reduce((sum,char)=>sum+advance(char),0);
  const scale=Math.min(size/38,maxWidth/Math.max(1,width));
  ctx.translate(x,y);ctx.scale(scale,scale);
  let left=0;
  for(const char of chars){
    const glyph=boardFontGlyphs[char];
    if(glyph&&atlas){
      let [sx,sy,w,h]=glyph;
      let baseline=sy===43?38:35;
      // The CSV rows overlap: trim umlaut dots from lowercase cells while
      // retaining descenders, and include the dots above the umlaut row.
      if(sy===43)h='gjpqy'.includes(char)?49:39;
      if('ÄÖÜäöü'.includes(char)){sy-=4;h+=4;baseline+=4;}
      ctx.drawImage(atlas,sx,sy,w,h,left,35-baseline,w,h);
    }else if(char!==' '){
      // Preserve names containing accents or symbols absent from the sheet.
      ctx.fillText(char,left,35);
    }
    left+=advance(char);
  }
  ctx.restore();
}
