import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { projectPreviews } from '../data/project-previews.js';

const TAU = Math.PI * 2;
const smooth = T.MathUtils.smoothstep;

// One north window and its return wall are reflected by every rounded surface.
// Values above 1 carry the luminance of the window into the enamel's highlights.
function studioReflection() {
  const w = 160,
    h = 80,
    data = new Uint16Array(w * h * 4);
  const direction = new T.Vector3();
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const az = ((i + 0.5) / w - 0.5) * TAU,
        el = ((j + 0.5) / h - 0.5) * Math.PI;
      direction.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
      const { x, y, z } = direction;
      let light = 0.14 + 0.24 * Math.max(y, 0) + 0.16 * Math.max(-y, 0);
      const paneU = z / Math.max(0.01, -x),
        paneV = y / Math.max(0.01, -x);
      if (x < 0 && paneU > -0.43 && paneU < 1.03 && paneV > -0.21 && paneV < 1.24) {
        const mullion =
          Math.abs(paneU - 0.07) < 0.012 ||
          Math.abs(paneU - 0.54) < 0.012 ||
          Math.abs(paneV - 0.69) < 0.012;
        light += mullion ? 0.42 : 7.4;
      }
      // Secondary return from the off-white cyclorama, opposite a strip of negative fill.
      light += 1.7 * smooth(z, 0.72, 0.96) * (1 - smooth(y, 0.18, 0.46));
      light *= 1 - 0.85 * smooth(x, 0.45, 0.89) * (1 - smooth(Math.abs(y + 0.08), 0.28, 0.48));
      const k = (j * w + i) * 4;
      [light * 0.98, light, light * 1.035, 1].forEach((n, c) => {
        data[k + c] = T.DataUtils.toHalfFloat(n);
      });
    }
  const env = new T.DataTexture(data, w, h, T.RGBAFormat, T.HalfFloatType);
  env.mapping = T.EquirectangularReflectionMapping;
  env.needsUpdate = true;
  return env;
}

export function buildInstrument(scene, manager, shadowSize = 1024) {
  const root = new T.Group();
  scene.add(root);
  const resources = new Set();
  function own(item) {
    resources.add(item);
    return item;
  }
  const std = (props) => own(new T.MeshStandardMaterial(props));
  const basic = (props) => own(new T.MeshBasicMaterial(props));
  const sheetInk = basic({ color: 0xffffff, toneMapped: false, side: T.DoubleSide });
  const enamel = own(
    new T.MeshPhysicalMaterial({
      color: '#073bc8',
      metalness: 0.43,
      roughness: 0.26,
      clearcoat: 0.48,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.16,
    }),
  );
  const enamelEdge = std({ color: '#06267c', metalness: 0.44, roughness: 0.27 });
  const alloy = std({ color: '#a8aba9', metalness: 0.77, roughness: 0.29 });
  const darkSteel = std({ color: '#363b3f', metalness: 0.61, roughness: 0.33 });
  const charcoal = std({ color: '#2c302f', roughness: 0.7 });
  const orange = own(
    new T.MeshPhysicalMaterial({ color: '#ff520b', roughness: 0.31, metalness: 0.02, clearcoat: 0.28 }),
  );
  const paper = std({ color: '#f1eee2', roughness: 0.96 });
  const chalk = std({ color: '#e3e0d4', roughness: 0.9 });
  const windowLight = basic({ color: '#f5faf7', toneMapped: false });
  const rack = new T.Group(),
    table = new T.Group(),
    display = new T.Group(),
    ruler = new T.Group();
  table.add(ruler);
  root.add(rack, table, display);
  const cube = own(new T.BoxGeometry(1, 1, 1)),
    plane = own(new T.PlaneGeometry(1, 1));
  const cylinder = own(new T.CylinderGeometry(1, 1, 1, 20));
  const loader = new T.TextureLoader(manager);
  function texture(url) {
    const t = own(loader.load(url));
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  function mesh(parent, geo, mat, x, y, z) {
    const object = new T.Mesh(geo, mat);
    object.position.set(x, y, z);
    parent.add(object);
    return object;
  }
  function box(parent, mat, x, y, z, w, h, d, r = 0) {
    const geo = r ? own(new RoundedBoxGeometry(w, h, d, 2, r)) : cube;
    const part = mesh(parent, geo, mat, x, y, z);
    if (!r) part.scale.set(w, h, d);
    return part;
  }
  function rod(parent, mat, a, b, radius) {
    const av = new T.Vector3(...a),
      bv = new T.Vector3(...b),
      vec = bv.clone().sub(av);
    const center = av.addScaledVector(vec, 0.5);
    const part = mesh(parent, cylinder, mat, center.x, center.y, center.z);
    part.scale.set(radius, vec.length(), radius);
    part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), vec.normalize());
    return part;
  }
  function artwork(parent, map, x, y, z, w, h, yaw = 0) {
    const material = basic({ map, toneMapped: false, side: T.DoubleSide });
    const panel = mesh(parent, plane, material, x, y, z);
    panel.scale.set(w, h, 1);
    panel.rotation.y = yaw;
    return panel;
  }
  function print(w, h, paint) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d'), w, h);
    const map = own(new T.CanvasTexture(c));
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  }

  const apertureUniform = { value: 4.4 },
    centerUniform = { value: 0 };
  // The penumbra widens with the distance from each suspended fin to the sweep.
  // In contrast to a group of shadow planes, this continues around the floor radius.
  const coveMaterial = std({ color: '#f0ebdb', roughness: 0.9 });
  coveMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.finGap = apertureUniform;
    shader.uniforms.stageCenter = centerUniform;
    shader.vertexShader =
      'varying vec3 pStudio;\n' +
      shader.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n pStudio=(modelMatrix*vec4(transformed,1.)).xyz;',
      );
    shader.fragmentShader =
      'uniform float finGap;uniform float stageCenter;varying vec3 pStudio;\n' +
      shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
      vec3 p = pStudio;
      float travel = (.20-p.z)/.745;
      vec2 hit = p.xy + vec2(-.25,.36)*travel;
      float soft = .045 + .075*max(travel,0.);
      float xFin = abs(hit.x-stageCenter) - .5*finGap;
      float shadow = smoothstep(-soft,soft,xFin+.035) * (1.-smoothstep(.68-soft,.68+soft,xFin));
      shadow *= smoothstep(.48-soft,.48+soft,hit.y) * (1.-smoothstep(4.96-soft,4.96+soft,hit.y));
      shadow *= smoothstep(-.1,.30,travel);
      // One large soft-edged sash lights the sweep and the return wall. The
      // diagonal shape continues from the floor around the cove without a seam.
      float u = p.x + .63*p.z - .49*p.y;
      float v = p.y + .35*p.z - .22*p.x;
      float lightPatch = smoothstep(-4.6,-3.3,u) * (1.-smoothstep(1.3,2.7,u)) * smoothstep(-2.3,-.8,v);
      float gobo = (1.-smoothstep(.022,.135,abs(u+.95))) * lightPatch;
      float depth = smoothstep(-6.,5.,p.x) * (1.-smoothstep(0.,5.5,p.y));
      vec3 balance = mix(vec3(.73,.76,.80), vec3(1.28,1.22,1.13),lightPatch);
      float corner = exp(-abs(p.x+6.22)*1.8)*exp(-abs(p.y)*1.8);
      diffuseColor.rgb *= balance * (1.-.13*depth) * (1.-.50*shadow) * (1.-.12*gobo) * (1.-.19*corner);

    `,
      );
  };
  const section = [
    [9.5, 0],
    [-2.72, 0],
  ];
  for (let i = 1; i <= 30; i++) {
    const a = ((i / 30) * Math.PI) / 2;
    section.push([-2.72 - 1.43 * Math.sin(a), 1.43 - 1.43 * Math.cos(a)]);
  }
  section.push([-4.15, 7.7]);
  const verts = [],
    ix = [];
  for (const [z, y] of section) verts.push(-10, y, z, 10, y, z);
  for (let j = 0; j < section.length - 1; j++) {
    const n = j * 2;
    ix.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
  }
  const geo = own(new T.BufferGeometry());
  geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geo.setIndex(ix);
  geo.computeVertexNormals();
  const cyc = mesh(root, geo, coveMaterial, 0, 0, 0);
  cyc.receiveShadow = true;
  scene.background = new T.Color('#e8e5da');
  scene.environment = own(studioReflection());
  scene.environmentIntensity = 0.57;
  scene.add(new T.HemisphereLight('#f6f8ff', '#b7ac96', 1.05));
  const key = new T.DirectionalLight('#fff5df', 2.16);
  key.position.set(-5.5, 7.0, 6.1);
  key.target.position.set(0.3, 0.7, -1.6);
  scene.add(key, key.target);
  key.castShadow = true;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(key.shadow.camera, {
    left: -6.6,
    right: 6.6,
    top: 6.2,
    bottom: -5.4,
    near: 0.4,
    far: 23,
  });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.normalBias = 0.015;
  key.shadow.bias = -0.00015;
  const softbox = new T.DirectionalLight('#e8f0ff', 0.64);
  softbox.position.set(4, 4, -2);
  scene.add(softbox);

  // The tall recessed north window is a single source; all mullions have depth.
  box(root, coveMaterial, -6.35, 3.5, -0.92, 0.24, 7.0, 6.46);
  box(root, chalk, -6.35, 3.5, 8.74, 0.24, 7.0, 2.16);
  box(root, coveMaterial, -6.35, 0.25, 4.96, 0.24, 0.5, 5.48);
  box(root, chalk, -6.35, 6.3, 4.96, 0.24, 1.4, 5.48);
  box(root, windowLight, -6.49, 3.08, 4.96, 0.036, 5.2, 5.48);
  for (const z of [2.23, 4.05, 5.87, 7.69]) box(root, chalk, -6.25, 3.07, z, 0.13, 5.17, 0.047);
  for (const y of [0.53, 4.5, 5.63]) box(root, chalk, -6.25, y, 4.96, 0.13, 0.05, 5.48);
  box(root, paper, -6.13, 0.5, 4.96, 0.54, 0.07, 5.56, 0.02);
  // A deep north-light reveal and flush ceiling carry the suspension points.
  const windowFrame = std({ color: '#d5d7d0', metalness: 0.18, roughness: 0.58 });
  box(root, paper, 0, 7.56, 0.8, 15.1, 0.19, 18.3);
  box(root, windowFrame, 0, 7.42, 0, 8.05, 0.19, 0.19, 0.012);
  // Main rail: two flanges around a recessed running channel. Four drop rods
  // connect it to the structural ceiling, clear of the sliding assemblies.
  for (const z of [-0.15, 0.15]) box(rack, alloy, 0, 5.24, z, 8.24, 0.2, 0.052, 0.012);
  box(rack, darkSteel, 0, 5.32, 0, 8.24, 0.047, 0.31);
  for (const x of [-3.77, -1.28, 1.28, 3.77]) {
    rod(rack, alloy, [x, 5.34, 0], [x, 7.43, 0], 0.017);
    box(rack, alloy, x, 5.36, 0, 0.16, 0.037, 0.2, 0.006);
  }
  const fins = [];
  const profile = new T.Shape();
  profile.moveTo(0, 0);
  profile.bezierCurveTo(0.19, 0.015, 0.51, -0.04, 0.74, -0.38);
  profile.bezierCurveTo(0.91, -0.63, 1.015, -0.915, 1.035, -1.16);
  profile.quadraticCurveTo(1.042, -1.198, 1.008, -1.19);
  profile.bezierCurveTo(0.97, -0.88, 0.85, -0.61, 0.69, -0.396);
  profile.bezierCurveTo(0.49, -0.105, 0.2, -0.046, 0, -0.044);
  profile.closePath();
  const bladeGeometry = own(
    new T.ExtrudeGeometry(profile, {
      depth: 4.3,
      curveSegments: 24,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.012,
      bevelThickness: 0.014,
      steps: 1,
    }),
  );
  bladeGeometry.rotateX(-Math.PI / 2);
  // ExtrudeGeometry assigns hard normals along profile edges. Welding normals on
  // the continuous enamel face makes the window reflection travel across its bend.
  const positions = bladeGeometry.attributes.position,
    normals = bladeGeometry.attributes.normal;
  const byPosition = new Map();
  for (let i = 0; i < positions.count; i++) {
    if (Math.abs(normals.getY(i)) > 0.32) continue;
    const k = [positions.getX(i), positions.getY(i), positions.getZ(i)]
      .map((n) => Math.round(n * 1e5))
      .join('/');
    const v = byPosition.get(k) || new T.Vector3();
    v.x += normals.getX(i);
    v.y += normals.getY(i);
    v.z += normals.getZ(i);
    byPosition.set(k, v);
  }
  for (let i = 0; i < positions.count; i++) {
    if (Math.abs(normals.getY(i)) > 0.32) continue;
    const k = [positions.getX(i), positions.getY(i), positions.getZ(i)]
      .map((n) => Math.round(n * 1e5))
      .join('/');
    const n = byPosition.get(k).normalize();
    normals.setXYZ(i, n.x, n.y, n.z);
  }
  for (const sign of [-1, 1]) {
    const sled = new T.Group();
    rack.add(sled);
    fins.push({ sled, sign });
    const blade = mesh(sled, bladeGeometry, enamel, sign * 0.028, 0.64, 0);
    blade.scale.set(sign, 1, sign < 0 ? -0.62 : -1);
    // Injection-moulded leading edge and folded hanging claw at the inner top.
    box(sled, enamelEdge, sign * 0.032, 2.79, 0.014, 0.017, 4.3, 0.048, 0.007);
    box(sled, darkSteel, sign * 0.26, 5.15, 0, 0.61, 0.12, 0.24, 0.021);
    for (const dx of [0.11, 0.4]) {
      rod(sled, alloy, [sign * dx, 4.93, 0.025], [sign * dx, 5.13, 0.025], 0.025);
      rod(sled, charcoal, [sign * dx, 5.2, -0.12], [sign * dx, 5.2, 0.12], 0.054);
    }
  }
  const storefront = texture(projectPreviews.gymdrobe.screenshot);
  const storefrontMobile = texture(projectPreviews.gymdrobe.mobile.screenshot);
  const surface = mesh(display, plane, sheetInk, 0, 2.31, 0.024);
  const back = box(display, paper, 0, 2.31, 0, 1, 1, 0.032);
  const contactMap = print(640, 720, (ctx, w, h) => {
    ctx.fillStyle = '#f7f5ed';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#cacbc1';
    ctx.beginPath();
    ctx.moveTo(45, 105);
    ctx.lineTo(w - 45, 105);
    ctx.stroke();
    ctx.fillStyle = '#10151a';
    ctx.font = 'bold 67px Arial';
    ctx.fillText('Your project', 43, 198);
    ctx.fillStyle = '#a6a69f';
    for (let i = 0; i < 4; i++) ctx.fillRect(46, 305 + 71 * i, w - 92, 2);
  });
  const contact = artwork(display, contactMap, 0, 2.31, 0.03, 1, 1);
  const previewGroup = new T.Group();
  root.add(previewGroup);
  const sampleTex = texture('/images/projects/gymdrobe-shirt-black.webp');
  const reviewWall = box(previewGroup, paper, 5.37, 2.37, 0.7, 0.14, 4.74, 5.94, 0.014);
  reviewWall.receiveShadow = true;
  for (const [i, z] of [-0.56, 1.04].entries()) {
    box(previewGroup, alloy, 5.285, 2.24, z, 0.035, 1.9, 1.3, 0.01);
    box(previewGroup, chalk, 5.262, 2.24, z, 0.018, 1.86, 1.265, 0.006);
    const flat = artwork(previewGroup, sampleTex, 5.248, 2.45, z, 1.14, 1.24, -Math.PI / 2);
    if (i === 1) flat.scale.y = 1.0;
    for (let n = 0; n < 2; n++)
      box(previewGroup, charcoal, 5.237, 1.69 - n * 0.06, z - 0.13, 0.016, 0.018, 0.74 - n * 0.18);
    box(previewGroup, enamel, 5.234, i === 0 ? 1.46 : 1.83, z, 0.021, 0.12, 1.12, 0.009);
  }

  // Linoleum is inset flush with the anodized edge. The grip is a dished solid
  // with a concave thumb pad and a lip that captures the table's longitudinal rail.
  const linoleumMap = own(loader.load('/variable/linoleum.webp'));
  linoleumMap.wrapS = linoleumMap.wrapT = T.RepeatWrapping;
  linoleumMap.repeat.set(3, 1);
  const lino = std({ color: '#83918c', roughness: 0.83, bumpMap: linoleumMap, bumpScale: 0.0015 });
  box(table, alloy, 0, 0.815, 0, 2.87, 0.073, 0.67, 0.025);
  box(table, lino, 0, 0.857, 0, 2.84, 0.018, 0.645, 0.007);
  for (const x of [-1.12, 1.12]) {
    const leg = box(table, darkSteel, x, 0.391, 0, 0.073, 0.78, 0.45, 0.016);
    leg.castShadow = true;
    box(table, charcoal, x, 0.027, 0, 0.116, 0.05, 0.49, 0.009);
  }
  box(table, alloy, 0, 0.7, -0.195, 2.22, 0.046, 0.046, 0.006);
  box(ruler, darkSteel, 0, 0.868, 0, 1.72, 0.014, 0.138, 0.014);
  box(ruler, charcoal, 0, 0.877, 0, 1.66, 0.012, 0.088, 0.03);
  for (let j = 0; j <= 12; j++)
    box(ruler, alloy, (j / 12 - 0.5) * 1.53, 0.868, 0.14, 0.007, 0.003, j % 3 === 0 ? 0.047 : 0.023);
  const grip = new T.Group();
  table.add(grip);
  box(grip, orange, 0, 0.903, 0, 0.229, 0.061, 0.158, 0.029);
  const lathe = own(
    new T.LatheGeometry(
      [
        [0.109, 0.002],
        [0.11, 0.016],
        [0.104, 0.024],
        [0.094, 0.026],
        [0.089, 0.022],
        [0.074, 0.012],
        [0.043, 0.006],
        [0, 0.006],
      ].map(([x, y]) => new T.Vector2(x, y)),
      48,
    ),
  );
  const thumb = mesh(grip, lathe, orange, 0, 0.93, 0);
  thumb.scale.z = 0.65;
  for (const dx of [-0.048, -0.024, 0, 0.024, 0.048])
    box(grip, orange, dx, 0.943, 0.045, 0.007, 0.006, 0.025, 0.002);
  table.position.set(0, 0, 1.87);
  const aoMap = print(96, 96, (ctx, w, h) => {
    const r = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, 'rgba(34,36,39,.40)');
    r.addColorStop(0.45, 'rgba(34,36,39,.20)');
    r.addColorStop(1, 'rgba(34,36,39,0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, w, h);
  });
  const ao = basic({ map: aoMap, transparent: true, depthWrite: false, toneMapped: false });
  for (const x of [-1.12, 1.12]) {
    const shadow = mesh(table, plane, ao, x, 0.008, 0);
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(0.74, 1.22, 1);
  }
  box(table, alloy, 0, 0.8, 0, 2.87, 0.001, 0.67).castShadow = true;

  function update({
    gap,
    cx,
    cy,
    height,
    progress,
    width,
    deskX = 0,
    deskZ = 1.87,
    deskScale = 1,
    deskDepth = 1,
    hideGrip = false,
  }) {
    apertureUniform.value = gap;
    centerUniform.value = cx;
    for (const { sign, sled } of fins) sled.position.x = cx + (sign * gap) / 2;
    surface.scale.set(gap - 0.018, height, 1);
    back.scale.set(gap, height, 0.032);
    contact.scale.copy(surface.scale);
    for (const p of [contact, surface, back]) {
      p.position.x = cx;
      p.position.y = cy;
    }
    const image = gap / height < 0.89 ? storefrontMobile : storefront;
    if (sheetInk.map !== image) {
      sheetInk.map = image;
      sheetInk.needsUpdate = true;
    }
    // Light up the projector as the visitor comes around its blade.
    const workLight = smooth(progress, 0.11, 0.68) * (1 - smooth(progress, 2.36, 2.83));
    const invite = smooth(progress, 2.51, 2.92);
    surface.visible = workLight > 0.005;
    sheetInk.transparent = workLight < 0.999;
    sheetInk.opacity = workLight;
    back.visible = workLight > 0.01 || invite > 0.01;
    contact.visible = invite > 0.005;
    contact.material.transparent = invite < 0.999;
    contact.material.opacity = invite;
    table.position.x = deskX;
    table.position.z = deskZ;
    table.scale.set(deskScale, 1, deskDepth);
    grip.position.x = (width - 0.5) * 1.47;
    grip.visible = !hideGrip;
    ruler.visible = !hideGrip;
  }
  return {
    update,
    dispose() {
      key.shadow.dispose();
      scene.remove(root, key, key.target, softbox);
      resources.forEach((r) => r.dispose());
    },
  };
}
