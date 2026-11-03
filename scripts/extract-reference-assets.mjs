/** M1: lossless structural recovery. Original files are only ever read. */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { sha256, parseDfm, parsePeResources, extractPicture, decodeBmp, decodeIco, dibToBmp } from './lib/delphi.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const original = path.join(root, 'original');
const output = path.join(root, 'artifacts/m1');
const manifest = {
  schemaVersion: 1,
  scope: 'All non-backup source DFM forms, loose BMP/BM/ICO files, and all six supplied executable resource trees. Source/alternate assets are not assumed to be shipped in the selected reference build.',
  sourceFiles: [], forms: [], executables: [], assets: [], comparisons: [],
  limitations: [
    'Static extraction does not establish runtime use of an asset.',
    'PNG previews preserve decoded pixels; original palette/metadata and VCL property bytes remain available in raw files.',
    'Byte differences do not necessarily establish visible differences.',
    'Text DFM property locations use character offsets; binary DFM locations use byte offsets.',
    'Non-image PE resource payloads are inventoried by location/hash, not rendered.',
  ],
};
const relative = value => path.relative(root, value).split(path.sep).join('/');
const projectFor = file => /(?:SchiebPl|Schieber)/i.test(file) ? 'Schieber' : /(?:DiffPl|Differ)/i.test(file) ? 'Differ' : 'Panel';
const sourceCache = new Map(), rawWritten = new Set(), previewWritten = new Set();
await mkdir(path.join(output, 'raw'), { recursive: true });
await mkdir(path.join(output, 'previews'), { recursive: true });

async function walk(directory) {
  const result = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    if (entry.isDirectory()) result.push(...await walk(path.join(directory, entry.name)));
    else if (entry.isFile()) result.push(path.join(directory, entry.name));
  }
  return result;
}
async function source(file) {
  if (!sourceCache.has(file)) {
    const bytes = await readFile(file), metadata = { file: relative(file), bytes: bytes.length, sha256: sha256(bytes) };
    sourceCache.set(file, { bytes, metadata }); manifest.sourceFiles.push(metadata);
  }
  return sourceCache.get(file);
}
async function raw(bytes, extension) {
  const file = `raw/${sha256(bytes)}.${extension}`;
  if (!rawWritten.has(file)) { await writeFile(path.join(output, file), bytes); rawWritten.add(file); }
  return file;
}
async function preview(decoded, digest, index = 0) {
  const file = `previews/${digest}${index ? `-${index}` : ''}.png`;
  if (!previewWritten.has(file)) {
    if (decoded.png) await writeFile(path.join(output, file), decoded.png);
    else await sharp(decoded.rgba, { raw: { width: decoded.width, height: decoded.height, channels: 4 } }).png().toFile(path.join(output, file));
    previewWritten.add(file);
  }
  return file;
}
async function asset(bytes, format, metadata) {
  const payloadSha256 = sha256(bytes);
  const result = { id: `asset-${sha256(Buffer.from(JSON.stringify(metadata.source))).slice(0, 20)}`, ...metadata, format, payloadBytes: bytes.length, payloadSha256, rawPath: await raw(bytes, format) };
  if (format === 'bmp') {
    const decoded = decodeBmp(bytes);
    result.dimensions = { width: decoded.width, height: decoded.height };
    result.bitmap = { bits: decoded.bits, compression: decoded.compression, paletteEntries: decoded.paletteEntries };
    result.decodedPixelSha256 = sha256(decoded.rgba);
    result.previewPath = await preview(decoded, payloadSha256);
  } else if (format === 'ico') {
    result.iconImages = [];
    for (const decoded of decodeIco(bytes)) result.iconImages.push({ index: decoded.index, width: decoded.width, height: decoded.height, previewPath: await preview(decoded, payloadSha256, decoded.index) });
    result.previewPath = result.iconImages[0].previewPath;
    result.dimensions = { width: result.iconImages[0].width, height: result.iconImages[0].height };
  }
  manifest.assets.push(result); return result;
}
function summarize(value) {
  if (value?.binary) return { binary: { offset: value.binary.offset, textCharacterOffset: value.binary.textCharacterOffset, bytes: value.binary.bytes.length, sha256: sha256(value.binary.bytes) } };
  if (Array.isArray(value)) return value.map(summarize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, summarize(v)]));
  return value;
}
async function form(bytes, metadata, baseOffset = 0) {
  const parsed = parseDfm(bytes), formClass = parsed.components[0].className.toUpperCase();
  const formRecord = {
    id: `${metadata.source.file}#${formClass}${metadata.source.resource ? `/${metadata.source.resource.language}` : ''}`,
    ...metadata, formClass, streamSha256: sha256(bytes.subarray(parsed.signatureOffset ?? 0)),
    encoding: parsed.encoding, signatureOffset: parsed.signatureOffset,
    components: parsed.components.map(component => ({ ...component, properties: summarize(component.properties) })),
    assetIds: [],
  };
  for (const component of parsed.components) for (const [property, value] of Object.entries(component.properties)) {
    if (!value?.binary) continue;
    const picture = extractPicture(value.binary.bytes), control = {};
    for (const key of ['NumGlyphs', 'Transparent', 'Stretch', 'Center', 'AutoSize', 'Proportional', 'Enabled', 'Visible', 'Layout', 'Margin', 'Spacing', 'Kind', 'ModalResult', 'Caption', 'OnClick', 'OnMouseDown', 'OnMouseUp', 'Left', 'Top', 'Width', 'Height'])
      if (Object.hasOwn(component.properties, key)) control[key] = component.properties[key];
    if (property === 'Glyph.Data' && !Object.hasOwn(control, 'NumGlyphs')) control.NumGlyphs = { value: 1, basis: 'VCL default; property not serialized' };
    const result = await asset(picture.bytes, picture.format, {
      origin: metadata.origin, buildRole: metadata.buildRole,
      source: { ...metadata.source, form: formClass, component: component.path, class: component.className, property,
        offset: value.binary.offset === null ? null : baseOffset + value.binary.offset + picture.offset,
        propertyOffset: value.binary.offset === null ? null : baseOffset + value.binary.offset,
        textCharacterOffset: value.binary.textCharacterOffset },
      propertySha256: sha256(value.binary.bytes), propertyRawPath: await raw(value.binary.bytes, 'vclbin'), control,
    });
    formRecord.assetIds.push(result.id);
  }
  manifest.forms.push(formRecord);
}

const files = await walk(original);
for (const file of files.filter(file => path.extname(file).toLowerCase() === '.dfm')) {
  const { bytes, metadata } = await source(file);
  await form(bytes, { origin: 'source-form', buildRole: 'source', source: { file: metadata.file, fileSha256: metadata.sha256, project: projectFor(metadata.file) } });
}
for (const file of files.filter(file => ['.bmp', '.bm', '.ico'].includes(path.extname(file).toLowerCase()))) {
  const { bytes, metadata } = await source(file);
  await asset(bytes, path.extname(file).toLowerCase() === '.ico' ? 'ico' : 'bmp', { origin: 'loose', buildRole: 'shared-archive', source: { file: metadata.file, fileSha256: metadata.sha256, project: /\/Bmp\/|\/Karten\//i.test(metadata.file) ? 'shared' : projectFor(metadata.file), offset: 0 } });
}
for (const file of files.filter(file => path.extname(file).toLowerCase() === '.exe')) {
  const { bytes, metadata } = await source(file), pe = parsePeResources(bytes);
  const buildRole = path.dirname(file) === original ? 'reference' : 'alternate', project = projectFor(metadata.file);
  const iconGroups = pe.resources.filter(r => r.type === 14).map(r => {
    const data = bytes.subarray(r.offset, r.offset + r.bytes);
    if (data.length < 6 || data.readUInt16LE(2) !== 1 || data.length !== 6 + data.readUInt16LE(4) * 14) throw new Error('Invalid RT_GROUP_ICON');
    const images = [];
    for (let i = 0; i < data.readUInt16LE(4); i++) {
      const p = 6 + i * 14, imageId = data.readUInt16LE(p + 12);
      images.push({ imageId, width: data[p] || 256, height: data[p + 1] || 256, declaredBytes: data.readUInt32LE(p + 8), candidateResources: pe.resources.filter(x => x.type === 3 && x.name === imageId).map(x => ({ language: x.language, offset: x.offset, sha256: x.sha256 })) });
    }
    return { name: r.name, language: r.language, images };
  });
  manifest.executables.push({ ...metadata, project, buildRole, machine: pe.machine, format: pe.magic === 0x10b ? 'pe32' : 'pe32+', resourceDirectory: { rva: pe.resourceRva, bytes: pe.resourceSize, offset: pe.directoryOffset }, resources: pe.resources, iconGroups });
  for (const resource of pe.resources) {
    const payload = bytes.subarray(resource.offset, resource.offset + resource.bytes);
    const sourceInfo = { file: metadata.file, fileSha256: metadata.sha256, project, offset: resource.offset, resource: { type: resource.type, name: resource.name, language: resource.language, payloadSha256: resource.sha256 } };
    if (resource.type === 10 && payload.toString('ascii', 0, 4) === 'TPF0') {
      await form(payload, { origin: 'executable-form', buildRole, source: sourceInfo }, resource.offset);
    } else if (resource.type === 2) {
      const bitmap = dibToBmp(payload);
      await asset(bitmap, 'bmp', { origin: 'pe-resource', buildRole, source: sourceInfo, rawResourcePath: await raw(payload, 'dib'), conversion: '14-byte BMP file header prepended to unchanged RT_BITMAP DIB' });
    } else if (resource.type === 3) {
      // Preserve RT_ICON DIB and wrap in an ICO directory for a standalone preview.
      checkIconDib(payload);
      const ico = Buffer.alloc(22);
      ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
      ico[6] = payload.readInt32LE(4) % 256; ico[7] = (Math.abs(payload.readInt32LE(8)) / 2) % 256;
      ico.writeUInt16LE(payload.readUInt16LE(12), 10); ico.writeUInt16LE(payload.readUInt16LE(14), 12);
      ico.writeUInt32LE(payload.length, 14); ico.writeUInt32LE(22, 18);
      await asset(Buffer.concat([ico, payload]), 'ico', { origin: 'pe-resource', buildRole, source: sourceInfo, rawResourcePath: await raw(payload, 'icon-dib'), conversion: 'Single-image ICO directory prepended to unchanged RT_ICON DIB' });
    }
  }
}
function checkIconDib(bytes) { if (bytes.length < 40 || bytes.readUInt32LE(0) !== 40) throw new Error('Unsupported RT_ICON DIB'); }

// Compare resource identity, not merely similarly named files or object strings.
for (const reference of manifest.executables.filter(exe => exe.buildRole === 'reference')) {
  const alternate = manifest.executables.find(exe => exe.project === reference.project && exe.buildRole === 'alternate');
  const key = r => JSON.stringify([r.type, r.name, r.language]);
  const left = new Map(reference.resources.map(r => [key(r), r])), right = new Map(alternate.resources.map(r => [key(r), r]));
  const differences = [];
  for (const name of [...new Set([...left.keys(), ...right.keys()])].sort()) {
    const a = left.get(name), b = right.get(name);
    if (a?.sha256 !== b?.sha256) differences.push({ resource: JSON.parse(name), referenceSha256: a?.sha256 ?? null, alternateSha256: b?.sha256 ?? null });
  }
  manifest.comparisons.push({ kind: 'reference-versus-alternate-executable', reference: reference.file, alternate: alternate.file, executableBytesEqual: reference.sha256 === alternate.sha256, resourcesCompared: new Set([...left.keys(), ...right.keys()]).size, equalResources: [...left.keys()].filter(k => left.get(k).sha256 === right.get(k)?.sha256).length, differences });
  const referenceForms = manifest.forms.filter(f => f.source.file === reference.file);
  const sourceForms = manifest.forms.filter(f => f.origin === 'source-form' && f.source.project === reference.project);
  for (const rf of referenceForms) {
    const sf = sourceForms.find(f => f.formClass === rf.formClass);
    const assetKey = a => `${a.source.component}|${a.source.property}`;
    const ra = new Map(manifest.assets.filter(a => rf.assetIds.includes(a.id)).map(a => [assetKey(a), a]));
    const sa = new Map(manifest.assets.filter(a => sf?.assetIds.includes(a.id)).map(a => [assetKey(a), a]));
    const bitmapDifferences = [];
    for (const name of [...new Set([...ra.keys(), ...sa.keys()])].sort()) {
      const a = ra.get(name), b = sa.get(name);
      if (a?.payloadSha256 !== b?.payloadSha256) bitmapDifferences.push({ componentProperty: name, referenceAssetId: a?.id ?? null, sourceAssetId: b?.id ?? null, referenceSha256: a?.payloadSha256 ?? null, sourceSha256: b?.payloadSha256 ?? null, decodedPixelsEqual: a?.decodedPixelSha256 && b?.decodedPixelSha256 ? a.decodedPixelSha256 === b.decodedPixelSha256 : null });
    }
    const referenceComponents = new Map(rf.components.map(c => [c.path, c]));
    const sourceComponents = new Map((sf?.components ?? []).map(c => [c.path, c]));
    const propertyDifferences = [];
    const comparisonValue = value => value?.binary ? { binarySha256: value.binary.sha256 } : value;
    for (const component of [...new Set([...referenceComponents.keys(), ...sourceComponents.keys()])].sort()) {
      const a = referenceComponents.get(component), b = sourceComponents.get(component);
      if (!a || !b) { propertyDifferences.push({ component, kind: a ? 'reference-only-component' : 'source-only-component', className: (a ?? b).className }); continue; }
      if (a.className !== b.className) propertyDifferences.push({ component, property: '$class', reference: a.className, source: b.className });
      for (const property of [...new Set([...Object.keys(a.properties), ...Object.keys(b.properties)])].sort()) {
        const av = comparisonValue(a.properties[property]), bv = comparisonValue(b.properties[property]);
        if (JSON.stringify(av) !== JSON.stringify(bv)) propertyDifferences.push({ component, property, reference: av ?? null, source: bv ?? null });
      }
    }
    manifest.comparisons.push({ kind: 'reference-form-versus-source', reference: rf.id, source: sf?.id ?? null, streamBytesEqual: sf?.encoding === 'binary-dfm' ? rf.streamSha256 === sf.streamSha256 : null, sourceEncoding: sf?.encoding ?? null, bitmapDifferences, propertyDifferences });
  }
  manifest.comparisons.push({ kind: 'source-forms-absent-from-reference', reference: reference.file, sourceFiles: sourceForms.filter(sf => !referenceForms.some(rf => rf.formClass === sf.formClass)).map(sf => sf.source.file) });
}

const countBy = (values, key) => Object.fromEntries([...new Set(values.map(key))].sort().map(k => [k, values.filter(v => key(v) === k).length]));
manifest.coverage = {
  status: 'complete-within-declared-scope', sourceFiles: manifest.sourceFiles.length,
  sourceForms: manifest.forms.filter(f => f.origin === 'source-form').length,
  sourceFormEncodings: countBy(manifest.forms.filter(f => f.origin === 'source-form'), f => f.encoding),
  executableFiles: manifest.executables.length,
  executableForms: manifest.forms.filter(f => f.origin === 'executable-form').length,
  assets: manifest.assets.length, assetOrigins: countBy(manifest.assets, a => a.origin),
  imageFormats: countBy(manifest.assets, a => a.format),
  uniqueImagePayloads: new Set(manifest.assets.filter(a => a.previewPath).map(a => a.payloadSha256)).size,
  sourceBmpInstances: manifest.assets.filter(a => a.origin === 'source-form' && a.format === 'bmp').length,
  referenceBmpInstances: countBy(manifest.assets.filter(a => a.origin === 'executable-form' && a.buildRole === 'reference' && a.format === 'bmp'), a => a.source.project),
  errors: [],
};
if (manifest.coverage.sourceForms !== 77 || manifest.coverage.sourceBmpInstances !== 95 || manifest.executables.length !== 6) throw new Error(`Archive inventory unexpectedly changed: ${JSON.stringify(manifest.coverage)}`);
const imageAssets = manifest.assets.filter(a => a.previewPath);
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const cards = imageAssets.map(a => `<article data-search="${escape(`${a.origin} ${a.buildRole} ${a.source.file} ${a.source.form ?? ''} ${a.source.component ?? a.source.resource?.name ?? ''}`.toLowerCase())}"><a href="${a.previewPath}"><img loading="lazy" src="${a.previewPath}" alt="${escape(a.source.component ?? a.source.file)}"></a><h2>${escape(a.source.component ?? a.source.resource?.name ?? path.basename(a.source.file))}</h2><p>${escape(a.origin)} · ${escape(a.buildRole)} · ${a.dimensions.width} × ${a.dimensions.height}</p><p>${escape(a.source.file)}<br>${escape(a.source.form ?? '')} ${escape(a.source.property ?? '')}</p><p><a href="${a.rawPath}">Original payload</a> · <a href="${a.previewPath}">PNG preview</a></p><code>${a.payloadSha256}</code></article>`).join('\n');
await writeFile(path.join(output, 'gallery.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M1 original artwork reference</title><style>body{font:14px system-ui;margin:24px;background:#eee;color:#222}header{position:sticky;top:0;background:#eee;padding:12px 0;z-index:1}input{padding:10px;width:min(90%,640px)}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}article{background:white;padding:14px;overflow-wrap:anywhere}img{max-width:100%;height:200px;object-fit:contain;background:repeating-conic-gradient(#ddd 0 25%,#fff 0 50%) 0/16px 16px}h2{font-size:16px}code{font-size:10px}article[hidden]{display:none}</style><header><h1>M1: recovered original artwork</h1><p>${imageAssets.length} image instances. No enhancement or resizing. Source, reference build and alternate builds are separate.</p><p><a href="manifest.json">Complete manifest</a> · <a href="mappings-gallery.html">Sprite/mask mappings (after maps generation)</a></p><input id="search" type="search" placeholder="Filter by game, component, origin or build role" aria-label="Filter assets"><span id="count"></span></header><main>${cards}</main><script>const input=document.querySelector('input'),cards=[...document.querySelectorAll('article')];input.addEventListener('input',()=>{let n=0;for(const c of cards){c.hidden=!c.dataset.search.includes(input.value.toLowerCase());if(!c.hidden)n++}document.querySelector('#count').textContent=' '+n+' images'});</script></html>\n`);
await writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest.coverage, null, 2));
console.log(`Gallery: ${relative(path.join(output, 'gallery.html'))}`);
