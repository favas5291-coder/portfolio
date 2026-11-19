import * as THREE from 'three';
import { buildOffice } from './buildOffice.js';
import { buildPeople } from './officePeople.js';
import { positionCamera } from './cameraPath.js';

export function startOffice(host, { readPosition, onReady, onFailure }) {
  const mobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: mobile ? 'low-power' : 'high-performance',
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.08, 85);
  const parts = [];
  let disposed = false;
  let caseOpen = Boolean(document.querySelector('.studio-case-dialog[open]'));
  let frame = 0,
    lastTime = 0,
    delivered = false,
    clock = 0;
  let density = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  let pointerX = 0,
    pointerY = 0,
    lookX = 0,
    lookY = 0,
    previousPosition = -1;
  let slowFrames = 0,
    sampleCount = 0;
  let observer;

  function resize() {
    const { clientWidth: w, clientHeight: h } = host;
    if (!w || !h) return;
    // Bound fill rate on very large displays.
    renderer.setPixelRatio(Math.min(density, Math.sqrt(1800000 / (w * h))));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  function move(e) {
    if (e.pointerType !== 'mouse') return;
    const bounds = host.getBoundingClientRect();
    pointerX = (2 * (e.clientX - bounds.left)) / bounds.width - 1;
    pointerY = 1 - (2 * (e.clientY - bounds.top)) / bounds.height;
  }
  function leave() {
    pointerX = 0;
    pointerY = 0;
  }
  function draw(now) {
    if (disposed || document.hidden || caseOpen) return;
    frame = requestAnimationFrame(draw);
    const interval = now - lastTime;
    const target = readPosition();
    // Give the visitor full motion while travelling. At rest, the actors need
    // fewer samples. No timer runs while the page is in the background.
    const moving = Math.abs(target - previousPosition) > 0.002;
    if (lastTime && interval < (moving ? 15 : 32)) return;
    // Ease the short entrance stride even for a mouse that sends a whole wheel
    // notch at once. Direct room links and restored positions settle immediately.
    let progress = target;
    if (delivered && lastTime && moving && previousPosition <= 1 && target <= 1) {
      const blend = 1 - Math.exp(-Math.min(interval, 100) / 160);
      progress = previousPosition + (target - previousPosition) * blend;
    }
    if (lastTime) clock += Math.min(0.08, interval / 1000);
    lastTime = now;
    previousPosition = progress;
    lookX += ((moving ? 0 : pointerX) - lookX) * 0.12;
    lookY += ((moving ? 0 : pointerY) - lookY) * 0.12;
    positionCamera(camera, progress, lookX, lookY);
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
    sampleCount++;
    if (sampleCount > 3 && interval > (mobile ? 44 : 52)) slowFrames++;
    if (slowFrames >= 4 && density > 0.65) {
      density = Math.max(0.65, density * 0.78);
      slowFrames = 0;
      sampleCount = 0;
      resize();
    }
  }
  function visibility() {
    cancelAnimationFrame(frame);
    lastTime = 0;
    if (!document.hidden && !caseOpen) frame = requestAnimationFrame(draw);
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
    host.removeEventListener('pointermove', move);
    host.removeEventListener('pointerleave', leave);
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
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    parts.push(buildOffice(THREE, scene, { mobile }));
    parts.push(buildPeople(THREE, scene, { mobile }));
    host.append(canvas);
    resize();
    observer = new ResizeObserver(resize);
    observer.observe(host);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    canvas.addEventListener('webglcontextlost', contextLost);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('studio:case-visibility', caseVisibility);
    frame = requestAnimationFrame(draw);
    return { dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
