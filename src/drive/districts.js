import {
  BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshLambertMaterial, Shape, ShapeGeometry,
} from 'three';
import { BUILDINGS, LOADING_BAY, RAMP } from './layout.js';
import { canvasTexture, craft, plane, seeded, sign } from './craft.js';
import { limb, planter, seedStreet } from './planting.js';

const ivory = '#eadfc4';
const teal = '#397064';
const wood = '#886a52';

function awning(builder, x, y, z, width, depth, count, paint, alternate) {
  const stripe = width / count;
  for (let i = 0; i < count; i++) {
    const cx = x - width / 2 + (i + .5) * stripe;
    const colour = i % 2 ? alternate : paint;
    builder.part('block', colour, cx, y - depth * .11, z + depth * .5,
      stripe + .008, .075, depth, .21);
    builder.part('soft', colour, cx, y - depth * .21 - .095, z + depth - .02,
      stripe + .008, .22, .065);
  }
}

function gable(builder, x, y, z, width, depth, rise, panel, seam) {
  const pitch = Math.atan2(rise, depth / 2);
  const slope = Math.hypot(depth / 2, rise);
  for (const direction of [-1, 1]) {
    builder.part('block', panel, x, y + rise / 2, z + direction * depth / 4,
      width, .16, slope, pitch * direction);
    const cuts = Math.ceil(width / .41);
    for (let n = 0; n <= cuts; n++) {
      builder.part('block', seam, x - width / 2 + width * n / cuts, y + rise / 2 + .083,
        z + direction * depth / 4, .041, .032, slope, pitch * direction);
    }
  }
  builder.part('soft', seam, x, y + rise + .055, z, width + .07, .13, .19);
}

function archFace(root, x, z, bottom, width, height, paint) {
  const r = width / 2;
  const face = new Shape().moveTo(-r, 0).lineTo(r, 0).lineTo(r, height - r)
    .absarc(0, height - r, r, 0, Math.PI).lineTo(-r, 0);
  const mesh = new Mesh(new ShapeGeometry(face, 18), new MeshLambertMaterial({ color: paint }));
  mesh.position.set(x, bottom, z);
  root.add(mesh);
}

function boutique(root, builder, site, print) {
  const { id, x, z, width: w, depth: d } = site;
  const f = z + d / 2;
  const luxury = id === 'luxvibe';
  const wall = luxury ? '#d5b7a3' : '#e6d6b6';
  const fascia = luxury ? '#653742' : '#efe4cd';
  const trim = luxury ? '#e8cdb4' : '#cfb893';
  const h = luxury ? 3.58 : 3.26;
  builder.part('soft', wall, x, h / 2 + .13, z, w, h, d);
  builder.part('block', trim, x, h + .22, z, w + .30, .18, d + .22);
  builder.part('soft', luxury ? '#c4a990' : '#d4c5ab', x, h + .36, z, w - .25, .14, d - .34);
  for (const direction of [-1, 1]) {
    builder.part('block', ivory, x + direction * (w / 2 - .04), h + .41, z, .16, .39, d + .22);
  }
  builder.part('block', ivory, x, h + .40, z - d / 2, w + .08, .39, .16);
  builder.part('block', fascia, x, h - .09, f + .07, w + .10, .78, .15);
  sign(root, luxury ? 'LUXVIBE' : 'fabea', x, h - .08, f + .155, w - .45, .64, {
    paper: fascia, ink: luxury ? '#f7ead8' : '#49382c', serif: true, bold: false,
  });

  // The two boutiques have distinct rooflines. Luxvibe carries a stepped
  // cornice; the low FABEA parapet screens its compact ventilation unit.
  if (luxury) {
    for (let n = 0; n < 3; n++) {
      builder.part('soft', n % 2 ? '#c9b199' : '#dfc9ae', x, h + .31 + n * .14, f - .05,
        w + .20 - n * .70, .15, .38);
    }
  } else {
    builder.part('block', '#b4ab96', x - w * .24, h + .52, z - .78, 1.31, .29, .92);
    builder.part('post', '#889384', x - w * .24, h + .70, z - .78, .69, .10, .69);
    builder.part('post', '#a0a48b', x - w * .24, h + .76, z - .78, .39, .04, .39);
  }
  if (luxury) {
    const blueGlass = '#688077';
    for (const [cx, ww] of [[x - 1.72, 2.03], [x + .07, 1.23], [x + 1.83, 1.84]]) {
      builder.part('block', wood, cx, 1.49, f + .05, ww + .15, 2.34, .13);
      builder.part('block', blueGlass, cx, 1.51, f + .13, ww, 2.16, .07);
      builder.part('block', '#a0a99a', cx, 2.22, f + .18, ww, .56, .05);
    }
    awning(builder, x, 2.82, f + .13, w - .19, 1.02, 11, '#7f4750', '#efe1c8');
    builder.part('block', '#6c5345', x - 1.72, .52, f + .24, 2.17, .11, .37);
    print(root, id, x - 1.72, 1.41, f + .194, 1.86, 1.65);
  } else {
    for (const [dx, aw] of [[-2.08, 1.70], [0, 1.35], [2.05, 1.74]]) {
      archFace(root, x + dx, f + .075, .34, aw + .17, 2.51, '#c4aa84');
      archFace(root, x + dx, f + .088, .40, aw, 2.38, '#5d6d60');
      builder.part('block', '#95856e', x + dx, 1.34, f + .115, .054, 1.84, .068);
      builder.part('block', '#a99677', x + dx, 1.92, f + .115, aw, .058, .068);
    }
    print(root, id, x + 2.05, 1.30, f + .157, 1.53, 1.54);
    const bladeX = x - w / 2 + .21;
    builder.part('block', '#594e40', bladeX, 2.68, f + .70, .09, .07, 1.18);
    for (const zz of [.68, 1.04]) builder.part('post', '#625548', bladeX, 2.56, f + zz, .045, .23, .045);
    builder.part('soft', '#a38d6d', bladeX, 2.28, f + .85, .11, .44, .92);
    sign(root, 'fabea', bladeX + .059, 2.28, f + .85, .80, .36,
      { yaw: Math.PI / 2, paper: '#a38d6d', ink: '#ffefcc', serif: true, bold: false });
  }
  planter(builder, x + w / 2 - .22, f + .64, .79);
  builder.part('block', '#cbbda1', x + .04, .19, f + .53, 1.55, .14, .60);
}

function teaShop(root, builder, site) {
  const { x, z, width: w, depth: d } = site, f = z + d / 2;
  builder.part('soft', '#7b9680', x, 1.18, z, w, 2.10, d);
  builder.part('block', '#365c51', x, 1.30, f + .04, w - .32, 1.54, .11);
  builder.part('block', '#b59a70', x, .98, f + .15, w + .04, .14, .38);
  builder.part('block', '#527769', x, .49, f + .11, w - .10, .75, .13);
  for (let n = 0; n < 7; n++) {
    builder.part('block', '#93a68a', x - 1.49 + n * .49, .52, f + .19, .052, .66, .05);
  }
  gable(builder, x, 2.29, z, w + .55, d + .57, .58, '#a16e50', '#c1926d');
  builder.part('block', '#33584b', x, 2.23, f + .10, w + .12, .48, .22);
  sign(root, 'CHAYA', x, 2.24, f + .221, 2.9, .42, { paper: '#365d50', ink: '#f8e8b9' });
  awning(builder, x, 1.95, f + .08, w - .13, .87, 9, '#567e68', '#e7d5a9');
  const side = x + w / 2 + .033;
  builder.part('block', '#e1cb9f', side, 1.48, z - .11, .075, .85, 2.06);
  sign(root, 'CHAYA', side + .045, 1.48, z - .11, 1.85, .66, {
    yaw: Math.PI / 2, paper: '#e1cb9f', ink: '#3c6455',
  });
  // Aluminium boiler, brass lid and the line of tea glasses on the counter.
  builder.part('post', '#a6a79a', x - .98, 1.29, f + .24, .35, .41, .35);
  builder.part('post', '#c4ae7e', x - .98, 1.52, f + .24, .39, .07, .39);
  for (let n = 0; n < 5; n++) {
    builder.part('post', n % 2 ? '#c2b29a' : '#d8ccb1',
      x + .18 + n * .19, 1.11, f + .26, .12, .16, .12);
  }
  for (const xx of [x - 1.05, x + .02]) {
    builder.part('post', '#966b4c', xx, .61, f + .87, .62, .12, .62);
    for (const [dx, dz] of [[-.18, -.13], [.18, -.13], [0, .19]]) {
      builder.part('post', '#65523e', xx + dx, .37, f + .87 + dz, .07, .45, .07);
    }
  }
}

function workshop(root, b, site) {
  const { x, z, width: w, depth: d } = site, f = z + d / 2;
  b.part('soft', '#b56f51', x, 1.45, z, w, 2.60, d);
  gable(b, x, 2.87, z, w + .48, d + .62, .94, '#9e7055', '#bd8969');
  for (const cx of [x - 1.75, x + 1.75]) {
    b.part('block', '#654e3f', cx, 1.28, f + .05, 2.96, 2.05, .14);
    for (let n = 0; n < 9; n++) {
      b.part('block', n % 2 ? '#829183' : '#899888', cx, .42 + n * .188, f + .14, 2.78, .17, .08);
    }
    b.part('block', '#4f625a', cx, .35, f + .20, 2.81, .12, .08);
  }
  b.part('block', '#78533f', x, 2.50, f + .14, w, .64, .22);
  sign(root, 'SERVICE WORKSHOP', x, 2.50, f + .26, w - .36, .52, { paper: '#76523f', ink: '#f6dfb6' });
  b.part('block', '#e0b38c', x, 1.26, f + .17, .24, 2.31, .22);
  const airVent = x + w / 2 + .06;
  b.part('block', '#786153', airVent, 1.75, z + .05, .15, .78, 1.29);
  for (let n = 0; n < 6; n++) {
    b.part('block', '#baa288', airVent + .10, 1.44 + n * .12, z + .05, .07, .046, 1.13);
  }
  // A real painted direction for the short road back to the flagship.
  const arrow = canvasTexture(512, 180, (ctx, width, height) => {
    ctx.fillStyle = '#b56f51'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f2d8aa'; ctx.font = 'bold 71px Arial';
    ctx.fillText('GYMDROBE', 20, 81);
    ctx.fillRect(108, 111, 307, 16);
    ctx.beginPath(); ctx.moveTo(415, 88); ctx.lineTo(469, 119); ctx.lineTo(415, 149); ctx.fill();
  });
  plane(root, arrow, x + w / 2 + .015, 1.48, z - 1.77, 1.62, .72, Math.PI / 2);
}

function office(root, b, site) {
  const { x, z, width: w, depth: d } = site, f = z + d / 2;
  b.part('soft', '#ddccac', x, 1.80, z, w, 3.30, d);
  b.part('block', '#b5a88d', x, 1.85, f + .04, w - .62, 2.67, .13);
  for (let j = 0; j < 3; j++) {
    const xx = x - w * .32 + j * w * .32;
    b.part('block', '#486b5e', xx, 1.58, f + .14, 1.23, 2.19, .11);
    b.part('block', '#8b9e88', xx, 2.09, f + .21, 1.07, .78, .06);
    b.part('block', '#c2b891', xx, 1.72, f + .24, 1.08, .042, .04);
  }
  for (const a of [-1, 1]) {
    b.part('soft', '#e6d8b8', x + a * (w / 2 - .23), 1.61, f + .63, .48, 2.96, .44);
    b.part('block', '#bdaa87', x + a * (w / 2 - .23), .44, f + .63, .58, .55, .56);
  }
  b.part('block', '#cdc1a1', x, 3.11, f + .53, w + .37, .34, 1.30);
  b.part('block', '#54766a', x, 3.24, f + 1.16, w + .38, .47, .14);
  sign(root, 'FAZHERE OFFICE', x, 3.25, f + 1.241, w - .12, .39, { paper: '#54766a' });
  gable(b, x, 3.54, z, w + .50, d + .53, .79, '#af7a5c', '#c18b6c');
  planter(b, x - w / 2 + .53, f + 1.06, .88);
  planter(b, x + w / 2 - .50, f + 1.06, .88);
}

function loading(b, root) {
  const x = LOADING_BAY.x, z = BUILDINGS[0].z - BUILDINGS[0].depth / 2 - .11;
  b.part('block', '#485649', x, 1.47, z, 5.12, 2.70, .20);
  b.part('block', '#293c35', x, 1.40, z - .14, 4.68, 2.41, .07);
  for (const side of [-1, 1]) b.part('block', '#9eaa91', x + side * 2.45, 1.43, z - .18, .15, 2.60, .32);
  b.part('block', '#6c715e', x, .27, z - .43, 5.17, .32, 1.03);
  b.part('block', '#a5ab92', x, 2.79, z - .16, 5.14, .27, .37);
  sign(root, 'DELIVERIES', x, 3.08, z - .12, 3.1, .44, { yaw: Math.PI, paper: '#425c4d' });
  const shutter = craft(root);
  shutter.group.position.set(x, 2.68, z - .69);
  for (let i = 0; i < 13; i++) {
    shutter.part('block', i % 2 ? '#7d907d' : '#8a9a83', 0, -.09 - i * .177, 0, 4.76, .16, .07);
  }
  shutter.part('block', '#44574a', 0, -2.28, -.054, 4.8, .10, .13);
  shutter.finish();
  // Rounded duffels have stitched straps, standing handles and a zipper.
  for (const [dx, y, w, col] of [[-1.25,.62,1.26,'#b49664'],[.07,.64,1.23,'#66816d'],
    [1.31,.65,1.19,'#997856'],[-.68,1.14,1.24,'#788577'],[.70,1.17,1.16,'#b48b67']]) {
    b.part('soft', col, x + dx, y, z - .39, w, .48, .43);
    b.part('block', '#554c3b', x + dx, y + .235, z - .40, w * .68, .03, .045);
    for (const side of [-1, 1]) {
      b.part('block', '#585d4c', x + dx + side * w * .26, y + .05, z - .614, .082, .42, .026);
      b.part('block', '#5c5846', x + dx + side * .13, y + .30, z - .45, .055, .17, .057);
    }
    b.part('block','#635d48',x+dx,y+.37,z-.45,.31,.05,.057);
  }
  return shutter.group;
}

function deliveryRamp(root, b) {
  const { x, z, width: w, depth: d, height: h } = RAMP;
  const left = x - w / 2, right = x + w / 2, foot = z + d / 2, lip = z - d / 2;
  const positions = [
    left,.01,foot, right,h,lip, left,h,lip, left,.01,foot, right,.01,foot, right,h,lip,
    left,.01,foot, left,h,lip, left,.01,lip, right,.01,foot, right,.01,lip, right,h,lip,
    left,.01,lip, left,h,lip, right,h,lip, left,.01,lip, right,h,lip, right,.01,lip,
  ];
  const shape = new BufferGeometry();
  shape.setAttribute('position', new Float32BufferAttribute(positions, 3));
  shape.computeVertexNormals();
  const wedge = new Mesh(shape, new MeshLambertMaterial({ color: '#a68f70' }));
  wedge.receiveShadow = true; wedge.castShadow = true; root.add(wedge);
  for (let i = 1; i <= 8; i++) {
    const t = i / 9;
    b.part('block', i % 2 ? '#7b705a' : '#968869', x, t * h + .022, foot - t * d,
      w - .28, .035, .065, Math.atan(h / d));
  }
  for (const side of [-1, 1]) limb(b, '#d7bc88', [x + side * (w / 2 - .04), .035, foot],
    [x + side * (w / 2 - .04), h + .025, lip], .12);
}

function streetFurniture(root, b) {
  // Public seating under the rain tree, with a painted timber back and cast feet.
  for (const [x,z] of [[-9.7,2.13],[12.72,-10]]) {
    for (const side of [-1,1]) b.part('block','#4d5c4d',x+side*.79,.32,z,.16,.52,.45);
    for(let l=0;l<3;l++) b.part('block','#a48961',x,.59,z-.17+l*.15,2.02,.078,.12);
    b.part('block','#8c7958',x,.91,z-.25,2.03,.24,.10);
  }
  // Low, faded laterite gate between the alley and the flagship's boundary.
  for(const [x,z,w] of [[-4.31,-26.6,5.8],[3.85,-26.7,5.4],[-22.37,-19.86,3.3],[24.24,-15.0,3.4]]){
    b.part('soft','#aa7656',x,.54,z,w,1.08,.44);
    b.part('block','#c59c76',x,1.12,z,w+.10,.13,.52);
    for(let i=0;i<3;i++) b.part('block','#966b52',x,.16+i*.30,z+.225,w,.019,.018);
  }
  // Painted lane identity on the shop's corner. Its edge is visible from above the pickup.
  b.part('post','#6e745f',4.99,1.23,-9.36,.105,2.08,.105);
  b.part('soft',teal,4.99,2.05,-9.36,1.50,.46,.087);
  sign(root, 'MARKET LANE',4.99,2.05,-9.309,1.40,.34,{paper:teal});
  const rand=seeded(1001);
  for(const [x,z] of [[-5.5,1.8],[7.3,1.8],[11.1,-15.8],[-17,-22],[20,-20],[-13,-11.1],[-13.2,4.3],[-10.8,4.7],[21.5,.98]]){
    for(let n=0;n<7;n++){
      const a=rand()*Math.PI*2,r=rand()*.78;
      b.part('crown',n%2?'#8d9c6d':'#6e8b5e',x+Math.cos(a)*r,.26+rand()*.19,z+Math.sin(a)*r,
        .56+rand()*.74,.40+rand()*.48,.60+rand()*.58,0,rand()*3,0);
    }
  }
  // Single falling leaf loops well away from titles, links and marked curves.
  const leaf=craft(root);
  leaf.part('crown','#a7723f',0,0,0,.27,.05,.46,.12,.55,.15);
  leaf.part('block','#916e4b',0,.021,0,.021,.012,.49);
  leaf.finish();
  return leaf.group;
}

export function addDistricts(root, { kerb, shopPrint }) {
  const group = new Group();
  root.add(group);
  const builder = craft(group);
  BUILDINGS.slice(1).forEach((site, i) => {
    kerb(builder, i + 1);
    switch (site.id) {
      case 'luxvibe':
      case 'fabea': boutique(group, builder, site, shopPrint); break;
      case 'tea': teaShop(group, builder, site); break;
      case 'workshop': workshop(group, builder, site); break;
      case 'office': office(group, builder, site); break;
    }
  });
  const rear = loading(builder, group);
  deliveryRamp(group, builder);
  const leaf = streetFurniture(group, builder);
  seedStreet(group, builder);
  builder.finish();
  return { rear, leaf };
}
