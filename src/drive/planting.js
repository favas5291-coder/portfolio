import {
  BufferGeometry, Color, DoubleSide, Euler, Float32BufferAttribute, Mesh,
  MeshLambertMaterial, Quaternion, Vector3,
} from 'three';
import { TREE_SITES } from './layout.js';
import { seeded } from './craft.js';

const up = new Vector3(0, 1, 0);
const start = new Vector3();
const end = new Vector3();
const axis = new Quaternion();
const angles = new Euler();

// Geometry is batched by the same craft builder as the street architecture.
export function limb(builder, colour, a, b, diameter) {
  start.set(...a);
  end.set(...b).sub(start);
  const length = end.length();
  axis.setFromUnitVectors(up, end.normalize());
  angles.setFromQuaternion(axis);
  builder.part('post', colour, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2,
    (a[2] + b[2]) / 2, diameter, length, diameter, angles.x, angles.y, angles.z);
}

function rainTree(builder, site, rand) {
  const { x, z, size } = site;
  const local = (dx, dy, dz) => [x + dx * size, dy * size, z + dz * size];
  const trunk = '#685744';
  const upper = local(-0.18, 2.15, 0.08);
  limb(builder, trunk, local(0, 0.02, 0), upper, .83 * size);
  for (let n = 0; n < 5; n++) {
    const a = n * 2 * Math.PI / 5 + .16;
    limb(builder, '#75634d', local(.84 * Math.cos(a), .07, .84 * Math.sin(a)),
      local(0, .62, 0), .32 * size);
  }
  const foliage = ['#497953', '#608457', '#6c905a', '#456e4e', '#609059', '#76975b'];
  for (let arm = 0; arm < 7; arm++) {
    const a = arm * 2 * Math.PI / 7 + rand() * .38;
    const r = 1.70 + rand() * .55;
    const fork = local(Math.cos(a), 2.86 + rand() * .30, Math.sin(a) * .84);
    const tips = local(Math.cos(a) * r, 3.50 + rand() * .78, Math.sin(a) * r);
    limb(builder, trunk, upper, fork, (.36 + rand() * .12) * size);
    limb(builder, '#705e4b', fork, tips, .24 * size);
    const crown = local(Math.cos(a) * (r + .55), 4.24 + rand() * .60, Math.sin(a) * (r + .45));
    limb(builder, '#71624d', tips, crown, .19 * size);
    for (let n = 0; n < 4; n++) {
      const theta = a + n * 1.8;
      const rr = n === 0 ? 0 : .68 + rand() * .46;
      const xx = crown[0] + Math.cos(theta) * rr * size;
      const zz = crown[2] + Math.sin(theta) * rr * size;
      const yy = crown[1] + (n === 0 ? .43 : rand() * .36) * size;
      builder.part('crown', foliage[(arm + n) % foliage.length], xx, yy, zz,
        (2.3 + rand() * .75) * size, (1.2 + rand() * .7) * size,
        (2.4 + rand() * .83) * size, rand() * .16, theta, rand() * .10);
    }
  }
  builder.part('crown', '#79965c', x - .2 * size, 5.12 * size, z,
    4.2 * size, 2.14 * size, 4.00 * size, .14, .64, -.08);
}

function palm(builder, arrays, { x, z, size }, rand) {
  const bend = rand() > .5 ? 1 : -1;
  const joints = [[0, 0, 0], [-.08 * bend, 1.34, 0], [.10 * bend, 2.86, .14],
    [.44 * bend, 4.30, .24], [.67 * bend, 5.16, .32]]
    .map(([dx, dy, dz]) => [x + dx * size, dy * size, z + dz * size]);
  for (let n = 0; n < joints.length - 1; n++) {
    limb(builder, n % 2 ? '#99816a' : '#aa9474', joints[n], joints[n + 1], (.36 - n * .045) * size);
    for (let j = 1; j < 4; j++) {
      const t = j / 4, a = joints[n], b = joints[n + 1];
      const seam = a.map((v, i) => v + (b[i] - v) * t);
      builder.part('post', '#8d795f', ...seam,
        (.365 - n * .045) * size, .035 * size, (.365 - n * .045) * size);
    }
  }
  const [cx, cy, cz] = joints[joints.length - 1];
  const paints = ['#52744a', '#557f50', '#6b9052', '#719353', '#4a744e', '#779c58'];
  const ink = new Color();
  function triangle(a, b, c, paint) {
    arrays.positions.push(...a, ...b, ...c);
    ink.set(paint);
    for (let i = 0; i < 3; i++) arrays.colours.push(ink.r, ink.g, ink.b);
  }
  // Each feather branches from a sagging midrib. Separate leaflets give the
  // coconut silhouette daylight between its edges, including in the shadow.
  for (let f = 0; f < 9; f++) {
    const angle = f * Math.PI * 2 / 9 + rand() * .30;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const reach = (2.02 + rand() * .75) * size;
    const point = (t, side = 0, lower = 0) => [
      cx + cos * t * reach - sin * side * size,
      cy + (Math.sin(t * Math.PI) * .84 - t * t * .71 - lower) * size,
      cz + sin * t * reach + cos * side * size,
    ];
    for (let k = 0; k < 10; k++) {
      const t = k / 10, next = (k + 1) / 10;
      const c = paints[(f + k % 3) % paints.length];
      const rib = .052 * (1 - t) + .013;
      triangle(point(t, -rib), point(t, rib), point(next), c);
      triangle(point(t, rib), point(next, rib * .8), point(next), c);
      if (!k) continue;
      for (const side of [-1, 1]) {
        const spread = (.20 + .40 * Math.sin(Math.PI * t)) * side;
        const tip = point(Math.min(1.1, next + .105), spread, Math.abs(spread) * .60);
        triangle(point(t, rib * side), point(next, rib * side), tip, c);
        triangle(point(t, rib * side), tip, point(t + .042, spread * .66, .11), c);
      }
    }
  }
  for (let n = 0; n < 3; n++) {
    builder.part('crown', '#74664a', cx + Math.cos(n * 2) * size * .12, cy - size * .19,
      cz + Math.sin(n * 2) * size * .12, .29 * size, .35 * size, .27 * size);
  }
}

export function seedStreet(root, builder) {
  const rand = seeded(778752);
  const arrays = { positions: [], colours: [] };
  const skyline = [
    [-27, -23, 1.16, 'rain'], [-24, -28, 1.03, 'palm'], [-10.7, -29.5, 1.18, 'rain'],
    [-6.0, -29.9, .84, 'palm'],
    [17.5, -28.5, 1.04, 'rain'], [25, -25.5, .99, 'palm'], [28.2, -15.3, 1.0, 'rain'],
    [28.3, -6.2, .95, 'palm'], [-28, -1.2, .9, 'rain'], [-27.6, 14, .84, 'palm'],
    [26, 16, .82, 'rain'],
  ].map(([x, z, size, kind]) => ({ x, z, size, kind }));
  for (const site of [...TREE_SITES, ...skyline]) {
    if (site.kind === 'rain') rainTree(builder, site, rand);
    else palm(builder, arrays, site, rand);
  }
  const blades = new BufferGeometry();
  blades.setAttribute('position', new Float32BufferAttribute(arrays.positions, 3));
  blades.setAttribute('color', new Float32BufferAttribute(arrays.colours, 3));
  blades.computeVertexNormals();
  const fronds = new Mesh(blades, new MeshLambertMaterial({ vertexColors: true, side: DoubleSide }));
  fronds.castShadow = true;
  fronds.receiveShadow = true;
  root.add(fronds);
}

export function planter(builder, x, z, size = .8) {
  builder.part('post', '#a9684c', x, .37 * size + .14, z, .69 * size, .70 * size, .69 * size);
  builder.part('post', '#bc8060', x, .72 * size + .14, z, .79 * size, .13 * size, .79 * size);
  builder.part('post', '#544e40', x, .79 * size + .14, z, .66 * size, .04 * size, .66 * size);
  for (let n = 0; n < 7; n++) {
    const theta = n * Math.PI * 2 / 7;
    builder.part('crown', n % 2 ? '#63885a' : '#496f4d',
      x + Math.cos(theta) * .19 * size, 1.04 * size + .14, z + Math.sin(theta) * .19 * size,
      .14 * size, .63 * size, .28 * size, Math.cos(theta) * .42, theta, Math.sin(theta) * .46);
  }
}
