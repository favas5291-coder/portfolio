import { build } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Build-time HTML keeps portfolio text and links available before JS loads.
await build({
  build: { ssr: 'src/entry-server.jsx', outDir: '.sites-runtime/ssr', emptyOutDir: true },
  logLevel: 'warn',
});
const { render } = await import(pathToFileURL(resolve('.sites-runtime/ssr/entry-server.js')).href);
const html = await readFile('dist/index.html', 'utf8');
if (!html.includes('<!--app-html-->')) throw new Error('Missing prerender placeholder');
await writeFile('dist/index.html', html.replace('<!--app-html-->', render()));
console.log('Prerendered portfolio content into dist/index.html');
