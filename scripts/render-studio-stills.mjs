// Authoring only. Install Playwright and Chromium as in the visual review job.
// All scene resources are loaded from this checkout, including the real screens.
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { chromium } from 'playwright';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destination = process.env.STILL_OUTPUT || resolve(root, 'public/studio');
const rooms = [
  'entrance',
  'reception',
  'project-room',
  'development-studio',
  'client-review',
  'founder-office',
];
// Optional room slugs allow the entrance and desk to be reviewed together.
const requestedRooms = process.argv.slice(2);
for (const slug of requestedRooms) {
  if (!rooms.includes(slug)) throw new Error('Unknown room ' + slug);
}
const poseTimes = [0, 5.8, 3.4, 4.6, 2.7, 3.7];
// The image fills the stage, which is a column on desktop and a short
// near-square view above the text on phones. Render both lenses directly.
const profiles = [
  { suffix: '', width: 1400, height: 1080, mobile: false },
  { suffix: '-mobile', width: 780, height: 720, mobile: true },
];
const entry = 'office-still-authoring';
const sceneModule = `
  import * as T from 'three';
  import {buildOffice} from '/src/studio/buildOffice.js';
  import {buildPeople} from '/src/studio/officePeople.js';
  import {positionCamera} from '/src/studio/cameraPath.js';

  const renderer = new T.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setSize(innerWidth, innerHeight);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(55, innerWidth/innerHeight, .08, 85);
  let texturesReady = Promise.resolve();
  T.DefaultLoadingManager.onStart = () => {
    texturesReady = new Promise(resolve => { T.DefaultLoadingManager.onLoad = resolve; });
  };
  const mobile = new URL(location.href).searchParams.has('mobile');
  const office = buildOffice(T, scene, {mobile});
  const cast = buildPeople(T, scene, {mobile});

  window.renderStill = async (room, time, colour) => {
    if (room === 2) {
      window.dispatchEvent(new CustomEvent('studio:product-colour', {detail: {colour}}));
    }
    await texturesReady;
    const arrival = {progress:room, room, time:0};
    office.update(arrival);
    cast.update(arrival);
    const pose = {progress:room, room, time};
    positionCamera(camera, room);
    office.update(pose);
    cast.update(pose);
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  };
`;
const compiled = await build({
  root,
  configFile: false,
  publicDir: false,
  logLevel: 'warn',
  plugins: [
    {
      name: 'office-still-authoring',
      resolveId(id) {
        return id === entry || id === resolve(root, entry) ? '\0' + entry : undefined;
      },
      load(id) {
        return id === '\0' + entry ? sceneModule : undefined;
      },
    },
  ],
  build: {
    write: false,
    assetsInlineLimit: Infinity,
    target: 'es2022',
    lib: { entry, formats: ['es'], fileName: 'still' },
  },
});
const [result] = Array.isArray(compiled) ? compiled : [compiled];
const bundle = result.output.find((file) => file.type === 'chunk').code;
const origin = 'https://studio-render.test';
const contentTypes = {
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
};
await mkdir(destination, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const missing = [];
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  await context.route('**/*', async (request) => {
    const url = new URL(request.request().url());
    if (url.origin !== origin) return request.abort();
    if (url.pathname === '/')
      return request.fulfill({
        contentType: 'text/html',
        body: '<!doctype html><meta charset=utf-8><script type=module src=/scene.js></script>',
      });
    if (url.pathname === '/scene.js')
      return request.fulfill({ contentType: 'text/javascript', body: bundle });
    try {
      const asset = await readFile(resolve(root, 'public', '.' + url.pathname));
      return request.fulfill({ contentType: contentTypes[extname(url.pathname)], body: asset });
    } catch {
      missing.push(url.pathname);
      return request.fulfill({ status: 404, body: 'Missing local scene asset' });
    }
  });
  for (const { suffix, width, height, mobile } of profiles) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height });
    const renderErrors = [];
    page.on('pageerror', error => renderErrors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error' || /THREE.WebGLProgram: Shader Error/.test(message.text())) {
        renderErrors.push(message.text());
      }
    });
    await page.goto(origin + (mobile ? '/?mobile' : '/'));
    await page.waitForFunction(() => typeof window.renderStill === 'function');
    for (const [room, slug] of rooms.entries()) {
      if (requestedRooms.length && !requestedRooms.includes(slug)) continue;
      for (const colour of room === 2 ? ['Black', 'Red'] : ['Black']) {
        const url = await page.evaluate(
          ([room, time, colour]) => window.renderStill(room, time, colour),
          [room, poseTimes[room], colour],
        );
        if (renderErrors.length) throw new Error(renderErrors.join('\n'));
        if (missing.length) throw new Error('Missing local scene resources: ' + missing.join(', '));
        const fileName = slug + (colour === 'Red' ? '-red' : '') + suffix + '.webp';
        const bytes = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
        const output = await sharp(bytes)
          .webp({ quality: 85, effort: 5 })
          .toFile(resolve(destination, fileName));
        console.log(fileName, Math.ceil(output.size / 1024) + ' KiB');
      }
    }
    await page.close();
  }
} finally {
  await browser.close();
}
