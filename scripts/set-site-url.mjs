import { readFile, writeFile } from 'node:fs/promises';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/set-site-url.mjs https://your-domain.com');
const url = new URL(input);
if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
  throw new Error('Supply an HTTPS origin without a path, credentials, query or hash.');
}
const html = await readFile('index.html', 'utf8');
const oldUrl = html.match(/<link rel="canonical" href="(https:\/\/[^\"]+)"/);
if (!oldUrl) throw new Error('Canonical URL is missing from index.html.');
const oldOrigin = new URL(oldUrl[1]).origin;
for (const path of ['index.html', 'public/robots.txt', 'public/sitemap.xml']) {
  const content = await readFile(path, 'utf8');
  await writeFile(path, content.replaceAll(oldOrigin, url.origin));
}
console.log(`Updated canonical metadata and sitemap to ${url.origin}. Rebuild before deploying.`);
