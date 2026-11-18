// Exercise the shipped Vite pages with physical inputs. The app only exposes read-only pose telemetry.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { appendFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { WHATSAPP_NUMBER } from '../src/data/site.js';
import { projectPreviews } from '../src/data/project-previews.js';

const head = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/';
const base = process.env.BASELINE_URL;
const milestone = process.env.DRIVE_REVIEW === 'milestone';
const out = 'visual-checks';
const widths = [[360, 800], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const host = '[data-drive-host]';
const report = {
  kind: milestone ? 'first street' : 'expanded world',
  head: process.env.HEAD_SHA, base: process.env.BASE_SHA,
  environment: 'Chromium on Linux, SwiftShader software rendering, emulated viewport and touch, DPR 1, no CPU/network throttling. No physical devices or human participants.',
  passed: [], failures: [], widths: [], drives: {}, coldLoad: {},
};
await mkdir(out, { recursive: true });
for (const url of [base, head].filter(Boolean)) {
  let ready = false;
  for (let attempt = 0; !ready && attempt < 80; attempt++) {
    try { ready = (await fetch(url)).ok; } catch {}
    if (!ready) await sleep(250);
  }
  assert.ok(ready, 'Could not serve ' + url);
}
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--enable-webgl', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
});
report.browser = browser.version();
const context = (width, height, options = {}) => browser.newContext({
  viewport: { width, height }, deviceScaleFactor: 1, hasTouch: width < 600, isMobile: width < 600, ...options,
});
const shot = (page, filename) => page.screenshot({ path: out + '/' + filename + '.png', timeout: 35000 });
const waitWorld = page => page.waitForFunction(() => {
  const stage = document.querySelector('[data-drive-host]');
  return stage?.dataset.renderer === 'webgl' && Number(stage.dataset.step) > 0 && stage.querySelector('canvas');
}, undefined, { timeout: 50000 });
async function waitStreet(page) {
  await waitWorld(page);
  if (!milestone) await page.locator(host + '[data-districts="ready"]').waitFor({ timeout: 45000 });
}
function quantiles(list) {
  const a = [...list].sort((l, r) => l - r);
  const at = q => a.length ? Math.round(a[Math.floor((a.length - 1) * q)] * 100) / 100 : null;
  return { count: a.length, p50: at(0.5), p95: at(0.95), max: at(1) };
}
async function check(name, fn) {
  console.log('Checking ' + name);
  try { await fn(); report.passed.push(name); }
  catch (error) {
    console.error(error);
    report.failures.push({ name, message: String(error.stack || error).slice(0, 2600) });
  }
  await writeFile(out + '/review.json', JSON.stringify(report, null, 2));
}
async function pose(page) {
  return page.locator(host).evaluate(el => ({
    x: Number(el.dataset.x), z: Number(el.dataset.z), heading: Number(el.dataset.heading),
    parked: el.dataset.parked, speed: Number(el.dataset.speed), collisions: Number(el.dataset.collisions), step: Number(el.dataset.step),
  }));
}
// Measure the interval between browser animation frames while the observable vehicle pose changes.
// This includes JS, renderer scheduling and runner GPU emulation. It is not a physical device GPU time.
async function armTelemetry(page) {
  await page.evaluate(() => {
    const stage = document.querySelector('[data-drive-host]');
    const sample = window.__driveReview = { active: true, frames: [], inputAt: null, firstMotionMs: null };
    const startZ = Number(stage.dataset.z);
    const onInput = e => {
      if (e.type === 'pointermove' && !e.buttons) return;
      if (sample.inputAt === null) sample.inputAt = performance.now();
    };
    for (const type of ['pointermove', 'keydown']) document.addEventListener(type, onInput, { capture: true, passive: true });
    let previous = null;
    function frame(now) {
      if (!sample.active) {
        for (const type of ['pointermove', 'keydown']) document.removeEventListener(type, onInput, true);
        return;
      }
      const speed = Math.abs(Number(stage.dataset.speed));
      if (sample.inputAt !== null && sample.firstMotionMs === null && Math.abs(Number(stage.dataset.z) - startZ) > 0.005) {
        sample.firstMotionMs = performance.now() - sample.inputAt;
      }
      if (previous !== null && sample.inputAt !== null && speed > 0.2) sample.frames.push(now - previous);
      previous = now;
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
async function waitZ(page, targetZ) {
  await page.waitForFunction(z => Number(document.querySelector('[data-drive-host]').dataset.z) <= z, targetZ, { timeout: 30000 });
}
async function centre(locator) {
  const box = await locator.boundingBox();
  assert.ok(box?.width && box.height, 'visible input control');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, radius: Math.min(box.width, box.height) / 2 };
}
async function driveAndPark(page, touch) {
  await armTelemetry(page);
  if (touch) {
    const session = await page.context().newCDPSession(page);
    const stick = await centre(page.locator('[data-stick]'));
    const pedal = await centre(page.locator('[data-brake]'));
    const event = (type, touchPoints) => session.send('Input.dispatchTouchEvent', { type, touchPoints });
    const thumb = (steer, gas) => ({ id: 1, x: stick.x + stick.radius * steer, y: stick.y - stick.radius * gas });
    try {
      await event('touchStart', [thumb(0, 0)]);
      await event('touchMove', [thumb(0.12, 0.8)]);
      await waitZ(page, 6.4);
      await event('touchMove', [thumb(0, 0.8)]);
      await waitZ(page, -3.6);
      await event('touchEnd', []);
      await event('touchStart', [{ id: 2, x: pedal.x, y: pedal.y }]);
      await page.waitForFunction(() => Math.abs(Number(document.querySelector('[data-drive-host]').dataset.speed)) < 0.05);
      await event('touchEnd', []);
    } finally { await event('touchEnd', []).catch(() => {}); await session.detach(); }
  } else {
    await page.locator(host).focus();
    await page.keyboard.down('ArrowUp');
    await waitZ(page, 6.7);
    await page.keyboard.down('ArrowRight');
    await waitZ(page, 6.3);
    await page.keyboard.up('ArrowRight');
    await waitZ(page, -3.4);
    await page.keyboard.up('ArrowUp');
    await page.keyboard.down('b');
    await page.waitForFunction(() => Math.abs(Number(document.querySelector('[data-drive-host]').dataset.speed)) < 0.05);
    await page.keyboard.up('b');
  }
  const result = await pose(page);
  const sample = await page.evaluate(() => {
    window.__driveReview.active = false;
    return { firstMotionMs: window.__driveReview.firstMotionMs, frames: window.__driveReview.frames };
  });
  return { stopped: result, firstInputToObservedPoseMs: sample.firstMotionMs, inputToFirstRenderedMovementMs: Number(await page.locator(host).getAttribute('data-input-ms')), movingFrameIntervalsMs: quantiles(sample.frames) };
}
async function firstFrame(page) {
  const controls = [
    page.getByText(/Muhammed Favas K\s*·\s*Full.stack developer/i).first(),
    page.getByRole('heading', { name: /I build websites and apps that help businesses grow/i }).first(),
    page.getByRole('link', { name: /^View GymDrobe/i }).first(),
    page.getByRole('link', { name: /^Chat on WhatsApp/i }).first(),
  ];
  for (const control of controls) {
    const b = await control.boundingBox();
    assert.ok(b && b.x >= -1 && b.y >= -1 && b.x + b.width <= page.viewportSize().width + 1 && b.y + b.height <= page.viewportSize().height + 1, 'first-frame text/action fits: ' + await control.textContent());
  }
}
async function exampleDrive(width, height, { record = false } = {}) {
  const touch = width < 600;
  const ctx = await context(width, height, record ? { recordVideo: { dir: out + '/video-temp', size: { width, height } } } : {});
  const page = await ctx.newPage();
  const video = page.video();
  page.setDefaultTimeout(14000);
  try {
    await page.goto(head);
    await waitStreet(page);
    await firstFrame(page);
    await shot(page, touch ? 'phone-spawn' : 'desktop-spawn');
    await sleep(420);
    const drive = await driveAndPark(page, touch);
    report.drives[width] = drive;
    assert.ok(drive.stopped.collisions > 0, 'pickup hit a movable object');
    assert.equal(drive.stopped.parked, 'gymdrobe');
    assert.ok(drive.firstInputToObservedPoseMs > 0 && drive.movingFrameIntervalsMs.count > 0, 'motion was sampled');
    await shot(page, touch ? 'phone-parked' : 'desktop-parked');
    const action = page.locator('[data-interact]');
    if (touch) await action.tap(); else await action.click();
    const dialog = page.getByRole('dialog').first();
    await dialog.waitFor();
    await dialog.locator('img').first().evaluate(img => img.decode());
    const projectLink = dialog.locator('a[href*="gymdrobe.com"]').first();
    assert.equal(new URL(await projectLink.getAttribute('href')).hostname.replace(/^www\./,''), 'gymdrobe.com');
    const whatsApp = dialog.locator('a[href^="https://wa.me/"]').first();
    const wa = new URL(await whatsApp.getAttribute('href'));
    assert.equal(wa.pathname, '/' + WHATSAPP_NUMBER);
    assert.ok(wa.searchParams.get('text')?.length);
    await shot(page, touch ? 'phone-project' : 'desktop-project');
    if (record) {
      await whatsApp.scrollIntoViewIfNeeded();
      await whatsApp.focus();
      await sleep(620);
      await shot(page, 'phone-whatsapp-path');
    }
    // Desktop also follows the real prerendered route across an entire page navigation.
    if (!touch && !milestone) {
      await dialog.getByRole('link', { name: /Read case study/i }).click();
      await page.waitForURL('**/projects/gymdrobe/');
      assert.ok(await page.locator('main h1').first().isVisible());
      await page.goBack();
      await dialog.waitFor();
      assert.ok(await dialog.getByRole('link', { name: /Read case study/i }).isVisible());
      await page.goBack();
    } else if (touch) await page.goBack();
    else await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'hidden' });
    await page.waitForFunction(() => Number.isFinite(Number(document.querySelector('[data-drive-host]')?.dataset.heading)));
    const returned = await pose(page);
    assert.deepEqual([returned.x, returned.z, returned.heading], [drive.stopped.x, drive.stopped.z, drive.stopped.heading]);
    await sleep(420);
  } catch (error) { await shot(page, 'error-drive-' + width).catch(() => {}); throw error; }
  finally {
    await ctx.close();
    if (video) {
      const original = await video.path();
      execFileSync(process.env.FFMPEG_PATH || 'ffmpeg', ['-y', '-loglevel', 'error', '-i', original, '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2', '-codec:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out + '/drive-from-spawn.mp4']);
      await rm(out + '/video-temp', { recursive: true, force: true });
    }
  }
}
async function layout(width, height) {
  const ctx = await context(width, height);
  try {
    const page = await ctx.newPage();
    await page.goto(head);
    await waitStreet(page);
    await page.evaluate(() => document.fonts.ready);
    await firstFrame(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, 'horizontal overflow ' + overflow + ' px');
    const stage = await page.locator(host).boundingBox();
    assert.ok(stage && stage.width > 200 && stage.y < height, 'world is visible on arrival');
    await shot(page, 'opening-' + width);
    report.widths.push({ width, height, visibleWorldHeight: Math.min(stage.height, height - stage.y), overflow });
  } finally { await ctx.close(); }
}
async function directRoutes() {
  const ctx = await context(390, 844);
  try {
    const page = await ctx.newPage();
    for (const path of ['/services/', '/contact/', ...Object.keys(projectPreviews).map(id => '/projects/' + id + '/')]) {
      const response = await page.goto(new URL(path, head).href);
      assert.equal(response.status(), 200);
      assert.ok((await page.locator('h1').first().innerText()).trim());
      assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute('href')).pathname, path);
    }
    await page.goto(head);
    await page.locator('#services').getByRole('button', { name: /I want to sell online/ }).click();
    const section = page.locator('#services');
    const draft = new URL(await section.getByRole('link', { name: /Discuss on WhatsApp/ }).getAttribute('href'));
    assert.equal(draft.pathname, '/' + WHATSAPP_NUMBER);
    assert.match(draft.searchParams.get('text'), /e-commerce/i);
    await section.getByRole('link', { name: /Send a brief/i }).click();
    await page.waitForFunction(() => document.querySelector('#enquiry-service')?.value === 'E-commerce development');
    assert.ok(await page.locator('form').first().isVisible());
  } finally { await ctx.close(); }
}
async function fallback(mode) {
  const ctx = await context(390, 844, mode === 'reduced-motion' ? { reducedMotion: 'reduce' } : mode === 'no-javascript' ? { javaScriptEnabled: false } : {});
  try {
    if (mode === 'webgl-unavailable') await ctx.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...options) {
        return /webgl/i.test(type) ? null : original.call(this, type, ...options);
      };
    });
    const page = await ctx.newPage();
    await page.goto(head);
    await firstFrame(page);
    const gym = page.getByRole('link', { name: /^View GymDrobe/i }).first();
    assert.equal(await gym.getAttribute('href'), '/projects/gymdrobe/');
    if (mode !== 'no-javascript') {
      await page.waitForFunction(() => !document.querySelector('[data-drive-host] canvas'));
      await gym.click();
      await page.getByRole('dialog').first().waitFor();
    } else {
      await gym.click();
      assert.equal(new URL(page.url()).pathname, '/projects/gymdrobe/');
    }
  } finally { await ctx.close(); }
}
async function coldLoad(width, height) {
  const series = { before: [], after: [] };
  // Interleave distinct empty browser contexts to limit cache warming and scheduling drift.
  for (let r = 0; r < 3; r++) {
    const order = r % 2 ? ['after', 'before'] : ['before', 'after'];
    for (const version of order) {
      const ctx = await context(width, height);
      try {
        const page = await ctx.newPage();
        await page.goto(version === 'before' ? base : head);
        if (version === 'after') await waitWorld(page);
        else await page.locator('[data-renderer="webgl"]').first().waitFor({ timeout: 50000 });
        const timing = await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          const paint = performance.getEntriesByName('first-contentful-paint')[0];
          return { load: navigation.loadEventEnd, dom: navigation.domContentLoadedEventEnd, fcp: paint?.startTime ?? null, observedReady: performance.now(),
            bytesThroughReady: performance.getEntriesByType('resource').reduce((total, item) => total + item.transferSize, navigation.transferSize) };
        });
        series[version].push(timing);
        if (!r && version === 'before') await shot(page, 'baseline-' + width);
      } finally { await ctx.close(); }
    }
  }
  const summarise = list => Object.fromEntries(Object.keys(list[0]).map(key => [key, quantiles(list.map(sample => sample[key]).filter(Number.isFinite)).p50]));
  report.coldLoad[width] = { raw: series, median: { before: summarise(series.before), after: summarise(series.after) },
    note: 'Cold context, localhost, same Chromium and machine. Observed ready is a browser test upper bound for a painted and initialized WebGL scene. Bytes include all resources completed up to that observation.' };
}
async function verifyCaptures() {
  const ctx = await context(390, 844);
  try {
    const page = await ctx.newPage();
    await page.goto(head);
    for (const [id, preview] of Object.entries(projectPreviews)) {
      await page.locator('#projects').locator('h3 a[href="/projects/' + id + '/"]').click();
      const dialog = page.getByRole('dialog').first();
      const image = dialog.locator('figure img');
      if (preview.mobile?.matchesDesktop === preview.screenshot) {
        await page.waitForFunction(src => document.querySelector('dialog[open] figure img, [role="dialog"] figure img')?.getAttribute('src') === src, preview.mobile.screenshot);
        await dialog.getByRole('button', { name: 'Desktop', exact: true }).click();
      }
      assert.equal(await image.getAttribute('src'), preview.screenshot);
      await image.evaluate(img => img.decode());
      const info = await image.evaluate(img => [img.naturalWidth, img.naturalHeight]);
      assert.deepEqual(info, [preview.width, preview.height]);
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
    }
  } finally { await ctx.close(); }
}
async function controlsAndPause() {
  const ctx = await context(1024, 768);
  try {
    const page = await ctx.newPage();
    await page.goto(head);
    await waitWorld(page);
    const sound = page.getByRole('button', { name: 'Sound', exact: true });
    assert.equal(await sound.getAttribute('aria-pressed'), 'false');
    await sound.click();
    assert.equal(await sound.getAttribute('aria-pressed'), 'true');
    await sound.click();
    await page.locator(host).focus();
    await page.keyboard.press('m');
    const modal = page.getByRole('dialog');
    await modal.getByRole('link', { name: 'Explore Fazhere office' }).click();
    assert.ok(await modal.getByRole('heading', { name: /what are you planning to build/i }).isVisible());
    assert.equal(await page.locator(host).getAttribute('data-paused'), 'true');
    await modal.getByText('From the first brief to handover', { exact: true }).click();
    assert.ok(await modal.getByText('Launch and handover', { exact: true }).isVisible());
    const before = await pose(page);
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(300);
    await page.keyboard.up('ArrowUp');
    assert.equal((await pose(page)).z, before.z);
    await modal.getByRole('button', {name: /Back to drive/i}).click();
    await modal.waitFor({ state: 'hidden' });
    await page.locator(host).focus();
    await page.keyboard.down('ArrowUp');
    await waitZ(page, 6.5);
    await page.keyboard.up('ArrowUp');
    await page.keyboard.press('r');
    await page.waitForFunction(() => Number(document.querySelector('[data-drive-host]').dataset.z) === 7);
    await page.getByRole('button', {name: 'Controls', exact: true}).click();
    assert.ok(await page.getByRole('dialog').getByText('Recover the pickup', { exact: true }).isVisible());
    await page.keyboard.press('Escape');
    await modal.waitFor({state: 'hidden'});
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    const pausedStep = (await pose(page)).step;
    await page.waitForTimeout(350);
    assert.equal((await pose(page)).step, pausedStep, 'engine stops offscreen');
  } finally { await ctx.close(); }
}
async function baselineFrames(width, height) {
  const ctx = await context(width, height);
  try {
    const page = await ctx.newPage();
    await page.goto(base);
    const handle = page.getByRole('slider', { name: /resize product layout/i });
    await handle.scrollIntoViewIfNeeded();
    const box = await centre(handle);
    await page.evaluate(() => {
      const sample = window.__railReview = { active: true, frames: [] };
      let prev;
      function frame(now) {
        if (!sample.active) return;
        if (prev) sample.frames.push(now - prev);
        prev = now; requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    await page.mouse.move(box.x, box.y); await page.mouse.down();
    for (let i = 0; i <= 45; i++) {
      await page.mouse.move(box.x - Math.min(180, box.x - 3) * Math.sin(Math.PI * i / 45), box.y);
      await sleep(25);
    }
    await page.mouse.up();
    const frames = await page.evaluate(() => { window.__railReview.active = false; return window.__railReview.frames; });
    report.baselineRailFrames ??= {};
    report.baselineRailFrames[width] = quantiles(frames);
    assert.ok(frames.length > 0);
  } finally { await ctx.close(); }
}

// Replay a discovered route with real keyboard inputs and a controlled frame clock.
// This optional observation cannot affect the measured frame times or gate a build.
async function probeDelivery() {
  const ctx = await context(900, 700);
  const page = await ctx.newPage();
  let paused = false;
  const results = report.deliveryObservation = {
    method: 'Real keyboard input in a separate Chromium context, Playwright virtual clock. No position injection.',
    observed: false,
  };
  try {
    page.setDefaultTimeout(15000);
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') });
    await page.goto(head);
    await waitStreet(page);
    await page.locator(host).focus();
    const next = await page.evaluate(() => new Date(Date.now() + 450).toISOString());
    await page.clock.pauseAt(next);
    paused = true;
    const held = new Set();
    const route = [
      [['w', 'd'], 44], [['w'], 59], [['w', 'a'], 22], [['b'], 48],
      [['w'], 67], [[], 82], [['w', 'a'], 109], [['w'], 12], [['b'], 50],
    ];
    for (const [keys, ticks] of route) {
      for (const key of [...held]) if (!keys.includes(key)) {
        await page.keyboard.up(key); held.delete(key);
      }
      for (const key of keys) if (!held.has(key)) {
        await page.keyboard.down(key); held.add(key);
      }
      await page.clock.runFor(Math.round(ticks * 1000 / 60));
    }
    for (const key of held) await page.keyboard.up(key);
    await page.clock.runFor(800);
    await page.clock.resume();
    paused = false;
    results.end = await pose(page);
    results.observed = await page.locator(host).getAttribute('data-discovered') === 'true';
    if (results.observed) await shot(page, 'delivery-bay');
  } catch (err) {
    results.note = String(err).slice(0, 450);
  } finally {
    if (paused) await page.clock.resume().catch(() => {});
    await ctx.close();
  }
}
async function writeSummary() {
  const lines = [
    '# Fazhere Drive browser review', '',
    'Tested commit `' + report.head + '` against `' + report.base + '`.',
    '', report.environment, '',
    '## Driving to GymDrobe', '',
    '| Viewport | Moving frames sampled | Median frame interval | 95th percentile | First input to changed-pose render submission |',
    '| --- | ---: | ---: | ---: | ---: |',
  ];
  for (const [width, drive] of Object.entries(report.drives)) {
    const f = drive.movingFrameIntervalsMs;
    lines.push('| ' + [width + ' px', f.count, f.p50 + ' ms', f.p95 + ' ms', drive.inputToFirstRenderedMovementMs + ' ms'].join(' | ') + ' |');
  }
  lines.push('', 'Input latency ends when Three.js submits the first changed-pose frame; the GPU and display can present it later. The primary route crosses the opening junction and the flagship’s frontage. The final full review measures both devices with video recording disabled. The checkpoint recording includes capture overhead on the phone.', '');
  if (Object.keys(report.coldLoad).length) {
    lines.push('## Cold loads', '', 'Medians from three fresh contexts per build at each size. Both builds used the same local server configuration, machine and browser.', '',
      '| Viewport | Version | First contentful paint | Load event | Scene ready (upper bound) | Transferred through ready |',
      '| --- | --- | ---: | ---: | ---: | ---: |');
    for (const [width, metrics] of Object.entries(report.coldLoad)) for (const [version, data] of Object.entries(metrics.median)) {
      lines.push('| ' + [width + ' px', version, data.fcp + ' ms', data.load + ' ms', data.observedReady + ' ms', Math.round(data.bytesThroughReady / 1024) + ' KiB'].join(' | ') + ' |');
    }
    lines.push('', 'The previous homepage’s equivalent animated control was its resize rail. Its frame samples are included in review.json alongside the new drive.', '');
  }
  lines.push('## Browser checks', '', ...report.passed.map(check => '- Passed — ' + check), ...report.failures.map(f => '- Failed — ' + f.name), '');
  const summary = lines.join('\n');
  await writeFile(out + '/review.md', summary);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
}

try {
  await check('390 px genuine touch drive, object impact, brake, park, project, WhatsApp and Back', () => exampleDrive(390, 844, { record: true }));
  await check('desktop keyboard drive, parking and Escape', () => exampleDrive(1440, 900));
  if (!milestone) {
    await check('phone busy street without recording overhead', async () => {
      const ctx = await context(390, 844);
      try {
        const page = await ctx.newPage();
        await page.goto(head);
        await waitStreet(page);
        report.recordedPhoneDrive = report.drives[390];
        // The timed route starts after the streamed shops and scenery have joined the world.
        report.drives[390] = await driveAndPark(page, true);
        assert.equal(report.drives[390].stopped.parked, 'gymdrobe');
      } finally { await ctx.close(); }
    });
    for (const [width, height] of widths) await check(width + ' px opening', () => layout(width, height));
    await check('service selection, WhatsApp destination, enquiry prefill and deep links', directRoutes);
    await check('all project captures and correct desktop/mobile pairing', verifyCaptures);
    console.log('Observing optional keyboard delivery replay');
    await probeDelivery();
    await check('sound, keyboard map, office, process, pause, respawn and offscreen stop', controlsAndPause);
    for (const mode of ['reduced-motion', 'webgl-unavailable', 'no-javascript']) await check(mode, () => fallback(mode));
    if (base) for (const [w, h] of [widths[1], widths[5]]) {
      await check('cold load comparison at ' + w, () => coldLoad(w, h));
      await check('baseline rail interaction at ' + w, () => baselineFrames(w, h));
    }
  }
  await check('standalone preview can render and drive', async () => {
    const ctx = await context(390, 844);
    try {
      const page = await ctx.newPage();
      await ctx.setOffline(true);
      await page.goto(pathToFileURL(resolve(out, 'Fazhere-Drive-Preview.html')).href);
      await waitWorld(page);
      await page.locator(host).focus();
      await page.keyboard.down('ArrowUp'); await waitZ(page, 6.7); await page.keyboard.up('ArrowUp');
    } finally { await ctx.close(); }
  });
} finally {
  await browser.close();
  await writeFile(out + '/review.json', JSON.stringify(report, null, 2));
  await writeSummary();
}
if (report.failures.length) process.exitCode = 1;
