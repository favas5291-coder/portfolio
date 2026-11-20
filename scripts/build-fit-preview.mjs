// Package the verified Vite output itself, including prerendered pages and lazy scene modules.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const archive = resolve(process.argv[2] || 'visual-checks/variable-width-preview.tar.gz');
if (!archive.endsWith('.tar.gz') || archive.startsWith(join(root, 'dist') + sep)) {
  throw new Error('Choose an output .tar.gz file outside dist.');
}
const home = await readFile(join(root, 'dist/index.html'), 'utf8');
if (!home.includes('id="work"') || !home.includes('id="contact"')) {
  throw new Error('Run npm run build first to produce the prerendered Variable Width visit.');
}
await mkdir(dirname(archive), { recursive: true });
const staging = await mkdtemp(join(dirname(archive), '.variable-width-'));
try {
  await copyFile(new URL('./serve-review.mjs', import.meta.url), join(staging, 'serve.mjs'));
  await writeFile(join(staging, 'README.txt'), [
    'Fazhere Studio — Variable Width', '',
    'Extract the archive. With Node.js 22 installed, open a terminal in the extracted directory and run:',
    '    node serve.mjs', 'Open http://127.0.0.1:4173/ in your browser. Press Ctrl+C to stop.',
    'To choose another port, pass its number after serve.mjs.', '',
    'The dist directory contains the production website. The local tour and project exhibits work without internet.',
    'Links to the live store, project source, and WhatsApp open their usual destinations.', '',
  ].join('\n'));
  const temporaryArchive = join(staging, 'preview.tar.gz');
  execFileSync('tar', ['-czf', temporaryArchive, '-C', root, 'dist', '-C', staging, 'serve.mjs', 'README.txt']);
  await rename(temporaryArchive, archive);
  console.log('Packaged production preview at ' + archive);
} finally {
  await rm(staging, { recursive: true, force: true });
}
