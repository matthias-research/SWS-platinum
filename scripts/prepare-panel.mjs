import {readFile,mkdir,copyFile,writeFile} from 'node:fs/promises';
const manifest=JSON.parse(await readFile('artifacts/m1/manifest.json','utf8'));
const names=['ImgBack','ImgSchieber','ImgSchieberOver','ImgSchieberPressed','ImgDiffer','ImgDifferOver','ImgDifferPressed'];
await mkdir('public/assets/panel',{recursive:true});
const assets=[];
for(const name of names){
  const asset=manifest.assets.find(a=>a.source.file==='original/PanelPl.exe'&&a.source.component===`bmpForm.${name}`);
  if(!asset?.previewPath)throw new Error(`Missing Panel graphic ${name}; run reference:extract first`);
  await copyFile(`artifacts/m1/${asset.previewPath}`,`public/assets/panel/${name}.png`);
  assets.push({file:`${name}.png`,...asset.dimensions,source:asset.source,sha256:asset.payloadSha256});
}
await writeFile('public/assets/panel/manifest.json',JSON.stringify({assetScale:1,assets},null,2)+'\n');
console.log(`Extracted ${assets.length} original Panel graphics`);
