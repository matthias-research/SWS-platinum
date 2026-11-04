# Enhanced graphics â€” manual review collection

417 image files mirror the paths and filenames under `public/assets/`, including seven Panel welcome-screen images. The application uses these files when Ansicht > Verbesserte Grafik is selected; Originalgrafik switches back.

415 files were enhanced with Real-ESRGAN x4plus, then downsampled to exactly twice their original width and height. The two existing `*-enhanced-2x.png` table images were copied unchanged because they are already enhanced. The separately enhanced `*-original.bmp` files are also present.

Transparency masks are enlarged by exact pixel replication, preserving cutout coverage. Sprite sheets retain their layout; multiply every original crop coordinate and dimension by two. Original JSON sprite mappings are intentionally not copied: they still describe the original pixels. `manifest.json` records every source, output, dimension, method and checksum.

You can edit or replace any image here. Preserve its filename, dimensions, sprite boundaries and transparency. Start with cards, lettering, faces and tiny symbols: neural restoration estimates detail and needs human review. Palette colour-key masks, if used by a future renderer, need separate review; these outputs preserve explicit alpha, not palette indices. Do not run a regeneration over your edits without a backup. Manifest output hashes describe the initial generated files and will change after manual edits.

Tool and model: https://github.com/xinntao/Real-ESRGAN (BSD-3-Clause). Processing tools and intermediate 4x images are in the ignored `artifacts/upscale-tools/` folder. Original assets remain unchanged.
