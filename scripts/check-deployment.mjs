import assert from 'node:assert/strict';
import { pages } from '../src/seo/pages.js';
import { SITE_ORIGIN } from '../src/data/site.js';
import { escapeHTML } from './seo.mjs';

// Read-only HTTP checks. Run after Render reports the new deployment is Live.
const base = new URL(process.argv[2] || SITE_ORIGIN).origin;
const get = (url, redirect = 'follow') => fetch(url, { redirect, signal: AbortSignal.timeout(20000) });
for (const page of pages) {
  const response = await get(`${base}${page.path}`);
  assert.equal(response.status, 200, `${page.path}: expected 200`);
  const html = await response.text();
  assert.ok(html.includes(`<title>${escapeHTML(page.title)}</title>`), `${page.path}: old or incorrect deployment`);
  assert.ok(html.includes(`rel="canonical" href="${SITE_ORIGIN}${page.path}"`), `${page.path}: wrong canonical`);
  assert.ok(!html.includes('content="noindex'), `${page.path}: production is noindex`);
  console.log(`PASS 200, initial content and canonical: ${page.path}`);
}
for (const path of ['/services', '/services/business-websites', '/contact']) {
  const response = await get(`${base}${path}`, 'manual');
  assert.ok([200, 301, 302, 307, 308].includes(response.status), `Clean URL inaccessible: ${path}`);
  if (response.status === 200) {
    const html = await response.text();
    assert.ok(html.includes(`href="${SITE_ORIGIN}${path}/"`), `Duplicate path must canonicalize: ${path}`);
    console.log(`PASS clean URL 200 with slash canonical: ${path}`);
  } else {
    const target = new URL(response.headers.get('location'), base);
    assert.equal(target.pathname, `${path}/`); console.log(`PASS ${response.status} slash redirect: ${path}`);
  }
}
const missing = await get(`${base}/__forge-missing-page-check-2026/`, 'manual');
assert.equal(missing.status, 404, 'Missing URL must return 404. Remove the /* -> /index.html rewrite in Render.');
const tracked = await get(`${base}/services/?utm_source=verification`);
assert.ok((await tracked.text()).includes(`rel="canonical" href="${SITE_ORIGIN}/services/"`));
const robots = await get(`${base}/robots.txt`);
assert.equal(robots.status, 200); assert.ok((await robots.text()).includes(`${SITE_ORIGIN}/sitemap.xml`));
const sitemap = await get(`${base}/sitemap.xml`);
assert.equal(sitemap.status, 200);
const xml = await sitemap.text();
for (const page of pages) assert.ok(xml.includes(`<loc>${SITE_ORIGIN}${page.path}</loc>`));
if (base === SITE_ORIGIN) {
  for (const alias of ['http://fazhere.com/', 'https://www.fazhere.com/']) {
    const initial = await get(alias, 'manual');
    assert.ok([301, 302, 307, 308].includes(initial.status), `Expected redirect: ${alias}`);
    const final = await get(alias);
    assert.equal(new URL(final.url).origin, SITE_ORIGIN, `Wrong final domain: ${alias}`);
  }
}
console.log('PASS live HTML, sitemap, robots, missing-page status, tracking canonical and available redirects.');
console.log('This does not submit a form, validate an inbox, run Lighthouse or verify a GPU.');
