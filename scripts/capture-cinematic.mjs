// Production build and base are started by the review workflow. Playwright is CI-only.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const home = 'http://127.0.0.1:4173/',
  before = process.env.BASELINE_URL,
  out = 'visual-checks';
const sizes = [
  [360, 800],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 768],
  [1440, 900],
  [1920, 1080],
];
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
await mkdir(out, { recursive: true });
for (const url of [home, before].filter(Boolean)) {
  let ready = false;
  for (let i = 0; i < 50 && !ready; i++) {
    try {
      ready = (await fetch(url)).ok;
    } catch {}
    if (!ready) await sleep(250);
  }
  assert.ok(ready, 'Preview unavailable: ' + url);
}
const browser = await chromium.launch({
  args: [
    '--enable-webgl',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-dev-shm-usage',
  ],
});
const ctx = (w, h, extra = {}) =>
  browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    isMobile: w < 600,
    hasTouch: w < 600,
    ...extra,
  });
const slider = (p) => p.getByRole('slider', { name: 'Resize product layout' });
const bench = (p) => p.getByRole('region', { name: 'GymDrobe product demonstration' });
const report = {
  head: process.env.HEAD_SHA,
  base: process.env.BASE_SHA,
  chromium: browser.version(),
  widths: [],
  fallbacks: [],
  performance: {},
};
const shot = (p, name) => p.screenshot({ path: out + '/' + name + '.png', timeout: 35000 });
async function render(p) {
  await p.locator('.mount[data-renderer=webgl]').waitFor({ timeout: 35000 });
  await p.evaluate(async () => {
    await document.fonts.ready;
    await document.querySelector('.sample-photo img').decode();
  });
}
async function choose(p) {
  await bench(p).getByRole('button', { name: 'Choose Red', exact: true }).click();
  await bench(p).getByRole('button', { name: 'Size M', exact: true }).click();
}
async function persisted(p) {
  assert.equal(
    await bench(p).getByRole('button', { name: 'Choose Red' }).getAttribute('aria-pressed'),
    'true',
  );
  assert.equal(
    await bench(p).getByRole('button', { name: 'Size M' }).getAttribute('aria-pressed'),
    'true',
  );
  assert.match(
    await bench(p).getByRole('img', { name: 'Red COITONIC compression shirt' }).getAttribute('src'),
    /shirt-red|data:image/,
  );
}
async function drag(p) {
  const rail = slider(p);
  await rail.scrollIntoViewIfNeeded();
  const { x, y, width, height } = await rail.boundingBox();
  const initial = Number(await rail.getAttribute('aria-valuenow'));
  await p.mouse.move(x + width / 2, y + height / 2);
  await p.mouse.down();
  await p.mouse.move(x + width / 2 - 180, y + height / 2, { steps: 24 });
  await p.mouse.up();
  assert.ok(
    Number(await rail.getAttribute('aria-valuenow')) < initial,
    'Rail drag narrowed the actual layout',
  );
}
async function journey(p, w) {
  const product = bench(p);
  if (w < 600) await product.getByRole('button', { name: 'Choose Red', exact: true }).tap();
  await choose(p);
  await product.getByRole('button', { name: 'Desktop', exact: true }).click();
  await drag(p);
  await persisted(p);
  await slider(p).focus();
  await slider(p).press('Home');
  let a = Number(await slider(p).getAttribute('aria-valuenow'));
  await slider(p).press('ArrowRight');
  assert.ok(Number(await slider(p).getAttribute('aria-valuenow')) > a);
  await product.getByRole('button', { name: 'Mobile', exact: true }).click();
  await persisted(p);
  const logical = await product.locator('.sample-window .sample').evaluate((el) => el.offsetWidth);
  assert.equal(logical, Number(await slider(p).getAttribute('aria-valuenow')));
  await product.getByRole('button', { name: 'Enlarge product demo' }).click();
  await p.getByRole('dialog', { name: 'Enlarged product demo' }).waitFor();
  await p.keyboard.press('Escape');
  assert.equal(
    await product
      .getByRole('button', { name: 'Enlarge product demo' })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await p.getByRole('link', { name: 'View GymDrobe', exact: true }).click();
  for (const d of ['Mobile', 'Desktop']) {
    const group = p.getByRole('group', { name: 'Compare desktop and mobile' });
    if (await group.count()) await group.getByRole('button', { name: d }).click();
    const enlarge = p.getByRole('button', { name: 'Enlarge screenshot' });
    await enlarge.click();
    const image = p.getByRole('dialog', { name: 'GymDrobe storefront capture' }).locator('img');
    await image.evaluate((el) => el.decode());
    if (await group.count())
      assert.equal(await image.evaluate((el) => el.naturalHeight > el.naturalWidth), d === 'Mobile');
    await p.keyboard.press('Escape');
    assert.ok(await enlarge.evaluate((el) => el === document.activeElement));
  }
  const ecom = p.getByRole('button', { name: /E-commerce development/i });
  await ecom.click();
  await p.getByRole('link', { name: /Discuss this service/ }).click();
  const select = p.locator('#enquiry-service');
  await select.waitFor();
  await p.waitForFunction(() =>
    document.querySelector('#enquiry-service')?.selectedOptions[0]?.textContent.includes('E-commerce'),
  );
  await p.goBack();
  await bench(p).waitFor();
  assert.ok(await p.locator('#contact a[href^="https://wa.me/"]').count());
}
async function perf(url, old) {
  const c = await ctx(390, 844),
    p = await c.newPage();
  try {
    await p.addInitScript(() => {
      window.metrics = { lcp: null, cls: 0 };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.metrics.lcp = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.metrics.cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await p.goto(url);
    await p
      .locator(old ? '[data-renderer=webgl]' : '.mount[data-renderer=webgl]')
      .first()
      .waitFor();
    await p.waitForTimeout(5200);
    const rail = p.getByRole('slider').first();
    await rail.focus();
    await rail.press('Home');
    const sampling = p.evaluate(
      () =>
        new Promise((resolve) => {
          let last;
          const values = [];
          function tick(t) {
            if (last !== undefined) values.push(t - last);
            last = t;
            if (values.reduce((a, b) => a + b, 0) < 2200) {
              requestAnimationFrame(tick);
              return;
            }
            values.sort((a, b) => a - b);
            resolve({
              p50FrameMs: values[Math.floor(values.length / 2)],
              p95FrameMs: values[Math.floor(values.length * 0.95)],
            });
          }
          requestAnimationFrame(tick);
        }),
    );
    for (let i = 0; i < 18; i++) {
      await rail.press(i % 8 < 4 ? 'ArrowRight' : 'ArrowLeft');
      await sleep(65);
    }
    const frames = await sampling;
    return {
      ...(await p.evaluate(() => ({
        loadMs: performance.getEntriesByType('navigation')[0].loadEventEnd,
        fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        lcpMs: window.metrics.lcp,
        cls: window.metrics.cls,
      }))),
      ...frames,
    };
  } finally {
    await c.close();
  }
}
try {
  for (const [w, h] of sizes) {
    const c = await ctx(w, h);
    try {
      const p = await c.newPage();
      const errors = [];
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(home);
      await render(p);
      assert.ok(
        await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        'Overflow at ' + w,
      );
      for (const link of ['View GymDrobe', 'Discuss a project'])
        assert.ok(
          (
            await p
              .getByRole('link', { name: new RegExp('^' + link) })
              .first()
              .boundingBox()
          ).y < h,
        );
      await shot(p, 'opening-' + w);
      if ([390, 1440].includes(w)) {
        await journey(p, w);
        await p.locator('#projects').scrollIntoViewIfNeeded();
        await shot(p, 'work-' + w);
      }
      assert.deepEqual(errors, []);
      report.widths.push(w);
    } finally {
      await c.close();
    }
  }
  for (const mode of ['reduced-motion', 'no-webgl', 'no-javascript']) {
    const c = await ctx(390, 844, {
      reducedMotion: mode === 'reduced-motion' ? 'reduce' : 'no-preference',
      javaScriptEnabled: mode !== 'no-javascript',
    });
    try {
      const p = await c.newPage();
      if (mode === 'no-webgl')
        await p.addInitScript(() => {
          const get = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (t, ...args) {
            return /webgl/.test(t) ? null : get.call(this, t, ...args);
          };
        });
      await p.goto(home);
      await p.getByRole('heading', { level: 1 }).waitFor();
      if (mode !== 'no-javascript') {
        await choose(p);
        await persisted(p);
      }
      assert.equal(await p.locator('.mount').getAttribute('data-renderer'), 'illustration');
      await p.getByRole('link', { name: /^Discuss a project/ }).click();
      assert.ok(new URL(p.url()).pathname === '/contact/');
      report.fallbacks.push(mode);
    } finally {
      await c.close();
    }
  }
  const recording = await ctx(1440, 900, {
    recordVideo: { dir: out + '/.recording', size: { width: 1152, height: 720 } },
  });
  const page = await recording.newPage(),
    video = page.video();
  await page.goto(home);
  await render(page);
  await sleep(1300);
  await choose(page);
  await sleep(600);
  await drag(page);
  await bench(page).getByRole('button', { name: 'Mobile', exact: true }).click();
  await sleep(900);
  await persisted(page);
  await recording.close();
  execFileSync('ffmpeg', [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    await video.path(),
    '-an',
    '-c:v',
    'libx264',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    out + '/Built-to-Fit-opening.mp4',
  ]);
  await rm(out + '/.recording', { recursive: true, force: true });
  const offline = await ctx(390, 844);
  try {
    await offline.setOffline(true);
    const p = await offline.newPage();
    await p.goto(pathToFileURL(resolve(out, 'Fazhere-Built-to-Fit-Preview.html')).href);
    await render(p);
    await journey(p, 390);
    report.offline = true;
  } finally {
    await offline.close();
  }
  if (before) {
    const samples = { before: [], after: [] };
    for (let i = 0; i < 3; i++) {
      samples.before.push(await perf(before, true));
      samples.after.push(await perf(home, false));
    }
    const median = (rows) =>
      Object.fromEntries(
        Object.keys(rows[0]).map((k) => [
          k,
          Number(
            rows
              .map((x) => x[k])
              .sort((a, b) => a - b)[1]
              .toFixed(3),
          ),
        ]),
      );
    report.performance = {
      conditions:
        'Three alternating cold 390 × 844 Chromium contexts, DPR 1, software GPU, local production builds, unthrottled network and CPU. Animation-frame intervals sampled for 2.2 seconds during keyboard input to the primary control.',
      before: median(samples.before),
      after: median(samples.after),
      samples,
    };
  }
} catch (e) {
  report.failure = String(e);
  throw e;
} finally {
  await writeFile(out + '/review.json', JSON.stringify(report, null, 2));
  await browser.close();
}
