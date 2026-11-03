import { createHash } from 'node:crypto';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const decoder = new TextDecoder('windows-1252');
function check(condition, message) { if (!condition) throw new Error(message); }

class Reader {
  constructor(bytes, position = 0) { this.bytes = bytes; this.position = position; }
  take(length) {
    check(Number.isSafeInteger(length) && length >= 0 && this.position + length <= this.bytes.length, `Truncated stream at ${this.position}, requested ${length}`);
    const value = this.bytes.subarray(this.position, this.position + length); this.position += length; return value;
  }
  u8() { return this.take(1).readUInt8(); }
  u32() { return this.take(4).readUInt32LE(); }
  string() { return decoder.decode(this.take(this.u8())); }
  peek() { check(this.position < this.bytes.length, 'Missing stream terminator'); return this.bytes[this.position]; }
}

function binaryValue(reader) {
  const kind = reader.u8();
  switch (kind) {
    case 0: case 13: return null;
    case 1: {
      const result = []; while (reader.peek() !== 0) result.push(binaryValue(reader)); reader.u8(); return result;
    }
    case 2: return reader.take(1).readInt8();
    case 3: return reader.take(2).readInt16LE();
    case 4: return reader.take(4).readInt32LE();
    case 5: return { extended80Hex: reader.take(10).toString('hex') };
    case 6: case 7: return reader.string();
    case 8: return false;
    case 9: return true;
    case 10: {
      const length = reader.u32(), offset = reader.position;
      return { binary: { offset, bytes: reader.take(length) } };
    }
    case 11: {
      const result = []; while (reader.peek() !== 0) result.push(reader.string()); reader.u8(); return result;
    }
    case 12: return decoder.decode(reader.take(reader.u32()));
    case 14: {
      const result = [];
      while (reader.peek() !== 0) {
        check(reader.u8() === 1, 'Invalid collection item'); result.push(binaryProperties(reader));
      }
      reader.u8(); return result;
    }
    case 15: return reader.take(4).readFloatLE();
    case 16: return { currencyScaled10000: reader.take(8).readBigInt64LE().toString() };
    case 17: return { delphiDate: reader.take(8).readDoubleLE() };
    case 18: return reader.take(reader.u32() * 2).toString('utf16le');
    case 19: return { int64: reader.take(8).readBigInt64LE().toString() };
    case 20: return reader.take(reader.u32()).toString('utf8');
    default: throw new Error(`Unsupported Delphi value type ${kind} at ${reader.position - 1}`);
  }
}

function binaryProperties(reader) {
  const properties = {};
  while (true) {
    const name = reader.string(); if (!name) return properties;
    check(!Object.hasOwn(properties, name), `Duplicate property ${name}`);
    properties[name] = binaryValue(reader);
  }
}

export function parseBinaryDfm(bytes) {
  const signature = bytes.indexOf(Buffer.from('TPF0'));
  check(signature >= 0 && signature <= 1024, 'Missing Delphi TPF0 signature');
  const reader = new Reader(bytes, signature + 4), components = [];
  function object(parent = '', depth = 0, siblingIndex = 0) {
    check(depth < 128, 'Delphi object nesting exceeds 128');
    let flags = 0, childPosition = null;
    if ((reader.peek() & 0xf0) === 0xf0) {
      flags = reader.u8() & 0xf;
      if (flags & 2) childPosition = binaryValue(reader);
    }
    const className = reader.string(), name = reader.string();
    check(className, 'Missing Delphi object class');
    const pathName = name || `$${className}[${siblingIndex}]`;
    const component = { path: parent ? `${parent}.${pathName}` : pathName, name, className, anonymous: !name, flags, childPosition, properties: binaryProperties(reader) };
    components.push(component);
    let childIndex = 0;
    while (reader.peek() !== 0) object(component.path, depth + 1, childIndex++);
    reader.u8();
  }
  object();
  check(reader.position === bytes.length, `${bytes.length - reader.position} trailing Delphi stream bytes`);
  return { encoding: 'binary-dfm', signatureOffset: signature, consumedBytes: reader.position, components };
}

// Text forms use the same typed component structure as binary streams.
export function parseTextDfm(bytes) {
  const text = decoder.decode(bytes), tokens = [];
  const re = /\s+|\{[\s\S]*?\}|'(?:''|[^'])*'|#(?:\$[0-9a-f]+|\d+)|\$[0-9a-f]+|[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?|[a-z_]\w*(?:\.\w+)*|[=:<>()[\],+]/igy;
  let position = 0;
  while (position < text.length) {
    re.lastIndex = position; const match = re.exec(text);
    check(match && match.index === position, `Unsupported text DFM syntax at ${position}: ${text.slice(position, position + 40)}`);
    if (!/^\s+$/.test(match[0])) tokens.push({ value: match[0], offset: position });
    position = re.lastIndex;
  }
  let cursor = 0;
  const peek = () => tokens[cursor]?.value;
  const take = expected => { const token = tokens[cursor++]; check(token && (!expected || token.value.toLowerCase() === expected), `Expected ${expected ?? 'token'} at token ${cursor}`); return token; };
  function value() {
    const token = take(), raw = token.value;
    if (raw.startsWith('{')) {
      const hex = raw.slice(1, -1).replace(/\s/g, ''); check(/^(?:[a-f\d]{2})*$/i.test(hex), 'Malformed text DFM binary hex');
      return { binary: { offset: null, textCharacterOffset: token.offset, bytes: Buffer.from(hex, 'hex') } };
    }
    if (raw.startsWith("'") || raw.startsWith('#')) {
      const decode = s => s.startsWith("'") ? s.slice(1, -1).replaceAll("''", "'") : String.fromCodePoint(s[1] === '$' ? parseInt(s.slice(2), 16) : Number(s.slice(1)));
      let result = decode(raw), allowQuotedSuffix = raw.startsWith('#');
      while ((allowQuotedSuffix && peek()?.startsWith("'")) || peek()?.startsWith('#') || peek() === '+') {
        if (peek() === '+') take('+');
        const part = take().value;
        check(part.startsWith("'") || part.startsWith('#'), 'Expected string continuation');
        result += decode(part); allowQuotedSuffix = part.startsWith('#');
      }
      return result;
    }
    if (raw === '[' || raw === '(') {
      const close = raw === '[' ? ']' : ')', result = [];
      while (peek() !== close) { if (peek() === ',') take(','); else result.push(value()); }
      take(close); return result;
    }
    if (raw === '<') {
      const result = [];
      while (peek() !== '>') {
        take('item'); const props = {};
        while (peek()?.toLowerCase() !== 'end') { const key = take().value; take('='); props[key] = value(); }
        take('end'); result.push(props);
      }
      take('>'); return result;
    }
    if (/^[-+]?\d/.test(raw)) return Number(raw);
    if (raw.startsWith('$')) return parseInt(raw.slice(1), 16);
    if (/^(true|false)$/i.test(raw)) return raw.toLowerCase() === 'true';
    if (/^nil$/i.test(raw)) return null;
    return raw;
  }
  const components = [];
  function object(parent = '') {
    const kind = take().value.toLowerCase(); check(['object', 'inherited', 'inline'].includes(kind), `Invalid object kind ${kind}`);
    const name = take().value; take(':'); const className = take().value;
    const component = { path: parent ? `${parent}.${name}` : name, name, className, kind, properties: {} };
    components.push(component);
    while (peek()?.toLowerCase() !== 'end') {
      if (['object', 'inherited', 'inline'].includes(peek()?.toLowerCase())) object(component.path);
      else { const key = take().value; take('='); component.properties[key] = value(); }
    }
    take('end');
  }
  object(); check(cursor === tokens.length, 'Trailing text DFM tokens');
  return { encoding: 'text-dfm', signatureOffset: null, consumedBytes: bytes.length, components };
}

export function parseDfm(bytes) {
  return bytes.subarray(0, 1028).includes(Buffer.from('TPF0')) ? parseBinaryDfm(bytes) : parseTextDfm(bytes);
}

export function parsePeResources(bytes) {
  check(bytes.length >= 64 && bytes.toString('ascii', 0, 2) === 'MZ', 'Not an MZ executable');
  const pe = bytes.readUInt32LE(60); check(pe + 24 < bytes.length && bytes.toString('ascii', pe, pe + 4) === 'PE\0\0', 'Invalid PE signature');
  const machine = bytes.readUInt16LE(pe + 4), sectionsCount = bytes.readUInt16LE(pe + 6), optionalSize = bytes.readUInt16LE(pe + 20), optional = pe + 24;
  check(optional + optionalSize <= bytes.length, 'Truncated optional header');
  const magic = bytes.readUInt16LE(optional), dataDir = optional + (magic === 0x10b ? 96 : magic === 0x20b ? 112 : -1);
  check([0x10b, 0x20b].includes(magic), 'Unsupported PE optional header');
  const sections = [];
  for (let i = 0; i < sectionsCount; i++) {
    const s = optional + optionalSize + i * 40; check(s + 40 <= bytes.length, 'Truncated PE section');
    sections.push({ name: bytes.toString('ascii', s, s + 8).replace(/\0.*$/, ''), virtualSize: bytes.readUInt32LE(s + 8), rva: bytes.readUInt32LE(s + 12), rawSize: bytes.readUInt32LE(s + 16), offset: bytes.readUInt32LE(s + 20) });
  }
  function mapRva(rva, length) {
    const candidates = sections.filter(s => rva >= s.rva && rva + length <= s.rva + s.rawSize);
    check(candidates.length === 1, `Unmapped/ambiguous PE RVA ${rva}`);
    const result = candidates[0].offset + rva - candidates[0].rva;
    check(result + length <= bytes.length, 'PE range exceeds file'); return result;
  }
  const resourceRva = bytes.readUInt32LE(dataDir + 16), resourceSize = bytes.readUInt32LE(dataDir + 20);
  if (!resourceRva || !resourceSize) return { machine, magic, resources: [], sections };
  const base = mapRva(resourceRva, 16), resources = [];
  let examinedEntries = 0;
  function relative(offset, length) { check(offset >= 0 && offset + length <= resourceSize, 'Resource structure exceeds directory size'); return mapRva(resourceRva + offset, length); }
  function identity(value) {
    if (!(value & 0x80000000)) return value;
    const relativeOffset = value & 0x7fffffff, p = relative(relativeOffset, 2), length = bytes.readUInt16LE(p);
    return bytes.toString('utf16le', relative(relativeOffset + 2, length * 2), p + 2 + length * 2);
  }
  function walk(offset, ids = [], ancestors = new Set()) {
    check(ids.length <= 3 && !ancestors.has(offset), 'Invalid/cyclic PE resource tree');
    const current = relative(offset, 16), count = bytes.readUInt16LE(current + 12) + bytes.readUInt16LE(current + 14);
    relative(offset + 16, count * 8);
    const nextAncestors = new Set([...ancestors, offset]);
    for (let i = 0; i < count; i++) {
      check(++examinedEntries <= 16384, 'Resource entry limit exceeded');
      const entry = current + 16 + i * 8, name = identity(bytes.readUInt32LE(entry)), address = bytes.readUInt32LE(entry + 4), path = [...ids, name];
      if (address & 0x80000000) walk(address & 0x7fffffff, path, nextAncestors);
      else {
        check(path.length === 3, 'Expected resource type/name/language');
        const dataEntry = relative(address, 16), rva = bytes.readUInt32LE(dataEntry), length = bytes.readUInt32LE(dataEntry + 4), payloadOffset = mapRva(rva, length);
        resources.push({ type: path[0], name: path[1], language: path[2], offset: payloadOffset, bytes: length, sha256: sha256(bytes.subarray(payloadOffset, payloadOffset + length)), codePage: bytes.readUInt32LE(dataEntry + 8) });
      }
    }
  }
  walk(0); return { machine, magic, resourceRva, resourceSize, directoryOffset: base, examinedEntries, resources, sections };
}

export function dibToBmp(dib) {
  check(dib.length >= 40 && dib.readUInt32LE(0) === 40, 'Unsupported DIB header');
  const bits = dib.readUInt16LE(14), compression = dib.readUInt32LE(16), colors = dib.readUInt32LE(32) || (bits <= 8 ? 2 ** bits : 0);
  const header = Buffer.alloc(14); header.write('BM'); header.writeUInt32LE(dib.length + 14, 2);
  header.writeUInt32LE(14 + 40 + (compression === 3 ? 12 : 0) + colors * 4, 10);
  return Buffer.concat([header, dib]);
}

export function decodeBmp(bytes, { icon = false } = {}) {
  check(bytes.length >= 54 && bytes.toString('ascii', 0, 2) === 'BM', 'Invalid BMP header');
  check(bytes.readUInt32LE(14) === 40, 'Only BITMAPINFOHEADER is supported');
  const width = bytes.readInt32LE(18), signedHeight = bytes.readInt32LE(22), height = Math.abs(signedHeight) / (icon ? 2 : 1);
  const bits = bytes.readUInt16LE(28), compression = bytes.readUInt32LE(30), pixelOffset = bytes.readUInt32LE(10);
  check(bytes.readUInt16LE(26) === 1 && width > 0 && height > 0 && Number.isInteger(height) && width * height <= 30_000_000, 'Invalid BMP dimensions/planes');
  check([1, 4, 8, 16, 24, 32].includes(bits) && [0, 3].includes(compression), `Unsupported BMP ${bits}-bit compression ${compression}`);
  check(compression !== 3 || [16, 32].includes(bits), 'Invalid bitfield compression');
  const stride = Math.ceil(width * bits / 32) * 4, xorBytes = stride * height;
  check(pixelOffset + xorBytes <= bytes.length, 'Truncated BMP pixels');
  const colors = bytes.readUInt32LE(46) || (bits <= 8 ? 2 ** bits : 0), paletteOffset = 54 + (compression === 3 ? 12 : 0);
  if (bits <= 8) check(paletteOffset + colors * 4 <= pixelOffset, 'Truncated BMP palette');
  const masks = compression === 3 ? [bytes.readUInt32LE(54), bytes.readUInt32LE(58), bytes.readUInt32LE(62)] : [0x7c00, 0x03e0, 0x001f];
  const channel = (value, mask) => { let shift = 0; while (shift < 32 && !((mask >>> shift) & 1)) shift++; const maximum = mask >>> shift; return maximum ? Math.round(((value & mask) >>> shift) / maximum * 255) : 0; };
  const rgba = Buffer.alloc(width * height * 4), andStride = Math.ceil(width / 32) * 4, andOffset = pixelOffset + xorBytes;
  if (icon) check(andOffset + andStride * height <= bytes.length, 'Truncated icon AND mask');
  let nonzeroAlpha = false;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const sourceY = signedHeight < 0 ? y : height - 1 - y, row = pixelOffset + sourceY * stride, out = (y * width + x) * 4;
    let red, green, blue, alpha = 255;
    if (bits <= 8) {
      const value = bytes[row + Math.floor(x * bits / 8)], index = bits === 8 ? value : bits === 4 ? (value >>> (x % 2 ? 0 : 4)) & 15 : (value >>> (7 - x % 8)) & 1;
      check(index < colors, 'BMP palette index out of range');
      const p = paletteOffset + index * 4; blue = bytes[p]; green = bytes[p + 1]; red = bytes[p + 2];
    } else if (bits === 16 || compression === 3) {
      const p = row + x * bits / 8, value = bits === 16 ? bytes.readUInt16LE(p) : bytes.readUInt32LE(p);
      [red, green, blue] = masks.map(mask => channel(value, mask));
    } else {
      const p = row + x * bits / 8; blue = bytes[p]; green = bytes[p + 1]; red = bytes[p + 2];
      if (icon && bits === 32) { alpha = bytes[p + 3]; if (alpha) nonzeroAlpha = true; }
    }
    if (icon && (bytes[andOffset + sourceY * andStride + Math.floor(x / 8)] & (128 >>> (x % 8)))) alpha = 0;
    rgba.set([red, green, blue, alpha], out);
  }
  if (icon && bits === 32 && !nonzeroAlpha) {
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) rgba[(y * width + x) * 4 + 3] = bytes[andOffset + (height - 1 - y) * andStride + Math.floor(x / 8)] & (128 >>> (x % 8)) ? 0 : 255;
  }
  return { width, height, rgba, bits, compression, paletteEntries: colors };
}

export function decodeIco(bytes) {
  check(bytes.length >= 6 && bytes.readUInt16LE(0) === 0 && bytes.readUInt16LE(2) === 1, 'Invalid ICO');
  const count = bytes.readUInt16LE(4), images = []; check(count > 0 && count <= 256 && 6 + count * 16 <= bytes.length, 'Invalid icon count');
  for (let index = 0; index < count; index++) {
    const e = 6 + index * 16, length = bytes.readUInt32LE(e + 8), offset = bytes.readUInt32LE(e + 12);
    check(offset + length <= bytes.length, 'Truncated ICO image');
    const dib = bytes.subarray(offset, offset + length);
    if (dib.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) images.push({ index, png: dib, width: bytes[e] || 256, height: bytes[e + 1] || 256 });
    else images.push({ index, ...decodeBmp(dibToBmp(dib), { icon: true }) });
  }
  return images;
}

export function extractPicture(bytes) {
  // Known VCL serializations: BMP directly, uint32 size + BMP, or
  // short-string TBitmap + uint32 size + BMP. Never scan arbitrary pixel data.
  for (const offset of [0, 4, 12]) {
    if (bytes.length < offset + 54 || bytes.toString('ascii', offset, offset + 2) !== 'BM') continue;
    if (offset === 12) check(bytes[0] === 7 && bytes.toString('ascii', 1, 8) === 'TBitmap', 'Invalid TBitmap prefix');
    const length = bytes.readUInt32LE(offset + 2);
    check(length >= 54 && offset + length === bytes.length, 'Bitmap payload length mismatch');
    if (offset) check(bytes.readUInt32LE(offset - 4) === length, 'VCL bitmap length mismatch');
    return { format: 'bmp', offset, bytes: bytes.subarray(offset) };
  }
  if (bytes.length >= 6 && bytes.readUInt16LE(0) === 0 && bytes.readUInt16LE(2) === 1) return { format: 'ico', offset: 0, bytes };
  return { format: 'bin', offset: 0, bytes };
}
