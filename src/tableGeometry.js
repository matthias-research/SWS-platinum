// One-player Delphi Table geometry, shared by canvas drawing and HTML overlays.
export const BASE_TABLE = Object.freeze({width:768,height:528});
export function tableOffset(size=BASE_TABLE){
  return {x:Math.floor(size.width/2)-384+(size.shiftX||0),y:Math.floor(size.height/2)-264};
}
export function carpetRect(size=BASE_TABLE){
  const {x,y}=tableOffset(size);
  return {x:269+x,y:52+y,right:501+x,bottom:284+y};
}
export function portraitRect(player,size=BASE_TABLE){
  const c=carpetRect(size),mx=c.x+116,my=c.y+116;
  return [null,{left:mx-76,top:Math.max(-24,c.y-85)},
    {left:c.x-69,top:my+20},{left:mx+20,top:c.bottom+17},
    {left:c.right+17,top:my-92}][player];
}
export function pileRect(player,n,size=BASE_TABLE){
  const c=carpetRect(size),mx=c.x+116,my=c.y+116;
  return [null,{left:mx-15+15*n,top:c.y-63,width:30,height:46},
    {left:c.x-63,top:my-15-15*n,width:46,height:30},
    {left:mx-15-15*n,top:c.bottom+17,width:30,height:46},
    {left:c.right+17,top:my-15+15*n,width:46,height:30}][player];
}
export function pointsRect(player,size=BASE_TABLE){
  const r=portraitRect(player,size),w=78,h=45;
  const p=[null,{left:r.left-10-w,top:r.top},{left:r.left,top:r.top+82},
    {left:r.left+66,top:r.top},{left:r.left,top:r.top-h-10}][player];
  return {left:Math.max(0,Math.min(size.width-w,p.left)),top:Math.max(0,Math.min(size.height-h,p.top))};
}
