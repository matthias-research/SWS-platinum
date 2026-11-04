import {BASE_TABLE,carpetRect,pileRect} from './tableGeometry';
import { drawCard } from './cards';
import { layout } from './table';
export const trumpNames = ['', 'Schellen', 'Schilten', 'Rosen', 'Eicheln', 'Obenabe', 'Undenufe'];
export function trumpLabels(set = 1) { return set === 1 ? trumpNames : ['', 'Karo', 'Herz', 'Kreuz', 'Pik', 'Obenabe', 'Undenufe']; }
export function cardName(id, set = 1) {
  const ranks = ['Sechs', 'Sieben', 'Acht', 'Neun', 'Zehn', set === 1 ? 'Under' : 'Bube', set === 1 ? 'Ober' : 'Dame', 'König', 'Ass'];
  return `${trumpLabels(set)[Math.floor((id - 1) / 9) + 1]} ${ranks[(id - 1) % 9]}`;
}
export function gameHand(view, sheet, size=BASE_TABLE) {
  if (!view || !sheet) return [];
  const { width, height } = sheet.cards[0].rect;
  const slots = view.count === 3 ? 12 : 9;
  let descending=false;try{descending=JSON.parse(localStorage.getItem('sws-preferences')||'{}').viewDescending===true;}catch{}
  const hand=descending?[...view.hand].filter(Boolean).reverse():view.hand;
  return hand.map((id, i) => ({ id, x: 5 + Math.floor(i * (size.width - 10 - width) / (slots - 1)), y: size.height - 5 - height, width, height })).filter(c => c.id);
}
export function drawTrumpCorners(ctx,sheet,trump,dimensions=BASE_TABLE) {
  if(!sheet||trump<1||trump>6)return;
  // JassBmps.ShowTrump / Table.CarpetRect: 22px symbols below the four card rows.
  const size=22,s=sheet.assetScale,sourceY=4*(sheet.cards[0].rect.height-1);
  const c=carpetRect(dimensions);
  for(const x of [c.x,c.right-size])for(const y of [c.y,c.bottom-size])
    ctx.drawImage(sheet.image,(trump-1)*size*s,sourceY*s,size*s,size*s,x,y,size,size);
}
export function trickPositions(sheet,size=BASE_TABLE){
  const {width:w,height:h}=sheet.cards[0].rect;
  const carpet=carpetRect(size),mx=carpet.x+116,my=carpet.y+116;
  return [null, { x: mx - Math.floor(w / 2), y: Math.max(carpet.y, my - h + 2), width: w, height: h },
    { x: Math.max(carpet.x, mx - h + 2), y: my - Math.floor(w / 2), width: h, height: w },
    { x: mx - Math.floor(w / 2), y: Math.min(my - 2, carpet.bottom - h), width: w, height: h },
    { x: Math.min(mx - 2, carpet.right - h), y: my - Math.floor(w / 2), width: h, height: w }];
}
export function drawCardAnimation(ctx,animation,sheets,progress,size=BASE_TABLE){
  if(!sheets.V||!sheets.H)return;
  const positions=trickPositions(sheets.V,size),t=1-Math.pow(1-progress,2);
  const mix=(a,b)=>Object.fromEntries(['x','y','width','height'].map(k=>[k,a[k]+(b[k]-a[k])*t]));
  if(animation.type==='play'){
    const {player,card,before}=animation,to=positions[player];
    const c=carpetRect(size),boards=layout(size.width,size.height,sheets.V.cards[0].rect.height);
    const from=player===before.human?gameHand(before,sheets.V,size).find(c=>c.id===card):
      {...to,...[null,{x:c.x+116-to.width/2,y:-to.height},{x:boards.log.x+boards.log.width-to.width,y:c.y+116-to.height/2},{x:c.x+116-to.width/2,y:size.height},{x:boards.score.x+18,y:c.y+116-to.height/2}][player]};
    if(from)drawCard(ctx,player%2?sheets.V:sheets.H,card,mix(from,to));
  }else{
    const p=animation.winner,n=Math.max(0,(animation.after.pickedTricks[p]||1)-1);
    const r=pileRect(p,n,size),to={x:r.left,y:r.top,width:r.width,height:r.height};
    let player=animation.before.trick.fLeading;
    for(let i=0;i<animation.before.count;i++,player=player===animation.before.count?1:player+1)
      drawCard(ctx,player%2?sheets.V:sheets.H,animation.before.trick.fPlayed[player],mix(positions[player],to));
  }
}
export function drawGame(canvas, view, sheets, setId = 1, animation=null, size=BASE_TABLE) {
  if (!view || !sheets.V || !sheets.H) return;
  const ctx = canvas.getContext('2d'), {height:h}=sheets.V.cards[0].rect,positions=trickPositions(sheets.V,size);
  drawTrumpCorners(ctx,sheets.V,view.trump,size);
  if (view.trick&&(view.pause||!['deal','done'].includes(view.phase))) {
    let p = view.trick.fLeading || 1;
    for (let i = 0; i < view.count; i++, p = p === view.count ? 1 : p + 1) {
      const card = view.trick.fPlayed[p];
      if (card&&animation?.type!=='collect'&&!(animation?.type==='play'&&animation.player===p)) drawCard(ctx, p % 2 ? sheets.V : sheets.H, card, positions[p]);
    }
  }
  const legal = view.request?.player === view.human && view.request.command === 'cmdPlay' ? view.request.data.fLegal : null;
  for (const card of gameHand(view, sheets.V,size)) {
    drawCard(ctx, sheets.V, card.id, card);
    if (legal && !legal.includes(card.id)) { ctx.fillStyle = '#0005'; ctx.fillRect(card.x + 2, card.y + 2, card.width - 4, card.height - 4); }
  }
  const { log, score } = layout(size.width, size.height, h);
  ctx.save(); ctx.font = '11px Arial'; ctx.textBaseline = 'top'; ctx.fillStyle = '#111';
  if(!view.feed){
  const x = log.x + 18; let y = log.y + 54;
  ctx.fillText(view.kind === 'schieber' ? 'Schieber' : 'Differenzler', x, y); y += 20;
  ctx.fillText(`Runde ${view.roundNumber}`, x, y); y += 18;
  if (view.trump) { ctx.fillText(`Trumpf: ${trumpLabels(setId)[view.trump]}`, x, y); y += 22; }
  for (let p = 1; p <= view.count; p++) {
    ctx.fillText(`${view.names[p]} · ${view.handCounts[p]} Karten`, x, y); y += 17;
    if (view.calls) { ctx.fillText(`Ansage: ${view.calls[p] < 0 ? 'verdeckt' : view.calls[p]}`, x + 7, y); y += 17; }
  }
  for (const event of view.events.slice(-3)) { if (y + 16 < log.y + log.height - 16) { y += 16; ctx.fillText(event, x, y, log.width - 45); } }
  }
  ctx.fillStyle = '#fff';
  if (view.kind === 'schieber') {
    ctx.font = '25px Georgia';
    ctx.fillText(String(view.scores[2]), score.x + 30, score.y + 70);
    ctx.fillText(String(view.scores[1]), score.x + 30, score.y + score.height / 2 + 65);
  } else {
    // Cover the Schieber team labels inside the existing frame.
    ctx.fillStyle = '#10131b'; ctx.fillRect(score.x + 18, score.y + 17, score.width - 36, score.height - 34);
    ctx.fillStyle = '#fff'; ctx.font = '10px Arial';
    const cellWidth = (score.width - 42) / view.count, top = score.y + 23, bottom = score.y + score.height - 24;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5;
    for (let p = 1; p <= view.count; p++) {
      const left = score.x + 23 + (p - 1) * cellWidth;
      ctx.fillText(view.names[p], left + 3, top, cellWidth - 5);
      ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left,bottom); ctx.stroke();
      ctx.fillText(String(view.scores[p]), left+5, bottom-12);
      view.history.slice(-12).forEach((r,i)=>{if(r.call)ctx.fillText(String(Math.abs(r.call[p]-r.made[p])-r.bonus[p]),left+5,top+25+i*16);});
    }
  }
  ctx.restore();
}
