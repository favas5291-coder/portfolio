import {
  BackSide,
  DoubleSide,
  BufferAttribute,
  CanvasTexture,
  DynamicDrawUsage,
  Group,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { buildHardware, pressLights } from './pressHardware.js';

const columns = 32,
  rows = 12;
const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const smooth = (n) => n * n * (3 - 2 * n);

function printTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f8f4e9';
  ctx.fillRect(0, 0, width, height);
  draw(ctx);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function wrapLines(ctx, text, x, y, width, leading, limit) {
  let line = '',
    count = 0;
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      ctx.fillText(line, x, y);
      y += leading;
      count++;
      if (count >= limit) return y;
      line = word;
    } else line = next;
  }
  if (line) ctx.fillText(line, x, y);
  return y + leading;
}

function makePaper() {
  const geometry = new PlaneGeometry(1, 1, columns, rows);
  const shadowGeometry = geometry.clone();
  const pos = geometry.attributes.position,
    shade = shadowGeometry.attributes.position;
  pos.setUsage(DynamicDrawUsage);
  shade.setUsage(DynamicDrawUsage);
  const colours = new BufferAttribute(new Float32Array(pos.count * 3).fill(1), 3);
  colours.setUsage(DynamicDrawUsage);
  geometry.setAttribute('color', colours);
  const face = new MeshBasicMaterial({ vertexColors: true });
  const verso = new MeshBasicMaterial({ vertexColors: true, side: BackSide });
  const shadowInk = new MeshBasicMaterial({
    color: 0x080b09,
    transparent: true,
    opacity: 0.29,
    depthWrite: false,
    side: DoubleSide,
  });
  const root = new Group(),
    front = new Mesh(geometry, face),
    reverse = new Mesh(geometry, verso);
  const shadow = new Mesh(shadowGeometry, shadowInk);
  for (const mesh of [front, reverse, shadow]) {
    mesh.frustumCulled = false;
    root.add(mesh);
  }
  const xs = new Float32Array(columns + 1),
    zs = new Float32Array(columns + 1);
  return {
    root,
    print(image, proof, aspect, maxWidth, footprint, specimen) {
      const w = maxWidth,
        h = Math.max(1, Math.round(w * aspect));
      face.map?.dispose();
      verso.map?.dispose();
      face.map = printTexture(w, h, (ctx) => {
        const area = footprint || { x: 0.025, y: 0.03, w: 0.95, h: 0.94 };
        const scale = Math.min((area.w * w) / image.naturalWidth, (area.h * h) / image.naturalHeight);
        const iw = image.naturalWidth * scale,
          ih = image.naturalHeight * scale;
        const left = area.x * w + (area.w * w - iw) / 2,
          top = area.y * h + (area.h * h - ih) / 2;
        ctx.drawImage(image, left, top, iw, ih);
        ctx.fillStyle = '#ec6a35';
        ctx.fillRect(w * 0.0225, h * 0.986, w * 0.023, Math.max(1, h * 0.005));
      });
      verso.map = printTexture(w, h, (ctx) => {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        const margin = w * 0.055;
        const innerWidth = w - 2 * margin;
        ctx.fillStyle = '#242520';
        ctx.font = `500 ${Math.min(0.022 * w, 0.05 * h)}px monospace`;
        wrapLines(
          ctx,
          (proof.detail || proof.title || '').toUpperCase(),
          margin,
          0.13 * h,
          innerWidth,
          0.037 * h,
          2,
        );
        if (specimen.photos.length) {
          const gap = w * 0.032;
          const slot = (innerWidth - gap * (specimen.photos.length - 1)) / specimen.photos.length;
          const available = 0.64 * h,
            top = 0.2 * h;
          specimen.photos.forEach(({ photo, caption }, i) => {
            const left = margin + i * (slot + gap);
            if (photo.complete && photo.naturalWidth) {
              // Match the close-up crop used on the static reverse.
              const scale = Math.max(slot / photo.naturalWidth, available / photo.naturalHeight);
              const sw = slot / scale,
                sh = available / scale;
              ctx.drawImage(
                photo,
                (photo.naturalWidth - sw) / 2,
                (photo.naturalHeight - sh) * 0.27,
                sw,
                sh,
                left,
                top,
                slot,
                available,
              );
            }
            ctx.font = `${Math.min(0.032 * w, 0.054 * h)}px monospace`;
            ctx.fillText(caption, left, top + available + 0.06 * h);
          });
        } else {
          ctx.fillStyle = '#929384';
          ctx.fillRect(margin, 0.22 * h, innerWidth, Math.max(1, w * 0.0015));
          ctx.fillStyle = '#242520';
          let y = 0.39 * h;
          for (const [i, line] of specimen.lines.entries()) {
            ctx.font = i === 0 ? `${0.085 * h}px Georgia,serif` : `${0.053 * h}px monospace`;
            y = wrapLines(ctx, line, margin, y, innerWidth, 0.09 * h, 2);
          }
        }
      });
      face.needsUpdate = verso.needsUpdate = true;
    },
    pose(height, turn, grabY, feedOffset, tip, nip) {
      const lift = Math.sin(turn * Math.PI),
        baseAngle = turn * Math.PI;
      for (let row = 0; row <= rows; row++) {
        // The grabbed side leads the unroll. Integrating the tangent maintains
        // length across each strip, including at the nearly edge-on midpoint.
        const v = row / rows,
          pull = 1 - Math.abs(v - grabY);
        let x = 0,
          z = 0;
        xs[0] = 0;
        zs[0] = 0;
        for (let col = 1; col <= columns; col++) {
          const u = (col - 0.5) / columns;
          const theta = clamp(baseAngle + lift * (1.64 * (u - 0.5) + 0.46 * (pull - 0.5)), 0, Math.PI);
          x += Math.cos(theta) / columns;
          z += Math.sin(theta) / columns;
          xs[col] = x;
          zs[col] = z;
        }
        const shiftX = 0.5 - turn;
        for (let col = 0; col <= columns; col++) {
          const u = col / columns,
            i = row * (columns + 1) + col;
          const dx = xs[col] - shiftX;
          const dz = zs[col] + tip * Math.max(0, 1 - ((1 - u) * 5 + (1 - v) * 5)) ** 2;
          const dy = Math.min(nip, (0.5 - v) * height + feedOffset + lift * 0.036 * (pull - 0.5) * u);
          pos.setXYZ(i, dx, dy, dz + 0.001);
          shade.setXYZ(i, dx + 0.006 + dz * 0.19, dy - 0.007 - dz * 0.22, -0.013);
          const light =
            1 - lift * (0.1 + 0.12 * Math.sin(Math.PI * u)) - Math.min(0.085, tip * 0.95) * u * v;
          colours.setXYZ(i, light, light, light);
        }
      }
      pos.needsUpdate = shade.needsUpdate = colours.needsUpdate = true;
      shadowInk.opacity = 0.29 - 0.13 * lift;
    },
    dispose() {
      geometry.dispose();
      shadowGeometry.dispose();
      face.map?.dispose();
      verso.map?.dispose();
      face.dispose();
      verso.dispose();
      shadowInk.dispose();
    },
  };
}

// The underlying HTML sheet owns content, links, semantics and input. This
// transparent layer only replaces its appearance during the physical motion.
export function mountPress(stage) {
  const layer = stage.querySelector('.press-canvas'),
    sheet = stage.querySelector('.press-sheet');
  if (!layer || !sheet) throw new Error('The press needs a canvas mount and a sheet.');
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    display: 'block',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  });
  layer.appendChild(canvas);
  const scene = new Scene(),
    camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 12);
  camera.position.z = 5;
  pressLights(scene);
  const assembly = new Group(),
    projection = new Group();
  assembly.add(projection);
  scene.add(assembly);
  const paper = makePaper();
  projection.add(paper.root);
  const motionPref = matchMedia('(prefers-reduced-motion: reduce)');
  let project,
    sourceImage,
    model,
    aspect = 0,
    ticket = 0,
    request = 0;
  let width = 0,
    turn = 0,
    grabY = 1,
    feedTime = null,
    previousFrame = 0;
  let resizeDirty = true,
    imageDirty = false,
    visible = false,
    lost = false,
    disposed = false;
  let lod = 0,
    frameTimeSum = 0,
    frameSamples = 0;

  function motionState(state) {
    if (state) {
      stage.dataset.pressMotion = state;
      stage.setAttribute('data-turn-mesh', '');
    } else {
      delete stage.dataset.pressMotion;
      stage.removeAttribute('data-turn-mesh');
    }
  }
  function stopFrame() {
    cancelAnimationFrame(request);
    request = 0;
    previousFrame = 0;
  }
  function invalidate() {
    if (!request && !disposed && !lost && visible && !document.hidden && !motionPref.matches)
      request = requestAnimationFrame(draw);
  }
  function fit() {
    const host = layer.getBoundingClientRect(),
      rect = sheet.getBoundingClientRect();
    if (!host.width || !host.height || !rect.width || !rect.height) return false;
    width = host.width;
    const w = rect.width,
      ratio = rect.height / w;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lod ? 1 : width < 510 ? 1.3 : 1.65));
    renderer.setSize(Math.round(width), Math.round(host.height), false);
    camera.left = -width / w / 2;
    camera.right = -camera.left;
    camera.top = host.height / w / 2;
    camera.bottom = -camera.top;
    camera.updateProjectionMatrix();
    assembly.position.set(
      (rect.x + rect.width / 2 - host.x - width / 2) / w,
      (host.y + host.height / 2 - rect.y - rect.height / 2) / w,
      0,
    );
    projection.matrixAutoUpdate = false;
    projection.matrix.makeShear(0, 0, 0, 0, width < 510 ? 0.055 : 0.18, width < 510 ? 0.09 : 0.26);
    if (!model || Math.abs(ratio - aspect) > 0.002) {
      if (model) {
        projection.remove(model.root);
        model.dispose();
      }
      aspect = ratio;
      model = buildHardware(aspect, width < 510);
      projection.add(model.root);
      imageDirty = true;
    }
    resizeDirty = false;
    return true;
  }
  function reprint() {
    const print = sheet.querySelector('img');
    const rect = sheet.getBoundingClientRect(),
      ink = print?.getBoundingClientRect();
    let footprint;
    if (ink && ink.width && ink.height && ink.width <= rect.width * 1.01) {
      footprint = {
        x: (ink.left - rect.left) / rect.width,
        y: (ink.top - rect.top) / rect.height,
        w: ink.width / rect.width,
        h: ink.height / rect.height,
      };
    }
    const photos = [...sheet.querySelectorAll('.ed-samples figure')]
      .map((figure) => ({
        photo: figure.querySelector('img'),
        caption: figure.querySelector('figcaption')?.textContent || '',
      }))
      .filter((item) => item.photo);
    const lines = [...sheet.querySelectorAll('.ed-slip p')].map((line) => line.textContent);
    paper.print(sourceImage, project, aspect, width < 510 ? 640 : 1024, footprint, { photos, lines });
    imageDirty = false;
  }
  function draw(now) {
    request = 0;
    if (document.hidden || !visible || disposed || lost || motionPref.matches) return;
    if (resizeDirty && !fit()) return;
    if (imageDirty && sourceImage) reprint();
    const frame = previousFrame ? now - previousFrame : 0;
    previousFrame = now;
    if (feedTime !== null && frame && !lod && frame < 200) {
      frameTimeSum += frame;
      frameSamples++;
      if (frameSamples === 16 && frameTimeSum / frameSamples > 35) {
        lod = 1;
        resizeDirty = true;
      }
    }
    let advance = 1,
      offset = 0,
      tip = 0;
    if (feedTime !== null && sourceImage) {
      feedTime += Math.min(80, frame);
      const drive = smooth(clamp(feedTime / 1750));
      advance = drive;
      // Back of the sheet enters the roller; the last millimetres arrive after it parks.
      offset = (1 - drive) * aspect * 0.21 + (1 - smooth(clamp((feedTime - 1550) / 850))) * 0.009;
      const lift = clamp((feedTime - 2110) / 880);
      tip = Math.sin(lift * Math.PI) ** 2 * 0.045;
      if (feedTime >= 2990) feedTime = null;
    }
    model.pose(advance);
    const turning = turn > 0.0002 && turn < 0.9998;
    const state = sourceImage && (turning ? 'turn' : feedTime !== null ? 'feed' : null);
    paper.root.visible = Boolean(state);
    if (state) {
      const nip = turning
        ? Infinity
        : aspect / 2 + 0.053 - (1 - advance) * Math.min(0.39, aspect * 0.48);
      paper.pose(aspect, turn, grabY, offset, tip, nip);
    }
    renderer.render(scene, camera);
    stage.dataset.renderer = 'webgl';
    motionState(state);
    if ((feedTime !== null && sourceImage) || resizeDirty) invalidate();
    else previousFrame = 0;
  }
  function feed() {
    if (disposed) return;
    feedTime = 0;
    previousFrame = 0;
    invalidate();
  }
  function setProof(next) {
    if (disposed || !next?.src) return;
    if (next.src === project?.src && sourceImage) return;
    project = next;
    const seq = ++ticket;
    sourceImage = null;
    feedTime = null;
    turn = 0;
    motionState(null);
    invalidate();
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (disposed || seq !== ticket) return;
      sourceImage = img;
      imageDirty = true;
      if (turn === 0) feed();
      else invalidate();
    };
    img.src = next.src;
  }
  function setTurn(progress, grab = 1) {
    if (disposed) return;
    turn = clamp(progress);
    grabY = clamp(grab);
    feedTime = null;
    invalidate();
  }
  const ro = new ResizeObserver(() => {
    resizeDirty = true;
    invalidate();
  });
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) invalidate();
    else stopFrame();
  });
  ro.observe(stage);
  ro.observe(sheet);
  io.observe(stage);
  function onVisibility() {
    if (document.hidden) stopFrame();
    else invalidate();
  }
  function fallback() {
    stopFrame();
    motionState(null);
    stage.dataset.renderer = 'illustration';
    canvas.style.visibility = 'hidden';
  }
  function onPreference() {
    if (motionPref.matches) {
      feedTime = null;
      fallback();
    } else {
      canvas.style.visibility = '';
      invalidate();
    }
  }
  function contextLost(event) {
    event.preventDefault();
    lost = true;
    fallback();
  }
  function contextRestored() {
    lost = false;
    resizeDirty = true;
    feedTime = null;
    onPreference();
  }
  function assetLoaded() {
    imageDirty = true;
    invalidate();
  }
  sheet.addEventListener('load', assetLoaded, true);
  document.addEventListener('visibilitychange', onVisibility);
  motionPref.addEventListener('change', onPreference);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  return {
    setProof,
    setTurn,
    feed,
    dispose() {
      disposed = true;
      ticket++;
      fallback();
      ro.disconnect();
      io.disconnect();
      sheet.removeEventListener('load', assetLoaded, true);
      document.removeEventListener('visibilitychange', onVisibility);
      motionPref.removeEventListener('change', onPreference);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      model?.dispose();
      paper.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
