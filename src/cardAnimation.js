// Animate only forward play and collected tricks, never restores or undo.
export function cardTransition(before,after,steps=15){
  if(!before||!after||steps<=0||before.kind!==after.kind||before.roundNumber!==after.roundNumber)return null;
  const total=v=>(v.pickedTricks||[]).reduce((a,b)=>a+b,0);
  if(total(after)===total(before)+1&&before.trick?.fPlayed.slice(1,before.count+1).every(Boolean)){
    const winner=after.pickedTricks.findIndex((n,p)=>n>(before.pickedTricks[p]||0));
    return {type:'collect',before,after,winner,duration:Math.min(800,steps*16)};
  }
  if(total(after)!==total(before))return null;
  const added=[];
  for(let p=1;p<=after.count;p++){
    const card=after.trick?.fPlayed[p],old=before.trick?.fPlayed[p];
    if(old&&old!==card)return null;
    if(card&&!old)added.push({player:p,card});
  }
  return added.length===1?{type:'play',before,after,...added[0],duration:Math.min(800,steps*16)}:null;
}
