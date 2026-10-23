import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export async function setSiteURL(input) {
  if (!input) throw new Error('Usage: node scripts/set-site-url.mjs https://your-domain.com');
  const url = new URL(input);
  if (url.protocol !== 'https:' || !/^[a-z0-9.-]+$/i.test(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Supply an HTTPS origin without a path, credentials, query or hash.');
  const path = 'src/data/site.js';
  const source = await readFile(path, 'utf8');
  const match = source.match(/export const SITE_ORIGIN = '([^']+)';/);
  if (!match) throw new Error('SITE_ORIGIN is missing from src/data/site.js');
  await writeFile(path, source.replace(match[0], `export const SITE_ORIGIN = '${url.origin}';`));
  for (const publicPath of ['public/robots.txt', 'public/sitemap.xml']) {
    const content = await readFile(publicPath, 'utf8');
    await writeFile(publicPath, content.replaceAll(match[1], url.origin));
  }
  console.log(`Site origin set to ${url.origin}. Rebuild to regenerate every page, canonical, graph and sitemap.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await setSiteURL(process.argv[2]);
