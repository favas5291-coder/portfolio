import * as THREE from 'three';
import { buildOffice } from './buildOffice.js';
import { buildPeople } from './officePeople.js';
import { positionCamera } from './cameraPath.js';

export function startOffice(host, { readPosition, onReady, onFailure, onSlow }) {
  const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: mobile ? 'low-power' : 'high-performance',
  });
  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const software = info && /swiftshader|llvmpipe|softpipe|software rasterizer/i.test(
    gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
  );
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.08, 85);
  const loadingManager = new THREE.LoadingManager();
  const parts = [];
  let disposed = false;
  let texturesReady = false;
  let redraw = true;
  let caseOpen = Boolean(document.querySelector('.studio-case-dialog[open]'));
  let frame = 0,
    lastTime = 0,
    delivered = false,
    clock = 0;
  let density = Math.min(devicePixelRatio || 1, software ? 0.72 : mobile ? 1.25 : 1.5);
  let previousPosition = -1;
  let slowFrames = 0,
    sampleCount = 0,
    sampleTime = 0;
  const minimumDensity = software ? 0.45 : mobile ? 0.65 : 0.5;
  let verySlowFrames = 0;
  let offeredStills = false;
  let observer;

  function resize() {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    // Bound fill rate on very large displays.
    renderer.setPixelRatio(Math.min(density, Math.sqrt(1800000 / (w * h))));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    redraw = true;
  }
  function invalidate() {
    redraw = true;
  }
  function draw(now) {
    if (disposed || document.hidden || caseOpen || !texturesReady) return;
    frame = requestAnimationFrame(draw);
    const interval = lastTime ? now - lastTime : 0;
    const target = readPosition();
    // Give the visitor full motion while travelling. At rest, the actors need
    // fewer samples. No timer runs while the page is in the background.
    const moving = Math.abs(target - previousPosition) > 0.002;
    // The facade and exhibit hold their reading positions. A scroll, resize
    // or swatch change wakes the renderer immediately. Idle reading time is
    // excluded from the throughput sample.
    if ((target === 0 || target === 2) && target === previousPosition && !redraw) {
      lastTime = 0;
      return;
    }
    if (lastTime && interval < (moving ? 15 : 32)) return;
    // Ease the short entrance stride even for a mouse that sends a whole wheel
    // notch at once. Direct room links and restored positions settle immediately.
    let progress = target;
    if (delivered && lastTime && moving && previousPosition <= 1 && target <= 1) {
      const blend = 1 - Math.exp(-Math.min(interval, 100) / 160);
      progress = previousPosition + (target - previousPosition) * blend;
    }
    if (lastTime) clock += Math.min(0.35, interval / 1000);
    lastTime = now;
    previousPosition = progress;
    redraw = false;
    positionCamera(camera, progress);
    const pose = { progress, room: Math.round(progress), time: clock };
    try {
      for (const part of parts) part.update(pose);
      renderer.render(scene, camera);
      if (!delivered) {
        delivered = true;
        onReady();
      }
    } catch {
      onFailure();
      return;
    }
    // A single shader compile or tab switch should not change presentation.
    // Reduce fill rate first. Only sustained low throughput at the smallest
    // buffer changes the tour to its matching stills; the visitor can resume.
    if (interval === 0) return;
    sampleCount++;
    sampleTime += interval;
    if (interval > (mobile ? 44 : 52)) slowFrames++;
    if (interval > 100) verySlowFrames++;
    // On a software renderer nine samples can take many seconds. Two large
    // misses in the same window warrant trying the cheaper buffer immediately.
    const stalled = verySlowFrames >= 2 && sampleTime >= 420;
    if (sampleCount >= 9 || stalled) {
      if ((stalled || slowFrames >= 4) && density > minimumDensity) {
        density = stalled ? minimumDensity : Math.max(minimumDensity, density * 0.74);
        resize();
      } else if (!offeredStills && density <= minimumDensity && (stalled || sampleTime / sampleCount > 85)) {
        offeredStills = true;
        onSlow();
      }
      sampleCount = 0;
      sampleTime = 0;
      slowFrames = 0;
      verySlowFrames = 0;
    }
  }
  function visibility() {
    cancelAnimationFrame(frame);
    lastTime = 0;
    slowFrames = 0;
    sampleCount = 0;
    sampleTime = 0;
    verySlowFrames = 0;
    if (!disposed && texturesReady && !document.hidden && !caseOpen) frame = requestAnimationFrame(draw);
  }
  function caseVisibility(event) {
    caseOpen = Boolean(event.detail?.open);
    visibility();
  }
  function contextLost(event) {
    event.preventDefault();
    onFailure();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener('studio:product-colour', invalidate);
    canvas.removeEventListener('webglcontextlost', contextLost);
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('studio:case-visibility', caseVisibility);
    for (const part of parts) part.dispose?.();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  try {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    // Bake the solar shadows once per visit. Moving hands and doors use the
    // room's contact shading instead of re-rendering a building-wide shadow map.
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = software ? THREE.BasicShadowMap : THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    // Keep the matched photograph visible until every material in the first
    // view is ready, including the storefronts. Later swatch loads invalidate
    // the held exhibit without borrowing another scene's loading callbacks.
    loadingManager.onLoad = () => {
      if (disposed) return;
      redraw = true;
      if (texturesReady) return;
      texturesReady = true;
      visibility();
    };
    loadingManager.onError = () => {
      if (!disposed) onFailure();
    };
    parts.push(buildOffice(THREE, scene, { mobile, software, loadingManager }));
    parts.push(buildPeople(THREE, scene, { mobile, loadingManager }));
    host.append(canvas);
    resize();
    observer = new ResizeObserver(resize);
    observer.observe(host);
    window.addEventListener('studio:product-colour', invalidate);
    canvas.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('studio:case-visibility', caseVisibility);
    return { dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
