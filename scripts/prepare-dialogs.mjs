import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import sharp from 'sharp';
const source = JSON.parse(await readFile('artifacts/m1/manifest.json','utf8'));
const out='public/assets/dialogs'; await mkdir(`${out}/images`,{recursive:true});
const manifest={version:1,forms:{schieber:{},differ:{}},images:{},loose:{},glyphs:{},sources:[]};
const copied=new Set();
for(const asset of source.assets) {
  if(asset.source.project==='Panel' || !asset.previewPath || !asset.dimensions) continue;
  const id=asset.payloadSha256;
  if(!copied.has(id)) { await copyFile(`artifacts/m1/${asset.previewPath}`,`${out}/images/${id}.png`);copied.add(id); }
  manifest.images[id]={file:`images/${id}.png`,...asset.dimensions};
  manifest.sources.push({id,source:asset.source,decodedPixelSha256:asset.decodedPixelSha256});
  if(asset.source.file.toLowerCase().startsWith('original/bmp/')) manifest.loose[asset.source.file.slice(13).toLowerCase()]=id;
  if(asset.buildRole==='reference'&&String(asset.source.resource?.name).startsWith('BB'))manifest.glyphs[asset.source.resource.name]=id;
}
for(const form of source.forms) {
  if(form.buildRole!=='reference'||!['Schieber','Differ'].includes(form.source.project))continue;
  const kind=form.source.project==='Schieber'?'schieber':'differ';
  manifest.forms[kind][form.formClass]={source:form.source,components:form.components.map(c=>{
    const images={};
    for(const a of source.assets.filter(a=>a.buildRole==='reference'&&a.source.file===form.source.file&&a.source.component===c.path)) images[a.source.property]=a.payloadSha256;
    const properties=Object.fromEntries(Object.entries(c.properties).filter(([,v])=>!v?.binary));
    return {...c,properties,images};
  })};
}
await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
await mkdir(`${out}/symbols`,{recursive:true});
const mappings=JSON.parse(await readFile('artifacts/m1/mappings.json','utf8'));
for(const set of mappings.cards.sets)for(const symbol of set.sheets.find(s=>s.sizeIndex===1&&s.orientation==='V').extraSymbols.filter(s=>s.kind==='log-trump'))await copyFile(`artifacts/m1/${symbol.previewPath}`,`${out}/symbols/${set.id}-${symbol.id}.png`);
manifest.glyphFiles={};
for(const id of new Set([...Object.values(manifest.glyphs),...Object.values(manifest.forms).flatMap(forms=>Object.values(forms).flatMap(f=>f.components.map(c=>c.images['Glyph.Data']).filter(Boolean)))])){
  const {data,info}=await sharp(`${out}/${manifest.images[id].file}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const key=(info.height-1)*info.width*4;
  for(let i=0;i<data.length;i+=4)if(data[i]===data[key]&&data[i+1]===data[key+1]&&data[i+2]===data[key+2])data[i+3]=0;
  const file=`images/${id}-glyph.png`;await sharp(data,{raw:info}).png().toFile(`${out}/${file}`);manifest.glyphFiles[id]=file;
}
await writeFile(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(`${Object.keys(manifest.forms.schieber).length+Object.keys(manifest.forms.differ).length} reference forms; ${copied.size} unique images packaged`);
