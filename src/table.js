import {BASE_TABLE} from './tableGeometry';
import { ASSETS, DISPLAY } from './config';
import { drawMaskedSprite } from './raster';
import {graphicsUrl} from './graphics';
import {loadBoardFont} from './boardFont';

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = async () => {
      image.assetScale=url.includes('/assets/enhanced/')&&!url.includes('enhanced-2x')?2:1;
      if(image.assetScale===2){
        try {image.maskSource=await loadImage(url.replace('/assets/enhanced/','/assets/'));}catch(error){reject(error);return;}
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${url}`));
    image.src = url;
  });
}

export async function loadAssets(mode='original') {
  const boardFont=await loadBoardFont();
  const [original, enhanced, pieces, manifest] = await Promise.all([
    loadImage(ASSETS.original.url), loadImage(ASSETS.enhanced.url), loadImage(graphicsUrl('schieber-pieces.bmp',mode)),
    fetch(ASSETS.manifest).then(r => { if (!r.ok) throw new Error('Grafikverzeichnis fehlt'); return r.json(); }),
  ]);
  const [differOriginal, differEnhanced, diffPieces, diffManifest] = await Promise.all([
    loadImage(ASSETS.differOriginal.url), loadImage(ASSETS.differEnhanced.url),
    loadImage(graphicsUrl('differ-pieces.bmp',mode)),
    fetch(`${import.meta.env.BASE_URL}assets/differ-pieces.json`).then(r=>r.json()),
  ]);
  manifest.assetScale=pieces.assetScale;diffManifest.assetScale=diffPieces.assetScale;
  return { original, enhanced, pieces, manifest, boardFont, sprites: new Map(), differ: {
    original:differOriginal, enhanced:differEnhanced, pieces:diffPieces, manifest:diffManifest, sprites:new Map(),
  } };
}

// TTable.BackBmpRect, TableBounds, LogBorderRect and ScoreBorderRect.
export function layout(width = DISPLAY.width, height = DISPLAY.height, cardHeight = 118, size = BASE_TABLE) {
  const background = { x: Math.floor(width / 2) - 512+(size.shiftX||0), y: Math.floor(height / 2) - 384 };
  const tableLeft = background.x + 323;
  const tableRight = tableLeft + 375;
  const handTop = height - 10 - cardHeight;
  const log = { x: 0, y: 10, width: tableLeft - 2, height: handTop - 20 };
  const score = { x: tableRight + 2, y: 10, width: width - tableRight - 2, height: handTop - 20 };
  // MaxRect centers a border when it exceeds its legacy maximum size.
  for (const [r, maxW, maxH] of [[log, 250, 600], [score, 250, 350]]) {
    if (r.width > maxW) { r.x += Math.floor(r.width / 2) - Math.floor(maxW / 2); r.width = maxW; }
    if (r.height > maxH) { r.y += Math.floor(r.height / 2) - Math.floor(maxH / 2); r.height = maxH; }
  }
  return { background, log, score };
}

function sprite(ctx, assets, id, x, y, maskId) {
  const r = assets.manifest.rects[id];
  if (maskId) {
    drawMaskedSprite(ctx, assets.pieces, r, assets.manifest.rects[maskId], x, y, assets.manifest.assetScale);
  } else {
    const s = assets.manifest.assetScale;
    if (!assets.sprites.has(id)) {
      // Isolate tiles before scaling so interpolation never reads adjacent sprites.
      const tile = document.createElement('canvas');
      tile.width = r.width * s; tile.height = r.height * s;
      tile.getContext('2d').drawImage(assets.pieces, r.x * s, r.y * s, tile.width, tile.height,
        0, 0, tile.width, tile.height);
      assets.sprites.set(id, tile);
    }
    ctx.drawImage(assets.sprites.get(id), x, y, r.width, r.height);
  }
}

// Original TTable.GloonRect: the joker sits over the bottom edge of its board.
export function jokerRect(assets,kind,cardHeight=118,size=BASE_TABLE){
  const {log,score}=layout(size.width,size.height,cardHeight,size),r=assets.manifest.rects;
  const useLog=kind==='differ'&&!size.hideFeed;
  const board=useLog?log:score,base=useLog?39:59;
  return {x:board.x+board.width-r[base+6].width-(kind==='differ'?18:0)-r[90].width,
    y:board.y+board.height-r[base+10].height-53,width:r[90].width,height:r[90].height};
}
export function drawTableJoker(canvas,overlay,assets,kind,cardHeight,pressed,size=BASE_TABLE){
  const r=jokerRect(assets,kind,cardHeight,size),ctx=canvas.getContext('2d'),t=ctx.getTransform();
  // Keep the joker on a transparent layer so enlarging it does not enlarge
  // a rectangular patch of the board behind it.
  overlay.width=Math.round(r.width*t.a);overlay.height=Math.round(r.height*t.d);
  const out=overlay.getContext('2d');out.setTransform(t.a,0,0,t.d,0,0);
  sprite(out,assets,pressed?89:90,0,0,pressed?91:92);
  const mask=assets.manifest.rects[pressed?91:92],source=assets.pieces.maskSource||assets.pieces;
  const ms=assets.pieces.maskSource?1:assets.manifest.assetScale;
  const matte=document.createElement('canvas');matte.width=overlay.width;matte.height=overlay.height;
  const m=matte.getContext('2d');m.imageSmoothingEnabled=false;
  m.drawImage(source,mask.x*ms,mask.y*ms,mask.width*ms,mask.height*ms,0,0,matte.width,matte.height);
  const pixels=out.getImageData(0,0,overlay.width,overlay.height),alpha=m.getImageData(0,0,matte.width,matte.height).data;
  for(let i=0;i<pixels.data.length;i+=4)pixels.data[i+3]=255-alpha[i];
  out.putImageData(pixels,0,0);
}

// Port of JassBmps.ShowBorder: retain the sixteen edge/corner pieces and four masks.
function border(ctx, assets, b, base) {
  const w = n => assets.manifest.rects[base + n].width;
  const h = n => assets.manifest.rects[base + n].height;
  const right = b.x + b.width, bottom = b.y + b.height;
  const draw = (n, x, y, mask) => sprite(ctx, assets, base + n, x, y, mask ? base + mask : undefined);
  ctx.save(); ctx.beginPath(); ctx.rect(b.x, b.y, b.width, b.height); ctx.clip();
  for (let x = b.x + w(0) + w(1); x <= right - w(4) - w(3); x += w(2)) draw(2, x, b.y);
  for (let x = b.x + w(12) + w(11); x <= right - w(9) - w(8); x += w(10)) draw(10, x, bottom - h(10));
  for (let y = b.y + h(0) + h(15); y <= bottom - h(13) - h(12); y += h(14)) draw(14, b.x, y);
  for (let y = b.y + h(4) + h(5); y <= bottom - h(7) - h(8); y += h(6)) draw(6, right - w(6), y);
  draw(1, b.x + w(0), b.y); draw(3, right - w(4) - w(3), b.y);
  draw(11, b.x + w(12), bottom - h(11)); draw(9, right - w(8) - w(9), bottom - h(9));
  draw(15, b.x, b.y + h(0)); draw(13, b.x, bottom - h(12) - h(13));
  draw(5, right - w(5), b.y + h(4)); draw(7, right - w(7), bottom - h(8) - h(7));
  draw(0, b.x, b.y, 16); draw(4, right - w(4), b.y, 17);
  draw(8, right - w(8), bottom - h(8), 18); draw(12, b.x, bottom - h(12), 19);
  ctx.restore();
  return { x: b.x + w(14), y: b.y + h(2), width: b.width - w(14) - w(6), height: b.height - h(2) - h(10) };
}

export function drawTable(canvas, assets, mode, scale, pixelRatio, cardHeight = 118, size = BASE_TABLE) {
  canvas.width = Math.round(size.width * scale * pixelRatio);
  canvas.height = Math.round(size.height * scale * pixelRatio);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(canvas.width / size.width, 0, 0, canvas.height / size.height, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // The original centered bitmap has finite bounds; keep larger windows dark.
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, size.width, size.height);
  const { background, log, score } = layout(size.width, size.height, cardHeight,size);
  const a=ASSETS[mode];
  ctx.drawImage(assets[mode],0,0,1024*a.scale,768*a.scale,background.x,background.y,1024,768);

  if(!size.hideFeed){
  const paper = border(ctx, assets, log, 39);
  ctx.fillStyle = '#fff'; ctx.fillRect(paper.x, paper.y, paper.width, paper.height);
  // The HTML feed supplies the working scrollbar; do not paint a static one.
  sprite(ctx, assets, 87, log.x + Math.floor(log.width / 2) - 78, log.y, 88);
  sprite(ctx, assets, 85, log.x + 5, log.y + 20, 86);
  }

  const board = border(ctx, assets, score, 59);
  ctx.save(); ctx.beginPath(); ctx.rect(board.x, board.y, board.width, board.height); ctx.clip();
  // Isolate the tile before repeating: sampling the atlas directly at fractional
  // display scales bleeds neighbouring light pixels into visible grid seams.
  const tile = document.createElement('canvas');
  const tileScale=assets.manifest.assetScale;
  tile.width = 32*tileScale; tile.height = 32*tileScale;
  const tileContext=tile.getContext('2d');tileContext.scale(tileScale,tileScale);
  sprite(tileContext, assets, 121, 0, 0);
  const pattern=ctx.createPattern(tile, 'repeat');pattern.setTransform(new DOMMatrix().scale(1/tileScale));
  ctx.fillStyle = pattern;
  ctx.fillRect(board.x, board.y, board.width, board.height);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(board.x, board.y + Math.floor(board.height / 2) + 0.5);
  ctx.lineTo(board.x + board.width, board.y + Math.floor(board.height / 2) + 0.5); ctx.stroke();
  ctx.restore();
}
