import { AdditiveBlending, BoxGeometry, BufferGeometry, Color, CylinderGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, Sprite, SpriteMaterial, TorusGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, release } from './craft.js';
const paint = '#fb651e',
  edge = '#ff8139',
  seam = '#b64a23',
  cream = '#f3e0b8';
const tyre = '#26322e',
  sidewall = '#34413b',
  metal = '#a4a89b',
  glass = '#42696c';

// Bake fixed details together, including their colours. Only moving assemblies need a draw call.
function batch(parent) {
  const pieces = [];
  const pose = new Object3D();
  function put(geometry, color, x, y, z, rx = 0, ry = 0, rz = 0) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    g.deleteAttribute('uv');
    g.deleteAttribute('uv1');
    const c = new Color(color),
      count = g.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) c.toArray(colors, i * 3);
    g.setAttribute('color', new Float32BufferAttribute(colors, 3));
    pose.position.set(x, y, z);
    pose.rotation.set(rx, ry, rz);
    pose.updateMatrix();
    pieces.push(g.applyMatrix4(pose.matrix));
  }
  function box(color, x, y, z, w, h, d, r = 0, rx = 0, ry = 0, rz = 0) {
    const geometry = r ? new RoundedBoxGeometry(w, h, d, 1, r) : new BoxGeometry(w, h, d);
    put(geometry, color, x, y, z, rx, ry, rz);
  }
  function cyl(color, x, y, z, top, base, h, rx = 0, ry = 0, rz = 0, n = 16) {
    put(new CylinderGeometry(top, base, h, n), color, x, y, z, rx, ry, rz);
  }
  function finish() {
    const geometry = mergeGeometries(pieces);
    for (const piece of pieces) piece.dispose();
    const mesh = new Mesh(geometry, new MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.7,
      metalness: 0.08
    }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  return {
    put,
    box,
    cyl,
    finish
  };
}

// A four-sided upper cabin with a pitched windshield and a narrower curved roofline.
function cabin() {
  const corners = [[-.63, .78, -.73], [.63, .78, -.73], [.63, .78, .18], [-.63, .78, .18], [-.54, 1.34, -.47], [.54, 1.34, -.47], [.54, 1.34, .105], [-.54, 1.34, .105]];
  const faces = [[0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0], [4, 7, 6, 5]];
  const positions = [];
  for (const [a, b, c, d] of faces) {
    for (const index of [a, b, c, a, c, d]) positions.push(...corners[index]);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function oneWheel() {
  const node = new Group(),
    b = batch(node);
  b.cyl(tyre, 0, 0, 0, .335, .335, .235, 0, 0, Math.PI / 2, 20);
  for (const side of [-1, 1]) {
    b.cyl(sidewall, side * .124, 0, 0, .30, .30, .026, 0, 0, Math.PI / 2, 20);
    b.cyl(cream, side * .14, 0, 0, .186, .186, .035, 0, 0, Math.PI / 2, 16);
    b.cyl(metal, side * .162, 0, 0, .117, .117, .025, 0, 0, Math.PI / 2, 12);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      b.cyl(tyre, side * .16, .146 * Math.cos(a), .146 * Math.sin(a), .017, .017, .009, 0, 0, Math.PI / 2, 6);
    }
  }
  b.finish();
  return node;
}

export function createPickup() {
  const root = new Group(),
    body = new Group();
  root.add(body);
  const b = batch(body);
  b.box(tyre, 0, .36, 0, 1.11, .19, 2.43, .05);
  b.box(paint, 0, .565, 0, 1.42, .36, 2.67, .085);
  b.box(paint, 0, .72, -1, 1.42, .24, .76, .08);
  b.box(edge, 0, .837, -.98, 1.22, .045, .62, .02);
  b.box(paint, 0, .762, -.25, 1.44, .20, 1.1, .05);
  b.put(cabin(), glass, 0, 0, 0);
  b.box(cream, 0, 1.358, -.18, 1.195, .105, .725, .047);
  b.box(cream, 0, 1.333, -.549, 1.13, .046, .08, .018);
  b.box(seam, 0, .838, -.716, 1.28, .044, .05, .014);
  b.box(paint, 0, .879, .171, 1.29, .1, .062, .018);
  for (const s of [-1, 1]) {
    b.box(paint, s * .585, 1.07, -.59, .066, .59, .071, .012, .429, 0, s * .143);
    b.box(paint, s * .586, 1.076, .144, .071, .556, .071, .011, -.13, 0, s * .143);
    b.box(tyre, s * .645, .859, -.275, .037, .037, .76, .011);
    b.box(seam, s * .715, .672, -.25, .017, .224, .014);
    b.box(metal, s * .728, .748, -.07, .028, .034, .156, .01);
    b.box(cream, s * .722, .60, -.78, .018, .049, .94);
    b.box(tyre, s * .736, .92, -.55, .178, .034, .038, .012);
    b.box(paint, s * .815, .949, -.56, .088, .13, .152, .025);
    b.box(glass, s * .815, .956, -.479, .069, .088, .011);
    b.box(paint, s * .648, .80, .75, .133, .36, 1.12, .045);
    b.box(edge, s * .648, .986, .752, .15, .045, 1.161, .015);
  }
  // Empty open delivery bed, embossed floor, tailgate rim and rear light clusters.
  b.box('#854b31', 0, .724, .756, 1.16, .04, 1.04, .018);
  for (let i = -3; i <= 3; i++) b.box('#a65b35', i * .154, .755, .744, .045, .026, .92, .01);
  b.box(paint, 0, .79, 1.282, 1.35, .34, .108, .027);
  b.box(edge, 0, .967, 1.295, 1.33, .04, .11, .015);
  b.box(seam, 0, .785, 1.341, .88, .13, .013, .004);
  b.box('#e9a061', 0, .806, 1.35, .55, .035, .016, .005);
  b.box(metal, 0, .419, 1.367, 1.54, .135, .175, .033);
  b.box(metal, 0, .424, -1.356, 1.50, .139, .17, .032);
  b.box(tyre, 0, .617, -1.356, .79, .177, .047, .016);
  for (let i = -2; i <= 2; i++) b.box(metal, i * .129, .621, -1.385, .042, .127, .012, .006);
  for (const s of [-1, 1]) {
    b.box('#673e35', s * .567, .756, 1.341, .122, .25, .038, .012);
    b.box('#cb3b2b', s * .567, .803, 1.363, .09, .111, .019, .006);
    b.box('#ffd081', s * .567, .715, 1.363, .09, .04, .019, .006);
    b.box(tyre, s * .529, .64, -1.342, .259, .213, .078, .035);
    b.box('#ffe6a4', s * .529, .644, -1.39, .206, .152, .029, .031);
  }
  b.box('#263e3e', 0, .493, 1.348, .33, .095, .016, .004);
  b.finish();
  const wheels = [],
    wheel = oneWheel();
  for (const x of [-.669, .669]) {
    for (const z of [-.922, .922]) {
      const pivot = new Group(),
        rotor = new Group();
      pivot.position.set(x, .335, z);
      root.add(pivot);
      pivot.add(rotor);
      rotor.add(wheel.clone());
      wheels.push({
        pivot,
        rotor,
        front: z < 0
      });
    }
  }
  const shadowMap = canvasTexture(64, 64, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w / 2, h / 2, w * .14, w / 2, h / 2, w * .5);
    gradient.addColorStop(0, 'rgba(23,29,25,.66)');
    gradient.addColorStop(.65, 'rgba(23,29,25,.31)');
    gradient.addColorStop(1, 'rgba(23,29,25,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
  const shadow = new Mesh(new PlaneGeometry(2.2, 3.8), new MeshBasicMaterial({
    map: shadowMap,
    transparent: true,
    depthWrite: false
  }));
  shadow.rotation.x = -Math.PI / 2;
  root.add(shadow);
  const flash = new Group();
  const brakeLights = new Group();
  // Compact hazard halos mark the delivery from either end, even in the overhead view.
  const glowMap = canvasTexture(32, 32, (ctx, width, height) => {
    const glow = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, '#fff4c7');
    glow.addColorStop(.32, 'rgba(255,187,73,.72)');
    glow.addColorStop(1, 'rgba(255,157,45,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  });
  const glowMaterial = new SpriteMaterial({
    map: glowMap, transparent: true, depthWrite: false, blending: AdditiveBlending
  });
  for (const s of [-1, 1]) {
    const lamp = new Mesh(new BoxGeometry(.189, .137, .034), new MeshBasicMaterial({
      color: '#fff3c2',
      toneMapped: false
    }));
    lamp.position.set(s * .529, .644, -1.402);
    const amber = new Mesh(new BoxGeometry(.112, .062, .031), new MeshBasicMaterial({
      color: '#fff3a1', toneMapped: false
    }));
    amber.position.set(s * .567, .714, 1.37);
    flash.add(lamp, amber);
    for (const light of [lamp, amber]) {
      const glow = new Sprite(glowMaterial);
      glow.position.copy(light.position);
      glow.position.z += Math.sign(light.position.z) * .035;
      glow.scale.set(.42, .42, 1);
      flash.add(glow);
    }
    const tail = new Mesh(new BoxGeometry(.087, .108, .016), new MeshBasicMaterial({
      color: '#ff5a43',
      toneMapped: false
    }));
    tail.position.set(s * .567, .803, 1.377);
    brakeLights.add(tail);
  }
  body.add(flash, brakeLights);
  function update(state) {
    root.position.set(state.x, state.y, state.z);
    root.rotation.y = state.heading;
    body.rotation.set(state.pitch, 0, state.roll);
    body.position.y = state.heave;
    for (const {
      pivot,
      rotor,
      front
    } of wheels) {
      if (front) pivot.rotation.y = state.wheelAngle;
      rotor.rotation.x = state.wheelSpin;
      pivot.position.y = .335 + Math.max(0, Math.abs(state.roll) * .07);
    }
    flash.visible = state.flash;
    brakeLights.visible = state.braking;
    shadow.position.y = .017 - state.y;
    shadow.material.opacity = Math.max(.25, .91 - state.y * .24);
  }
  return {
    root,
    update,
    dispose: () => release(root)
  };
}

function streetCone() {
  const node = new Group(),
    b = batch(node);
  b.box('#463d35', 0, .043, 0, .46, .085, .46, .028);
  b.cyl('#ce7849', 0, .335, 0, .036, .186, .54, 0, 0, 0, 12);
  b.cyl(cream, 0, .365, 0, .085, .117, .108, 0, 0, 0, 12);
  b.cyl(cream, 0, .499, 0, .053, .069, .055, 0, 0, 0, 12);
  b.finish();
  return node;
}

function looseTyre() {
  const node = new Group(),
    b = batch(node);
  b.put(new TorusGeometry(.264, .105, 8, 18), tyre, 0, 0, 0, 0, Math.PI / 2, 0);
  for (const s of [-1, 1]) b.put(new TorusGeometry(.269, .022, 6, 18), sidewall, s * .099, 0, 0, 0, Math.PI / 2, 0);
  b.box('#9d9a80', 0, .357, 0, .115, .014, .022);
  b.finish();
  return node;
}

function swingingSign() {
  const node = new Group(),
    pivot = new Group(),
    b = batch(node);
  b.box('#766355', 0, .059, 0, .75, .12, .44, .038);
  for (const x of [-.30, .30]) b.box('#4d544d', x, .515, 0, .044, .92, .052, .015);
  b.box('#4d544d', 0, .95, 0, .67, .051, .06, .012);
  b.finish();
  pivot.position.y = .884;
  node.add(pivot);
  const board = batch(pivot);
  board.box('#456458', 0, -.23, 0, .53, .46, .054, .02);
  for (const s of [-1, 1]) {
    board.box(cream, 0, -.21, s * .029, .275, .044, .009);
    board.box(cream, .121, -.173, s * .03, .104, .037, .009, 0, 0, -.69);
    board.box(cream, .121, -.247, s * .03, .104, .037, .009, 0, 0, .69);
  }
  board.finish();
  return {
    node,
    pivot
  };
}

export function createStreetProps() {
  const root = new Group();
  const cone = streetCone(),
    tyrePivot = new Group(),
    ring = looseTyre(),
    sign = swingingSign();
  root.add(cone, tyrePivot, sign.node);
  tyrePivot.add(ring);
  ring.position.y = .368;
  function update(state) {
    for (const prop of state.props) {
      if (prop.kind === 'cone') {
        cone.position.set(prop.x, Math.sin(prop.tilt) * .17, prop.z);
        cone.rotation.set(0, prop.yaw, 0);
        cone.rotateX(prop.tilt);
      } else if (prop.kind === 'tyre') {
        tyrePivot.position.set(prop.x, 0, prop.z);
        tyrePivot.rotation.y = prop.yaw;
        ring.rotation.x = prop.spin;
      } else if (prop.kind === 'sign') {
        sign.node.position.set(prop.x, 0, prop.z);
        sign.pivot.rotation.x = prop.tilt;
      }
    }
  }
  return {
    root,
    update,
    dispose: () => release(root)
  };
}
