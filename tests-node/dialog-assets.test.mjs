import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import sharp from 'sharp';
const base='public/assets/dialogs/',m=JSON.parse(await readFile(base+'manifest.json','utf8'));
test('every recovered dialog image is packaged at its original dimensions',async()=>{
  assert.equal(Object.values(m.forms).flatMap(Object.keys).length,64);
  assert.equal(Object.keys(m.images).length,218);
  for(const image of Object.values(m.images)){
    const meta=await sharp(base+image.file).metadata();assert.equal(meta.width,image.width);assert.equal(meta.height,image.height);
  }
  for(const forms of Object.values(m.forms))for(const form of Object.values(forms))for(const control of form.components)for(const id of Object.values(control.images))assert.ok(m.images[id],control.path);
  for(const file of Object.values(m.glyphFiles))await access(base+file);
});
test('hint arm transparency preserves the original binary masks',async()=>{
  for(const kind of ['schieber','differ']){
    const id=Object.values(m.forms[kind].THINTDLG.components.find(c=>c.name==='ArmM').images)[0];
    const {data,info}=await sharp(base+m.images[id].file).removeAlpha().raw().toBuffer({resolveWithObject:true});
    assert.equal(info.width,80);assert.equal(info.height,16);
    for(let i=0;i<data.length;i+=info.channels){assert.ok(data[i]===0||data[i]===255);assert.equal(data[i],data[i+1]);assert.equal(data[i],data[i+2]);}
  }
});
