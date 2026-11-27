// Refresh the proof's unfused HTML image from the same source as the live site.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { projectPreviews } from '../../src/data/project-previews.js';
import { whatsappHref } from '../../src/data/site.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const output = resolve(root, 'docs/appointment/gate-1/media-proof');
const record = projectPreviews.gymdrobe;
await sharp(resolve(root, 'public', record.screenshot.slice(1))).resize({width: 192})
  .webp({quality: 85}).toFile(resolve(output, 'gymdrobe.webp'));
const inputs = ['shell', 'car', 'tree'].map(id => 'public/appointment/models/' + id + '.glb');
inputs.push('public/appointment/environment/after-rain.hdr','src/appointment/scene.js',
  'src/appointment/reflections.js', 'src/appointment/scene.config.ts','src/appointment/visit.js');
const hashes = {};
for (const path of inputs) {
  hashes[path] = createHash('sha256').update(await readFile(resolve(root, path))).digest('hex');
}
const source = { preview:record.screenshot, capturedAt:record.capturedAt, store:record.website,
  whatsapp:whatsappHref(), inputs:hashes };
await writeFile(resolve(output,'capture-source.js'),'window.motionSource = '+JSON.stringify(source,null,2)+';\n');
