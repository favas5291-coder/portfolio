import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { profile, chapters, project } from '../src/data/portfolio.js';

const html = await readFile('dist/index.html', 'utf8');
for (const chapter of chapters) assert.ok(html.includes(`id="${chapter.id}"`), `Missing prerendered ${chapter.id}`);
for (const destination of [`mailto:${profile.email}`, profile.github, project.website, project.repository]) {
  assert.ok(html.includes(destination), `Missing working contact/project destination: ${destination}`);
}
for (const asset of [project.screenshot, '/environment/forge-studio.hdr', '/social-card.png', '/favicon.svg']) {
  assert.ok((await stat(`dist${asset}`)).size > 0, `Missing asset: ${asset}`);
}
assert.ok(html.includes('application/ld+json') && html.includes('og:image') && html.includes('rel="canonical"'), 'Missing search/sharing metadata');
const entry = html.match(/<script\b[^>]*type="module"[^>]*src="([^\"]+)"/);
assert.ok(entry, 'Missing Vite entry');
const js = await readFile(`dist${entry[1]}`);
const bytes = gzipSync(js).byteLength;
assert.ok(bytes <= 125 * 1024, `Initial JavaScript exceeds the 125 KiB gzip budget: ${bytes}`);
assert.ok(!js.toString().includes('WebGLRenderer'), 'The 3D renderer must remain outside the initial bundle');
console.log(`Build verification passed: all chapters, contact/project links, assets and metadata present.`);
console.log(`Initial JavaScript: ${(bytes / 1024).toFixed(1)} KiB gzip (budget: 125 KiB). 3D renderer remains lazy-loaded.`);
console.log('This checks output and transfer budgets; it does not produce a Lighthouse score or GPU frame-rate result.');
