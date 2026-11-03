import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
const compiler=process.env.PAS2JS || 'artifacts/toolchain/pas2js/pas2js-win64-x86_64-3.2.0/bin/pas2js.exe';
if(!existsSync(compiler)) throw new Error('Set PAS2JS to the pas2js 3.2.0 executable. See docs/ai-port.md.');
for(const [exe,args] of [
  ['python',['scripts/prepare-pascal-ai.py']],['python',['scripts/prepare-differ-ai.py']],
  ...['schieber','differ'].map(game=>[compiler,['-Mdelphi','-O-','-Jc','-Jirtl.js',`artifacts/pascal-ai/${game}/ai.pas`]]),
  [process.execPath,['scripts/package-pascal-ai.mjs']],
]) {
  const result=spawnSync(exe,args,{stdio:'inherit',windowsHide:true});
  if(result.error) throw result.error;
  if(result.status!==0) process.exit(result.status||1);
}
