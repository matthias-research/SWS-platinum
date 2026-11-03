import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await mkdir('src/ai/generated', { recursive: true });
await mkdir('public/assets/ai', { recursive: true });
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = { compiler: 'pas2js 3.2.0', rebuild: 'npm run ai:build', modules: {}, tables: {} };
for (const game of ['schieber', 'differ']) {
  const compiled = await readFile(`artifacts/pascal-ai/${game}/ai.js`, 'utf8');
  await writeFile(`src/ai/generated/${game}.js`, '// Generated from the original Pascal with pas2js 3.2.0. See docs/ai-port.md.\nexport function createPascalRuntime() {\n' + compiled + '\nrtl.run(); return { pas, rtl };\n}\n');
  manifest.modules[game] = { path: `src/ai/generated/${game}.js`, sha256: sha256(await readFile(`src/ai/generated/${game}.js`)) };
}
for (const file of ['RUGD7000.DAT', 'RGDIFF.DAT', 'Hcall.dat', 'HPLAY.DAT', 'TRASHY.DAT']) {
  await copyFile(`original/Daten/${file}`, `public/assets/ai/${file}`);
  const bytes = await readFile(`public/assets/ai/${file}`);
  manifest.tables[file] = { source: `original/Daten/${file}`, bytes: bytes.length, sha256: sha256(bytes) };
}
await writeFile('public/assets/ai/manifest.json', JSON.stringify(manifest, null, 2) + '\n');
