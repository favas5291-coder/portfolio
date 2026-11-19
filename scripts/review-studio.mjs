// Run against "npm run preview" after a production build. CI installs Playwright
// separately to keep browser tooling out of the application's dependencies.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { WHATSAPP_NUMBER } from '../src/data/site.js';

const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/';
const output = process.env.REVIEW_OUTPUT || 'visual-checks';
const rooms = [
  'entrance',
  'reception',
  'project-room',
  'development-studio',
  'client-review',
  'founder-office',
];
const tour = '.studio-tour';
const message = 'Hi Favas, I visited your studio. I’d like to discuss a project.';
const report = {
  build: process.env.HEAD_SHA || null,
  origin: url,
  conditions:
    'Fresh browser contexts, headless Linux, DPR 1, no CPU/network throttling. Chromium uses SwiftShader software rendering. Mobile WebKit uses an emulated touch viewport. Durations are lab samples, not physical-device results.',
  sessions: [],
  failures: [],
};
await mkdir(output, { recursive: true });
const save = () => writeFile(join(output, 'review.json'), JSON.stringify(report, null, 2) + '\n');
const requiredRoom = (page, id) =>
  page.waitForFunction((expected) => document.querySelector('.studio-tour')?.dataset.room === expected, id, {
    timeout: 25000,
  });

function activeMode(page, target) {
  return page.waitForSelector(tour + '[data-render="' + target + '"]', { timeout: 65000 });
}

function verifyContact(href) {
  const dest = new URL(href);
  assert.equal(dest.origin, 'https://wa.me');
  assert.equal(dest.pathname, '/' + WHATSAPP_NUMBER);
  assert.equal(dest.searchParams.get('text'), message);
}

async function state(page) {
  return page.locator(tour).evaluate((el) => ({
    room: el.dataset.room,
    renderer: el.dataset.render,
    canvas: !!el.querySelector('canvas'),
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
}

async function menuJump(page, id) {
  const summary = page.locator('summary').filter({ hasText: 'Jump to a room' });
  await summary.focus();
  await page.keyboard.press('Enter');
  const destination = summary.locator('..').locator('a[href="#' + id + '"]');
  await destination.focus();
  await page.keyboard.press('Enter');
  await requiredRoom(page, id);
}

async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(output, name + '.jpg'), type: 'jpeg', quality: 84, timeout: 45000 });
}

async function frameSample(page) {
  return page.evaluate(async () => {
    const position = scrollY;
    const intervals = [];
    let first, previous;
    await new Promise((resolve) => {
      function move(now) {
        if (first === undefined) first = now;
        if (previous !== undefined) intervals.push(now - previous);
        previous = now;
        const progress = Math.min(1, (now - first) / 1800);
        scrollTo(0, position + Math.round(progress * (innerHeight * 0.7)));
        if (progress < 1) requestAnimationFrame(move);
        else resolve();
      }
      requestAnimationFrame(move);
    });
    intervals.sort((a, b) => a - b);
    const quantile = (q) => Math.round(intervals[Math.floor((intervals.length - 1) * q)] * 10) / 10;
    return { samples: intervals.length, medianMs: quantile(0.5), p95Ms: quantile(0.95) };
  });
}

async function testContact(page, id) {
  const contact = page.locator('#' + id + ' a[data-contact="whatsapp"]').first();
  verifyContact(await contact.getAttribute('href'));
  // Verify the activated URL but keep the browser local; no messages are sent.
  await page.context().route(
    'https://wa.me/**',
    (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<title>WhatsApp destination checked</title>',
      }),
    { times: 1 },
  );
  const reached = page
    .context()
    .waitForEvent('request', { predicate: (req) => req.url().startsWith('https://wa.me/') });
  const opensPopup = (await contact.getAttribute('target')) === '_blank';
  const popupEvent = opensPopup ? page.waitForEvent('popup') : null;
  await contact.click();
  verifyContact((await reached).url());
  if (popupEvent) await (await popupEvent).close();
  else await page.goBack({ waitUntil: 'domcontentloaded' });
  await requiredRoom(page, id);
}

async function exercise(page, session, name) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Muhammed Favas K' }).waitFor();
  assert.equal(
    await page.locator('section[data-office-room]').evaluateAll((nodes) => nodes.map((n) => n.id).join(' ')),
    rooms.join(' '),
  );
  const supportsWebGL = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  });
  const target = supportsWebGL ? 'live' : 'still';
  await activeMode(page, target);
  session.opening = await state(page);
  assert.ok(session.opening.width >= session.opening.documentWidth, 'no horizontal overflow');
  if (name === 'desktop')
    assert.equal(session.opening.renderer, 'live', 'at least desktop must exercise WebGL');
  await capture(page, name + '-01-entrance');
  session.navigation = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    return {
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
      loadMs: Math.round(nav.loadEventEnd),
      firstContentfulPaintMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
      resourceCountAtLiveFrame: resources.length,
      decodedResourceKiBAtLiveFrame:
        Math.round(resources.reduce((sum, res) => sum + res.decodedBodySize, 0) / 1024) || null,
    };
  });
  if (name === 'desktop') {
    await page.mouse.move(90, 210);
    await page.mouse.wheel(0, 120);
    await page.waitForFunction(() => document.querySelector('.studio-tour')?.dataset.room === 'reception', undefined, {timeout:1000});
    await page.waitForTimeout(650);
    session.entranceWheelPixels = await page.evaluate(() => scrollY);
    assert.ok(Math.abs(session.entranceWheelPixels - 120) <= 2, 'one wheel notch enters reception');
    await capture(page, 'desktop-first-stride');
    await page.mouse.wheel(0, -120);
    await requiredRoom(page, 'entrance');
  }
  verifyContact(await page.locator('#entrance a[data-contact="whatsapp"]').getAttribute('href'));
  await testContact(page, 'entrance');
  await page.getByRole('link', { name: 'Scroll to enter' }).click();
  await requiredRoom(page, 'reception');
  await activeMode(page, target);
  await capture(page, name + '-02-reception');
  assert.equal((await page.locator('#reception a[href^="/services/"]').count()) >= 4, true);
  session.scrollAnimationFrameIntervals = await frameSample(page);
  await menuJump(page, 'project-room');
  const product = page.locator('#project-room .studio-product img');
  const initialPhoto = await product.getAttribute('src');
  const swatch = page.getByRole('button', { name: 'Red', exact: true });
  if (name === 'mobile-webkit') await swatch.tap();
  else await swatch.click();
  assert.notEqual(await product.getAttribute('src'), initialPhoto);
  assert.equal(await swatch.getAttribute('aria-pressed'), 'true');
  await capture(page, name + '-03-project-room');
  const caseLink = page.getByRole('link', { name: 'View case study', exact: true });
  await caseLink.focus();
  const resting = await page.evaluate(() => scrollY);
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  await page.getByRole('dialog').getByRole('heading', { name: 'GymDrobe', exact: true }).waitFor();
  await capture(page, name + '-gymdrobe-case');
  await page.goBack();
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  assert.ok(
    await caseLink.evaluate((el) => el === document.activeElement),
    'Back restores case opener focus',
  );
  assert.ok(Math.abs((await page.evaluate(() => scrollY)) - resting) < 9, 'Back restores project position');
  await caseLink.click();
  await page.getByRole('button', { name: 'Close case study' }).click();
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  await page.locator('a.studio-fabea').click();
  await page.getByRole('dialog').getByRole('heading', { name: 'FABEA', exact: true }).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  for (const [offset, id] of rooms.slice(3).entries()) {
    await menuJump(page, id);
    await capture(page, name + '-0' + (offset + 4) + '-' + id);
  }
  await testContact(page, 'founder-office');
  await page.mouse.move(2, 2);
  if (name === 'mobile-webkit') await page.keyboard.press('Home');
  else await page.mouse.wheel(0, -100000);
  await requiredRoom(page, 'entrance');
  assert.ok((await page.evaluate(() => scrollY)) < 10, 'native reverse scroll reaches entrance');
  await page.goto(new URL('#client-review', url).href);
  await requiredRoom(page, 'client-review');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await requiredRoom(page, 'client-review');
  const faq = page.locator('#client-review details').nth(1);
  await faq.locator('summary').click();
  assert.ok(await faq.evaluate((el) => el.open), 'client question opens');
  for (const [href, heading] of [
    ['?exhibit=gymdrobe', 'GymDrobe'],
    ['#drive-fabea', 'FABEA'],
  ]) {
    await page.goto(new URL(href, url).href);
    await page.getByRole('dialog').getByRole('heading', { name: heading, exact: true }).waitFor();
    await page.keyboard.press('Escape');
    await requiredRoom(page, 'project-room');
    assert.equal(new URL(page.url()).hash, '#project-room', 'closing a shared case restores its room');
    await page.goBack();
  }
  if (name === 'desktop') {
    await activeMode(page, 'live');
    const sound = page.getByRole('button', { name: 'Ambient sound' });
    if (await sound.count()) assert.equal(await sound.getAttribute('aria-pressed'), 'false');
    const motion = page.locator('.studio-media-tools button[title="Use still room views"]');
    await motion.click();
    await activeMode(page, 'still');
    await page.locator('.studio-media-tools button[title="Resume 3D visit"]').click();
    await page.waitForSelector(tour + '[data-render="live"] canvas');
    const lost = await page
      .locator(tour + ' canvas')
      .first()
      .evaluate((el) => {
        const ext = el.getContext('webgl2')?.getExtension('WEBGL_lose_context');
        ext?.loseContext();
        return !!ext;
      });
    assert.ok(lost, 'WebGL context loss can be simulated');
    await page.waitForSelector(tour + '[data-render="still"]');
    await menuJump(page, 'founder-office');
    verifyContact(await page.locator('#founder-office [data-contact="whatsapp"]').getAttribute('href'));
  }
}

async function fallback(page, session, name) {
  if (name === 'no-webgl')
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...options) {
        if (type.includes('webgl')) {
          window.__studioGPUAttempts = (window.__studioGPUAttempts || 0) + 1;
          return null;
        }
        return original.call(this, type, ...options);
      };
    });
  await page.goto(new URL('#project-room', url).href);
  await requiredRoom(page, 'project-room');
  await page.waitForSelector(tour + '[data-render="still"]');
  await page.locator('.studio-poster').evaluate(async (img) => {
    await img.decode();
  });
  if (name === 'no-webgl') {
    await page.waitForFunction(() => window.__studioGPUAttempts > 0);
  }
  session.opening = await state(page);
  assert.equal(session.opening.canvas, false);
  await capture(page, name + '-project-room');
  await menuJump(page, 'founder-office');
  verifyContact(await page.locator('#founder-office [data-contact="whatsapp"]').getAttribute('href'));
}

async function noScript(page) {
  await page.goto(url);
  await page.getByRole('heading', { name: 'Muhammed Favas K' }).waitFor();
  assert.equal(await page.locator('.studio-static-photo').count(), 6);
  const enter = page.getByRole('link', { name: 'Scroll to enter' });
  await enter.click();
  assert.equal(new URL(page.url()).hash, '#reception');
  const founder = page.locator('#founder-office a[data-contact="whatsapp"]');
  verifyContact(await founder.getAttribute('href'));
  const caseStudy = page.locator('#project-room a').filter({ hasText: 'View case study' });
  assert.equal(await caseStudy.getAttribute('href'), '/projects/gymdrobe/');
}

async function touchScroll(page, session) {
  await page.goto(url);
  await activeMode(page, 'live');
  const cdp = await page.context().newCDPSession(page);
  try {
    async function swipe(from, to) {
      const at = (y) => [{ x: 175, y, id: 1 }];
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: at(from) });
      for (let i = 1; i <= 6; i++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: at(from + ((to - from) * i) / 6),
        });
        await page.waitForTimeout(45);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    await swipe(720, 280);
    await page.waitForFunction(() => scrollY > 160);
    session.forwardPixels = await page.evaluate(() => scrollY);
    for (let i = 0; i < 4 && (await page.evaluate(() => scrollY > 3)); i++) await swipe(260, 750);
    await page.waitForFunction(() => scrollY < 4);
    await requiredRoom(page, 'entrance');
  } finally {
    await cdp.detach();
  }
}

async function run(browser, name, width, height, options = {}) {
  const mobile = width < 600;
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    ...options,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(16000);
  const session = { name, browser: browser.version(), width, height, errors: [] };
  report.sessions.push(session);
  page.on('pageerror', (error) => session.errors.push(error.message));
  try {
    if (name === 'no-webgl' || name === 'reduced-motion') await fallback(page, session, name);
    else if (name === 'no-javascript') await noScript(page);
    else if (name === 'mobile-touch') await touchScroll(page, session);
    else await exercise(page, session, name);
    assert.deepEqual(session.errors, [], 'no uncaught page errors');
    session.result = 'pass';
  } catch (error) {
    session.result = 'fail';
    report.failures.push({ name, message: String(error.stack || error) });
    await capture(page, name + '-failure').catch(() => {});
    console.error(name, String(error));
  } finally {
    await context.close();
    await save();
  }
}

const engineFilter = process.env.STUDIO_ENGINE;
if (!engineFilter || engineFilter === 'chromium') {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: [
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--disable-dev-shm-usage',
    ],
  });
  try {
    await run(browser, 'desktop', 1440, 900);
    await run(browser, 'reduced-motion', 390, 844, { reducedMotion: 'reduce' });
    await run(browser, 'no-webgl', 390, 844);
    await run(browser, 'no-javascript', 390, 844, { javaScriptEnabled: false });
    await run(browser, 'mobile-touch', 390, 844);
  } finally {
    await browser.close();
  }
}
if (!engineFilter || engineFilter === 'webkit') {
  const browser = await webkit.launch({ executablePath: process.env.WEBKIT_PATH || undefined });
  try {
    await run(browser, 'mobile-webkit', 390, 844);
  } finally {
    await browser.close();
  }
}
await save();
if (report.failures.length) process.exitCode = 1;
