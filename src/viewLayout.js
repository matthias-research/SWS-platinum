export const viewModes=['auto','desktop','mobile-horizontal','mobile-vertical'];

export function resolveView(mode,{width,height,coarse,screenWidth,screenHeight}){
  if(mode!=='auto')return mode;
  const phone=coarse&&Math.min(screenWidth,screenHeight)<=600;
  return phone?(height>=width?'mobile-vertical':'mobile-horizontal'):'desktop';
}

// Keep one coordinate system for drawing, hit targets, portraits and animations.
export function mobileLayout(mode,width,height,adaptive=true,kind='schieber'){
  const horizontal=mode==='mobile-horizontal';
  const availableWidth=Math.max(1,width-16);
  const availableHeight=Math.max(1,height-(horizontal?12:56));
  const baseWidth=horizontal?(adaptive?768:580):kind==='differ'?580:520;
  const baseHeight=horizontal?528:620;
  const scale=Math.min(availableWidth/baseWidth,availableHeight/baseHeight);
  const tableWidth=adaptive?baseWidth:horizontal?Math.max(580,Math.floor(availableWidth/scale)):baseWidth;
  const tableHeight=adaptive?baseHeight:horizontal?528:Math.max(620,Math.floor(availableHeight/scale));
  const hideFeed=!horizontal||tableWidth<768;
  return {scale,size:{width:tableWidth,height:tableHeight,hideFeed,
    shiftX:hideFeed?190-Math.floor(tableWidth/2):0}};
}
