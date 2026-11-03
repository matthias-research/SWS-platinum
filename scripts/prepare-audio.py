"""Convert original recordings to on-demand browser assets; never modify originals."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess, hashlib, json, shutil
root=Path(__file__).resolve().parents[1]
source=root/'original/SOUND'
target=root/'public/assets/audio'
ffmpeg=shutil.which('ffmpeg')
if not ffmpeg: raise SystemExit('ffmpeg is required on PATH')
files=sorted(source.rglob('*.WAV'))
def convert(path):
 relative=path.relative_to(source).with_suffix('.mp3')
 destination=target/relative
 destination.parent.mkdir(parents=True,exist_ok=True)
 if not destination.exists():
  subprocess.run([ffmpeg,'-v','error','-nostdin','-i',str(path),'-codec:a','libmp3lame','-q:a','5','-map_metadata','-1',str(destination)],check=True,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
 return {'file':relative.as_posix(),'source':path.relative_to(root).as_posix(),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'bytes':destination.stat().st_size,'sourceBytes':path.stat().st_size}
with ThreadPoolExecutor(max_workers=6) as pool:
 results=[]
 for i,result in enumerate(pool.map(convert,files)):
  results.append(result)
  if (i+1)%500==0:print(f'{i+1}/{len(files)} converted',flush=True)
target.mkdir(parents=True,exist_ok=True)
(target/'manifest.json').write_text(json.dumps({'encoding':'libmp3lame VBR quality 5; original sample rate and channels','files':results},indent=2)+'\n')
(target/'index.json').write_text(json.dumps([r['file'] for r in results])+'\n')
print(f'{len(results)} recordings: {sum(r["sourceBytes"] for r in results)} WAV bytes -> {sum(r["bytes"] for r in results)} MP3 bytes')
