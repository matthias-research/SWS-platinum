export function roundInformation(view,prefs={}){
  if(view.kind==='differ')return prefs.genInfoRound!==false||(view.phase==='done'&&prefs.genInfoGame!==false)?[{type:'differ'}]:[];
  const round=view.history.at(-1),notices=[];
  if(!round)return notices;
  if(round.matchBy){
    if(prefs.viewInfoMatch!==false)notices.push({type:(round.trumpedBy%2===1?1:2)===round.matchBy?'match':'conter',team:round.matchBy});
  }else if(prefs.viewInfoRound!==false)notices.push({type:'round'});
  if(view.phase==='done'&&view.winner&&prefs.viewInfoWin!==false)notices.push({type:'win',team:view.winner});
  return notices;
}
