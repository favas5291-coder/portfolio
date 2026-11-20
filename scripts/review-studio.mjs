// Run against the extracted production preview. Browser tooling is installed separately by CI.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { WHATSAPP_NUMBER } from '../src/data/site.js';
import { profile } from '../src/data/portfolio.js';

const origin = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/';
const output = process.env.REVIEW_OUTPUT || 'visual-checks';
const engine = process.env.STUDIO_ENGINE;
const report = { commit: process.env.HEAD_SHA || null, origin, sessions: [] };
await mkdir(output, { recursive: true });

function button(page, name) {
  return page.getByRole('button', { name, exact: true });
}
async function jump(page, id) {
  const link = page.locator('header a[href="#' + id + '"]').first();
  await link.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(stop => document.querySelector('.vw-visit')?.dataset.stop === stop, id);
}
async function layout(page) {
  return page.locator('.vw-product').evaluate(product => {
    const box = selector => product.querySelector(selector).getBoundingClientRect();
    const photo = box('.vw-product-photo'), title = box('.vw-product-title'), action = box('.vw-product-action');
    return {
      width: product.closest('.vw-projection-inner').clientWidth,
      columns: getComputedStyle(product).gridTemplateColumns.split(' ').length,
      sideBySide: photo.right <= title.left + 1 && action.left >= photo.right - 1,
      stacked: title.bottom <= photo.top + 1 && action.top >= photo.bottom - 1,
      view: product.dataset.view, colour: product.dataset.colour,
    };
  });
}
async function capture(page, name) {
  await page.screenshot({ path: join(output, name + '.jpg'), type: 'jpeg', quality: 87 });
}
async function caseRoundTrip(page, method) {
  const link = page.getByRole('link', { name: 'View case study', exact: true });
  const range = page.getByRole('slider', { name: 'Projection width' });
  await link.focus();
  const before = { scroll: await page.evaluate(() => scrollY), range: await range.inputValue(), layout: await layout(page) };
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  assert.equal(new URL(page.url()).searchParams.get('case'), 'gymdrobe');
  if (method === 'back') await page.goBack();
  else await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  await page.waitForFunction(top =>
    document.activeElement?.textContent.trim() === 'View case study' && Math.abs(scrollY - top) < 3, before.scroll);
  assert.equal(await range.inputValue(), before.range);
  assert.deepEqual(await layout(page), before.layout);
}

async function checkContact(page, link, draft) {
  const href = new URL(await link.getAttribute('href'));
  assert.equal(href.origin, 'https://wa.me');
  assert.equal(href.pathname, '/' + WHATSAPP_NUMBER);
  assert.match(href.searchParams.get('text') || '', draft);
  const context = page.context();
  const request = context.waitForEvent('request', { predicate: req => req.url() === href.href });
  await link.click({ noWaitAfter: true });
  await request;
  for (const tab of context.pages()) if (tab !== page) await tab.close();
  return href.searchParams.get('text');
}

async function sampleFrames(page) {
  return page.evaluate(async () => {
    const intervals = [];
    let first, previous;
    await new Promise(done => {
      function frame(now) {
        first ??= now;
        if (previous !== undefined) intervals.push(now - previous);
        previous = now;
        const t = Math.min(1, (now - first) / 1200);
        scrollTo({ top: Math.round(95 * t), behavior: 'instant' });
        if (t < 1) requestAnimationFrame(frame); else done();
      }
      requestAnimationFrame(frame);
    });
    intervals.sort((a, b) => a - b);
    const quantile = q => Math.round(intervals[Math.floor(q * (intervals.length - 1))] * 10) / 10;
    return { samples: intervals.length, medianMs: quantile(.5), p95Ms: quantile(.95), worstMs: quantile(1) };
  });
}

async function exercise(page, name, session) {
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: /Muhammed Favas K/i }).first().waitFor();
  await page.waitForSelector('.vw-projection-inner[style]');
  await page.waitForFunction(() => performance.getEntriesByName('vw-interactive').length > 0);
  session.hydratedInteractiveControlsMs = await page.evaluate(() => Math.round(performance.getEntriesByName('vw-interactive')[0].startTime));
  await page.locator('.vw-scene-poster').evaluate(img => img.decode());
  if (name.startsWith('chromium')) await page.waitForSelector('.vw-visit[data-render="live"]');
  await capture(page, name + '-opening');
  session.opening = await page.evaluate(() => {
    const gl = document.querySelector('.vw-scene canvas')?.getContext('webgl2');
    const info = gl?.getExtension('WEBGL_debug_renderer_info');
    return {
      firstContentfulPaintMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
      renderer: info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null,
      mode: document.querySelector('.vw-visit').dataset.render,
      scrollWidth: document.documentElement.scrollWidth, viewport: innerWidth,
    };
  });
  assert.ok(session.opening.scrollWidth <= session.opening.viewport + 1);
  const opening = page.getByRole('link', { name: 'Talk to Favas', exact: true }).first();
  session.initialWhatsApp = await checkContact(page, opening, /Favas/i);
  session.scrollFrames = await sampleFrames(page);
  await page.waitForFunction(() => Number(document.querySelector('.vw-scene').dataset.progress) > 0);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => Math.abs(Number(document.querySelector('.vw-scene').dataset.progress)) < .01);

  await jump(page, 'work');
  await button(page, 'Wide').click();
  await button(page, 'View details').click();
  await button(page, 'Red').click();
  session.wide = await layout(page);
  assert.ok(session.wide.width > 465 && session.wide.columns === 2 && session.wide.sideBySide);
  await capture(page, name + '-wide');
  await button(page, 'Compact').click();
  session.compact = await layout(page);
  assert.ok(session.compact.width <= 465 && session.compact.columns === 1 && session.compact.stacked);
  assert.equal(session.compact.colour, 'Red');
  assert.equal(session.compact.view, 'details');
  assert.match(await page.locator('img[data-product-photo]').getAttribute('src'), /gymdrobe-shirt-red\.webp$/);
  await capture(page, name + '-compact');
  const range = page.getByRole('slider', { name: 'Projection width' });
  await range.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await range.inputValue(), '1');
  await page.keyboard.press('End');
  assert.equal(await range.inputValue(), '100');
  await caseRoundTrip(page, 'close');
  await caseRoundTrip(page, 'back');

  await jump(page, 'process');
  assert.equal(await page.locator('.vw-proposal').count(), 2);
  await button(page, 'Product details').click();
  assert.equal(await page.locator('.vw-phone[data-inspect="details"]').count(), 2);
  await capture(page, name + '-review');
  await jump(page, 'contact');
  const contact = page.getByRole('link', { name: 'Talk to Favas on WhatsApp', exact: true });
  session.contactDrafts = { initial: await checkContact(page, contact, /Favas/i) };
  for (const choice of ['Website', 'Online store', 'Web app']) {
    await page.getByRole('radio', { name: choice, exact: true }).check();
    session.contactDrafts[choice] = await checkContact(page, contact, new RegExp(choice, 'i'));
  }
  assert.equal(await page.locator('#contact a[href^="mailto:"]').getAttribute('href'), 'mailto:' + profile.email);
  await capture(page, name + '-contact');
}

async function swipe(page, from, to) {
  const cdp = await page.context().newCDPSession(page);
  try {
    const point = (x, y) => [{ x, y, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(from.x, from.y) });
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove',
        touchPoints: point(from.x + (to.x - from.x) * i / 8, from.y + (to.y - from.y) * i / 8) });
      await page.waitForTimeout(25);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } finally { await cdp.detach(); }
}
async function touchRail(page, name, session) {
  await page.goto(new URL('#work', origin).href);
  await page.waitForFunction(() => performance.getEntriesByName('vw-interactive').length > 0);
  await page.evaluate(() => document.fonts.ready);
  await button(page, 'Compact').click();
  const range = page.getByRole('slider', { name: 'Projection width' });
  const grip = page.locator('.vw-touch-grip');
  // The styled range provides keyboard access; the transparent overlay receives
  // touch pointers. Sample its viewport coordinates after layout is stable.
  await grip.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await grip.scrollIntoViewIfNeeded();
  const route = await grip.evaluate(el => {
    const box = el.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const start = { x: box.left + 14, y }, end = { x: box.right - 14, y };
    return { start, end, startTarget: document.elementFromPoint(start.x, y)?.className,
      endTarget: document.elementFromPoint(end.x, y)?.className, scroll: scrollY };
  });
  session.touchHit = route;
  assert.equal(route.startTarget, 'vw-touch-grip');
  assert.equal(route.endTarget, 'vw-touch-grip');
  assert.equal(await range.inputValue(), '0');
  await swipe(page, route.start, { ...route.end, y: route.end.y + 2 });
  await page.waitForFunction(() => Number(document.querySelector('.vw-width-grip').value) >= 80);
  session.draggedValue = Number(await range.inputValue());
  assert.ok(Math.abs((await page.evaluate(() => scrollY)) - route.scroll) < 10);
  await swipe(page, route.end, { x: route.end.x, y: route.end.y - 140 });
  await page.waitForFunction(y => scrollY > y + 35, route.scroll);
  assert.ok(Math.abs(Number(await range.inputValue()) - session.draggedValue) <= 2, 'a vertical swipe preserves the aperture');
}
async function stills(page, name, session) {
  if (name === 'no-webgl') {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type.includes('webgl')) { window.__reviewWebGLAttempt = true; return null; }
        return original.call(this, type, ...args);
      };
    });
  }
  await page.goto(new URL('#work', origin).href);
  await page.waitForSelector('.vw-visit[data-stop="work"]');
  if (name === 'context-loss') {
    await page.waitForSelector('.vw-visit[data-render="live"] canvas');
    const scene = page.locator('.vw-scene');
    const wide = Number(await scene.getAttribute('data-aperture'));
    await button(page, 'Compact').click();
    await page.waitForFunction(previous =>
      Number(document.querySelector('.vw-scene').dataset.aperture) < previous - 0.05, wide);
    session.liveAperture = { wide, compact: Number(await scene.getAttribute('data-aperture')) };
    const supported = await page.locator('.vw-scene canvas').evaluate(canvas => {
      const ext = canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context');
      ext?.loseContext(); return Boolean(ext);
    });
    assert.ok(supported, 'a real WebGL context was lost');
  }
  if (name === 'no-webgl') await page.waitForFunction(() => window.__reviewWebGLAttempt === true);
  await page.waitForSelector('.vw-visit[data-render="still"]');
  assert.equal(await page.locator('.vw-scene canvas').count(), 0);
  await page.locator('.vw-scene-poster').evaluate(img => img.decode());
  await button(page, 'View details').click();
  await button(page, 'Compact').click();
  assert.equal((await layout(page)).columns, 1);
  await jump(page, 'contact');
  await checkContact(page, page.getByRole('link', { name: 'Talk to Favas on WhatsApp', exact: true }), /Favas/i);
}

async function slowRenderer(page, name, session) {
  await page.goto(origin);
  const canvas = page.locator('.vw-visit[data-render="live"] .vw-scene canvas');
  await canvas.waitFor();
  await canvas.evaluate(el => {
    window.__reviewBufferWidths = [el.width];
    new MutationObserver(() => window.__reviewBufferWidths.push(el.width)).observe(el, {
      attributes: true, attributeFilter: ['width'],
    });
    // Keep walking while spacing animation callbacks, so idle reading time is excluded.
    const raf = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    let token = 0;
    const scheduled = new Map();
    window.requestAnimationFrame = callback => {
      const id = --token;
      const entry = {};
      scheduled.set(id, entry);
      entry.timer = setTimeout(() => {
        entry.frame = raf(time => { scheduled.delete(id); callback(time); });
      }, 160);
      return id;
    };
    window.cancelAnimationFrame = id => {
      const entry = scheduled.get(id);
      if (!entry) return cancel(id);
      clearTimeout(entry.timer);
      if (entry.frame !== undefined) cancel(entry.frame);
      scheduled.delete(id);
    };
    window.__reviewWalk = setInterval(() => scrollTo({ top: 140 + 100 * Math.sin(performance.now() / 900), behavior: 'instant' }), 80);
  });
  await page.locator('.vw-visit[data-render="still"]').waitFor({ timeout: 50000 });
  session.bufferWidths = await page.evaluate(() => { clearInterval(window.__reviewWalk); return [...new Set(window.__reviewBufferWidths)]; });
  assert.ok(Math.min(...session.bufferWidths) < session.bufferWidths[0], 'lowered render resolution before switching to stills');
  await jump(page, 'work');
  await button(page, 'Compact').click();
  assert.equal((await layout(page)).columns, 1);
}

async function run(browser, name, width, height, task, options = {}) {
  const recording = task === exercise;
  const context = await browser.newContext({
    viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600,
    ...(recording ? { recordVideo: { dir: output, size: { width, height } } } : {}),
    ...options,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const session = { name, browser: browser.version(), width, height, errors: [] };
  report.sessions.push(session);
  page.on('pageerror', error => session.errors.push(error.message));
  // Check the URL requested by the real link without contacting WhatsApp.
  await context.route('https://wa.me/**', route => route.fulfill({ status: 204, headers: { 'cache-control': 'no-store' } }));
  const video = page.video();
  try {
    await task(page, name, session);
    assert.deepEqual(session.errors, []);
    session.result = 'pass';
  } catch (error) {
    session.result = 'fail';
    session.failure = String(error.stack || error);
    console.error(name, session.failure);
    await capture(page, name + '-failure').catch(() => {});
    process.exitCode = 1;
  } finally {
    await context.close();
    if (video) {
      await video.saveAs(join(output, name + '-walkthrough.webm'));
      await video.delete();
    }
    await writeFile(join(output, 'review.json'), JSON.stringify(report, null, 2) + '\n');
  }
}

report.conditions = 'Headless Linux, fresh contexts, DPR 1, no simulated network or CPU throttling. Video recording enabled for journey sessions. Frame samples include the first 95 CSS pixels of scrolling. The vw-interactive mark records hydrated HTML controls. A missing paint entry is reported as null. Mobile viewports are emulated.';
if (!engine || engine === 'chromium') {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  try {
    await run(browser, 'chromium-desktop', 1440, 900, exercise);
    await run(browser, 'touch-rail', 390, 844, touchRail, { reducedMotion: 'reduce' });
    await run(browser, 'context-loss', 1440, 900, stills);
    await run(browser, 'no-webgl', 390, 844, stills);
    await run(browser, 'slow-renderer', 390, 844, slowRenderer);
  } finally { await browser.close(); }
}
if (!engine || engine === 'webkit') {
  const browser = await webkit.launch({ executablePath: process.env.WEBKIT_PATH });
  try {
    await run(browser, 'webkit-mobile-emulation', 390, 844, exercise);
    await run(browser, 'reduced-motion', 390, 844, stills, { reducedMotion: 'reduce' });
  } finally { await browser.close(); }
}
