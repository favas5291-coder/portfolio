import * as T from 'three';
import { buildInstrument } from './instrument.js';

const clamp = T.MathUtils.clamp;
const smooth = T.MathUtils.smoothstep;
const mix = T.MathUtils.lerp;

// All four views inhabit the same room, expressed in metres. The off-centre
// frontal Work view leaves a margin for the task and keeps DOM text square.
function shots(aspect) {
  const phone = aspect < 0.84;
  const workField = phone ? 3.95 : 8.52;
  const fieldHeight = workField / aspect;
  const workZ = fieldHeight / (2 * Math.tan((50 * Math.PI) / 360));
  const workX = phone ? 0 : -0.166 * workField;
  const workY = 2.32 + (phone ? 0.165 : -0.024) * fieldHeight;
  const intro = phone
    ? { at: 0, eye: [3.95, 1.68, 3.55], aim: [0.67, 2.0, 1.32], fov: 68 }
    : { at: 0, eye: [2.6, 1.62, 3.1], aim: [-0.98, 1.94, 1.32], fov: 68 };
  const pass = phone
    ? { at: 0.22, eye: [1.96, 1.61, 2.44], aim: [0.12, 2.01, -0.34], fov: 65 }
    : { at: 0.22, eye: [2.08, 1.49, 1.9], aim: [0.13, 1.85, -0.45], fov: 60 };
  return [
    intro,
    pass,
    { at: 0.54, eye: [0.48, 1.51, 3.31], aim: [-0.59, 2.05, -0.7], fov: 55 },
    { at: 1, eye: [workX, workY, workZ], aim: [workX, workY, 0], fov: 50 },
    { at: 1.5, eye: [-1.32, 1.75, 4.32], aim: [1.93, 2.1, -0.39], fov: 51 },
    phone
      ? { at: 2, eye: [0.26, 1.96, 3.73], aim: [5.16, 2.4, 0.52], fov: 64 }
      : { at: 2, eye: [-0.42, 1.64, 3.4], aim: [4.64, 2.12, -0.37], fov: 48 },
    { at: 2.45, eye: [-0.85, 2.1, 5.57], aim: [1.31, 2.33, -0.78], fov: 52 },
    phone
      ? { at: 3, eye: [-0.93, 2.4, 12.0], aim: [0.03, 2.38, -0.2], fov: 60 }
      : { at: 3, eye: [-2.92, 2.37, 8.4], aim: [-1.38, 2.45, -0.22], fov: 47 },
  ];
}

function cameraAt(camera, path, value) {
  let i = 0;
  while (i < path.length - 2 && value > path[i + 1].at) i++;
  const a = path[i],
    b = path[i + 1];
  const t = clamp((value - a.at) / (b.at - a.at), 0, 1);
  const dt = b.at - a.at;
  // Cubic Hermite with zero speed at each editorial stop and a continuous
  // tangent through the near-fin pass, pivot points and the return dolly.
  function derivative(index, key, j) {
    if (Number.isInteger(path[index].at)) return 0;
    return (
      (path[index + 1][key][j] - path[index - 1][key][j]) / (path[index + 1].at - path[index - 1].at)
    );
  }
  function vector(key) {
    return a[key].map(
      (n, j) =>
        mix(n, b[key][j], t * t * (3 - 2 * t)) +
        dt *
          (t * (1 - t) * (1 - t) * derivative(i, key, j) - t * t * (1 - t) * derivative(i + 1, key, j)),
    );
  }
  camera.position.set(...vector('eye'));
  camera.lookAt(...vector('aim'));
  const fov = mix(a.fov, b.fov, t * t * (3 - 2 * t));
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld();
}

export function mountScene(
  host,
  { readState, onReady = () => {}, onFailure = () => {}, onSlow = () => {}, capture = false },
) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;';
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.97;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const gl = renderer.getContext();
  const diagnostics = gl.getExtension('WEBGL_debug_renderer_info');
  const device = gl.getParameter(diagnostics?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER) || '';
  const software =
    /swiftshader|llvmpipe|softpipe|software rasterizer|software renderer|microsoft basic render/i.test(
      device,
    );
  const budgets = software && !capture ? [180000, 105000, 58000] : [1500000, 560000, 180000];
  let tier = 0;
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(52, 1, 0.055, 52);
  const parent = host.parentElement || host;
  let active = true,
    ready = false,
    loaded = false,
    frame = 0,
    resizePending = true;
  let w = 1,
    h = 1,
    route = [],
    model;
  let lastProgress = -10,
    lastWidth = -10,
    lastY = -10,
    lastStamp = 0,
    dirty = true;
  let pricedFrame = 0,
    slowTime = 0,
    probe = false;
  let offered = false,
    lastSignature = '';
  const manager = new T.LoadingManager();
  manager.onLoad = () => {
    loaded = true;
    dirty = true;
  };
  const projection = new T.Vector3();
  let observer;
  function resize() {
    w = host.clientWidth || innerWidth;
    h = host.clientHeight || innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    route = shots(w / h);
    const nativeRatio = Math.min(devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(Math.min(nativeRatio, Math.sqrt(budgets[tier] / (w * h))));
    host.dataset.renderTier = String(tier);
    renderer.setSize(w, h, false);
    dirty = true;
    resizePending = false;
  }
  function screenPoint(x, y) {
    projection.set(x, y, 0.024).project(camera);
    return [((projection.x + 1) * w) / 2, ((1 - projection.y) * h) / 2];
  }
  function render(state = readState()) {
    if (!active) return;
    if (resizePending) resize();
    const progress = clamp(state.progress || 0, 0, 3),
      width = clamp(state.width ?? 1, 0, 1);
    const phone = w / h < 0.84;
    cameraAt(camera, route, progress);
    const engage = smooth(progress, 0.1, 0.91),
      farewell = smooth(progress, 2.21, 2.94);
    const workGap = phone ? mix(3.08, 3.67, width) : mix(1.9, 4.65, width);
    let gap = mix(mix(phone ? 0.97 : 1.4, workGap, engage), 3.24, farewell);
    let cx = 0,
      cy = 2.32,
      height = mix(phone ? 3.52 : 2.25, 2.18, farewell);
    const hold = 1 - smooth(Math.abs(progress - 1), 0.008, 0.14);
    let deskX = mix(phone ? 0.84 : 0.15, 0, engage),
      deskZ = mix(phone ? 2.14 : 1.8, 1.87, engage);
    let deskScale = 1,
      deskDepth = 1;
    if (hold > 0.0001) {
      const panel = document.querySelector('.vw-projection');
      const rect = panel?.getBoundingClientRect();
      if (rect && rect.width > 80 && rect.height > 36 && rect.top < h && rect.bottom > 0) {
        // Intersect the HTML rectangle with the actual projector plane. Registration
        // works with changing copy length, zoom, wide/compact and restored details.
        const bounds = host.getBoundingClientRect();
        const rest = route.find((shot) => shot.at === 1).eye;
        const unit = (2 * rest[2] * Math.tan((50 * Math.PI) / 360)) / h;
        gap = mix(gap, rect.width * unit, hold);
        cx = mix(cx, rest[0] + (rect.left - bounds.left + rect.width / 2 - w / 2) * unit, hold);
        cy = mix(cy, rest[1] - (rect.top - bounds.top + rect.height / 2 - h / 2) * unit, hold);
        height = mix(height, rect.height * unit, hold);
      }
    }
    if (hold > 0.0001) {
      // Register the *one* visible grip to the operator's linoleum surface. At
      // rest, HTML owns the thumb and slot so there is a single draggable affordance.
      const slider = document.querySelector('.vw-width-grip');
      const thumbTrack = slider?.getBoundingClientRect();
      const bounds = host.getBoundingClientRect();
      const rest = route.find((shot) => shot.at === 1).eye;
      const u = thumbTrack
        ? thumbTrack.left - bounds.left + thumbTrack.width / 2
        : w * (phone ? 0.51 : 0.649);
      const v = thumbTrack
        ? thumbTrack.top - bounds.top + thumbTrack.height / 2
        : h * (phone ? 0.867 : 0.753);
      const rail = slider?.closest('.vw-rail')?.getBoundingClientRect();
      const railPixels = rail?.width || (phone ? w * 0.89 : Math.min(w * 0.46, 535));
      const pitch = (v / h - 0.5) * 2 * Math.tan((50 * Math.PI) / 360);
      if (pitch > 0.03) {
        const distance = clamp((rest[1] - 0.867) / pitch, rest[2] - 3.3, rest[2] - 0.16);
        const metresPerPx = (distance * 2 * Math.tan((50 * Math.PI) / 360)) / h;
        deskX = mix(deskX, rest[0] + (u - w / 2) * metresPerPx, hold);
        deskZ = mix(deskZ, rest[2] - distance, hold);
        deskScale = mix(1, clamp((railPixels * metresPerPx) / 2.87 + 0.1, 0.73, 1.4), hold);
        deskDepth = mix(1, 1.47, hold);
      }
    }
    model.update({
      gap,
      cx,
      cy,
      height,
      progress,
      width: mix(1, width, engage),
      deskX,
      deskZ,
      deskScale,
      deskDepth,
      hideGrip: hold > 0.82,
    });
    const tl = screenPoint(cx - gap / 2, cy + height / 2),
      br = screenPoint(cx + gap / 2, cy - height / 2);
    const entries = [tl[0], tl[1], br[0] - tl[0], br[1] - tl[1]].map((n) => n.toFixed(2));
    const signature = entries.join(' ');
    if (signature !== lastSignature) {
      ['x', 'y', 'width', 'height'].forEach((key, i) =>
        parent.style.setProperty('--projection-' + key, entries[i] + 'px'),
      );
      lastSignature = signature;
    }
    host.dataset.sceneProgress = progress.toFixed(3);
    host.dataset.aperture = gap.toFixed(3);
    renderer.render(scene, camera);
    if (loaded && !ready) {
      ready = true;
      onReady();
    }
  }
  // Price each moving draw at the *next* foreground animation callback. Software
  // WebGL can return from render() quickly, then block for seconds presenting it.
  // This also catches the last frame of a single wheel or width-control gesture.
  function accountForDraw(elapsed) {
    if (capture || offered || elapsed < 68) return;
    slowTime += elapsed;
    if (elapsed < 220 && slowTime < 330) return;
    const minimum = budgets.length - 1;
    if (tier < minimum) {
      tier = elapsed >= 220 ? minimum : tier + 1;
      resizePending = true;
      dirty = true;
      probe = true;
      slowTime = 0;
    } else if (elapsed >= 220 || slowTime >= 470) {
      offered = true;
      onSlow();
    }
  }
  function tick(stamp) {
    if (!active || document.hidden) return;
    frame = requestAnimationFrame(tick);
    if (pricedFrame) {
      accountForDraw(stamp - pricedFrame);
      pricedFrame = 0;
    }
    if (!active || !loaded) return;
    const state = readState(),
      y = window.scrollY;
    const moved =
      Math.abs((state.progress || 0) - lastProgress) > 0.00014 ||
      Math.abs((state.width ?? 1) - lastWidth) > 0.00014 ||
      y !== lastY;
    if (!dirty && !moved) {
      lastStamp = 0;
      slowTime = 0;
      return;
    }
    if (lastStamp && stamp - lastStamp < 14) return;
    const price = ready && (moved || probe);
    probe = false;
    try {
      render(state);
    } catch {
      onFailure();
      return;
    }
    lastProgress = state.progress || 0;
    lastWidth = state.width ?? 1;
    lastY = y;
    lastStamp = stamp;
    if (price) pricedFrame = stamp;
    dirty = false;
  }
  function visibility() {
    cancelAnimationFrame(frame);
    lastStamp = pricedFrame = slowTime = 0;
    probe = false;
    if (!document.hidden && active) {
      dirty = true;
      frame = requestAnimationFrame(tick);
    }
  }
  function lost(e) {
    e.preventDefault();
    if (active) onFailure();
  }
  function dispose() {
    if (!active) return;
    active = false;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    document.removeEventListener('visibilitychange', visibility);
    canvas.removeEventListener('webglcontextlost', lost);
    model?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }
  try {
    model = buildInstrument(scene, manager, software && !capture ? 512 : 1024);
    host.append(canvas);
    resize();
    observer = new ResizeObserver(() => {
      resizePending = true;
      dirty = true;
    });
    observer.observe(host);
    const sheet = document.querySelector('.vw-projection');
    if (sheet) observer.observe(sheet);
    document.addEventListener('visibilitychange', visibility);
    canvas.addEventListener('webglcontextlost', lost);
    frame = requestAnimationFrame(tick);
    return { render, dispose };
  } catch (err) {
    dispose();
    throw err;
  }
}
