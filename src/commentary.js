import catalogs from './commentaryData.js';
import {CommentaryTriggers,COMMENT_REPLIES} from './commentaryTriggers.js';

export function talkMode(settings={}) {
  return (settings.results!==false?1:0)|(settings.before!==false?2:0)|
    (settings.during!==false?4:0)|(settings.after!==false?8:0);
}

// JASSERS.UpdateEntryInfo. The two games intentionally interpret xd/xs differently.
export function entryInfo(raw,kind) {
  const info={};
  for(const token of (raw.match(/\[([^\]]*)/)?.[1]||'').split(',').map(s=>s.trim())){
    const flag=token[0],value=token.slice(1);
    if(flag==='x')info.disabled=value==='d'?kind==='differ':value==='s'?kind==='schieber':true;
    else if(flag==='m'||flag==='f')info.gender=flag==='f'?'female':'male';
    else if(flag==='c')info.cardset=value;
    else if('dir'.includes(flag)&&flag){
      const [min,max]=value.split('-').map(Number);
      info[flag]=[min,Number.isFinite(max)?max:{d:1231,i:2359,r:9999}[flag]];
    }else if(['s','p','t','w'].includes(flag)){
      const digits=value.match(/^\d*/)[0];
      info[flag]={values:[...digits].map(Number),invert:value[digits.length]==='n'};
    }else if(flag==='a'){
      const [category,entry]=-1===value.indexOf('-')?[Number(value),-1]:value.split('-').map(Number);
      info.reply={category,entry};
    }
  }
  return info;
}
const inRange=(n,[min,max])=>min<=max?n>=min&&n<=max:n>=min||n<=max;
const inSet=(n,rule)=>!rule||!rule.values.length||rule.values.includes(n)!==rule.invert;

export class Commentary {
  constructor(options,settings={},random){
    this.options=options;this.kind=options.kind;this.count=options.count;this.human=options.human;
    this.settings=settings;this.pending=new Map();this.history=new Map();
    // Commentary never consumes the dealing or AI random streams.
    let seed=(Number(options.seed)||1)>>>0;
    this.random=random||(()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;});
    this.triggers=new CommentaryTriggers({...options,random:this.random},this);
  }
  isFemale(player){return player===this.human?this.settings.gender==='female':[0,2].includes(this.options.characters?.[player]??0);}
  character(player){return player===this.human?0:(this.options.characters?.[player]??0)+2;}
  eligible(info,player,target){
    if(info.disabled)return false;
    if(info.gender&&(!target||info.gender!==(this.isFemale(target)?'female':'male')))return false;
    if(info.cardset&&info.cardset!==((this.settings.set??1)===1?'d':'f'))return false;
    if(info.s&&(!target||!inSet(this.character(target),info.s)))return false;
    // Pascal uses four compass seats even in a three-player game.
    if(target&&!inSet((target-player+3)%4,info.p))return false;
    if(this.kind==='schieber'&&info.t){
      const {values,invert}=info.t;
      if(values.includes(0)&&this.triggers.shifted===invert)return false;
      if(invert&&this.triggers.trump===0)return false;
      if(!inSet(this.triggers.trump,{values:values.filter(n=>n!==0),invert}))return false;
    }
    const date=this.settings.date||{monthDay:101,time:1200,weekday:0};
    if(info.d&&!inRange(date.monthDay,info.d)||info.i&&!inRange(date.time,info.i)||
      info.r&&!inRange(this.settings.elapsedMinutes||0,info.r)||!inSet(date.weekday,info.w))return false;
    return true;
  }
  say(player,category,target,probability,mood,entry=-1){
    if(player===this.human)return false;
    // Original Random(101) <= ROUND(100*probability), including its 1/101 floor.
    if(Math.floor(this.random()*101)>Math.round(100*probability))return false;
    const base=5000+1000*this.character(player),lines=catalogs[this.kind][base+category]||[];
    const key=`${player}/${category}`,used=this.history.get(key)||new Set();
    let selected;
    if(entry!==-1){
      const raw=lines[entry-1];
      if(raw&&!entryInfo(raw,this.kind).disabled)selected={raw,entry};
    }else{
      const candidates=lines.map((raw,i)=>({raw,entry:i+1})).filter(e=>this.eligible(entryInfo(e.raw,this.kind),player,target));
      let fresh=candidates.filter(e=>!used.has(e.entry));
      if(!fresh.length){used.clear();fresh=candidates;}
      selected=fresh[Math.floor(this.random()*fresh.length)];
      if(selected){used.add(selected.entry);this.history.set(key,used);}
    }
    if(!selected)return false;
    const addressed=target&&target!==player?target:0;
    const name=addressed?this.options.names[addressed]:'';
    const female=this.isFemale(addressed);
    const prefixes=['',female?'D ':'Dr ',female?'d ':'dr ',female?'Dr ':'Em ',female?'dr ':'em '];
    const text=selected.raw.split('[')[0].trimEnd().replace(/@./g,token=>addressed&&/^@[0-4]$/.test(token)?prefixes[Number(token[1])]+name:'');
    this.pending.set(player,{kind:'say',player,text,mood,target:addressed,category,
      sound:base+category+selected.entry,voice:this.character(player)+1,
      icon:5100+this.character(player)*1000+(mood===2?1:mood>2?2:0),
      info:entryInfo(selected.raw,this.kind)});
    return true;
  }
  notify(command,data,context={}){
    this.triggers.notify(command,data,{talkMode:talkMode(this.settings),leading:this.options.leading??3,
      elapsedMinutes:this.settings.elapsedMinutes||0,...context});
  }
  reply(player,incoming){
    if(!incoming.fTo?.includes(player)||incoming.fTo.length!==1)return;
    const defaults=COMMENT_REPLIES[incoming.category]||[-2,2,0];
    const category=incoming.info?.reply?.category??defaults[0];
    if(category!==-2)this.say(player,category,incoming.fFrom,defaults[2],defaults[1],incoming.info?.reply?.entry??-1);
  }
  drain(){
    const result=[];
    // Deliver replies through the same handlers, retaining one pending line per seat.
    for(let pass=0;this.pending.size&&pass<32;pass++)for(let p=1;p<=this.count;p++){
      const event=this.pending.get(p);if(!event)continue;
      this.pending.delete(p);result.push(event);
      this.notify('cmdSay',{fFrom:p,fTo:event.target?[event.target]:Array.from({length:this.count+1},(_,i)=>i).filter(i=>i!==p),
        fText:event.text,fMood:event.mood,fSound:event.sound,category:event.category,info:event.info});
    }
    this.pending.clear();
    return result.map(({info,category,target,...event})=>event);
  }
}
