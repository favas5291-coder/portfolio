import test from 'node:test';
import assert from 'node:assert/strict';
import { pages, pageForPath, structuredData, notFound } from '../src/seo/pages.js';
import { renderHead, isPreview } from '../scripts/seo.mjs';
import { readEnquiry, validateEnquiry, formEndpoint, enquiryMessage, submitEnquiry } from '../src/enquiries/form.js';
import { SITE_ORIGIN, whatsappHref } from '../src/data/site.js';
import { analyticsAllowed } from '../src/seo/analytics.js';

const valid = { name: 'QA Example', email: 'example@example.com', phone: '', business: '', service: 'Business websites', message: 'A responsive website to explain my services.', budget: '', _gotcha: '' };
test('marketing routes have unique canonical URLs and unique titles/descriptions', () => {
  for (const key of ['path', 'title', 'description']) assert.equal(new Set(pages.map(p => p[key])).size, pages.length);
  assert.equal(pageForPath('/services?utm_source=example').path, '/services/');
  assert.equal(pageForPath('/services/').path, '/services/');
  assert.equal(pageForPath('/not-a-real-page').noindex, true);
  assert.equal(pageForPath('/services//').path, '/services/');
});
test('metadata is initial HTML, escapes verification values, and noindexes previews/404s', () => {
  const page = pages[2];
  const production = renderHead(page, { GOOGLE_SITE_VERIFICATION: '"><script>unsafe</script>' });
  assert.ok(production.includes(`href="${SITE_ORIGIN}${page.path}"`));
  assert.ok(production.includes('index, follow, max-image-preview:large'));
  assert.ok(production.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
  for (const env of [{ SITE_ENV: 'preview' }, { IS_PULL_REQUEST: 'true', SITE_ENV: 'production' }]) {
    assert.equal(isPreview(env), true); assert.ok(renderHead(page, env).includes('noindex, follow'));
  }
  assert.ok(renderHead(notFound).includes('noindex, follow'));
  assert.ok(!renderHead(notFound).includes('rel="canonical"'));
});
test('structured data connects the person, site, visible service and breadcrumbs without invented business details', () => {
  for (const page of pages) {
    const graph = structuredData(page)['@graph'];
    assert.equal(graph[0]['@type'], 'Person');
    assert.equal(graph[0].name, 'Muhammed Favas K');
    assert.ok(graph[0].sameAs.some(url => url.includes('linkedin.com')));
    assert.ok(!JSON.stringify(graph).match(/aggregateRating|openingHours|streetAddress|priceCurrency|reviewRating/));
    if (page.service) {
      const service = graph.find(n => n['@type'] === 'Service');
      assert.equal(service.provider['@id'], graph[0]['@id']);
      assert.equal(service.name, page.service.name);
      assert.equal(graph.find(n => n['@type'] === 'BreadcrumbList').itemListElement.length, 3);
    }
  }
});
test('enquiry requires one contact method and validates supplied email and phone', () => {
  assert.deepEqual(validateEnquiry(valid), {});
  assert.ok(validateEnquiry({ ...valid, email: '', phone: '' }).email);
  assert.deepEqual(validateEnquiry({ ...valid, email: '', phone: '+91 8156805806' }), {});
  assert.ok(validateEnquiry({ ...valid, email: 'broken', phone: '+91 8156805806' }).email);
  assert.ok(validateEnquiry({ ...valid, phone: '123' }).phone);
  assert.ok(validateEnquiry({ ...valid, name: ' ', message: 'short', service: '' }).message);
});
test('enquiry values are bounded and WhatsApp handoff preserves readable information', () => {
  const data = readEnquiry(new Map(Object.entries({ ...valid, message: 'x'.repeat(4000), irrelevant: 'ignored' })));
  assert.equal(data.message.length, 3000); assert.equal(data.irrelevant, undefined);
  const url = new URL(whatsappHref(enquiryMessage(valid)));
  assert.equal(url.pathname, '/918156805806'); assert.ok(url.searchParams.get('text').includes(valid.message));
});
test('form endpoint accepts public Formspree IDs only and never needs a browser secret', () => {
  assert.equal(formEndpoint('https://bad.example'), ''); assert.equal(formEndpoint(''), '');
  assert.equal(formEndpoint('exampleid'), 'https://formspree.io/f/exampleid');
});
test('analytics require a configured ID and an indexable page; preview and 404 documents cannot enable tracking', () => {
  assert.equal(analyticsAllowed('', 'index, follow'), false);
  assert.equal(analyticsAllowed('invalid', 'index, follow'), false);
  assert.equal(analyticsAllowed('G-EXAMPLE123', 'index, follow'), true);
  assert.equal(analyticsAllowed('G-EXAMPLE123', 'noindex, follow'), false);
});
test('form only confirms a successful provider response; errors and unconfirmed delivery are rejected', async () => {
  const endpoint = formEndpoint('exampleid');
  let options;
  assert.equal(await submitEnquiry(endpoint, valid, { fetcher: async (url, opts) => { options = opts; return { ok: true, status: 200, json: async () => ({ ok: true }) }; } }), true);
  assert.equal(options.credentials, 'omit'); assert.equal(options.headers.Accept, 'application/json');
  for (const response of [{ ok: false, status: 400 }, { ok: false, status: 429 }, { ok: true, status: 200 }]) {
    await assert.rejects(submitEnquiry(endpoint, valid, { fetcher: async () => ({ ...response, json: async () => ({}) }) }));
  }
  await assert.rejects(submitEnquiry(endpoint, valid, { fetcher: async () => { throw new TypeError('network unavailable'); } }));
  await assert.rejects(submitEnquiry(endpoint, { ...valid, _gotcha: 'bot' }, { fetcher: () => { throw new Error('Must not request'); } }));
  await assert.rejects(submitEnquiry('', valid));
});
