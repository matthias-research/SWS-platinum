import {kShowShow} from './engine/DiffBase.js';

// Resource arithmetic from Schieber/Differ PCMEDIA.PAS. IDs are original WAV IDs.
const clip = (folder, first, variants = 1) => ({ folder, first, variants });
const voiceFolder = voice => `STIMME${voice}`;
const cardsFolder = (voice, set) => `${set === 1 ? 'DEUTSCH' : 'FRANZ'}/STIMME${voice}`;

// PCMEDIA.PlaySuitSound / PlayOwnSuitSound: announce only the total before
// the first trick, then describe the publicly revealed combinations.
function speechForSuit(suit,view,settings,voice,base,own){
  if(!suit?.fCount)return [];
  const cardsOf=call=>[...(call.fCards||[])].sort((a,b)=>a-b);
  const callsOnly=cardsOf(suit.fCalls[0]).length===0;
  const total=callsOnly?1:suit.fCount,result=[],suitBase=base+(own?230:900);
  const rank=card=>(card-1)%9+1,colour=card=>Math.floor((card-1)/9)+1;
  const say=(offset,cardset=false)=>result.push(clip(cardset?cardsFolder(voice,settings.set):voiceFolder(voice),suitBase+offset));
  for(let i=0;i<total;i++){
    const call=suit.fCalls[i],cards=cardsOf(call),min=cards[0],max=cards.at(-1);
    const value=call.fValue-call.fValue%10,count=call.fValue%10||cards.length;
    const offset=value<=20?(!callsOnly&&count<3?69:60):value<=50?61:value<=100?62:value===150?63:value===200?64:65+Math.floor((value-100)/Math.max(1,view.rules?.fSuitsIncrement??50));
    if(callsOnly||offset===69||total>1)say(offset);
    if(!callsOnly&&count>2){
      if(colour(min)!==colour(max))say(50+rank(min)-1,!own||[4,7].includes(rank(min)));
      else if(view.trump===6)say(min-1,true);
      else if(view.trump===5||colour(max)!==view.trump)say(max-1,true);
      else say(40+rank(max)-(own?1:3),!own||rank(max)===7);
    }
    if(i<total-1)say(59);
  }
  return result;
}

// cmdSay carries the exact resource chosen with its text, not a new random variant.
export function speechForComment(event) {
  return event?.kind === 'say' && Number.isInteger(event.sound) && event.sound > 0 && [3,4,5,6].includes(event.voice)
    ? [clip(voiceFolder(event.voice), event.sound)] : [];
}

export function speechForAction(action, view, settings) {
  if (!action) return [];
  const player=action.data?.fPlayer,character=view.characters?.[player];
  const own=player!==undefined&&player===view.human;
  // MAINWIN assigns computer voices from the character, not the compass seat.
  const voice=own?2:Number.isInteger(character)&&character>=0&&character<=3?character+3:settings.voice;
  const base=own?4000+(settings.gender==='female'?0:500):5000+(voice-1)*1000;
  if(action.command==='cmdSuit')return speechForSuit(action.data.fSuit,view,settings,voice,base,own);
  if(own){
    if(action.command==='cmdShift')return [clip('STIMME2',base+180,10)];
    if(action.command==='cmdTrump'){
      const trump=action.data.fTrump;
      return [clip('STIMME2',base+190,10),clip(trump<5?cardsFolder(2,settings.set):'STIMME2',base+200+trump-1)];
    }
    if(action.command==='cmdCall'){
      if(view.kind==='differ'&&view.rules?.fCallMode!==kShowShow)return [];
      const call=action.data.fCall;if(view.calls?.[player]!==call)return [];
      return [...(call>20?[clip('STIMME2',base+170,10)]:[]),clip('STIMME2',base+call)];
    }
  }
  if (action.command === 'cmdShift') return [clip(voiceFolder(voice), base + 800, 10)];
  if (action.command === 'cmdTrump') {
    const trump = action.data.fTrump;
    return [clip(trump < 5 ? cardsFolder(voice, settings.set) : voiceFolder(voice), base + 800 + trump * 10, 10)];
  }
  if (action.command === 'cmdCall') {
    const { fPlayer, fCall } = action.data;
    // Never announce a computer prediction that is still hidden on the table.
    if (view.calls?.[fPlayer] !== fCall) return [];
    return [...(fCall > 20 ? [clip(voiceFolder(voice), base + 8170, 10)] : []), clip(voiceFolder(voice), base + 8000 + fCall)];
  }
  return [];
}

export function speechForHint(hint, settings) {
  if (!hint) return [];
  const { command, data } = hint;
  if (command === 'cmdCard') return [clip(cardsFolder(1, settings.set), 3300 + data.fCard)];
  if (command === 'cmdShift') return [clip('STIMME1', 3180, 10)];
  if (command === 'cmdTrump') return [clip(data.fTrump < 5 ? cardsFolder(1, settings.set) : 'STIMME1', 3190 + (data.fTrump - 1) * 10, 10)];
  if (command === 'cmdCall') return [clip('STIMME1', 3001, data.fCall < 20 ? 1 : 4), clip('STIMME1', 3010 + data.fCall)];
  return [];
}
