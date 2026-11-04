import {graphicsUrl,graphicsScale} from './graphics';
import { DISPLAY } from './config';
import { loadImage } from './table';

const base = `${import.meta.env.BASE_URL}assets/cards/`;
export async function loadCardManifest() {
  const response = await fetch(`${base}manifest.json`);
  if (!response.ok) throw new Error('Kartenverzeichnis fehlt');
  return response.json();
}
export async function loadCardSheet(manifest, setId, sizeIndex, orientation) {
  const sheet = manifest.sets.find(s => s.id === setId)?.sheets.find(s => s.sizeIndex === sizeIndex && s.orientation === orientation);
  if (!sheet) throw new Error('Unbekannter Kartensatz');
  const scale=graphicsScale();
  return { ...sheet, assetScale:sheet.assetScale*scale, image: await loadImage(graphicsUrl(`cards/${sheet.file}`)) };
}

// Table.pas: HandRect/CardRect, one-player South, TABLEOFFS=5, kHandHigh=8.
// Horizontal sheets use the same review slots, to inspect their separate artwork.
export function handLayout(sheet, firstCard = 1) {
  return Array.from({ length: 9 }, (_, index) => {
    const card = sheet.cards[firstCard - 1 + index];
    const { width, height } = card.rect;
    return { id: card.id, x: 5 + Math.floor(index * (DISPLAY.width - 10 - width) / 8),
      y: Math.floor((DISPLAY.height - 10 - height + DISPLAY.height) / 2) - Math.floor(height / 2), width, height };
  });
}

export function hitCard(cards, point) {
  // Later cards cover earlier ones, as in the original drawing order.
  return [...cards].reverse().find(r => point.x >= r.x && point.x < r.x + r.width && point.y >= r.y && point.y < r.y + r.height)?.id ?? null;
}

export function drawCard(ctx, sheet, id, destination) {
  const r = sheet.cards.find(c => c.id === id)?.rect;
  if (!r) throw new Error(`Unknown card ${id}`);
  const { x, y, width, height } = destination;
  ctx.save();
  ctx.beginPath();
  // GDI kRounding=15 is an ellipse diameter, Canvas uses a radius.
  ctx.roundRect(x, y, width, height, 7.5);
  ctx.clip();
  const s = sheet.assetScale;
  ctx.drawImage(sheet.image, r.x * s, r.y * s, r.width * s, r.height * s, x, y, width, height);
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x + 0.5, y + 0.5, width - 1, height - 1, 7.5); ctx.stroke();
  ctx.restore();
}

export function drawHand(canvas, sheet, cards, selected) {
  const ctx = canvas.getContext('2d');
  for (const card of cards) {
    drawCard(ctx, sheet, card.id, card);
    if (card.id === selected) {
      ctx.save(); ctx.strokeStyle = '#ffce37'; ctx.lineWidth = 2;
      ctx.strokeRect(card.x + 2, card.y + 2, card.width - 4, card.height - 4); ctx.restore();
    }
  }
}
