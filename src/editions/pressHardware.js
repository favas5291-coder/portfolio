import {
  BoxGeometry,
  CanvasTexture,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  SRGBColorSpace,
  Vector3,
} from 'three';

// A studio reflection map sampled on a polished sphere. Long softboxes give the
// turning cylinder a brushed highlight without an environment download or PMREM.
function steelReflection() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  const pixels = context.createImageData(128, 128);
  for (let y = 0; y < 128; y++) {
    for (let x = 0; x < 128; x++) {
      const nx = (x - 63.5) / 64,
        ny = (63.5 - y) / 64;
      const nz = Math.sqrt(Math.max(0.001, 1 - nx * nx - ny * ny));
      const ry = 2 * ny * nz,
        rx = 2 * nx * nz;
      const strip = (center, spread) => Math.exp(-(((ry - center) / spread) ** 2));
      const studio =
        100 +
        46 * ny +
        112 * strip(0.49, 0.32) -
        64 * strip(-0.38, 0.19) +
        68 * strip(-0.67, 0.1) +
        13 * Math.cos(rx * 2.8);
      const offset = (y * 128 + x) * 4;
      pixels.data.set([studio * 1.025, studio * 1.014, studio, 255], offset);
    }
  }
  context.putImageData(pixels, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function softShadowMap() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(0,0,0,.76)');
  gradient.addColorStop(0.56, 'rgba(0,0,0,.36)');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

export function pressLights(scene) {
  scene.add(new HemisphereLight(0xfff7e6, 0x6d7476, 1.45));
  const light = new DirectionalLight(0xfff5e7, 2.15);
  light.position.set(-2, 4, 5);
  scene.add(light);
}

// One unit is the width of the sheet. The normal camera sees the paper face-on.
// A shallow cabinet projection of the hardware gives its castings visible depth.
export function buildHardware(sheetHeight, compact) {
  const root = new Group();
  const runner = new Group(),
    axle = new Group(),
    crank = new Group();
  const reflection = steelReflection(),
    shadowMap = softShadowMap();
  const metal = (color) => new MeshMatcapMaterial({ matcap: reflection, color });
  const enamel = (color, roughness) => new MeshStandardMaterial({ color, roughness, metalness: 0.18 });
  const steel = metal(0xffffff),
    edge = metal(0x8a8e8e),
    black = metal(0x444745);
  const ink = enamel(0x292c2b, 0.6),
    bed = enamel(0x3b3d39, 0.68);
  const grip = enamel(0xed692d, 0.4),
    darkGrip = enamel(0x9d3a18, 0.55);
  const shadowInk = new MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });
  const materials = [steel, edge, black, ink, bed, grip, darkGrip, shadowInk];
  const cube = new BoxGeometry(),
    plane = new PlaneGeometry();
  const cylinder = new CylinderGeometry(1, 1, 1, 40),
    geometries = [cube, plane, cylinder];
  const a = new Vector3(),
    b = new Vector3(),
    up = new Vector3(0, 1, 0);

  function part(parent, geometry, material, x, y, z) {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function box(parent, mat, x, y, z, w, h, d) {
    const mesh = part(parent, cube, mat, x, y, z);
    mesh.scale.set(w, h, d);
    return mesh;
  }
  function pin(parent, mat, start, end, radius) {
    a.set(...start);
    b.set(...end);
    const span = a.distanceTo(b);
    const mesh = part(parent, cylinder, mat, 0, 0, 0);
    mesh.position.copy(a).lerp(b, 0.5);
    mesh.quaternion.setFromUnitVectors(up, b.sub(a).normalize());
    mesh.scale.set(radius, span, radius);
    return mesh;
  }
  function casting(width, height, radius, depth) {
    const w = width / 2,
      h = height / 2,
      r = radius,
      path = new Shape();
    path.moveTo(-w + r, -h);
    path.lineTo(w - r, -h);
    path.quadraticCurveTo(w, -h, w, -h + r);
    path.lineTo(w, h - r);
    path.quadraticCurveTo(w, h, w - r, h);
    path.lineTo(-w + r, h);
    path.quadraticCurveTo(-w, h, -w, h - r);
    path.lineTo(-w, -h + r);
    path.quadraticCurveTo(-w, -h, -w + r, -h);
    const shape = new ExtrudeGeometry(path, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 4,
    });
    geometries.push(shape);
    return shape;
  }
  function screw(parent, x, y, z) {
    pin(parent, edge, [x, y, z], [x, y, z + 0.002], 0.006);
    const cut = box(parent, ink, x, y, z + 0.0025, 0.008, 0.0014, 0.0009);
    cut.rotation.z = -0.48;
  }

  const height = sheetHeight + 0.133,
    top = sheetHeight / 2;
  const groundShadow = part(root, plane, shadowInk, 0.018, -0.037, -0.12);
  groundShadow.scale.set(1.36, height * 1.36, 1);
  part(root, casting(1.12, height, 0.022, 0.035), ink, 0, 0.016, -0.07);
  part(root, casting(1.048, height - 0.033, 0.009, 0.012), bed, 0, 0.019, -0.035);
  for (const side of [-1, 1]) {
    const x = side * 0.541;
    box(root, black, x, 0.014, -0.018, 0.023, height - 0.054, 0.012);
    box(root, edge, x - 0.004, 0.014, -0.011, 0.003, height - 0.054, 0.002);
    screw(root, x, top + 0.059, -0.006);
    screw(root, x, -top - 0.025, -0.006);
  }
  root.add(runner);
  runner.add(axle);
  axle.position.z = 0.042;
  // Shaft, steel impression cylinder, stepped journal ends, oil-black bearings.
  pin(axle, black, [-0.579, 0, -0.005], [0.59, 0, -0.005], 0.021);
  pin(axle, steel, [-0.487, 0, 0], [0.487, 0, 0], 0.046);
  for (const side of [-1, 1]) {
    const x = 0.49 * side;
    pin(axle, edge, [x, 0, 0], [x + 0.011 * side, 0, 0], 0.044);
    pin(axle, steel, [x + 0.011 * side, 0, 0], [x + 0.016 * side, 0, 0], 0.035);
    box(axle, black, x + 0.004 * side, 0.008, 0.042, 0.006, 0.008, 0.0018);
    const block = part(runner, casting(0.046, 0.109, 0.008, 0.037), ink, 0.535 * side, 0, 0.011);
    screw(block, 0, -0.038, 0.039);
    screw(block, 0, 0.038, 0.039);
    pin(runner, edge, [0.513 * side, 0, 0.043], [0.525 * side, 0, 0.043], 0.027);
  }
  // One orange operator handle. The offset arm turns around the roller spindle.
  crank.position.set(compact ? 0.566 : 0.577, 0, 0.04);
  crank.scale.x = compact ? 0.66 : 1;
  runner.add(crank);
  pin(crank, edge, [0, 0, 0], [0.006, -0.059, 0.03], 0.009);
  pin(crank, black, [-0.005, 0, 0], [0.009, 0, 0], 0.016);
  pin(crank, darkGrip, [0.002, -0.059, 0.03], [0.012, -0.059, 0.03], 0.014);
  pin(crank, grip, [0.01, -0.059, 0.03], [0.057, -0.059, 0.03], 0.016);
  pin(crank, darkGrip, [0.055, -0.059, 0.03], [0.06, -0.059, 0.03], 0.014);

  const underside = part(runner, plane, shadowInk, 0.005, -0.024, 0.002);
  underside.scale.set(1.12, 0.087, 1);
  return {
    root,
    pose(phase) {
      const travel = (1 - phase) * Math.min(0.39, sheetHeight * 0.48);
      runner.position.y = top + 0.053 - travel;
      axle.rotation.x = -travel / 0.046;
      crank.rotation.x = 0.1 + (1 - phase) * 2.35;
    },
    dispose() {
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      reflection.dispose();
      shadowMap.dispose();
    },
  };
}
