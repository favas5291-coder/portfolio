import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

// A real browser capture must be visually checked before calling this helper.
// It never contacts project sites, changes project copy or marks code as reviewed.
export async function updateProjectPreview({ root = process.cwd(), id, capture, capturedAt, previews }) {
  if (!/^[a-z0-9-]+$/.test(id) || !Object.hasOwn(previews, id)) throw new Error('Unknown project ID');
  const previous = previews[id];
  const date = new Date(capturedAt);
  if (!capturedAt || !Number.isFinite(date.getTime()) || date.getTime() > Date.now() + 60_000) throw new Error('Invalid capture date');
  if (date < new Date(previous.capturedAt)) throw new Error('Capture predates the current preview');
  const input = await readFile(capture);
  const image = sharp(input, { limitInputPixels: 20_000_000, failOn: 'warning' });
  const metadata = await image.metadata();
  const { width, height } = previous;
  if (!['jpeg', 'png', 'webp'].includes(metadata.format) || metadata.width < width || metadata.height < height || Math.abs(metadata.width / metadata.height - width / height) > 0.025) {
    throw new Error(`Use a desktop screenshot at least ${width} × ${height} with the same aspect ratio`);
  }
  const output = await image.resize(width, height, { fit: 'cover', position: 'top' }).webp({ quality: 85 }).toBuffer();
  const stats = await sharp(output).stats();
  if (stats.channels.every(channel => channel.stdev < 3)) throw new Error('Blank capture rejected');
  const hash = createHash('sha256').update(output).digest('hex').slice(0, 16);
  const screenshot = `/images/projects/${id}-${hash}.webp`;
  // Identical captures do not create a new date or trigger a deployment.
  if (previous.screenshot === screenshot) return { changed: false, screenshot };
  const target = resolve(root, `public${screenshot}`);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, output);
  const next = { ...previews, [id]: { ...previous, screenshot, capturedAt: date.toISOString() } };
  const manifest = resolve(root, 'src/data/project-previews.js');
  const temporary = `${manifest}.tmp`;
  await writeFile(temporary, `// Capture metadata is separate from the case study's source-code review date.\nexport const projectPreviews = ${JSON.stringify(next, null, 2)};\n`);
  await rename(temporary, manifest);
  return { changed: true, screenshot };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [id, capture, capturedAt] = process.argv.slice(2);
  if (!id || !capture || !capturedAt) throw new Error('Usage: npm run preview:update -- <project-id> <capture-file> <ISO-capture-date>');
  const { projectPreviews } = await import('../src/data/project-previews.js');
  console.log(JSON.stringify(await updateProjectPreview({ id, capture, capturedAt, previews: projectPreviews })));
}
