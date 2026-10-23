import { build, loadEnv } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { pages, notFound } from '../src/seo/pages.js';
import { SITE_ORIGIN } from '../src/data/site.js';
import { renderHead, isPreview } from './seo.mjs';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
await build({ build: { ssr: 'src/entry-server.jsx', outDir: '.sites-runtime/ssr', emptyOutDir: true }, logLevel: 'warn' });
const { render } = await import(pathToFileURL(resolve('.sites-runtime/ssr/entry-server.js')).href);
const template = await readFile('dist/index.html', 'utf8');
if (!template.includes('<!--app-html-->') || !template.includes('<!--page-meta-->')) throw new Error('Missing prerender placeholders');
for (const page of [...pages, notFound]) {
  const output = page.path === '/' ? 'dist/index.html' : page.noindex ? 'dist/404.html' : `dist${page.path}index.html`;
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, template.replace('<!--page-meta-->', renderHead(page, env)).replace('<!--app-html-->', render(page.path)));
}
const indexable = isPreview(env) ? [] : pages;
await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexable.map(p => `<url><loc>${SITE_ORIGIN}${p.path}</loc></url>`).join('')}</urlset>\n`);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\n${isPreview(env) ? '' : `Sitemap: ${SITE_ORIGIN}/sitemap.xml\n`}`);
await writeFile('dist/_headers', `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Content-Type-Options: nosniff\n${isPreview(env) ? '  X-Robots-Tag: noindex, follow\n' : ''}`);
console.log(`Prerendered ${pages.length} pages and a 404 document. Environment: ${isPreview(env) ? 'preview (noindex)' : 'production'}.`);
