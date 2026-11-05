// Event rules from original/{Schieber,Differ}/JASSERS.PAS, TProtoJasser.NotifyCommand.
// Resource selection, history and reply metadata belong to the supplied commentary.
import * as S from './engine/SWSBase.js';
import * as D from './engine/DiffBase.js';

export const COMMENT_MOOD={furious:0,angry:1,calm:2,happy:3,overjoyed:4};
// Both originals use this InitSayEntryInfos reply table. Other categories have no reply.
export const COMMENT_REPLIES={
  4400:[4800,3,0.80],4450:[4900,1,0.80],4500:[4800,3,0.80],4600:[4900,1,0.80],
  4750:[4950,1,0.50],4900:[4900,1,0.10],4950:[4950,1,0.05],
};
const {furious,angry,calm,happy,overjoyed}=COMMENT_MOOD;
export class CommentaryTriggers {
  constructor({kind,count=4,human=3,random=Math.random},commentary){
    Object.assign(this,{kind,count,human,random,commentary});
    this.next=D.SetupPrevNext(count).next;
    this.players=Array.from({length:5},()=>({games:0,rounds:0,points:0,picked:false,total:Array(5).fill(0)}));
    this.calls=Array(5).fill(D.NoCall);this.teamPoints=[0,0,0];
    this.trump=0;this.trumper=0;this.shifted=false;this.cardCount=0;this.trickNumber=0;
    this.trick={fLeading:0,fPlayed:Array(5).fill(0)};this.best=0;
  }
  notify(command,data={},context={}){
    const {talkMode=15,leading=3,elapsedMinutes=0,recipients}=context;
    const before=Boolean(talkMode&2),during=Boolean(talkMode&4),after=Boolean(talkMode&8),results=Boolean(talkMode&1);
    const schieber=this.kind==='schieber',base=schieber?S:D,c=data.fCard,actor=data.fPlayer;
    let winner=0,value=0,pick=false;
    if(command==='cmdNew'){
      for(const p of this.players)p.rounds=0;
    }else if(command==='cmdDeal'){
      this.trump=schieber?0:S.gColourOf[data.fDrawn];this.trumper=0;this.shifted=false;
      this.cardCount=0;this.trickNumber=0;this.best=0;this.trick={fLeading:0,fPlayed:Array(5).fill(0)};
      this.calls=Array(5).fill(D.NoCall);this.teamPoints=[...(data.fPoints||[0,0,0])];
      for(const p of this.players){p.points=0;p.picked=false;p.total=[...(data.fTotal||Array(5).fill(0))];}
    }else if(command==='cmdTrump'){this.trump=data.fTrump;this.trumper=actor;}
    else if(command==='cmdShift')this.shifted=true;
    else if(command==='cmdCall')this.calls[actor]=data.fCall;
    else if(command==='cmdCard'){
      if(this.cardCount===0){this.trick={fLeading:actor,fPlayed:Array(5).fill(0)};this.trickNumber++;this.best=c;pick=true;}
      else if(base.BetterCard(this.trump,this.best,c)){this.best=c;pick=true;for(let p=1;p<=this.count;p++)this.players[p].picked=actor===p;}
      this.trick.fPlayed[actor]=c;
      if(this.cardCount===this.count-1){winner=schieber?S.WinnerOfTrick(this.trump,this.trick):D.WinnerOfTrick(this.next,this.trump,this.trick);value=base.ValueOfTrick(this.trump,this.trick);}
    }else if(command==='cmdCount'&&schieber){
      for(let team=1;team<=2;team++)this.teamPoints[team]+=(data.fPoints[team]+data.fSuitPts[team]);
    }
    for(let player=1;player<=this.count;player++){
      const state=this.players[player];
      if(recipients&&!recipients.includes(player))continue;
      // Human handlers do not autonomously answer cmdSay.
      if(player===this.human)continue;
      const opponent=this.next[player],partner=this.next[this.next[player]],own=S.gTeamOf[player],opp=S.gTeamOf[opponent];
      const has=()=>this.commentary.pending.has(player);
      const say=(category,target,probability,mood=calm,entry=-1,replace=false)=>{
        if(!replace&&has())return false;
        return this.commentary.say(player,category,target,probability,mood,entry);
      };
      switch(command){
        case 'cmdNew':
          if(!state.games&&before)say(0,0,1,happy);
          state.games++;
          break;
        case 'cmdAutoPlay':case 'cmdStopPlay':this.commentary.pending.delete(player);break;
        case 'cmdDeal':
          if(before&&!has()&&(!schieber||S.gTeamOf[leading]!==own)){
            if(Math.floor(this.random()*2)===0)say(300,schieber?partner:0,0.05,happy);
            else say(350,schieber?partner:0,0.10,angry);
          }
          break;
        case 'cmdSuit':
          if(schieber&&before&&data.fSuit.fCount&&data.fSuit.fCalls[0].fCards.size){
            const probability=Math.min(1,Math.floor(data.fSuit.fCalls[0].fValue/100));
            if(actor===player)say(400,0,probability,happy);
            else if(actor===opponent)say(450,actor,probability,angry);
          }
          break;
        case 'cmdCard':
          if(!during)break;
          if(schieber){
            if(this.cardCount===0){
              if(actor===player){
                if(this.trickNumber>1&&this.trickNumber<9)say(500,0,0.03);
              }else if(this.trickNumber===1&&this.trump<S.TopDown){
                const female=this.commentary.isFemale?.(actor)||false;
                if(this.shifted){
                  if(S.gColourOf[c]!==this.trump)say(4850,actor,0.05,calm,female?4:3,true);
                }else if(c!==S.gCardOf[this.trump][S.Knave])say(4850,actor,0.05,actor===partner?furious:happy,female?2:1,true);
              }
            }else if(this.cardCount<this.count-1&&this.trickNumber<9&&actor===player){
              if(pick)say(550,0,0.02,happy);
              else if(this.trickNumber>2){
                const points=S.ValueOfCard(this.trump,c);
                if(points===8||points===10)say(600,0,0.02);
                else if(S.gColourOf[c]!==S.gColourOf[this.trick.fPlayed[this.trick.fLeading]]&&S.gColourOf[c]!==this.trump&&points===0)say(650,0,0.01);
              }
            }
          }else if(!has()){
            if(!winner&&actor===player){
              if(state.picked)say(550,player,0.02);
              else if(S.gColourOf[c]!==S.gColourOf[this.trick.fPlayed[this.trick.fLeading]]){
                if(S.gRankOf[c]>=S.gRankOf[S.Queen])say(600,player,0.15,happy);
                else if(D.ValueOfCard(this.trump,c)>=4)say(600,player,0.15,happy);
              }else say(8300,player,0.10);
            }else if(winner===player){
              if(state.points>=this.calls[player]&&value>0&&state.picked)say(8250,player,0.15,furious);
            }else if(winner){
              if(state.points<this.calls[player]-17&&value>0&&this.trickNumber>2&&this.trickNumber<36/this.count-1)say(8350,player,0.05,angry);
              if(state.points<this.calls[player]-17&&value>0&&state.picked)say(8200,player,0.10,furious);
            }
            if(winner&&value>25)say(8400,winner,0.04);
          }
          break;
        case 'cmdCount':{
          // Legacy elapsed-time comments are independent of the four category flags.
          if(Math.floor(elapsedMinutes/60)>=1&&elapsedMinutes%60<3)say(4860,0,0.15);
          if(!after||has())break;
          if(schieber){
            if(data.fMatchBy===own)say(700,partner,0.75,happy);
            else if(data.fMatchBy)say(750,partner,0.25,furious);
            else{
              if(this.teamPoints[own]-this.teamPoints[opp]>300&&data.fPoints[own]>data.fPoints[opp])say(4500,partner,0.33,overjoyed);
              if(this.teamPoints[own]-this.teamPoints[opp]<-300&&data.fPoints[own]<data.fPoints[opp])say(4600,partner,0.66,furious);
              if(this.trumper===partner){
                if(data.fPoints[own]>=3*data.fPoints[opp])say(4400,partner,0.33,happy);
                else if(data.fPoints[own]<Math.floor(data.fPoints[opp]/2))say(4450,partner,0.66,angry);
              }else{
                if(data.fPoints[own]>=3*data.fPoints[opp])say(4300,partner,0.15,happy);
                else if(data.fPoints[own]<Math.floor(data.fPoints[opp]/2))say(4350,partner,0.15,angry);
              }
            }
          }else{
            const delta=p=>D.DeltaOf(data.fCall[p],data.fMade[p],data.fBonus[p]);
            for(let p=1;p<=this.count;p++)state.total[p]+=delta(p);
            state.rounds++;
            const find=(min,max)=>{for(let p=this.next[player];p!==player;p=this.next[p])if(delta(p)>=min&&delta(p)<=max)return p;return 0;};
            const d=delta(player);
            if(d>=D.NoCall&&d<=0)say(4200,player,data.fCounts[player]>0?0.75:0.25,overjoyed);
            let target=find(D.NoCall,0);
            if(target)say(4700,target,data.fCounts[target]>0?0.40:0.20);
            if(d>=1&&d<=5)say(4200,player,0.20,happy);
            if(d>=20&&d<=157)say(4350,player,1,furious);
            if(d>=15&&d<=19)say(4350,player,0.50,furious);
            target=find(20,157);if(target)say(4750,target,0.40,happy);
            target=find(1,5);if(target)say(4700,target,0.20);
          }
          break;
        }
        case 'cmdBPrice':
          if(schieber&&results){
            if(own===data.fTeam){say(4000,partner,0.60,happy);say(4200,partner,0.20,happy);}
            else{say(4050,opponent,0.20,angry);say(4250,partner,0.20,angry);}
          }
          break;
        case 'cmdWinner':
          if(!results)break;
          if(schieber){
            if(own===data.fTeam){say(4100,partner,0.60,overjoyed);say(4750,opponent,0.40,happy);say(4200,partner,0.40,happy);}
            else{say(4150,partner,0.20,angry);say(4700,opponent,0.20);say(4250,partner,0.40,angry);}
          }else{
            this.commentary.pending.delete(player);
            const average=p=>Math.round(state.total[p]/Math.max(1,state.rounds));
            if(data.fTable[player]===1){const d=average(player);say(4200,player,d<=5?1:d<=8?0.60:d<=12?0.40:0.20,d<=8?overjoyed:d<=12?happy:calm);}
            let target=this.next[player];while(target!==player&&data.fTable[target]!==1)target=this.next[target];
            if(target!==player){const d=average(target);say(4700,target,d<=2?0.40:d<=5?0.30:d<=8?0.20:d<=12?0.10:0.05,d<=8?calm:angry);}
            target=this.next[player];while(target!==player&&data.fTable[target]!==this.count)target=this.next[target];
            if(target!==player)say(4750,target,0.40,happy);
          }
          break;
        case 'cmdSay':this.commentary.reply?.(player,data);break;
      }
    }
    if(command==='cmdCard'){
      if(winner)this.players[winner].points+=value;
      this.cardCount=(this.cardCount+1)%this.count;
    }
  }
}
