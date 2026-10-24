import assert from 'node:assert/strict';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { loadEnv } from 'vite';
import { profile, chapters, project } from '../src/data/portfolio.js';
import { SITE_ORIGIN } from '../src/data/site.js';
import { pages, normalizePath } from '../src/seo/pages.js';
import { escapeHTML, isPreview } from './seo.mjs';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const preview = isPreview(env);
const home = await readFile('dist/index.html', 'utf8');
for (const chapter of chapters) assert.ok(home.includes(`id="${chapter.id}"`), `Missing chapter ${chapter.id}`);
for (const url of [`mailto:${profile.email}`, profile.github, profile.linkedin, project.website, project.repository, 'tel:+918156805806', 'https://wa.me/918156805806']) assert.ok(home.includes(url), `Missing contact/project link: ${url}`);
for (const asset of [project.screenshot, '/environment/forge-studio.hdr', '/social-card.png', '/favicon.svg']) assert.ok((await stat(`dist${asset}`)).size > 0);
const rendered = new Map();
for (const page of pages) {
  const file = page.path === '/' ? 'dist/index.html' : `dist${page.path}index.html`;
  const html = await readFile(file, 'utf8');
  rendered.set(page.path, html);
  assert.equal((html.match(/<h1\b/g) || []).length, 1, `One clear H1 required: ${page.path}`);
  assert.ok(html.includes(`<title>${escapeHTML(page.title)}</title>`), `Wrong title: ${page.path}`);
  assert.ok(html.includes(`name="description" content="${escapeHTML(page.description)}"`));
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.ok(html.includes(`rel="canonical" href="${SITE_ORIGIN}${page.path}"`));
  assert.ok(html.includes(preview ? 'noindex, follow' : 'index, follow, max-image-preview:large'));
  assert.ok(html.includes('og:image') && html.includes('twitter:card'));
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(graph['@graph'][0].name, 'Muhammed Favas K');
  if (page.service) {
    for (const [q, answer] of page.service.faqs) assert.ok(html.includes(escapeHTML(q)) && html.includes(escapeHTML(answer)));
    assert.ok(graph['@graph'].some(n => n['@type'] === 'Service'));
  }
  assert.ok(html.includes('href="/contact/"') || page.path === '/contact/');
  assert.ok(!html.includes('<!--app-html-->') && !html.includes('<!--page-meta-->'));
}
for (const [path, html] of rendered) {
  const ids = target => new Set([...target.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
    if (/^(mailto:|tel:|https?:)/.test(href)) continue;
    const url = new URL(href.replaceAll('&amp;', '&'), `${SITE_ORIGIN}${path}`);
    const targetPath = normalizePath(url.pathname);
    const target = rendered.get(targetPath);
    if (!target && /\.[a-z0-9]+$/i.test(url.pathname)) { await stat(`dist${url.pathname}`); continue; }
    assert.ok(target, `Broken internal link on ${path}: ${href}`);
    if (url.hash) assert.ok(ids(target).has(decodeURIComponent(url.hash.slice(1))), `Broken fragment: ${path} -> ${href}`);
  }
  for (const [, src] of html.matchAll(/<(?:img|script)\b[^>]*\bsrc="([^"]+)"/g)) {
    if (src.startsWith('/')) assert.ok((await stat(`dist${src}`)).size > 0, `Missing ${src}`);
  }
}
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.deepEqual(locations.sort(), (preview ? [] : pages.map(p => `${SITE_ORIGIN}${p.path}`)).sort());
const robots = await readFile('dist/robots.txt', 'utf8');
assert.ok(robots.includes('Allow: /'));
assert.equal(robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`), !preview);
const error = await readFile('dist/404.html', 'utf8');
assert.ok(error.includes('noindex, follow') && !error.includes('rel="canonical"'));
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'));
const sizes = {};
for (const [name, route] of [['home', 'src/App.jsx'], ['services', 'src/MarketingPages.jsx']]) {
  const seen = new Set();
  const visit = key => {
    if (seen.has(key)) return;
    const chunk = manifest[key]; assert.ok(chunk, `Missing manifest ${key}`);
    seen.add(key); for (const child of chunk.imports || []) visit(child);
  };
  visit('index.html'); visit(route);
  let bytes = 0;
  for (const key of seen) {
    const source = await readFile(`dist/${manifest[key].file}`);
    assert.ok(!source.toString().includes('WebGLRenderer'), '3D renderer must stay deferred');
    bytes += gzipSync(source).byteLength;
  }
  sizes[name] = Number((bytes / 1024).toFixed(1));
  assert.ok(bytes <= 125 * 1024, `${name} initial JavaScript exceeds 125 KiB gzip: ${bytes}`);
}
await mkdir('.sites-runtime', { recursive: true });
await writeFile('.sites-runtime/seo-results.json', JSON.stringify({ environment: preview ? 'preview' : 'production', pages: pages.length, staticHTML: true, sitemapURLs: locations.length, internalLinks: 'passed', structuredData: 'JSON and local consistency passed; external validator not run', initialJavaScriptKiBGzip: sizes, lighthouse: 'not run', fieldCoreWebVitals: 'unavailable', renderedWebGL: 'not verified in cloud browser' }, null, 2));
console.log(`Verified ${pages.length} static pages: unique metadata, headings, canonical URLs, schema, sitemap, robots, contact actions and internal links.`);
console.log(`Initial JavaScript including the selected page and shared imports: home ${sizes.home} KiB gzip; services ${sizes.services} KiB gzip (budget 125 KiB). 3D remains deferred.`);
console.log('404 document verified. HTTP status codes and redirects require the host checks; these checks are not Lighthouse or field Core Web Vitals.');
