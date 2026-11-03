// Package the M1 mappings and lossless previews; no enhancement or renumbering.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { decodeBmp } from './lib/delphi.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const mappings = JSON.parse(await readFile(path.join(root, 'artifacts/m1/mappings.json')));
const manifest = JSON.parse(await readFile(path.join(root, 'artifacts/m1/manifest.json')));
const out = path.join(root, 'public/assets/cards');
await mkdir(out, { recursive: true });
const sets = [];
for (const set of mappings.cards.sets) {
  const sheets = [];
  for (const sheet of set.sheets) {
    const source = await readFile(path.join(root, sheet.sourceFile));
    if (createHash('sha256').update(source).digest('hex') !== sheet.payloadSha256) throw new Error(`Changed source: ${sheet.sourceFile}`);
    const asset = manifest.assets.find(a => a.id === sheet.assetId);
    if (!asset || asset.payloadSha256 !== sheet.payloadSha256) throw new Error('M1 manifest/mapping mismatch');
    const file = `set-${set.id}-${sheet.sizeIndex}-${sheet.orientation}.png`;
    const decoded = decodeBmp(source);
    if (createHash('sha256').update(decoded.rgba).digest('hex') !== asset.decodedPixelSha256) throw new Error('Decoded card pixels differ from M1');
    await sharp(decoded.rgba, { raw: { width: decoded.width, height: decoded.height, channels: 4 } }).png().toFile(path.join(out, file));
    sheets.push({ file, assetScale: 1, sizeIndex: sheet.sizeIndex, orientation: sheet.orientation,
      source: sheet.sourceFile, sourceSha256: sheet.payloadSha256, decodedPixelSha256: asset.decodedPixelSha256,
      cards: sheet.cards.map(({ id, colourId, rankId, drawRect }) => ({ id, colourId, rankId, rect: drawRect })) });
  }
  sets.push({ id: set.id, typeId: set.typeId, fourColour: set.fourColour, sheets });
}
await writeFile(path.join(out, 'manifest.json'), JSON.stringify({
  provenance: 'Lossless original card sheets; M1 ShowCard mappings. No AI enhancement.', sets,
}, null, 2) + '\n');
console.log(`Packaged ${sets.length} original card sets / 20 sheets.`);
