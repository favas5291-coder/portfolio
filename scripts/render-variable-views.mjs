// Author fallback plates from the same renderer, camera path and geometry as the visit.
// Run with Playwright Chromium installed, or set CHROME_PATH to local Chromium.
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.env.STILL_OUTPUT || resolve(root, 'public/variable');
const names = ['arrival', 'work', 'process', 'contact'];
const selected = process.argv.slice(2);
for (const name of selected) {
  if (!names.includes(name)) throw new Error('Unknown destination ' + name);
}
const harness = `<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  *{box-sizing:border-box}html,body,main{margin:0;width:100%;height:100%;overflow:hidden}canvas{display:block;width:100%;height:100%}
</style></head><body><main id="stage"></main><script type="module">
  import { mountScene } from '/src/variable/scene.js';
  let state = {progress:0, width:1};
  const engine = await mountScene(document.getElementById('stage'), {
    readState: () => state,
    onReady() { window.sceneReady = true; },
    onSlow() {},
    onFailure(error) { throw error || new Error('Could not render a studio plate'); }
  });
  // Match the live sleeve around the HTML exhibit at either width. The
  // placeholder is invisible in the plate but its edges register the 3D fins.
  const sleeve = document.createElement('div');
  sleeve.className = 'vw-projection';
  sleeve.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none';
  document.body.append(sleeve);
  window.showPlate = async (progress, width, rect) => {
    sleeve.style.display = rect ? 'block' : 'none';
    if (rect) {
      for (const key of ['left','top','width','height']) sleeve.style[key] = rect[key] + 'px';
    }
    state = {progress, width};
    await engine.render(state);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  };
</script></body></html>`;

const server = await createServer({
  root, logLevel: 'error',
  cacheDir: resolve(root, 'node_modules/.cache/variable-width-capture'),
  server: { host: '127.0.0.1', port: 0, strictPort: false, hmr: false },
  plugins: [{
    name: 'variable-width-capture',
    configureServer(server) {
      server.middlewares.use('/render-view', (_request, response) => {
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.end(harness);
      });
    },
  }],
});
await mkdir(destination, { recursive: true });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  for (const mobile of [false, true]) {
    const viewport = mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 };
    const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
    let layout;
    if (!selected.length || selected.includes('work')) {
      layout = await context.newPage();
      await layout.emulateMedia({ reducedMotion: 'reduce' });
      await layout.goto(new URL('/#work', server.resolvedUrls.local[0]).href);
      await layout.locator('.vw-projection').waitFor();
      await layout.evaluate(() => document.fonts.ready);
    }
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.status() >= 400) errors.push(response.status() + ' ' + response.url());
    });
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(new URL('/render-view', server.resolvedUrls.local[0]).href);
    await page.waitForFunction(() => window.sceneReady && window.showPlate, null, { timeout: 45000 });
    for (const [progress, name] of names.entries()) {
      if (selected.length && !selected.includes(name)) continue;
      const widths = name === 'work' ? [1, 0] : [mobile ? 0 : 1];
      for (const width of widths) {
        let rect;
        if (name === 'work') {
          await layout.getByRole('button', { name: width ? 'Wide' : 'Compact', exact: true }).click();
          await layout.locator('#work').evaluate(section => section.scrollIntoView({ behavior: 'instant' }));
          rect = await layout.locator('.vw-projection').evaluate(async panel => {
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            return panel.getBoundingClientRect().toJSON();
          });
        }
        await page.evaluate(args => window.showPlate(...args), [progress, width, rect]);
        const png = await page.locator('#stage canvas').screenshot();
        if (errors.length) throw new Error(errors.join('\n'));
        let variant = '';
        if (name === 'work' && width === 0 && !mobile) variant = '-compact';
        if (name === 'work' && width === 1 && mobile) variant = '-wide';
        const file = name + variant + (mobile ? '-mobile' : '') + '.webp';
        const result = await sharp(png).webp({ quality: 84, effort: 5 }).toFile(resolve(destination, file));
        console.log(file, result.width + '×' + result.height, Math.ceil(result.size / 1024) + ' KiB');
      }
    }
    await context.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
