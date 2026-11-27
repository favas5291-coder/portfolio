// Author the no-WebGL plates with the same camera, materials and project sources as the visit.
// Uses the browser tools installed by the review workflow. CHROME_PATH can select a local Chromium.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { build } from 'vite';
import { projectPreviews } from '../src/data/project-previews.js';
import { chapters, sceneScale } from '../src/appointment/scene.config.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = process.env.STILL_OUTPUT || resolve(root, 'public/appointment');
const origin = 'https://appointment-authoring.test';
const ids = chapters.map((chapter) => chapter.id);
const selected = process.argv.slice(2);
for (const id of selected) assert(ids.includes(id), 'Unknown studio room ' + id);
const sizes = [
  { name: 'compact', width: 390, height: 844, dpr: 1.5 },
  { name: 'wide', width: 1440, height: 900, dpr: 1.5 },
];
const motion = process.env.MOTION_OUTPUT;
const entry = 'author-appointment-camera';
const bundleSource = `
  import { mountStudio } from '/src/appointment/scene.js';
  let p = 0;
  const canvas = document.querySelector('canvas');
  let ready;
  window.firstFrame = new Promise((resolve,reject) => { ready = {resolve,reject}; });
  const scene = await mountStudio(canvas, {
    capture: true, blankScreens: true, progress: () => p, project: () => ${JSON.stringify(projectPreviews.gymdrobe.screenshot)},
    isPaused: () => false, onReady: ready.resolve, onFailure: error => ready.reject(new Error(String(error))),
  });
  window.showRoom = async progress => {
    p = progress;
    scene.invalidate();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  };
`;
const result = await build({
  root,
  publicDir: false,
  configFile: false,
  logLevel: 'warn',
  plugins: [
    {
      name: entry,
      resolveId(id) {
        if (id === entry || id === resolve(root, entry)) return '\0' + entry;
      },
      load(id) {
        if (id === '\0' + entry) return bundleSource;
      },
    },
  ],
  build: {
    write: false,
    assetsInlineLimit: Infinity,
    target: 'es2022',
    lib: { entry, formats: ['es'] },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const chunk = (Array.isArray(result) ? result[0] : result).output.find((item) => item.type === 'chunk');
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const metadataFile = process.env.PROJECTION_OUTPUT || resolve(root, 'src/appointment/stillProjection.json');
const screens = JSON.parse(await readFile(metadataFile, 'utf8').catch(() => '{}'));
const types = {
  '.glb': 'model/gltf-binary',
  '.ktx2': 'image/ktx2',
  '.wasm': 'application/wasm',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
try {
  await mkdir(output, { recursive: true });
  for (const size of sizes) {
    if (motion && process.env.MOTION_LAYOUT && process.env.MOTION_LAYOUT !== size.name) continue;
    const [sceneWidth, sceneHeight] = sceneScale.composition[size.name];
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      deviceScaleFactor: motion ? (size.name === 'compact' ? 1 : 0.75) : size.dpr,
      isMobile: size.name === 'compact',
      hasTouch: size.name === 'compact',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === '/')
        return route.fulfill({
          contentType: 'text/html',
          body: `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body,canvas{margin:0}canvas{display:block;width:${sceneWidth}px;height:${sceneHeight}px}</style><canvas></canvas><script type="module" src="/shot.js"></script>`,
        });
      if (url.pathname === '/shot.js')
        return route.fulfill({ contentType: 'text/javascript', body: chunk.code });
      const local = resolve(root, 'public', '.' + url.pathname);
      try {
        return await route.fulfill({
          body: await readFile(local),
          contentType: types[extname(local)] || 'application/octet-stream',
        });
      } catch {
        errors.push(url.pathname);
        return route.fulfill({ status: 404 });
      }
    });
    await page.goto(origin);
    await page.waitForFunction(() => typeof window.showRoom === 'function');
    await page.evaluate(() => window.firstFrame);
    if (motion) {
      const { renderExit } = await import('./gate1/render-motion.mjs');
      await renderExit(page, motion, size.name);
      assert.deepEqual(errors, []);
      await context.close();
      continue;
    }
    for (let i = 0; i < ids.length; i++) {
      if (selected.length && !selected.includes(ids[i])) continue;
      await page.evaluate((p) => window.showRoom(p), chapters[i].progress);
      await page.waitForLoadState('networkidle');
      const file = resolve(output, ids[i] + '-' + size.name + '.webp');
      const projected = await page.locator('canvas').evaluate((el) => el.appointmentStillScreens);
      if (ids[i] === 'office') assert.equal(projected?.office?.points?.length, 4, 'Missing office monitor corners');
      // A replacement room can have fewer physical displays than its predecessor.
      const screenNames = { reception: ['reception'], studio: ['studio', 'phone'], office: ['office'] };
      for (const name of screenNames[ids[i]] || []) {
        if (screens[name]) {
          delete screens[name][size.name];
          if (!Object.keys(screens[name]).length) delete screens[name];
        }
      }
      for (const [id, projection] of Object.entries(projected || {})) {
        screens[id] ||= {};
        screens[id][size.name] = projection;
      }
      const capture = await page.locator('canvas').screenshot();
      assert.deepEqual(errors, []);
      const info = await sharp(capture).webp({ quality: 86, effort: 5 }).toFile(file);
      console.log(ids[i], size.name, info.width + '×' + info.height, Math.round(info.size / 1024) + ' KiB');
    }
    await context.close();
  }
  if (!motion) await writeFile(metadataFile, JSON.stringify(screens, null, 2) + '\n');
} finally {
  await browser.close();
}
