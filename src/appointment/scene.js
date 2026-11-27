import * as THREE from 'three';
import { buildLandscape } from '../studio/officeLandscape.js';
import { buildArchitecture } from './architecture.js';
import { buildCar } from './car.js';
import { positionCamera } from './visit.js';

const inert = { invalidate() {}, dispose() {} };

function daylight(scene, compact) {
  const sun = new THREE.DirectionalLight('#ffe3b8', 2.36);
  sun.position.set(-16, 20, 16);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(compact ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left:-14, right:14, top:13, bottom:-13, near:1, far:53 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.021;
  sun.shadow.bias = -0.00018;
  scene.add(sun, sun.target, new THREE.HemisphereLight('#f8f5e8', '#878375', 1.42));
  return sun;
}

// A small copy of the local sky feeds the rough surfaces and the car paint.
// Keeping it separate allows the visible skyline to retain its resolution.
function ambientReflection(panorama) {
  const image = document.createElement('canvas');
  image.width = 128;
  image.height = 64;
  image.getContext('2d').drawImage(panorama, 0, 0, image.width, image.height);
  const texture = new THREE.CanvasTexture(image);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function projectScreen(camera, corners, width, height) {
  if (!corners) return null;
  const projected = corners.map(point => point.project(camera));
  if (projected.some(point => point.z > 1 || point.z < -1)) return null;
  const points = projected.map(point => [
    Math.round((1 + point.x) * width * 50) / 100,
    Math.round((1 - point.y) * height * 50) / 100,
  ]);
  return { width, height, points };
}

function publishScreenPositions(canvas, camera, architecture, p, capture) {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  const names = p > .95 ? ['office'] : p >= .53 && p <= .63 ? ['studio','phone'] :
    p > .35 && p < .46 ? ['reception'] : [];
  const screens = {};
  for (const name of names) {
    const projected = projectScreen(camera, architecture.getScreenCorners(name), width, height);
    if (projected) screens[name] = projected;
  }
  if (capture) {
    canvas.appointmentStillScreens = screens;
    canvas.appointmentStillScreen = screens[names[0]] || null;
  }
  canvas.appointmentMonitorBounds = null;
  if (screens.reception) {
    const rect = canvas.getBoundingClientRect();
    const xs = screens.reception.points.map(point => point[0]);
    const ys = screens.reception.points.map(point => point[1]);
    canvas.appointmentMonitorBounds = {left:rect.left + Math.min(...xs), top:rect.top + Math.min(...ys),
      width:Math.max(...xs) - Math.min(...xs), height:Math.max(...ys) - Math.min(...ys)};
  }
}

export function mountStudio(canvas, { progress, project, isPaused = () => false,
  onReady = () => {}, onFailure = () => {}, onSlow, capture = false, blankScreens = false }) {
  const narrow = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!capture && reduced.matches) {
    onFailure('reduced-motion');
    return inert;
  }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha:false, antialias:true,
      powerPreference:narrow.matches ? 'low-power' : 'high-performance',
      preserveDrawingBuffer:capture,
    });
  } catch {
    onFailure('webgl-unavailable');
    return inert;
  }
  const gl = renderer.getContext();
  const debugInfo = !capture && gl.getExtension('WEBGL_debug_renderer_info');
  const software = Boolean(debugInfo && /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(
    gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(61, 1, 0.035, 100);
  const manager = new THREE.LoadingManager();
  // Give each visit a separate texture queue. A disposed/restarted visit cannot
  // mark its replacement ready, even when an earlier image finishes later.
  class VisitTextureLoader extends THREE.TextureLoader {
    constructor() { super(manager); }
  }
  const kit = { ...THREE, TextureLoader: VisitTextureLoader };
  const resources = [];
  let architecture, car, landscape, sunlight, reflection;
  let active = true, inView = true, loaded = true, ready = false;
  let frame = 0, timer = 0, clock = 0, previousTime = 0, lastProgress = -1;
  let pixelRatio = Math.min(devicePixelRatio || 1, narrow.matches ? 1.25 : 1.5);
  let previousUrl = project(), shadowStep, furnished = false;
  let pixelBudget = capture ? 2400000 : (software ? 64000 : 1300000);
  let movingFrames = 0, slowFrames = 0, offerSent = false;
  let resizeObserver, viewportObserver;

  function stopFrames() {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    frame = timer = 0;
  }

  function drawable() {
    return active && inView && !document.hidden && !isPaused();
  }

  function invalidate() {
    clearTimeout(timer);
    timer = 0;
    if (!drawable()) {
      stopFrames();
      previousTime = 0;
      return;
    }
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function resize() {
    if (!active) return;
    const { clientWidth:width, clientHeight:height } = canvas;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(pixelRatio, Math.sqrt(pixelBudget / (width * height))));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  }

  function quality(interval, moving) {
    if (capture || !moving || !interval) return;
    movingFrames++;
    if (interval > 63) slowFrames++;
    if (movingFrames < (software ? 8 : 18)) return;
    if (slowFrames >= (software ? 4 : 11)) {
      if (pixelRatio > 0.65) {
        pixelRatio = Math.max(0.65, pixelRatio * 0.72);
        pixelBudget = Math.max(30000, pixelBudget * 0.68);
        resize();
      } else if (!offerSent) {
        offerSent = true;
        if (onSlow) onSlow('slow-device');
        else fail('slow-device');
      }
    }
    movingFrames = slowFrames = 0;
  }

  function draw(now) {
    frame = 0;
    if (!drawable() || !loaded) return;
    const interval = previousTime ? now - previousTime : 0;
    previousTime = now;
    clock += Math.min(interval, 150) / 1000;
    const p = Math.max(0, Math.min(1, progress()));
    const moving = lastProgress >= 0 && p !== lastProgress;
    if (capture) clock = 0;
    try {
      const url = project();
      if (url !== previousUrl) {
        previousUrl = url;
        architecture.setProject(url);
      }
      if (!reflection && landscape.horizonMap.image) {
        reflection = ambientReflection(landscape.horizonMap.image);
        scene.environment = reflection;
        scene.environmentIntensity = 0.46;
        scene.environmentRotation.y = 2.15;
      }
      positionCamera(camera, p, narrow.matches);
      car.update(p, clock);
      architecture.update(p, clock);
      // Static sun occlusion can be reused at rest. Refresh while either
      // hinged door is moving and on entering the furnished upper room.
      const doorStep = (p > 0.008 && p < 0.22) || (p > 0.25 && p < 0.48)
        ? Math.floor(p * 92) : (p > 0.58 ? 100 : 0);
      const newFurnishings = !furnished && p > .34 && architecture.getScreenCorners('office');
      if ((!software && doorStep !== shadowStep) || newFurnishings) {
        shadowStep = doorStep;
        if (newFurnishings) furnished = true;
        renderer.shadowMap.needsUpdate = true;
      }
      renderer.render(scene, camera);
      publishScreenPositions(canvas, camera, architecture, p, capture);
      if (!ready) {
        ready = true;
        onReady();
      }
    } catch (error) {
      console.error('Studio frame failed', error);
      fail('scene-unavailable');
      return;
    }
    lastProgress = p;
    quality(interval, moving);
    // Scroll invalidations interrupt this timer immediately. The quiet office
    // and project inspection have no idle loop. Only the tree needs an idle tick.
    if (active && !capture && !frame && p < 0.88 && !(p >= 0.39 && p <= 0.443))
      timer = setTimeout(invalidate, 125);
  }

  function fail(reason) {
    dispose();
    onFailure(reason);
  }

  function contextLost(event) {
    event.preventDefault();
    fail('context-lost');
  }

  function motionChange() {
    if (reduced.matches && !capture) fail('reduced-motion');
  }

  function dispose() {
    if (!active) return;
    active = false;
    stopFrames();
    resizeObserver?.disconnect();
    viewportObserver?.disconnect();
    document.removeEventListener('visibilitychange', invalidate);
    window.removeEventListener('scroll', invalidate, true);
    narrow.removeEventListener('change', resize);
    reduced.removeEventListener('change', motionChange);
    canvas.removeEventListener('webglcontextlost', contextLost);
    for (const resource of resources.reverse()) resource.dispose?.();
    scene.environment = null;
    reflection?.dispose();
    sunlight?.shadow.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    scene.clear();
  }

  try {
    scene.background = new THREE.Color('#d7ded5');
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    sunlight = daylight(scene, narrow.matches);
    if (software) sunlight.shadow.mapSize.setScalar(512);
    renderer.shadowMap.needsUpdate = true;
    manager.onStart = () => { if (!ready) loaded = false; };
    manager.onLoad = () => { loaded = true; invalidate(); };
    landscape = buildLandscape(kit, scene, {streetGarden:true});
    resources.push(landscape);
    architecture = buildArchitecture(kit, scene, {
      previewUrl:previousUrl, mobile:narrow.matches, horizonMap:landscape.horizonMap, blankScreens,
      onInvalidate:invalidate,
    });
    resources.push(architecture);
    car = buildCar(kit, scene, {mobile:narrow.matches});
    resources.push(car);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    viewportObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      invalidate();
    });
    viewportObserver.observe(canvas);
    window.addEventListener('scroll', invalidate, {capture:true, passive:true});
    document.addEventListener('visibilitychange', invalidate);
    narrow.addEventListener('change', resize);
    reduced.addEventListener('change', motionChange);
    canvas.addEventListener('webglcontextlost', contextLost);
    resize();
  } catch (error) {
    console.error('Studio initialization failed', error);
    fail('scene-unavailable');
  }
  return { invalidate, dispose };
}
