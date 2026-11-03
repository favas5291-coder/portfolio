import {
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  Scene,
  Shape,
  ExtrudeGeometry,
  WebGLRenderer,
} from 'three';

// Model in CSS pixels so the metal stays attached to the actual HTML viewport.
export function mountRails(host) {
  const layer = host.querySelector('.metal-layer');
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  const scene = new Scene(),
    camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 1200);
  camera.position.z = 400;
  const profile = new Shape();
  profile.moveTo(-4, -1);
  profile.lineTo(-4, 1);
  profile.lineTo(-2.5, 2.6);
  profile.lineTo(1, 3);
  profile.lineTo(3.8, 2);
  profile.lineTo(4.8, 0);
  profile.lineTo(4.8, -1);
  profile.closePath();
  const geometry = new ExtrudeGeometry(profile, { depth: 1, bevelEnabled: false });
  geometry.rotateX(Math.PI / 2);
  const metal = new MeshStandardMaterial({
    color: new Color('#c8cbc4'),
    metalness: 0.28,
    roughness: 0.34,
  });
  const assembly = new Group();
  const rails = [-1, 1].map(() => {
    const mesh = new Mesh(geometry, metal);
    assembly.add(mesh);
    return mesh;
  });
  scene.add(assembly, new AmbientLight(0xffffff, 1.55));
  const key = new DirectionalLight(0xfff8e6, 3);
  key.position.set(-1, 0.45, 1);
  scene.add(key);
  const rim = new DirectionalLight(0xd2e1ec, 1.8);
  rim.position.set(1, 0, 0.45);
  scene.add(rim);
  renderer.setClearColor(0, 0);
  layer.appendChild(renderer.domElement);
  let visible = false,
    paused = false,
    raf = 0,
    first = null,
    animating = !host.classList.contains('used'),
    stopped = false;
  let w = 0,
    h = 0;
  function draw(now) {
    raf = 0;
    if (stopped || !visible || paused || document.hidden) return;
    const width = host.clientWidth,
      height = host.clientHeight;
    if (!width || !height) return;
    if (w !== width || h !== height) {
      w = width;
      h = height;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 540 ? 1.25 : 1.6));
      renderer.setSize(w, h, false);
      Object.assign(camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
      camera.updateProjectionMatrix();
      rails.forEach((mesh, i) => {
        mesh.position.set((i ? 1 : -1) * (w / 2 - 6), h / 2, 0);
        mesh.scale.set(1.2, h, 1);
      });
      // Extrusion along Z becomes the long Y axis after the profile rotation.
    }
    first ??= now;
    const t = Math.min(1, (now - first) / 1400);
    if (animating) key.position.x = -1 + Math.sin(Math.PI * t) * 0.65;
    renderer.render(scene, camera);
    host.dataset.renderer = 'webgl';
    if (animating && t < 1) invalidate();
    else animating = false;
  }
  function invalidate() {
    if (!raf && !stopped && visible && !paused && !document.hidden) raf = requestAnimationFrame(draw);
  }
  function interrupt() {
    animating = false;
    key.position.x = -1;
    invalidate();
  }
  function visibility() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else invalidate();
  }
  function lost(event) {
    event.preventDefault();
    paused = true;
    host.dataset.renderer = 'illustration';
  }
  function restored() {
    paused = false;
    invalidate();
  }
  const ro = new ResizeObserver(invalidate),
    io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) invalidate();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
  io.observe(host);
  ro.observe(host);
  host.addEventListener('pointerdown', interrupt);
  host.addEventListener('keydown', interrupt);
  document.addEventListener('visibilitychange', visibility);
  const canvas = renderer.domElement;
  canvas.addEventListener('webglcontextlost', lost);
  canvas.addEventListener('webglcontextrestored', restored);
  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener('visibilitychange', visibility);
    host.removeEventListener('pointerdown', interrupt);
    host.removeEventListener('keydown', interrupt);
    canvas.removeEventListener('webglcontextlost', lost);
    canvas.removeEventListener('webglcontextrestored', restored);
    geometry.dispose();
    metal.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    host.dataset.renderer = 'illustration';
  };
}
