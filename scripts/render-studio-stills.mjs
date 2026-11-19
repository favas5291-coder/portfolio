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
const poseTimes = [0, 5.8, 3.4, 4.6, 4.3, 3.7];
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
  const texturesReady = new Promise(resolve => { T.DefaultLoadingManager.onLoad = resolve; });
  const office = buildOffice(T, scene, {mobile:false});
  const cast = buildPeople(T, scene, {mobile:false});

  window.renderStill = async (room, time) => {
    await texturesReady;
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 1 });
  const missing = [];
  await page.route('**/*', async (request) => {
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
  await page.goto(origin);
  await page.waitForFunction(() => typeof window.renderStill === 'function');
  for (const [room, slug] of rooms.entries()) {
    const url = await page.evaluate(
      ([room, time]) => window.renderStill(room, time),
      [room, poseTimes[room]],
    );
    if (missing.length) throw new Error('Missing local scene resources: ' + missing.join(', '));
    const bytes = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    const output = await sharp(bytes)
      .webp({ quality: 83, effort: 6 })
      .toFile(resolve(destination, slug + '.webp'));
    console.log(slug, Math.ceil(output.size / 1024) + ' KiB');
  }
} finally {
  await browser.close();
}
