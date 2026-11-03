import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseBinaryDfm, parseTextDfm, parseDfm, parsePeResources, decodeBmp, decodeIco, extractPicture, sha256 } from '../scripts/lib/delphi.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const u32 = value => { const bytes = Buffer.alloc(4); bytes.writeUInt32LE(value); return bytes; };
const short = value => Buffer.concat([Buffer.from([Buffer.byteLength(value, 'latin1')]), Buffer.from(value, 'latin1')]);
const object = (cls, name, properties, children = []) => Buffer.concat([short(cls), short(name), ...properties, Buffer.from([0]), ...children, Buffer.from([0])]);
const property = (name, value) => Buffer.concat([short(name), value]);

test('binary DFM retains typed controls, anonymous children and exact binary offsets', () => {
  const payload = Buffer.from('cafe', 'hex');
  const child = object('TImage', 'Picture', [property('Picture.Data', Buffer.concat([Buffer.from([10]), u32(payload.length), payload]))]);
  const anonymous = object('TTabPage', '', [property('Caption', Buffer.concat([Buffer.from([6]), short('Regeln')]))]);
  const form = Buffer.concat([Buffer.from('TPF0'), object('TForm', 'Main', [property('Visible', Buffer.from([8])), property('Left', Buffer.from([2, 0xfe]))], [child, anonymous])]);
  const parsed = parseBinaryDfm(form);
  assert.equal(parsed.components[0].properties.Left, -2);
  assert.equal(parsed.components[0].properties.Visible, false);
  assert.equal(parsed.components[2].name, '');
  assert.equal(parsed.components[2].path, 'Main.$TTabPage[1]');
  const blob = parsed.components[1].properties['Picture.Data'].binary;
  assert.deepEqual(form.subarray(blob.offset, blob.offset + blob.bytes.length), payload);
  assert.throws(() => parseBinaryDfm(form.subarray(0, -1)), /terminator|Truncated/);
  assert.throws(() => parseBinaryDfm(Buffer.concat([form, Buffer.from([0])])), /trailing/);
});

test('text DFM distinguishes nested components, Pascal text, lists, collection and image hex', () => {
  const parsed = parseTextDfm(Buffer.from(`object Main: TForm
 Caption = 'Stoeck ''Wyys'''#13#10'Sued'
 Items.Strings = ('Nord' 'West')
 Font.Style = [fsBold, fsItalic]
 Columns = <item Caption = 'Punkte' Width = 42 end>
 object OK: TBitBtn
  NumGlyphs = 2
  Glyph.Data = {CA FE}
  Enabled = False
 end
end`, 'latin1'));
  assert.equal(parsed.components[0].properties.Caption, "Stoeck 'Wyys'\r\nSued");
  assert.deepEqual(parsed.components[0].properties['Items.Strings'], ['Nord', 'West']);
  assert.deepEqual(parsed.components[0].properties['Font.Style'], ['fsBold', 'fsItalic']);
  assert.deepEqual(parsed.components[0].properties.Columns, [{ Caption: 'Punkte', Width: 42 }]);
  assert.equal(parsed.components[1].path, 'Main.OK');
  assert.equal(parsed.components[1].properties.NumGlyphs, 2);
  assert.equal(parsed.components[1].properties.Enabled, false);
  assert.deepEqual(parsed.components[1].properties['Glyph.Data'].binary.bytes, Buffer.from('cafe', 'hex'));
  assert.throws(() => parseTextDfm(Buffer.from('object Main: TForm Picture.Data = {FFG0} end')), /hex/);
});

function paletteBmp(topDown = false) {
  const bytes = Buffer.alloc(70);
  bytes.write('BM'); bytes.writeUInt32LE(70, 2); bytes.writeUInt32LE(62, 10);
  bytes.writeUInt32LE(40, 14); bytes.writeInt32LE(3, 18); bytes.writeInt32LE(topDown ? -2 : 2, 22);
  bytes.writeUInt16LE(1, 26); bytes.writeUInt16LE(8, 28); bytes.writeUInt32LE(2, 46);
  bytes.set([0, 0, 255, 0, 255, 0, 0, 0], 54); // red, blue palette (BGR)
  const top = [0, 1, 0, 0], bottom = [1, 0, 1, 0]; // padded rows
  bytes.set(topDown ? [...top, ...bottom] : [...bottom, ...top], 62);
  return bytes;
}

test('palette BMP decoding preserves colors, orientation and row padding', () => {
  const positive = decodeBmp(paletteBmp()), negative = decodeBmp(paletteBmp(true));
  assert.deepEqual(positive.rgba, negative.rgba);
  assert.deepEqual([...positive.rgba], [255,0,0,255, 0,0,255,255, 255,0,0,255, 0,0,255,255, 255,0,0,255, 0,0,255,255]);
  assert.equal(positive.width, 3); assert.equal(positive.height, 2);
  assert.throws(() => decodeBmp(paletteBmp().subarray(0, 65)), /Truncated/);
});

test('VCL picture wrapper is structural and refuses mismatched declared lengths', () => {
  const image = paletteBmp();
  const wrapped = Buffer.concat([short('TBitmap'), u32(image.length), image]);
  const result = extractPicture(wrapped);
  assert.equal(result.format, 'bmp'); assert.equal(result.offset, 12); assert.deepEqual(result.bytes, image);
  wrapped.writeUInt32LE(image.length + 1, 8);
  assert.throws(() => extractPicture(wrapped), /length mismatch/);
  assert.equal(extractPicture(Buffer.from('random BM bytes')).format, 'bin');
});

const hasOriginal = existsSync(path.join(root, 'original/SchiebPl.exe'));
test('supplied source forms and reference PE resources parse exhaustively without silent omissions', { skip: !hasOriginal }, async () => {
  const expectedSourceCounts = { Schieber: 37, Differ: 36, Panel: 4 };
  let bitmapCount = 0, textForms = 0;
  for (const [directory, expected] of Object.entries(expectedSourceCounts)) {
    const files = (await readdir(path.join(root, 'original', directory))).filter(name => /\.dfm$/i.test(name));
    assert.equal(files.length, expected);
    for (const name of files) {
      const parsed = parseDfm(await readFile(path.join(root, 'original', directory, name)));
      if (parsed.encoding === 'text-dfm') textForms++;
      for (const component of parsed.components) for (const value of Object.values(component.properties)) if (value?.binary) {
        const picture = extractPicture(value.binary.bytes);
        if (picture.format === 'bmp') { decodeBmp(picture.bytes); bitmapCount++; }
        else if (picture.format === 'ico') assert.equal(decodeIco(picture.bytes)[0].width, 32);
        else assert.fail(`Unrecognized binary image property in ${directory}/${name}`);
      }
    }
  }
  assert.equal(textForms, 3); assert.equal(bitmapCount, 95);
  for (const [name, forms, digest] of [
    ['SchiebPl.exe', 32, 'e459420bece30466a47b5a5016c4b978cb79b5cbd3b624c05f50b94c51722ec9'],
    ['DiffPl.exe', 32, '73efe1af9e869edabbcc2616c58ae949c1ce15b6b1cfcb110f9605fdffcb03e1'],
    ['PanelPl.exe', 3, '3aee937c6d9518fc0243506a61f4301f7bc18df7a0bb9e06b558710d2f2e6127'],
  ]) {
    const bytes = await readFile(path.join(root, 'original', name));
    assert.equal(sha256(bytes), digest, 'Reference identity unexpectedly changed');
    const pe = parsePeResources(bytes), streams = pe.resources.filter(r => r.type === 10 && bytes.toString('ascii', r.offset, r.offset + 4) === 'TPF0');
    assert.equal(streams.length, forms);
    for (const r of streams) parseDfm(bytes.subarray(r.offset, r.offset + r.bytes));
    assert.throws(() => parsePeResources(bytes.subarray(0, 512)), /Truncated|range|Unmapped/);
  }
});

test('generated manifest has unique trace identities and recoverable source payloads', { skip: !existsSync(path.join(root, 'artifacts/m1/manifest.json')) }, async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'artifacts/m1/manifest.json'), 'utf8'));
  assert.equal(new Set(manifest.assets.map(a => a.id)).size, manifest.assets.length);
  const files = new Map();
  for (const source of manifest.sourceFiles) {
    const bytes = await readFile(path.join(root, source.file)); assert.equal(sha256(bytes), source.sha256); files.set(source.file, bytes);
  }
  for (const asset of manifest.assets) {
    const raw = await readFile(path.join(root, 'artifacts/m1', asset.rawPath));
    assert.equal(sha256(raw), asset.payloadSha256);
    if (!asset.conversion && asset.source.offset !== null) {
      const bytes = files.get(asset.source.file).subarray(asset.source.offset, asset.source.offset + asset.payloadBytes);
      assert.equal(sha256(bytes), asset.payloadSha256, asset.id);
    }
    assert.ok(existsSync(path.join(root, 'artifacts/m1', asset.previewPath)));
  }
});
