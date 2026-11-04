import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import sharp from 'sharp';
import { parseDfm } from './lib/delphi.mjs';
const manifest = JSON.parse(await readFile('artifacts/m1/manifest.json', 'utf8'));
const find = component => manifest.assets.find(a => a.buildRole === 'reference' && a.source.file === 'original/SchiebPl.exe' && a.source.component === component);
const background = find('DlgNewJass.BackImage'), icons = find('iconForm.Icons');
if (!background || !icons) throw new Error('Run npm run reference:extract first');
const output = 'public/assets/setup';
await mkdir(output, { recursive: true });
await copyFile(`artifacts/m1/${background.previewPath}`, `${output}/schieber.png`);
const source = await readFile('original/Schieber/ICONS.PAS', 'latin1');
const rectangles = [...source.matchAll(/left:\s*(\d+);top:\s*(\d+);right:\s*(\d+);bottom:\s*(\d+)\);nr:\s*(\d+)/g)];
const exported = [];
for (const match of rectangles) {
  const [left, top, right, bottom, id] = match.slice(1).map(Number);
  if (![5006, ...Array.from({length:12},(_,i)=>7006+Math.floor(i/3)*1000+i%3), ...Array.from({length:20},(_,i)=>5200+i)].includes(id)) continue;
  await sharp(`artifacts/m1/${icons.previewPath}`).extract({left,top,width:right-left,height:bottom-top}).png().toFile(`${output}/${id}.png`);
  exported.push({id,rect:{left,top,right,bottom}});
}
const form = parseDfm(await readFile('original/Schieber/DLGNEW.dfm'));
await writeFile(`${output}/manifest.json`, JSON.stringify({background:{source:background.source,sha256:background.payloadSha256},icons:{source:icons.source,sha256:icons.payloadSha256,exported},controls:form.components.filter(c=>!c.properties['Picture.Data']).map(c=>({name:c.name,properties:c.properties})),assetScale:1},null,2)+'\n');
