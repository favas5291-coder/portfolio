// Compare the actual built pull request and base with the same browser and runner.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { WHATSAPP_NUMBER } from '../src/data/site.js';
import { projectPreviews } from '../src/data/project-previews.js';

const head = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/';
const base = process.env.BASELINE_URL;
const output = 'visual-checks';
const viewports = [[360, 800], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
await mkdir(output, { recursive: true });
for (const url of [head, base].filter(Boolean)) {
  let ready = false;
  for (let attempt = 0; attempt < 80 && !ready; attempt++) {
    try { ready = (await fetch(url)).ok; } catch {}
    if (!ready) await sleep(250);
  }
  assert.ok(ready, 'Could not serve the built site at ' + url);
}
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
});
const report = {
  head: process.env.HEAD_SHA,
  base: process.env.BASE_SHA,
  browser: browser.version(),
  environment: 'Headless Chromium with SwiftShader, DPR 1. Phones use emulated touch and viewport. No physical device or business-owner session.',
  widths: [],
  fallbacks: [],
};
function context(width, height, overrides = {}) {
  return browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 1,
    hasTouch: width < 600, isMobile: width < 600, ...overrides,
  });
}
const screenshot = (page, name) => page.screenshot({ path: output + '/' + name + '.png', timeout: 35000 });
const turn = (page) => page.getByRole('button', { name: /^Turn the proof/i }).first();
const showFront = (page) => page.getByRole('button', { name: /^Show front/i }).first();
const enlarge = (page) => page.getByRole('button', { name: /^Enlarge/i }).first();
const stage = (page) => page.locator('[data-edition][data-face]').first();
function waitFace(page, face, edition = 'gymdrobe') {
  return page.locator('[data-edition="' + edition + '"][data-face="' + face + '"]').first().waitFor();
}
async function settled(page, legacy = false) {
  await page.locator('[data-renderer="webgl"]').first().waitFor({ timeout: 45000 });
  await page.evaluate(async (legacy) => {
    await document.fonts.ready;
    const image = document.querySelector(legacy ? '.sample-photo img' : '.press-sheet img');
    if (!image) throw Error('Missing opening artwork');
    await image.decode();
  }, legacy);
  if (!legacy) await page.waitForFunction(() => !document.querySelector('[data-turn-mesh], [data-press-motion="feed"], [data-press-motion="turn"]'));
}
// A pointer follows the paper toward the opposite side. Touch dispatch here is
// a genuine touch sequence, so mobile gesture cancellation remains observable.
async function drag(page, target, amount, touch = false, duration = 450) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  assert.ok(box && box.width && box.height, 'Grab target is visible');
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const end = Math.max(4, x - amount);
  let session;
  if (touch) {
    session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
  }
  try {
    for (let i = 1; i <= 16; i++) {
      const coordinate = x + (end - x) * i / 16;
      if (touch) await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: coordinate, y }] });
      else await page.mouse.move(coordinate, y);
      await sleep(duration / 16);
    }
  } finally {
    if (touch) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
    } else await page.mouse.up();
  }
}
async function proofJourney(page, isPhone) {
  await waitFace(page, 'front');
  const sheetBox = await page.locator('.press-sheet').boundingBox();
  await drag(page, page.locator('[data-turn-corner]').first(), sheetBox.width * .85, isPhone);
  await waitFace(page, 'back');
  await screenshot(page, isPhone ? 'reverse-phone' : 'reverse-desktop');
  await showFront(page).focus();
  await page.keyboard.press('Enter');
  await waitFace(page, 'front');
  await enlarge(page).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.locator('img:visible').first().evaluate(image => image.decode());
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.ok(await enlarge(page).evaluate(el => el === document.activeElement), 'Focus returns to Enlarge');
  for (const [id, proof] of Object.entries(projectPreviews)) {
    await page.locator('a[href="#proof-' + id + '"][aria-label]').first().click();
    await waitFace(page, 'front', id);
    const image = stage(page).locator('.press-sheet img').first();
    await image.evaluate(el => el.decode());
    const actual = await image.evaluate(el => el.currentSrc || el.src);
    const expected = isPhone && proof.mobile?.matchesDesktop === proof.screenshot ? proof.mobile : proof;
    assert.equal(new URL(actual).pathname, expected.screenshot, 'Manifest capture for ' + id);
    await enlarge(page).click();
    const comparison = dialog.getByRole('group', { name: 'Compare captures' });
    if (proof.mobile?.matchesDesktop === proof.screenshot) {
      for (const [label, capture] of [['Desktop', proof], ['Mobile', proof.mobile]]) {
        await comparison.getByRole('button', { name: label }).click();
        const actual = await dialog.locator('img').evaluate(async image => {
          await image.decode();
          return [new URL(image.currentSrc).pathname, image.naturalWidth, image.naturalHeight];
        });
        assert.deepEqual(actual, [capture.screenshot, capture.width, capture.height]);
      }
    } else assert.equal(await comparison.count(), 0);
    await dialog.getByRole('button', { name: /^Close/ }).click();
    await dialog.waitFor({ state: 'hidden' });
    await turn(page).press('Enter');
    await waitFace(page, 'back', id);
    await showFront(page).click();
    await waitFace(page, 'front', id);
    assert.equal(await page.locator('a[href="/projects/' + id + '/"]').count() > 0, true);
  }
}
function verifyWhatsApp(href, expectedText) {
  const destination = new URL(href);
  assert.equal(destination.origin, 'https://wa.me');
  assert.equal(destination.pathname, '/' + WHATSAPP_NUMBER);
  if (expectedText) assert.match(destination.searchParams.get('text'), expectedText);
}
async function enquiryJourney(page) {
  const service = page.locator('#services details').filter({ has: page.locator('summary', { hasText: /I want to sell online/i }) });
  if (!await service.evaluate(details => details.open)) await service.locator('summary').click();
  verifyWhatsApp(await service.getByRole('link', { name: /Discuss this on WhatsApp/i }).getAttribute('href'), /e-commerce/i);
  await service.getByRole('link', { name: /Send a written brief/i }).click();
  await page.waitForURL('**/contact/?service=ecommerce-development#project-enquiry');
  const select = page.locator('#enquiry-service');
  await page.waitForFunction(() => document.querySelector('#enquiry-service')?.value === 'E-commerce development');
  assert.equal(await select.inputValue(), 'E-commerce development');
  await page.getByRole('button', { name: 'Prepare WhatsApp Enquiry' }).click();
  assert.ok(await page.getByLabel('Your name', { exact: true }).evaluate(el => el === document.activeElement));
  await page.getByLabel('Your name', { exact: true }).fill('QA Example');
  await page.getByLabel('Email (or add a phone number)', { exact: true }).fill('example@example.com');
  await page.getByLabel('What would you like to build or improve?', { exact: true }).fill('A store for a small catalogue of shirts.');
  await page.getByRole('button', { name: 'Prepare WhatsApp Enquiry' }).click();
  verifyWhatsApp(await page.getByRole('link', { name: /Open WhatsApp and review/ }).getAttribute('href'), /QA Example/);
  assert.match(await page.getByRole('status').innerText(), /Nothing has been sent/);
  await page.goBack();
  await stage(page).waitFor();
  const expectedHash = new URL(page.url()).hash;
  await page.locator('a[href="/projects/fabea/"][aria-label*="case study"]').first().click();
  await page.waitForURL('**/projects/fabea/');
  assert.match(await page.getByRole('heading', { level: 1 }).innerText(), /FABEA/i);
  await page.goBack();
  assert.equal(new URL(page.url()).hash, expectedHash);
  for (const id of ['gymdrobe', 'luxvibe', 'fabea']) {
    const response = await page.goto(new URL('projects/' + id + '/', head).href);
    assert.equal(response.status(), 200);
    await page.getByRole('heading', { level: 1 }).waitFor();
    const preview = projectPreviews[id];
    assert.ok(await page.locator('img[src="' + preview.screenshot + '"]').count() > 0, 'Case study uses shared capture for ' + id);
  }
}
async function contactCheck(page, width) {
  await page.goto(new URL('contact/', head).href);
  await page.locator('.fit-contact').waitFor();
  verifyWhatsApp(await page.getByRole('link', { name: /^Chat on WhatsApp/ }).getAttribute('href'));
  assert.equal(await page.getByRole('link', { name: 'Contact', exact: true }).getAttribute('aria-current'), 'page');
  for (const type of ['tel:', 'mailto:']) assert.equal(await page.locator('a[href^="' + type + '"]').count(), 1);
  for (const field of await page.locator('.form-field input, .form-field select, .form-field textarea').all()) {
    const box = await field.boundingBox();
    assert.ok(box?.width > 0 && box.height >= 44, 'Contact field at width ' + width);
    assert.ok(await field.evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16));
  }
}
async function measure(url) {
  const c = await context(390, 844);
  try {
    const p = await c.newPage();
    await p.addInitScript(() => {
      window.reviewMetrics = { lcpMs: null, cls: 0 };
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.reviewMetrics.lcpMs = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.reviewMetrics.cls += entry.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await p.goto(url);
    const legacy = !(await stage(p).count());
    await settled(p, legacy);
    await sleep(5200);
    const grab = legacy ? p.getByRole('slider').first() : p.locator('[data-turn-corner]').first();
    await grab.scrollIntoViewIfNeeded();
    const sample = p.evaluate(() => new Promise(resolve => {
      const frames = [];
      const start = performance.now();
      let previous;
      function tick(time) {
        if (previous !== undefined) frames.push(time - previous);
        previous = time;
        if (time - start < 2200 || frames.length < 2) return requestAnimationFrame(tick);
        frames.sort((a, b) => a - b);
        resolve({
          p50FrameMs: frames[Math.floor(frames.length / 2)],
          p95FrameMs: frames[Math.floor(frames.length * .95)],
          frames: frames.length,
        });
      }
      requestAnimationFrame(tick);
    }));
    await drag(p, grab, 200, true, 700);
    return {
      ...(await p.evaluate(() => ({
        loadMs: performance.getEntriesByType('navigation')[0].loadEventEnd,
        fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
        ...window.reviewMetrics,
      }))),
      ...await sample,
    };
  } finally { await c.close(); }
}
const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
function medians(rows) {
  return Object.fromEntries(Object.keys(rows[0]).map(key => {
    const values = rows.map(row => row[key]).filter(Number.isFinite);
    return [key, values.length ? Number(median(values).toFixed(3)) : null];
  }));
}
try {
  for (const [width, height] of viewports) {
    const c = await context(width, height);
    try {
      const page = await c.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      if (base && [390, 1440].includes(width)) {
        await page.goto(base);
        await settled(page, !(await stage(page).count()));
        await sleep(2000);
        await screenshot(page, 'before-' + width);
      }
      await page.goto(head);
      await settled(page);
      const headline = page.getByRole('heading', { level: 1 });
      assert.match(await headline.innerText(), /I build websites and apps that help businesses grow/i);
      const wa = page.getByRole('link', { name: /^Chat on WhatsApp/i }).first();
      verifyWhatsApp(await wa.getAttribute('href'));
      const work = page.getByRole('link', { name: /^View GymDrobe/i }).first();
      for (const link of [work, wa]) {
        const box = await link.boundingBox();
        assert.ok(box && box.y >= 0 && box.y + box.height <= height, 'First-screen link at ' + width);
      }
      const sheet = await page.locator('.press-sheet').boundingBox();
      if (width === 390) assert.ok(sheet.y < height - 70, 'Product is recognisable on the opening phone screen');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal overflow at ' + width);
      await screenshot(page, 'opening-' + width);
      if (width === 390 || width === 1440) {
        await proofJourney(page, width === 390);
        await enquiryJourney(page);
      }
      await contactCheck(page, width);
      assert.deepEqual(errors, []);
      report.widths.push(width);
    } finally { await c.close(); }
  }
  for (const mode of ['reduced-motion', 'no-webgl', 'no-javascript']) {
    const c = await context(390, 844, {
      reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference',
      javaScriptEnabled: mode !== 'no-javascript',
    });
    try {
      const p = await c.newPage();
      if (mode === 'no-webgl') await p.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          if (type.includes('webgl')) return null;
          return original.call(this, type, ...args);
        };
      });
      await p.goto(head);
      await stage(p).waitFor();
      await p.getByRole('link', { name: /^View GymDrobe/i }).first().waitFor();
      verifyWhatsApp(await p.getByRole('link', { name: /^Chat on WhatsApp/i }).first().getAttribute('href'));
      if (mode !== 'no-javascript') {
        await turn(p).tap();
        await waitFace(p, 'back');
        await showFront(p).tap();
        await waitFace(p, 'front');
      }
      assert.notEqual(await stage(p).getAttribute('data-renderer'), 'webgl');
      report.fallbacks.push(mode);
    } finally { await c.close(); }
  }
  const recorder = await context(1440, 900, {
    recordVideo: { dir: output + '/.recording', size: { width: 1280, height: 800 } },
  });
  const page = await recorder.newPage();
  const video = page.video();
  try {
    await page.goto(head);
    await settled(page);
    await sleep(3200);
    await drag(page, page.locator('[data-turn-corner]').first(), (await page.locator('.press-sheet').boundingBox()).width * .83, false, 800);
    await waitFace(page, 'back');
    await sleep(1600);
  } finally { await recorder.close(); }
  execFileSync(process.env.FFMPEG_PATH || 'ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error', '-i', await video.path(), '-an', '-c:v', 'libx264',
    '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output + '/Fazhere-Editions-opening.mp4',
  ]);
  await rm(output + '/.recording', { recursive: true, force: true });
  const offline = await context(390, 844);
  try {
    await offline.setOffline(true);
    const page = await offline.newPage();
    await page.goto(pathToFileURL(resolve(output, 'Fazhere-Editions-Preview.html')).href);
    await settled(page);
    await turn(page).tap();
    await waitFace(page, 'back');
    await showFront(page).tap();
    await enlarge(page).tap();
    await page.getByRole('dialog').locator('img:visible').first().evaluate(image => image.decode());
    assert.ok(await page.getByRole('dialog').isVisible());
    report.offlineHomepage = true;
  } finally { await offline.close(); }
  if (base) {
    const samples = { before: [], after: [] };
    for (let i = 0; i < 3; i++) {
      samples.before.push(await measure(base));
      samples.after.push(await measure(head));
    }
    report.performance = {
      conditions: 'Three alternating cold contexts per build at 390 × 844, local production servers, Chromium / SwiftShader, DPR 1, unthrottled. Frame intervals cover a 2.2 s window around a 200 CSS px touch drag of the principal control. Values are lab medians.',
      before: medians(samples.before), after: medians(samples.after), samples,
    };
  }
} catch (error) {
  report.failure = String(error);
  throw error;
} finally {
  await writeFile(output + '/review.json', JSON.stringify(report, null, 2));
  await browser.close();
}
