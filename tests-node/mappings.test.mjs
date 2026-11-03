import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parsePieceRects, parseIconRects, parsePieceNames, cardRectangles, inside, maskPairs, composeMask } from '../scripts/extract-reference-mappings.mjs';

const source = relative => readFile(new URL(`../${relative}`, import.meta.url), 'latin1');

test('original piece/icon maps retain source numeric identity and fit known atlas bounds', async () => {
  for (const [project, count, width] of [['Schieber', 121, 491], ['Differ', 128, 510]]) {
    const text = await source(`original/${project}/JassBmps.pas`);
    const pieces = parsePieceRects(text);
    const names = parsePieceNames(text);
    assert.equal(pieces.length, count);
    assert.ok(pieces.every(p => inside(p, { width, height: 603 })));
    assert.equal(names.find(n => n.name === 'prPen').id, 85);
    assert.deepEqual({ x: pieces[84].x, y: pieces[84].y, width: pieces[84].width, height: pieces[84].height }, { x: 273, y: 1, width: 177, height: 37 });
    const masks = maskPairs(names);
    assert.ok(masks.some(p => p.imageId === 39 && p.maskId === 55));
    assert.ok(masks.some(p => p.imageId === 85 && p.maskId === 86));
    assert.equal(masks.some(p => p.imageId === 126 && p.maskId === 127), project === 'Differ');
    const icons = parseIconRects(await source(`original/${project}/${project === 'Schieber' ? 'ICONS.PAS' : 'Icons.pas'}`));
    assert.equal(icons.length, 106);
    assert.equal(new Set(icons.map(i => i.resourceId)).size, 106);
    assert.equal(icons[0].resourceId, 7006);
    assert.equal(icons.at(-1).resourceId, 5119);
    assert.ok(icons.every(p => inside(p, { width: 938, height: 465 })));
  }
});

test('card cell crops preserve all 36 cards, both orientations, and intentional border overhang', () => {
  assert.deepEqual(cardRectangles(1, 1, 'V'), {
    cell: { x: 0, y: 0, width: 74, height: 117 },
    draw: { x: -1, y: -1, width: 75, height: 118 },
  });
  assert.deepEqual(cardRectangles(36, 2, 'H'), {
    cell: { x: 0, y: 768, width: 150, height: 96 },
    draw: { x: 0, y: 767, width: 151, height: 97 },
  });
  for (const size of [1, 2]) for (const orientation of ['V', 'H']) {
    const dimensions = size === 1
      ? (orientation === 'V' ? { width: 666, height: 516 } : { width: 468, height: 666 })
      : (orientation === 'V' ? { width: 864, height: 648 } : { width: 600, height: 864 });
    const rects = Array.from({ length: 36 }, (_, i) => cardRectangles(i + 1, size, orientation));
    assert.ok(rects.every(r => inside(r.cell, dimensions)));
    assert.equal(new Set(rects.map(r => JSON.stringify(r.cell))).size, 36);
    assert.ok(rects.some(r => !inside(r.draw, dimensions)), 'Do not clamp away original out-of-sheet drawing coordinates');
  }
  assert.throws(() => cardRectangles(0, 1, 'V'));
  assert.throws(() => cardRectangles(37, 1, 'V'));
  assert.throws(() => cardRectangles(1, 0, 'V'));
});

test('mask preview uses exact RGB bit operations, including non-binary masks', () => {
  const source = Buffer.from([12, 34, 56, 255, 0, 0, 0, 255, 3, 7, 15, 255]);
  const mask = Buffer.from([0, 0, 0, 255, 255, 255, 255, 255, 0xf0, 0x0f, 0xff, 255]);
  const composed = composeMask(source, mask, 3, 1);
  assert.deepEqual([...composed.output], [12, 34, 56, 255, 160, 160, 160, 255, 163, 7, 175, 255]);
  assert.equal(composed.nonBinaryChannels, 2);
  assert.equal(composed.foregroundBitsUnderMask, 2);
  assert.throws(() => composeMask(source, Buffer.alloc(4), 3, 1));
});
