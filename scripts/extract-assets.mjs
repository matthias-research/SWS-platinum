// Lossless recovery only: original files are never modified.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'public/assets');
await mkdir(out, { recursive: true });
const dfm = await readFile(path.join(root, 'original/Schieber/JassBmps.dfm'));
let pieces;
for (let i = 0; i < dfm.length - 54; i++) {
  if (dfm.toString('ascii', i, i + 2) !== 'BM') continue;
  const bytes = dfm.readUInt32LE(i + 2);
  if (dfm.readUInt32LE(i + 14) === 40 && dfm.readInt32LE(i + 18) === 491 && dfm.readInt32LE(i + 22) === 603 && i + bytes <= dfm.length) {
    pieces = dfm.subarray(i, i + bytes);
    break;
  }
}
if (!pieces) throw new Error('Expected 491 × 603 Pieces bitmap not found');
await writeFile(path.join(out, 'schieber-pieces.bmp'), pieces);
const source = await readFile(path.join(root, 'original/Schieber/JassBmps.pas'), 'latin1');
const table = source.slice(source.indexOf('kPieceRect :'), source.indexOf('kCharacterColor :'));
const rects = [null, ...[...table.matchAll(/left:\s*(\d+);\s*top:\s*(\d+);\s*right:\s*(\d+);\s*bottom:\s*(\d+)/g)].map(m => {
  const [x, y, right, bottom] = m.slice(1).map(Number);
  return { x, y, width: right - x, height: bottom - y };
})];
if (rects.length !== 122) throw new Error(`Expected 121 sprite rectangles, found ${rects.length - 1}`);
await writeFile(path.join(out, 'schieber-pieces.json'), JSON.stringify({
  source: 'original/Schieber/JassBmps.dfm: BmpsForm.Pieces.Picture.Data',
  coordinates: 'original/Schieber/JassBmps.pas: kPieceRect',
  sha256: createHash('sha256').update(pieces).digest('hex'),
  assetScale: 1, width: 491, height: 603, rects,
}, null, 2) + '\n');
await copyFile(path.join(root, 'original/Bmp/BackS1.bmp'), path.join(out, 'table-original.bmp'));
console.log('Extracted original background, Pieces atlas and 121 rectangles.');
const differ = await readFile(path.join(root, 'original/Differ/JassBmps.dfm'));
const diffPieces = differ.subarray(21107, 21107 + differ.readUInt32LE(21109));
if (diffPieces.toString('ascii',0,2) !== 'BM' || diffPieces.readInt32LE(18) !== 510) throw new Error('Differenzler Pieces layout changed');
await writeFile(path.join(out, 'differ-pieces.bmp'), diffPieces);
const diffSource = await readFile(path.join(root, 'original/Differ/JassBmps.pas'),'latin1');
const diffTable = diffSource.slice(diffSource.indexOf('kPieceRect :'), diffSource.indexOf('kCharacterColor :'));
const diffRects = [null,...[...diffTable.matchAll(/left:\s*(\d+);\s*top:\s*(\d+);\s*right:\s*(\d+);\s*bottom:\s*(\d+)/g)].map(m=>{
  const [x,y,right,bottom]=m.slice(1).map(Number);return{x,y,width:right-x,height:bottom-y};
})];
await writeFile(path.join(out,'differ-pieces.json'),JSON.stringify({source:'original/Differ/JassBmps.dfm',assetScale:1,width:510,height:603,sha256:createHash('sha256').update(diffPieces).digest('hex'),rects:diffRects},null,2)+'\n');
await copyFile(path.join(root,'original/Bmp/BackD1.bmp'),path.join(out,'differ-table-original.bmp'));
