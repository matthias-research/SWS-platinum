// Normalize an AI-generated restoration to the atlas contract; this step itself
// does not invent detail. Image enhancement happens before this packaging step.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/prepare-enhanced.mjs <generated-image.png>');
const output = fileURLToPath(new URL('../public/assets/table-enhanced-2x.png', import.meta.url));
const metadata = await sharp(input).metadata();
if (Math.abs(metadata.width / metadata.height - 4 / 3) > 0.001) throw new Error('Expected a 4:3 image; refusing to distort the reference geometry');
await sharp(input).resize(2048, 1536).png().toFile(output);
console.log(`Packaged ${metadata.width} × ${metadata.height} enhancement as 2048 × 1536: ${output}`);
