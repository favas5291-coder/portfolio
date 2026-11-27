import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { sceneScale, studioAssets } from './scene.config.ts';
import { positionCamera, doorPose } from './visit.js';
import { kerbReflection } from './reflections.js';

const inert = { invalidate() {}, dispose() {} };

function disposeModel(root) {
  const resources = new Set();
  root.traverse((node) => {
    if (!node.isMesh) return;
    resources.add(node.geometry);
    for (const material of [node.material].flat()) {
      resources.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
    }
  });
  for (const resource of resources) {
    resource.dispose();
    if (resource.isTexture) resource.source?.data?.close?.();
  }
}

function studioLights(scene, shadowSize) {
  const sun = new THREE.DirectionalLight('#ffe1b8', 2.32);
  const az = THREE.MathUtils.degToRad(sceneScale.sunAzimuth);
  const el = THREE.MathUtils.degToRad(sceneScale.sunElevation);
  sun.target.position.set(5, 1.4, 0);
  sun.position
    .set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el))
    .multiplyScalar(30)
    .add(sun.target.position);
  sun.castShadow = true;
  sun.shadow.mapSize.setScalar(shadowSize);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 9, bottom: -9, near: 10, far: 51 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.normalBias = 0.009;
  sun.shadow.bias = -0.00018;
  const room = new THREE.PointLight('#ffcd96', 22, 7);
  room.position.set(6.76, 5.17, -2.53);
  const lobby = new THREE.PointLight('#ffe0b6', 13, 6);
  lobby.position.set(3.95, 2.65, -2.35);
  scene.add(sun, sun.target, new THREE.HemisphereLight('#d7e6e9', '#9d9484', 0.37), room, lobby);
  return sun;
}

function monitorQuad(mesh) {
  const positions = mesh.geometry.attributes.position;
  const uv = mesh.geometry.attributes.uv;
  // GLTF UV space is top-left based. UV endpoints survive vertex reordering
  // and KHR_mesh_quantization, unlike hard-coded vertex indices.
  return [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ].map(([u, v]) => {
    let best = 0,
      least = Infinity;
    for (let i = 0; i < uv.count; i++) {
      const distance = (uv.getX(i) - u) ** 2 + (uv.getY(i) - v) ** 2;
      if (distance < least) {
        best = i;
        least = distance;
      }
    }
    return mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(positions, best));
  });
}

function projectPlate(corners, camera, width, height) {
  const projected = corners.map((point) => point.clone().project(camera));
  if (projected.some((point) => point.z < -1 || point.z > 1)) return null;
  return {
    width,
    height,
    aspect: corners[0].distanceTo(corners[1]) / corners[0].distanceTo(corners[3]),
    points: projected.map((point) => [((1 + point.x) * width) / 2, ((1 - point.y) * height) / 2]),
  };
}

export function mountStudio(
  canvas,
  {
    progress,
    project,
    isPaused = () => false,
    onReady = () => {},
    onFailure = () => {},
    onSlow = () => {},
    capture = false,
    blankScreens = false,
    composeCamera,
  },
) {
  const compact = matchMedia('(max-width: 760px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!capture && (reduced.matches || navigator.connection?.saveData)) {
    onFailure('reduced-motion');
    return inert;
  }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: compact.matches ? 'low-power' : 'high-performance',
      preserveDrawingBuffer: capture,
    });
  } catch {
    onFailure('webgl-unavailable');
    return inert;
  }

  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const software =
    info && /swiftshader|llvmpipe|software rasterizer/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(65, 1, 0.025, 140);
  const basis = new KTX2Loader().setTranscoderPath(studioAssets.basis).detectSupport(renderer);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).setKTX2Loader(basis);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.83;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const sunlight = studioLights(scene, capture || !compact.matches ? 2048 : 1024);
  scene.background = new THREE.Color('#bbc8c6');

  let disposed = false,
    ready = false,
    loaded = false,
    visible = true,
    frame = 0;
  let plate, corners, passenger, entrance, water, sky, previousUrl, displayTexture;
  let passengerClosed, entranceClosed, lastPassenger, lastEntrance;
  let imageRevision = 0;
  let budget = capture ? 2400000 : software ? 300000 : compact.matches ? 650000 : 1450000;
  let lastFrame = 0,
    lastProgress = -1,
    requestedAt = 0,
    expensive = 0,
    samples = 0;
  const models = [];
  const resize = new ResizeObserver(size);
  const viewport = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    invalidate();
  });
  function size() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h || disposed) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, capture ? 2 : 1.5, Math.sqrt(budget / (w * h))));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    invalidate();
  }
  function invalidate() {
    if (disposed || !loaded || !visible || document.hidden || isPaused()) {
      cancelAnimationFrame(frame);
      frame = lastFrame = 0;
      return;
    }
    if (!frame) {
      requestedAt = performance.now();
      frame = requestAnimationFrame(draw);
    }
  }
  function setImage(url) {
    previousUrl = url;
    const ticket = ++imageRevision;
    if (!url || blankScreens) return;
    const image = new Image();
    image.onload = () => {
      if (disposed || ticket !== imageRevision) return;
      const surface = document.createElement('canvas');
      surface.width = 768;
      surface.height = Math.round(
        (surface.width * corners[0].distanceTo(corners[3])) / corners[0].distanceTo(corners[1]),
      );
      const ctx = surface.getContext('2d');
      const scale = Math.min(surface.width / image.width, surface.height / image.height);
      const w = image.width * scale,
        h = image.height * scale;
      ctx.fillStyle = '#101310';
      ctx.fillRect(0, 0, surface.width, surface.height);
      ctx.drawImage(image, (surface.width - w) / 2, (surface.height - h) / 2, w, h);
      displayTexture?.dispose();
      displayTexture = new THREE.CanvasTexture(surface);
      displayTexture.flipY = false;
      displayTexture.colorSpace = THREE.SRGBColorSpace;
      displayTexture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      plate.material.map = displayTexture;
      plate.material.needsUpdate = true;
      invalidate();
    };
    image.src = url;
  }

  function draw(now) {
    frame = 0;
    if (disposed || !visible || document.hidden || isPaused() || !loaded) return;
    try {
      const p = Math.max(0, Math.min(1, progress()));
      const pose = doorPose(p);
      passenger.rotation.y = passengerClosed + pose.passenger;
      entrance.rotation.y = entranceClosed + pose.entrance;
      if (pose.passenger !== lastPassenger || pose.entrance !== lastEntrance) {
        renderer.shadowMap.needsUpdate = true;
        lastPassenger = pose.passenger;
        lastEntrance = pose.entrance;
      }
      const url = project?.();
      if (url !== previousUrl) setImage(url);
      positionCamera(camera, p, compact.matches);
      if (capture && composeCamera) {
        composeCamera(camera, scene);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
      }
      if (water && (p <= 0.45 || p >= 0.945 || composeCamera)) water.render(camera);
      renderer.render(scene, camera);
      if (capture) {
        const rect = p >= 0.945 && projectPlate(corners, camera, canvas.clientWidth, canvas.clientHeight);
        canvas.appointmentStillScreens = rect ? { office: rect } : {};
        canvas.appointmentStillScreen = rect || null;
      }
      if (!ready) {
        ready = true;
        canvas.dataset.models = 'ready';
        onReady();
      }
      const interval = now - lastFrame;
      // Ignore reading pauses while still counting a long GPU stall that held
      // up a frame already requested during a continuous scroll gesture.
      const followingScroll = requestedAt - lastFrame < 180;
      if (!capture && lastFrame && p !== lastProgress && followingScroll) {
        samples++;
        if (interval > 67) expensive++;
        if (samples >= 24) {
          if (expensive >= 17) {
            if (budget > 220000) {
              onSlow('slow-device');
              budget *= 0.6;
              size();
            } else {
              fail('slow-device');
              return;
            }
          }
          samples = expensive = 0;
        }
      }
      lastFrame = now;
      lastProgress = p;
    } catch (error) {
      console.error('Appointment render failed', error);
      fail('scene-unavailable');
    }
  }

  async function addModel(url) {
    const { scene: model } = await loader.loadAsync(url);
    if (disposed) {
      disposeModel(model);
      return;
    }
    model.traverse((node) => {
      if (!node.isMesh) return;
      node.receiveShadow = true;
      // The static indirect and AO bakes share secondary UVs. Balance them
      // with the live sky and key so plaster retains its tonal range.
      for (const material of [node.material].flat()) {
        if (material.aoMap?.channel === 1 && material.emissiveMap?.channel === 1) {
          material.aoMapIntensity = 0.34;
          material.emissiveIntensity = 0.44;
        }
      }
      node.castShadow = [node.material].flat().some((mat) => !mat.transparent || mat.alphaTest > 0);
    });
    scene.add(model);
    models.push(model);
  }
  async function loadSky() {
    const texture = await new HDRLoader().loadAsync(studioAssets.sky);
    if (disposed) {
      texture.dispose();
      return;
    }
    sky = texture;
    sky.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = scene.environment = sky;
    scene.environmentIntensity = 0.55;
    scene.backgroundIntensity = 0.78;
    scene.backgroundBlurriness = 0.035;
  }
  function motionChanged() {
    if (!capture && reduced.matches) fail('reduced-motion');
  }
  function contextLost(event) {
    event.preventDefault();
    fail('context-lost');
  }
  function fail(reason) {
    if (disposed) return;
    dispose();
    onFailure(reason);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect();
    viewport.disconnect();
    document.removeEventListener('visibilitychange', invalidate);
    window.removeEventListener('scroll', invalidate, true);
    compact.removeEventListener('change', size);
    reduced.removeEventListener('change', motionChanged);
    canvas.removeEventListener('webglcontextlost', contextLost);
    delete canvas.dataset.models;
    water?.dispose();
    sunlight.shadow.dispose();
    for (const model of models) disposeModel(model);
    sky?.dispose();
    basis.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    scene.clear();
  }
  resize.observe(canvas);
  viewport.observe(canvas);
  compact.addEventListener('change', size);
  reduced.addEventListener('change', motionChanged);
  window.addEventListener('scroll', invalidate, { capture: true, passive: true });
  document.addEventListener('visibilitychange', invalidate);
  canvas.addEventListener('webglcontextlost', contextLost);
  size();
  Promise.all([
    addModel(studioAssets.shell),
    addModel(studioAssets.car),
    addModel(studioAssets.tree),
    loadSky(),
  ])
    .then(() => {
      if (disposed) return;
      scene.updateMatrixWorld(true);
      passenger = scene.getObjectByName(sceneScale.passengerHinge);
      entrance = scene.getObjectByName(sceneScale.entranceHinge);
      plate = scene.getObjectByName(sceneScale.officeMonitor);
      if (!passenger || !entrance || !plate?.isMesh)
        throw new Error('Missing a required authored hinge or monitor');
      passengerClosed = passenger.rotation.y;
      entranceClosed = entrance.rotation.y;
      corners = monitorQuad(plate);
      plate.material.dispose();
      plate.material = new THREE.MeshBasicMaterial({
        color: blankScreens ? 0x101310 : 0xffffff,
        toneMapped: false,
      });
      const wet = [];
      scene.traverse((node) => {
        if (node.isMesh && node.material.name === 'PuddleWater') wet.push(node);
      });
      water = kerbReflection(renderer, scene, wet, compact.matches);
      loaded = true;
      invalidate();
    })
    .catch((error) => {
      if (!disposed) {
        console.error('Appointment asset load failed', error);
        fail('assets-unavailable');
      }
    });
  return { invalidate, dispose };
}
