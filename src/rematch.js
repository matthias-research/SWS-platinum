// SWSPlay / DiffPlay cmdRestart: advance from the previous Jass's starter,
// not from the last round's starter. Schieber may skip the winning team.
export function rematchOptions(options,view){
  const next=player=>player===view.count?1:player+1;
  let leading=next(options.leading??3);
  if(view.kind==='schieber'&&view.rules.fLooserBegins&&view.winner&&
    (leading%2===1?1:2)===view.winner)leading=next(leading);
  return {...structuredClone(options),rules:structuredClone(view.rules),names:[...view.names],leading,
    id:crypto.randomUUID(),seed:crypto.getRandomValues(new Uint32Array(1))[0]%2147483646+1};
}
