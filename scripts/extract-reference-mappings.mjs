// Source-derived atlas coordinates; no enhancement, resizing or original-file writes.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const OUTPUT = path.join(ROOT, 'artifacts/m1');
const sha256 = b => createHash('sha256').update(b).digest('hex');
const normalize = s => s.replaceAll('\\', '/');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const esc = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const decoder = new TextDecoder('windows-1252');

export function location(source, offset) {
  return { byteOffset: offset, line: source.slice(0, offset).split(/\r\n|\r|\n/).length };
}

export function parsePieceRects(source) {
  const start = source.indexOf('kPieceRect :');
  const end = source.indexOf('kCharacterColor :', start);
  assert(start >= 0 && end > start, 'kPieceRect source table not found');
  return [...source.slice(start, end).matchAll(/\(left:\s*(\d+);\s*top:\s*(\d+);\s*right:\s*(\d+);\s*bottom:\s*(\d+)\)/g)].map((m, i) => {
    const [x, y, right, bottom] = m.slice(1).map(Number);
    return { id: i + 1, x, y, width: right - x, height: bottom - y, source: location(source, start + m.index) };
  });
}

export function parseIconRects(source) {
  const start = source.indexOf('kIconData :');
  assert(start >= 0, 'kIconData source table not found');
  return [...source.slice(start).matchAll(/\(r:\(left:\s*(\d+);\s*top:\s*(\d+);\s*right:\s*(\d+);\s*bottom:\s*(\d+)\);nr:\s*(\d+)\)/g)].map((m, i) => {
    const [x, y, right, bottom, resourceId] = m.slice(1).map(Number);
    return { index: i + 1, resourceId, x, y, width: right - x, height: bottom - y, source: location(source, start + m.index) };
  });
}

export function parsePieceNames(source) {
  return [...source.matchAll(/^\s*(pr\w+)\s*=\s*(\d+);/gm)].map(m => ({ name: m[1], id: Number(m[2]), source: location(source, m.index) }));
}

export function cardRectangles(cardId, size, orientation) {
  assert(Number.isInteger(cardId) && cardId >= 1 && cardId <= 36, 'Card id must be 1..36');
  assert(size === 1 || size === 2, 'Face sheets have only size indices 1 and 2');
  assert(orientation === 'V' || orientation === 'H', 'Card orientation must be V or H');
  const width = size === 1 ? 75 : 97;
  const height = size === 1 ? 118 : 151;
  const xc = ((cardId - 1) % 9) * (width - 1);
  const yc = Math.floor((cardId - 1) / 9) * (height - 1);
  return orientation === 'V'
    ? { cell: { x: xc, y: yc, width: width - 1, height: height - 1 }, draw: { x: xc - 1, y: yc - 1, width, height } }
    : { cell: { x: 3 * (height - 1) - yc, y: xc, width: height - 1, height: width - 1 }, draw: { x: 3 * (height - 1) - yc, y: xc - 1, width: height, height: width } };
}

export function inside(rect, dimensions) {
  return rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0 && rect.x + rect.width <= dimensions.width && rect.y + rect.height <= dimensions.height;
}

export function maskPairs(names) {
  const ids = Object.fromEntries(names.map(n => [n.name, n.id]));
  const pairs = [];
  const add = (imageId, maskId, reason) => pairs.push({ imageId, maskId, reason });
  for (const name of ['prLogBorder', 'prScoreBorder']) {
    const base = ids[name];
    for (const [corner, offset] of [0, 4, 8, 12].map((v, i) => [v, i])) add(base + corner, base + 16 + offset, `ShowBorder(${name}, masked=true), corner ${offset}`);
  }
  for (const name of ['prName', 'prNameActive']) {
    for (let i = 0; i < 4; i++) add(ids[name] + i, ids[`${name}Mask`] + i, `${name} orientation ${i}`);
  }
  for (const name of ['prPen', 'prHolder', 'prGloonPressed', 'prGloon', 'prLeverBig']) {
    if (ids[name] && ids[`${name}Mask`]) add(ids[name], ids[`${name}Mask`], name);
  }
  return pairs;
}

export function composeMask(source, mask, width, height) {
  assert(source.length === width * height * 4 && mask.length === source.length, 'Mask pixel dimensions must match');
  const output = Buffer.alloc(source.length);
  let nonBinaryChannels = 0, foregroundBitsUnderMask = 0;
  for (let i = 0; i < output.length; i += 4) {
    const pixel = i / 4;
    const checker = (Math.floor((pixel % width) / 8) + Math.floor(Math.floor(pixel / width) / 8)) % 2 ? 224 : 160;
    for (let c = 0; c < 3; c++) {
      output[i + c] = (checker & mask[i + c]) | source[i + c];
      if (mask[i + c] !== 0 && mask[i + c] !== 255) nonBinaryChannels++;
      if ((mask[i + c] & source[i + c]) !== 0) foregroundBitsUnderMask++;
    }
    output[i + 3] = 255;
  }
  return { output, nonBinaryChannels, foregroundBitsUnderMask };
}

async function sourceFile(relative) {
  // Resolve historical mixed-case filenames while recording their actual spelling.
  let actual = ROOT;
  for (const part of normalize(relative).split('/')) {
    const candidates = (await readdir(actual)).filter(name => name.toLowerCase() === part.toLowerCase());
    assert(candidates.length === 1, `Missing/ambiguous source path segment: ${relative}`);
    actual = path.join(actual, candidates[0]);
  }
  const bytes = await readFile(actual);
  return { file: normalize(path.relative(ROOT, actual)), sha256: sha256(bytes), text: bytes.toString('latin1'), decoded: decoder.decode(bytes) };
}

function assetBinding(manifest, project, component) {
  const matches = manifest.assets.filter(a => a.origin === 'executable-form' && a.buildRole === 'reference' && a.source.project === project && a.source.component.toLowerCase().endsWith(`.${component.toLowerCase()}`) && a.format === 'bmp');
  assert(matches.length === 1, `Expected one reference ${project}.${component} asset; found ${matches.length}`);
  const reference = matches[0];
  const sources = manifest.assets.filter(a => a.origin === 'source-form' && a.source.project === project && a.source.component.toLowerCase().endsWith(`.${component.toLowerCase()}`) && a.format === 'bmp');
  assert(sources.length === 1, `Expected one source ${project}.${component} asset`);
  assert(reference.payloadSha256 === sources[0].payloadSha256, `Reference/source bitmap discrepancy for ${project}.${component}; coordinate applicability requires review`);
  assert(reference.previewPath, `Missing decoded preview for ${reference.id}`);
  return { assetId: reference.id, sourceAssetId: sources[0].id, payloadSha256: reference.payloadSha256, sourcePayloadMatchesReference: true, previewPath: reference.previewPath, dimensions: reference.dimensions, sourceFile: reference.source.file };
}

function looseAsset(manifest, file) {
  const matches = manifest.assets.filter(a => a.origin === 'loose' && normalize(a.source.file).toLowerCase() === normalize(file).toLowerCase());
  assert(matches.length === 1, `Expected one loose asset ${file}; found ${matches.length}`);
  assert(matches[0].previewPath, `Missing decoded preview for ${file}`);
  return matches[0];
}

async function crop(previewPath, rect, output) {
  await sharp(path.join(OUTPUT, previewPath)).extract({ left: rect.x, top: rect.y, width: rect.width, height: rect.height }).png().toFile(path.join(OUTPUT, output));
}

async function cropRaw(previewPath, rect) {
  return sharp(path.join(OUTPUT, previewPath)).extract({ left: rect.x, top: rect.y, width: rect.width, height: rect.height }).ensureAlpha().raw().toBuffer();
}

function stringArray(source, name) {
  const m = source.match(new RegExp(`${name}\\s*:[\\s\\S]*?=\\s*\\(([^;]+)\\);`));
  assert(m, `Missing ${name}`);
  return [...m[1].matchAll(/'((?:[^']|'')*)'/g)].map(x => x[1].replaceAll("''", "'"));
}

async function atlasMappings(manifest, project, expectedPieces) {
  const pascal = await sourceFile(`original/${project}/JassBmps.pas`);
  const iconsSource = await sourceFile(`original/${project}/${project === 'Schieber' ? 'ICONS.PAS' : 'Icons.pas'}`);
  const pieces = parsePieceRects(pascal.text);
  const names = parsePieceNames(pascal.text);
  const icons = parseIconRects(iconsSource.text);
  assert(pieces.length === expectedPieces, `${project}: expected ${expectedPieces} pieces, got ${pieces.length}`);
  assert(icons.length === 106, `${project}: expected 106 icon entries, got ${icons.length}`);
  const pieceAtlas = assetBinding(manifest, project, 'Pieces');
  const iconAtlas = assetBinding(manifest, project, 'Icons');
  for (const [list, binding, type] of [[pieces, pieceAtlas, 'pieces'], [icons, iconAtlas, 'icons']]) {
    for (const rect of list) {
      assert(inside(rect, binding.dimensions), `${project} ${type} rectangle ${rect.id ?? rect.resourceId} outside bitmap`);
      rect.previewPath = `sprites/${project}/${type}-${rect.id ?? rect.resourceId}.png`;
      rect.names = type === 'pieces' ? names.filter(n => n.id === rect.id).map(n => n.name) : [];
      await crop(binding.previewPath, rect, rect.previewPath);
    }
  }
  const masks = maskPairs(names);
  for (const pair of masks) {
    const image = pieces[pair.imageId - 1], mask = pieces[pair.maskId - 1];
    assert(image && mask, `Missing mask pair ${JSON.stringify(pair)}`);
    // ShowMaskedPiece copies the source dimensions at the mask origin, not the declared mask dimensions.
    const sampledMaskRect = { x: mask.x, y: mask.y, width: image.width, height: image.height };
    assert(inside(sampledMaskRect, pieceAtlas.dimensions), 'Sampled mask leaves atlas');
    const [imageBytes, maskBytes] = await Promise.all([cropRaw(pieceAtlas.previewPath, image), cropRaw(pieceAtlas.previewPath, sampledMaskRect)]);
    const result = composeMask(imageBytes, maskBytes, image.width, image.height);
    pair.sampledMaskRect = sampledMaskRect;
    pair.declaredMaskSizeMatches = image.width === mask.width && image.height === mask.height;
    pair.nonBinaryMaskChannels = result.nonBinaryChannels;
    pair.foregroundBitsUnderMask = result.foregroundBitsUnderMask;
    pair.previewPath = `sprites/${project}/masked-${pair.imageId}-${pair.maskId}.png`;
    pair.previewSemantics = 'Exact RGB AND/OR operation over a generated grey checkerboard; not a transparent cutout.';
    await sharp(result.output, { raw: { width: image.width, height: image.height, channels: 4 } }).png().toFile(path.join(OUTPUT, pair.previewPath));
  }
  const blends = [];
  for (const name of ['Blend1', 'Blend2']) {
    const binding = assetBinding(manifest, project, name);
    assert(binding.dimensions.width === 288 && binding.dimensions.height === 32, 'Unexpected blend atlas size');
    const steps = [];
    for (let factor = 0; factor <= 8; factor++) {
      const rect = { x: factor * 32, y: 0, width: 32, height: 32 };
      const previewPath = `sprites/${project}/${name}-${factor}.png`;
      await crop(binding.previewPath, rect, previewPath);
      steps.push({ factor, rect, previewPath });
    }
    blends.push({ name, binding, steps });
  }
  const formMasks = [];
  for (const [foregroundName, maskName, sourceUnit] of [['floatText', 'floatMask', 'DLGABOUT.PAS'], ['Arm', 'ArmM', 'DLGHINT.PAS']]) {
    const foreground = assetBinding(manifest, project, foregroundName);
    const mask = assetBinding(manifest, project, maskName);
    assert(foreground.dimensions.width === mask.dimensions.width && foreground.dimensions.height === mask.dimensions.height, 'Form mask dimensions differ');
    const rect = { x: 0, y: 0, ...foreground.dimensions };
    const [imageBytes, maskBytes] = await Promise.all([cropRaw(foreground.previewPath, rect), cropRaw(mask.previewPath, rect)]);
    const result = composeMask(imageBytes, maskBytes, rect.width, rect.height);
    const previewPath = `sprites/${project}/masked-form-${foregroundName}-${maskName}.png`;
    await sharp(result.output, { raw: { width: rect.width, height: rect.height, channels: 4 } }).png().toFile(path.join(OUTPUT, previewPath));
    const unit = await sourceFile(`original/${project}/${sourceUnit}`);
    formMasks.push({ foregroundName, maskName, foreground, mask, source: { file: unit.file, sha256: unit.sha256 },
      nonBinaryMaskChannels: result.nonBinaryChannels, foregroundBitsUnderMask: result.foregroundBitsUnderMask,
      previewPath, previewSemantics: 'Exact RGB AND/OR operation over a generated grey checkerboard; not a transparent cutout.' });
  }
  return { project, coordinateSource: { file: pascal.file, sha256: pascal.sha256 }, iconCoordinateSource: { file: iconsSource.file, sha256: iconsSource.sha256 },
    pieceAtlas, iconAtlas, pieces, namedPieceConstants: names, icons, masks, formMasks, blends,
    colorLabels: { german: stringArray(pascal.decoded, 'kDColourName'), french: stringArray(pascal.decoded, 'kFColourName'), rank: stringArray(pascal.decoded, 'kRankName') },
    iconSelection: {
      source: 'GetIconNr / GetInfoIconNr / GetHumanIconNr in iconCoordinateSource',
      baseExpression: '1000 * (5 + handlerID)',
      kindOffsets: { kIconSay: 100, kIconSetup: 6, kIconShift: 3, kIconInfo: 9, kIconPic: 0 },
      levelAdjustment: 'For handlerID >= 2, add PlayLevelToCharacterLevel(level), exactly as source; do not substitute the public character name for handlerID.',
      infoMoodOffsets: { moodFurious: 0, moodAngry: 0, moodCalm: 1, moodHappy: 2, moodOverjoyed: 2 },
      humanIcons: 'Profile fSayIconID + ORD(mood) - ORD(moodFurious), plus 100 when big. Missing profile: 6000 when big, otherwise 6100.',
    },
  };
}

async function cardsMapping(manifest) {
  const source = await sourceFile('original/Schieber/PCFILES.PAS');
  const differSource = await sourceFile('original/Differ/PCFILES.PAS');
  const bmps = await sourceFile('original/Schieber/JassBmps.pas');
  const base = await sourceFile('original/Schieber/SWSBase.pas');
  const array = (text, name) => {
    const m = text.match(new RegExp(`${name}\\s*:[\\s\\S]*?=\\s*\\(([^)]+)\\)`));
    assert(m, `Missing ${name}`); return m[1].split(',').map(s => s.trim().toLowerCase());
  };
  const types = array(source.text, 'TypeOfCardSet').map(Number);
  const numbers = array(source.text, 'NrOfCardSet').map(Number);
  const fourColor = array(source.text, 'FourColourCardSet').map(s => s === 'true');
  for (const name of ['TypeOfCardSet', 'NrOfCardSet', 'FourColourCardSet']) assert(JSON.stringify(array(source.text, name)) === JSON.stringify(array(differSource.text, name)), `Games disagree on ${name}`);
  assert(types.length === 5 && numbers.length === 5, 'Expected five card sets');
  const result = { source: { file: source.file, sha256: source.sha256 }, sharedWith: { file: differSource.file, sha256: differSource.sha256 },
    cropSource: { file: bmps.file, sha256: bmps.sha256, functions: ['CardW', 'CardH', 'ShowCard', 'ShowTrump', 'ShowLogTrump', 'ShowSmallAce'] },
    numberingSource: { file: base.file, sha256: base.sha256, expression: 'card = 9 * (colour - 1) + rank' },
    noCard: 0, backCard: 37, ranks: ['NoRank', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Knave', 'Queen', 'King', 'Ace'],
    colourConstants: ['NoColour', 'Spades', 'Hearts', 'Diamonds', 'Clubs'],
    colourWarning: 'These legacy constant names do not match the displayed French suit names at every index. Preserve numeric IDs and the source labels; do not normalize by English suit-name assumptions.',
    logicalCardSizes: [{ index: 0, width: 30, height: 46, facesAvailable: false }, { index: 1, width: 75, height: 118 }, { index: 2, width: 97, height: 151 }],
    cropWarning: 'ShowCard draw rectangles include -1 offsets and border pixels. Preview files use bounded raw cell rectangles, with no invented pixels or rounded border. Reproduce draw rectangles, GDI rounded clipping and border separately in the renderer.',
    sets: [], backs: [] };
  for (let index = 0; index < 5; index++) {
    const folder = types[index] === 1 ? 'Deutsch' : 'Franz';
    const set = { id: index + 1, typeId: types[index], fileSetNumber: numbers[index], folder, fourColour: fourColor[index], sheets: [] };
    for (const size of [1, 2]) for (const orientation of ['V', 'H']) {
      const filename = `original/Karten/${folder}/CARDS${numbers[index]}${size}${orientation}.BMP`;
      const asset = looseAsset(manifest, filename);
      const sheet = { sizeIndex: size, orientation, assetId: asset.id, sourceFile: asset.source.file, payloadSha256: asset.payloadSha256, dimensions: asset.dimensions, cards: [], extraSymbols: [] };
      for (let cardId = 1; cardId <= 36; cardId++) {
        const rectangles = cardRectangles(cardId, size, orientation);
        assert(inside(rectangles.cell, asset.dimensions), `Raw card cell outside ${filename}: ${cardId}`);
        const previewPath = `sprites/cards/set-${set.id}-size-${size}-${orientation}-card-${cardId}.png`;
        await crop(asset.previewPath, rectangles.cell, previewPath);
        sheet.cards.push({ id: cardId, colourId: Math.floor((cardId - 1) / 9) + 1, rankId: (cardId - 1) % 9 + 1, cellRect: rectangles.cell, drawRect: rectangles.draw, drawExtendsOutsideSheet: !inside(rectangles.draw, asset.dimensions), previewPath });
      }
      if (orientation === 'V') {
        const y = 4 * (size === 1 ? 117 : 150);
        for (const [kind, count, width, height, startX, startY] of [['trump', 6, 22, 22, 0, y], ['log-trump', 6, 26, 26, 0, y + 22], ['small-ace', 4, 27, 40, 156, y], ['small-ace-mask', 1, 27, 40, 264, y]]) {
          for (let i = 0; i < count; i++) {
            const rect = { x: startX + i * width, y: startY, width, height };
            assert(inside(rect, asset.dimensions), `Extra symbol outside ${filename}`);
            const previewPath = `sprites/cards/set-${set.id}-size-${size}-${kind}-${i + 1}.png`;
            await crop(asset.previewPath, rect, previewPath);
            sheet.extraSymbols.push({ kind, id: i + 1, rect, previewPath, ...(kind === 'small-ace' ? { maskRect: { x: 264, y, width: 27, height: 40 }, operation: '(destination RGB AND mask RGB) OR source RGB' } : {}) });
          }
        }
      }
      set.sheets.push(sheet);
    }
    result.sets.push(set);
  }
  for (const design of [0, 1, 2]) for (const size of [0, 1, 2]) for (const orientation of ['V', 'H']) {
    const asset = looseAsset(manifest, `original/Bmp/CARDB${design}${size}${orientation}.BMP`);
    const metrics = result.logicalCardSizes[size];
    const drawRect = { x: -1, y: -1, width: orientation === 'V' ? metrics.width : metrics.height, height: orientation === 'V' ? metrics.height : metrics.width };
    result.backs.push({ design, sizeIndex: size, orientation, assetId: asset.id, sourceFile: asset.source.file, payloadSha256: asset.payloadSha256, dimensions: asset.dimensions, drawRect, drawExtendsOutsideSheet: !inside(drawRect, asset.dimensions), previewPath: asset.previewPath });
  }
  return result;
}

function gallery(mapping) {
  const figure = (title, src, details = '') => `<figure><a href="${esc(src)}"><img loading="lazy" src="${esc(src)}" alt="${esc(title)}"></a><figcaption>${esc(title)}<small>${esc(details)}</small></figcaption></figure>`;
  let body = '<h1>Original sprite and card mappings</h1><p>Lossless crops at original resolution. Click an image for the PNG. Mask composites use the exact legacy RGB AND/OR operation over a checkerboard; they are not alpha-converted assets.</p><p><a href="gallery.html">Full asset gallery</a> · <a href="mappings.json">Coordinate manifest</a></p>';
  for (const project of mapping.projects) {
    body += `<h2>${esc(project.project)} pieces (${project.pieces.length})</h2><div class="grid">` + project.pieces.map(p => figure(`${p.id}: ${p.names.join(', ')}`, p.previewPath, `${p.x},${p.y} ${p.width}×${p.height}`)).join('') + '</div>';
    body += `<h2>${esc(project.project)} masks (${project.masks.length})</h2><div class="grid">` + project.masks.map(p => figure(`${p.imageId} AND/OR ${p.maskId}`, p.previewPath, p.reason)).join('') + '</div>';
    body += `<h2>${esc(project.project)} form masks</h2><div class="grid">` + project.formMasks.map(p => figure(`${p.foregroundName} AND/OR ${p.maskName}`, p.previewPath, p.source.file)).join('') + '</div>';
    body += `<h2>${esc(project.project)} icons (${project.icons.length})</h2><div class="grid">` + project.icons.map(p => figure(`Resource ${p.resourceId}`, p.previewPath, `${p.x},${p.y} ${p.width}×${p.height}`)).join('') + '</div>';
    body += `<h2>${esc(project.project)} blend patterns</h2><div class="grid">` + project.blends.flatMap(b => b.steps.map(s => figure(`${b.name}: factor ${s.factor}`, s.previewPath))).join('') + '</div>';
  }
  for (const set of mapping.cards.sets) {
    body += `<h2>Card set ${set.id}: ${set.folder} / file set ${set.fileSetNumber}${set.fourColour ? ' / four-colour' : ''}</h2>`;
    for (const sheet of set.sheets) {
      body += `<details${sheet.sizeIndex === 1 && sheet.orientation === 'V' ? ' open' : ''}><summary>Size ${sheet.sizeIndex}, ${sheet.orientation}: ${esc(sheet.sourceFile)}</summary><div class="cards">`;
      body += sheet.cards.map(c => figure(`Card ${c.id}`, c.previewPath, `colour ${c.colourId}, rank ${c.rankId}`)).join('') + '</div><div class="grid">';
      body += sheet.extraSymbols.map(c => figure(`${c.kind} ${c.id}`, c.previewPath)).join('') + '</div></details>';
    }
  }
  body += '<h2>Card backs</h2><div class="grid">' + mapping.cards.backs.map(b => figure(`Design ${b.design}, size ${b.sizeIndex}, ${b.orientation}`, b.previewPath)).join('') + '</div>';
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M1 original sprite mappings</title><style>body{font:15px system-ui;margin:24px;color:#222;background:#eee}h2{margin-top:40px}.grid,.cards{display:flex;flex-wrap:wrap;gap:12px}.cards{max-width:1100px}figure{margin:0;padding:8px;background:white;border:1px solid #aaa;min-width:96px;max-width:220px}img{max-width:200px;max-height:180px;object-fit:contain;image-rendering:pixelated;background:repeating-conic-gradient(#ddd 0% 25%,#fff 0% 50%) 0/16px 16px}figcaption{font-size:12px;overflow-wrap:anywhere}small{display:block;color:#555}summary{cursor:pointer;padding:10px;background:#ddd;margin:10px 0}</style>${body}</html>`;
}

export async function extractMappings() {
  const manifest = JSON.parse(await readFile(path.join(OUTPUT, 'manifest.json'), 'utf8'));
  for (const subdir of ['Schieber', 'Differ', 'cards']) await mkdir(path.join(OUTPUT, 'sprites', subdir), { recursive: true });
  const projects = [];
  for (const [project, count] of [['Schieber', 121], ['Differ', 128]]) projects.push(await atlasMappings(manifest, project, count));
  const cards = await cardsMapping(manifest);
  const result = { schemaVersion: 1, coordinateSystem: 'Original unscaled logical pixels. Right and bottom are exclusive; preserve numeric IDs.',
    sourceManifestSha256: sha256(await readFile(path.join(OUTPUT, 'manifest.json'))),
    maskOperation: '(destination RGB AND mask RGB) OR source RGB; white mask generally passes destination and black clears it, but source values can still modify masked channels.',
    limitations: ['Source coordinate tables are bound to matching authoritative executable bitmap payloads, not decompiled executable coordinate instructions.', 'Card previews are raw cell crops, not complete GDI card rendering with rounded clip and outline.', 'No PNG is enhanced or resized. Composite mask previews intentionally include a checkerboard destination.'],
    projects, cards, coverage: { pieces: projects.reduce((n, p) => n + p.pieces.length, 0), icons: projects.reduce((n, p) => n + p.icons.length, 0), maskPairs: projects.reduce((n, p) => n + p.masks.length, 0), formMaskPairs: projects.reduce((n, p) => n + p.formMasks.length, 0), cardSets: cards.sets.length, cardSheets: cards.sets.reduce((n, s) => n + s.sheets.length, 0), cardCells: cards.sets.reduce((n, s) => n + s.sheets.reduce((m, t) => m + t.cards.length, 0), 0), backImages: cards.backs.length } };
  await writeFile(path.join(OUTPUT, 'mappings.json'), JSON.stringify(result, null, 2) + '\n');
  await writeFile(path.join(OUTPUT, 'mappings-gallery.html'), gallery(result));
  console.log(JSON.stringify(result.coverage));
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await extractMappings();
