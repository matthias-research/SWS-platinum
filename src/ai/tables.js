// Typed Pascal records stored by Delphi are little-endian. Decode explicitly;
// browser objects have no native struct layout or pointer-addressable storage.
export function loadHackerTables(pas, callBytes, playBytes) {
  function reader(bytes, length) {
    if (bytes?.length !== length) throw new Error('Invalid Hacker table length');
    const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); let offset = 0;
    return { int: () => { const v = data.getInt32(offset, true); offset += 4; return v; },
      word: () => { const v = data.getUint16(offset, true); offset += 2; return v; },
      byte: () => data.getUint8(offset++), finish: () => { if (offset !== length) throw new Error('Hacker table layout mismatch'); } };
  }
  const fill = (array, get) => { for (let i = 0; i < array.length; i++) Array.isArray(array[i]) ? fill(array[i], get) : array[i] = get(); };
  const call = pas.Hjasser.$impl.gCallStat, c = reader(callBytes, 338332);
  call.version = c.int();
  if (call.version !== 655619) throw new Error('Unsupported Hacker call table version');
  for (const key of ['valT', 'expTri', 'expVal']) fill(call[key], c.int);
  for (const record of call.Call) { fill(record.valNT, c.int); fill(record.nonlinear, c.int); }
  fill(call.expTriM, c.int); c.finish();
  const play = pas.Hjasser.$impl.gPlayStat, p = reader(playBytes, 20484);
  play.version = p.int();
  if (play.version !== 655620) throw new Error('Unsupported Hacker play table version');
  for (const record of [...play.startnormal, play.startmisere]) { fill(record.perm, p.word); fill(record.dyn, p.byte); }
  fill(play.rejectmisere, p.word); p.finish();
}

export function loadTrashyTables(pas, bytes) {
  if (bytes?.length !== 184320) throw new Error('Invalid TRASHY.DAT length');
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength); let offset = 0;
  const table = pas.fdcBase.fdcData.$new();
  function fill(value) {
    if (Array.isArray(value)) for (const child of value) fill(child);
    else if ('v' in value) fill(value.v);
    else {
      value.played = data.getInt32(offset, true); value.evalue = data.getFloat32(offset + 4, true); offset += 8;
      if (!Number.isFinite(value.evalue)) throw new Error('Invalid Trashy estimate');
    }
  }
  fill(table.fCallTab); fill(table.fPlayTab);
  if (offset !== bytes.length) throw new Error('Trashy table layout mismatch');
  pas.fdcBase.gfdcData = table;
}
