// Original, full-scale right-hand-drive saloon. Local +X is the nose; the
// front passenger door is on the -Z (kerb) side. Dimensions are in metres.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const carPosition = Object.freeze([-1.34, -0.13, 13.38]);

export function buildCar(THREE, scene) {
  const car = new THREE.Group();
  car.name = 'Parked car';
  car.position.set(...carPosition);
  scene.add(car);

  const finish = (color, roughness, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const paint = finish('#58716a', 0.29, 0.28);
  const rubber = finish('#242828', 0.89);
  const rubberEdge = finish('#343b39', 0.59);
  const metal = finish('#a3a8a4', 0.29, 0.53);
  const darkMetal = finish('#414a49', 0.35, 0.45);
  const mirrorSilver = finish('#c7d5d2', 0.13, 0.7);
  const upholstery = finish('#585448', 0.89);
  const interior = finish('#313332', 0.81);
  const headlining = finish('#888374', 0.94);
  const lamp = finish('#d2dbd5', 0.2, 0.3);
  const amber = finish('#b96a36', 0.34, 0.15);
  const red = finish('#85352c', 0.29, 0.16);
  const glass = new THREE.MeshStandardMaterial({
    color: '#aec6bd',
    transparent: true,
    opacity: 0.078,
    roughness: 0.12,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const trimMaterial = [
    paint,
    rubber,
    rubberEdge,
    metal,
    darkMetal,
    upholstery,
    interior,
    headlining,
    lamp,
    amber,
    red,
    glass,
    mirrorSilver,
  ];

  const body = new THREE.Group();
  const door = new THREE.Group();
  car.add(body, door);
  const hinge = new THREE.Vector3(0.97, 0, -0.83);

  function mesh(group, geometry, material, at = [0, 0, 0]) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(...at);
    group.add(item);
    return item;
  }
  const block = (g, m, position, size) => mesh(g, new THREE.BoxGeometry(...size), m, position);

  function bar(group, material, a, b, radius, endRadius = radius, segments = 8) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const line = end.clone().sub(start);
    const item = mesh(
      group,
      new THREE.CylinderGeometry(endRadius, radius, line.length(), segments),
      material,
      start.addScaledVector(line, 0.5).toArray(),
    );
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), line.normalize());
    return item;
  }

  function polygon(group, material, vertices, triangles) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
    geometry.setIndex(triangles);
    geometry.computeVertexNormals();
    return mesh(group, geometry, material);
  }

  // An elliptical shoulder and a narrow crown soften highlights along each
  // pressed shell. Separate longitudinal sections leave the cabin hollow.
  function shell(group, material, rows) {
    const positions = [];
    const indices = [];
    const sides = 12;
    for (const [x, base, top, half] of rows) {
      const height = top - base;
      for (const [y, z] of [
        [0.04, -0.92],
        [0.16, -0.98],
        [0.65, -1],
        [0.86, -0.95],
        [0.98, -0.77],
        [1, -0.37],
        [1, 0.37],
        [0.98, 0.77],
        [0.86, 0.95],
        [0.65, 1],
        [0.16, 0.98],
        [0.04, 0.92],
      ])
        positions.push([x, base + height * y, half * z]);
    }
    for (let row = 0; row < rows.length - 1; row++) {
      for (let j = 0; j < sides; j++) {
        const a = row * sides + j,
          b = row * sides + ((j + 1) % sides);
        indices.push(a, b, b + sides, a, b + sides, a + sides);
      }
    }
    for (let j = 1; j < sides - 1; j++) {
      const last = (rows.length - 1) * sides;
      indices.push(0, j + 1, j, last, last + j, last + j + 1);
    }
    return polygon(group, material, positions, indices);
  }

  function skin(group, material, shape, z, depth, bevel = 0.008) {
    return mesh(
      group,
      new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: bevel > 0,
        bevelSegments: 2,
        steps: 1,
        bevelSize: bevel,
        bevelThickness: bevel,
        curveSegments: 12,
      }),
      material,
      [0, 0, z],
    );
  }

  function pane(group, corners) {
    polygon(group, glass, corners, [0, 1, 2, 0, 2, 3]);
  }
  function edge(group, material, contour, radius) {
    for (let i = 1; i < contour.length; i++) bar(group, material, contour[i - 1], contour[i], radius);
  }
  function sidePanel(group, material, points, z, depth, bevel) {
    const shape = new THREE.Shape();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) shape.moveTo(...points[i]);
      else shape.lineTo(...points[i]);
    }
    shape.closePath();
    return skin(group, material, shape, z, depth, bevel);
  }

  // Engine compartment, raised deck, floor, and painted top. The bulk of
  // the body fits between the wheels; the outer wings have real arch cuts.
  shell(body, paint, [
    [0.92, 0.45, 1.025, 0.83],
    [1.06, 0.46, 1.004, 0.865],
    [1.78, 0.46, 0.82, 0.84],
    [2.04, 0.44, 0.73, 0.79],
    [2.12, 0.44, 0.66, 0.7],
  ]);
  shell(body, paint, [
    [-2.16, 0.45, 0.76, 0.71],
    [-2.09, 0.45, 0.87, 0.8],
    [-1.75, 0.48, 0.98, 0.85],
    [-1.44, 0.5, 1.046, 0.84],
  ]);
  shell(body, paint, [
    [-1.36, 1.4, 1.46, 0.56],
    [-1.13, 1.48, 1.56, 0.66],
    [-0.89, 1.51, 1.59, 0.68],
    [0.46, 1.52, 1.59, 0.68],
    [0.62, 1.49, 1.56, 0.66],
  ]);
  shell(body, headlining, [
    [-1.14, 1.47, 1.49, 0.66],
    [-0.91, 1.49, 1.51, 0.67],
    [0.61, 1.49, 1.51, 0.64],
  ]);
  block(body, interior, [-0.15, 0.34, 0], [2.93, 0.14, 1.58]);

  for (const side of [-1, 1]) {
    const panelZ = side < 0 ? -0.862 : 0.808;
    const fender = new THREE.Shape();
    fender.moveTo(0.98, 0.29);
    fender.lineTo(1.3 - 0.357, 0.31);
    fender.absarc(1.3, 0.315, 0.357, Math.PI, 0, true);
    fender.lineTo(2.03, 0.325);
    fender.quadraticCurveTo(2.15, 0.41, 2.09, 0.68);
    fender.quadraticCurveTo(1.68, 0.9, 1.04, 1.035);
    fender.lineTo(0.98, 1.041);
    fender.closePath();
    skin(body, paint, fender, panelZ, 0.052);
    const quarter = new THREE.Shape();
    quarter.moveTo(-2.1, 0.34);
    quarter.lineTo(-1.32 - 0.357, 0.31);
    quarter.absarc(-1.32, 0.315, 0.357, Math.PI, 0, true);
    quarter.lineTo(-0.61, 0.28);
    quarter.lineTo(-0.61, 1.098);
    quarter.lineTo(-1.73, 0.985);
    quarter.quadraticCurveTo(-2.06, 0.94, -2.14, 0.77);
    quarter.closePath();
    skin(body, paint, quarter, panelZ, 0.052);
    block(body, rubber, [-0.14, 0.27, 0.827 * side], [2.05, 0.095, 0.1]);
    block(body, metal, [-0.12, 0.3, 0.865 * side], [1.92, 0.019, 0.014]);

    const group = side < 0 ? door : body;
    sidePanel(
      group,
      paint,
      [
        [-0.59, 0.32],
        [0.938, 0.32],
        [0.951, 1.018],
        [0.918, 1.054],
        [-0.59, 1.1],
      ],
      panelZ,
      0.051,
      0.01,
    );
    sidePanel(
      group,
      interior,
      [
        [-0.575, 0.33],
        [0.916, 0.33],
        [0.925, 1.038],
        [-0.575, 1.082],
      ],
      side < 0 ? -0.804 : 0.766,
      0.039,
      0.008,
    );
    const glassBottom = [
      [-0.565, 1.105, 0.829 * side],
      [0.946, 1.06, 0.83 * side],
    ];
    const glassTop = [
      [0.57, 1.495, 0.667 * side],
      [-0.556, 1.495, 0.675 * side],
    ];
    pane(group, [...glassBottom, ...glassTop]);
    edge(group, rubberEdge, [glassBottom[0], glassBottom[1]], 0.022);
    edge(group, rubber, [glassBottom[1], glassTop[0], glassTop[1], glassBottom[0]], 0.02);
    edge(group, metal, [glassBottom[1], glassBottom[0]], 0.009);
    bar(group, metal, [-0.46, 0.908, 0.882 * side], [-0.28, 0.908, 0.882 * side], 0.015);
    bar(group, darkMetal, [-0.44, 0.9, 0.857 * side], [-0.44, 0.9, 0.879 * side], 0.015);
    bar(group, darkMetal, [-0.3, 0.9, 0.857 * side], [-0.3, 0.9, 0.879 * side], 0.015);

    // Moulded, layered door trim. The padded cap and slim satin release catch
    // side light below the glass in the passenger's opening point of view.
    const cap = sidePanel(
      group,
      upholstery,
      [
        [-0.555, 0.953],
        [0.91, 0.914],
        [0.914, 1.028],
        [-0.555, 1.074],
      ],
      side < 0 ? -0.797 : 0.723,
      0.074,
      0.012,
    );
    cap.name = 'Padded inner shoulder';
    bar(group, interior, [-0.549, 1.082, 0.785 * side], [0.925, 1.039, 0.785 * side], 0.026);
    bar(group, metal, [-0.548, 1.065, 0.717 * side], [0.918, 1.021, 0.717 * side], 0.0055);
    const arm = block(group, upholstery, [-0.04, 0.804, 0.732 * side], [0.77, 0.065, 0.119]);
    arm.rotation.z = -0.022;
    const escutcheon = sidePanel(
      group,
      interior,
      [
        [0.248, 0.945],
        [0.52, 0.947],
        [0.578, 1.025],
        [0.254, 1.038],
        [0.232, 1.012],
      ],
      side < 0 ? -0.72 : 0.709,
      0.011,
      0.004,
    );
    escutcheon.name = 'Recess behind door release';
    bar(group, metal, [0.264, 1.011, 0.698 * side], [0.519, 0.993, 0.694 * side], 0.011, 0.014);
    bar(group, metal, [0.519, 0.993, 0.694 * side], [0.544, 0.978, 0.703 * side], 0.014, 0.01);
    block(group, rubberEdge, [0.065, 0.841, 0.727 * side], [0.068, 0.012, 0.04]);

    // Mirrors travel with the front doors.
    bar(group, rubber, [0.81, 1.073, 0.8 * side], [0.795, 1.116, 1.01 * side], 0.032, 0.024);
    // The mirror face looks back and slightly inboard. Its rim and tapered
    // housing have different finishes, so the kerb-side mirror also reads
    // correctly from the passenger seat at grazing incidence.
    const mirrorContour = [
      [-0.96, -0.49],
      [-0.77, -0.79],
      [0.45, -0.86],
      [0.84, -0.63],
      [1, -0.18],
      [0.92, 0.44],
      [0.58, 0.73],
      [-0.55, 0.87],
      [-0.89, 0.65],
      [-1, 0.21],
    ];
    const ringPoints = (size, depth) =>
      mirrorContour.map(([u, v]) => [
        0.733 - side * 0.5 * u * 0.147 * size + 0.866 * depth,
        1.134 + v * 0.084 * size,
        1.032 * side + 0.866 * u * 0.147 * size + side * 0.5 * depth,
      ]);
    const ringBetween = (one, two) => {
      const indices = [];
      for (let j = 0; j < one.length; j++) {
        const k = (j + 1) % one.length,
          l = one.length;
        indices.push(j, k + l, k, j, j + l, k + l);
      }
      return [one.concat(two), indices];
    };
    const front = ringPoints(0.96, 0);
    const waist = ringPoints(1, 0.034);
    const nose = ringPoints(0.72, 0.097);
    const end = ringPoints(0.08, 0.125);
    const mirrorFace = ringPoints(0.872, -0.001);
    polygon(group, rubber, ...ringBetween(front, waist));
    polygon(group, paint, ...ringBetween(waist, nose));
    polygon(group, paint, ...ringBetween(nose, end));
    polygon(group, rubber, ...ringBetween(mirrorFace, front));
    const faceTriangles = [];
    for (let j = 1; j < mirrorFace.length - 1; j++) faceTriangles.push(0, j, j + 1);
    polygon(group, mirrorSilver, mirrorFace, faceTriangles);
    // Fixed A/B/C pillars and brightwork follow the side glass into the roof.
    const frontPillar = [
      [1.04, 1.052, 0.82 * side],
      [0.61, 1.51, 0.66 * side],
    ];
    const rear = [
      [-1.65, 1.006, 0.81 * side],
      [-1.13, 1.5, 0.66 * side],
    ];
    bar(body, paint, ...frontPillar, 0.05, 0.042);
    bar(body, paint, ...rear, 0.1, 0.068);
    bar(body, interior, [-0.608, 1.073, 0.8 * side], [-0.608, 1.51, 0.664 * side], 0.047);
    const rearGlass = [
      [-1.53, 1.036, 0.826 * side],
      [-0.673, 1.105, 0.831 * side],
      [-0.669, 1.486, 0.674 * side],
      [-1.105, 1.486, 0.651 * side],
    ];
    pane(body, rearGlass);
    edge(body, rubber, [...rearGlass, rearGlass[0]], 0.019);
    edge(body, metal, [rear[0], rear[1], frontPillar[1]], 0.013);
    bar(body, metal, [-1.58, 1.025, 0.85 * side], [-0.64, 1.091, 0.85 * side], 0.011);
  }
  pane(body, [
    [1.045, 1.044, -0.79],
    [1.045, 1.044, 0.79],
    [0.609, 1.495, 0.65],
    [0.609, 1.495, -0.65],
  ]);
  pane(body, [
    [-1.59, 1.038, 0.77],
    [-1.59, 1.038, -0.77],
    [-1.13, 1.49, -0.62],
    [-1.13, 1.49, 0.62],
  ]);
  for (const z of [-0.3, 0.35]) {
    bar(body, rubber, [1.005, 1.089, z - 0.19], [0.98, 1.113, z + 0.16], 0.01);
  }

  // Both axle assemblies and small rubber lips around each wheel opening.
  for (const x of [-1.32, 1.3]) {
    for (const side of [-1, 1]) {
      const wheelZ = 0.822 * side;
      const axle = (m, rad, depth, z) => {
        const w = mesh(body, new THREE.CylinderGeometry(rad, rad, depth, 32), m, [x, 0.317, z]);
        w.rotation.x = Math.PI / 2;
      };
      axle(rubber, 0.312, 0.182, wheelZ);
      axle(rubberEdge, 0.268, 0.012, wheelZ + 0.087 * side);
      axle(darkMetal, 0.207, 0.017, wheelZ + 0.092 * side);
      const z = wheelZ + 0.108 * side;
      const ring = mesh(body, new THREE.TorusGeometry(0.198, 0.01, 5, 32), metal, [x, 0.317, z]);
      ring.name = 'Rolled rim';
      for (let s = 0; s < 7; s++) {
        const angle = (s * Math.PI * 2) / 7;
        for (const offset of [-0.08, 0.08]) {
          const hub = [x + Math.cos(angle) * 0.058, 0.317 + Math.sin(angle) * 0.058, z];
          const rim = [x + Math.cos(angle + offset) * 0.192, 0.317 + Math.sin(angle + offset) * 0.192, z];
          bar(body, metal, hub, rim, 0.011, 0.009, 6);
        }
      }
      axle(metal, 0.064, 0.016, z + 0.005 * side);
      const lip = [];
      for (let s = 0; s <= 20; s++) {
        const a = (Math.PI * s) / 20;
        lip.push([x + 0.355 * Math.cos(a), 0.315 + 0.355 * Math.sin(a), 0.868 * side]);
      }
      edge(body, rubberEdge, lip, 0.009);
    }
  }

  // Passenger and driver seats, dashboard, steering and rear bench.
  for (const z of [-0.4, 0.4]) {
    const base = shell(body, upholstery, [
      [-0.29, 0.405, 0.55, 0.22],
      [-0.24, 0.395, 0.579, 0.26],
      [0.26, 0.395, 0.578, 0.259],
      [0.318, 0.409, 0.539, 0.229],
    ]);
    base.position.z = z;
    const back = block(body, upholstery, [-0.286, 0.738, z], [0.13, 0.54, 0.485]);
    back.rotation.z = 0.17;
    const rest = mesh(body, new THREE.SphereGeometry(1, 14, 8), interior, [-0.343, 1.084, z]);
    rest.scale.set(0.1, 0.122, 0.178);
    for (const dz of [-0.095, 0.095])
      bar(body, metal, [-0.335, 0.979, z + dz], [-0.344, 1.045, z + dz], 0.009);
  }
  block(body, upholstery, [-1.04, 0.498, 0], [0.49, 0.16, 1.37]);
  const bench = block(body, upholstery, [-1.32, 0.74, 0], [0.14, 0.49, 1.34]);
  bench.rotation.z = 0.19;
  shell(body, interior, [
    [0.7, 0.68, 0.907, 0.735],
    [0.75, 0.635, 0.941, 0.8],
    [1.04, 0.67, 0.949, 0.8],
  ]);
  block(body, darkMetal, [0.707, 0.797, 0], [0.018, 0.094, 0.323]);
  bar(body, metal, [0.7, 0.77, -0.67], [0.7, 0.77, -0.098], 0.01);
  const rim = mesh(body, new THREE.TorusGeometry(0.159, 0.018, 8, 28), rubber, [0.592, 0.895, 0.387]);
  rim.rotation.y = Math.PI / 2;
  rim.rotation.x = -0.18;
  for (let i = 0; i < 3; i++) {
    const a = (i * 2 * Math.PI) / 3 + Math.PI / 2;
    bar(
      body,
      darkMetal,
      [0.592, 0.895, 0.387],
      [0.592, 0.895 + 0.14 * Math.sin(a), 0.387 + 0.14 * Math.cos(a)],
      0.015,
    );
  }

  block(body, rubber, [2.107, 0.51, 0], [0.04, 0.187, 1.314]);
  for (const y of [0.47, 0.52, 0.57]) bar(body, darkMetal, [2.13, y, -0.56], [2.13, y, 0.56], 0.009);
  for (const side of [-1, 1]) {
    const frontLight = block(body, lamp, [2.06, 0.647, 0.596 * side], [0.055, 0.075, 0.28]);
    frontLight.rotation.y = 0.22 * side;
    block(body, amber, [2.03, 0.646, 0.743 * side], [0.046, 0.052, 0.029]);
    const rearLight = block(body, red, [-2.118, 0.704, 0.588 * side], [0.06, 0.076, 0.31]);
    rearLight.rotation.y = -0.16 * side;
  }
  block(body, lamp, [-2.157, 0.55, 0], [0.019, 0.092, 0.335]);
  block(body, rubberEdge, [-2.118, 0.4, 0], [0.1, 0.067, 1.5]);

  // Bake local transforms and batch original opaque geometry by finish. Hinged
  // pieces stay on a separate draw group so reverse scrolling also reverses them.
  function batch(group) {
    const materials = new Map();
    for (const item of [...group.children]) {
      item.updateMatrix();
      const src = item.geometry;
      const geom = src.index ? src.toNonIndexed() : src.clone();
      for (const attr of Object.keys(geom.attributes)) {
        if (attr !== 'position' && attr !== 'normal') geom.deleteAttribute(attr);
      }
      geom.applyMatrix4(item.matrix);
      const pieces = materials.get(item.material) || [];
      pieces.push(geom);
      materials.set(item.material, pieces);
      group.remove(item);
      src.dispose();
    }
    for (const [material, pieces] of materials) {
      const combined = mergeGeometries(pieces);
      for (const geometry of pieces) geometry.dispose();
      if (group === door) combined.translate(-hinge.x, -hinge.y, -hinge.z);
      const item = mesh(group, combined, material);
      item.castShadow = material !== glass;
      item.receiveShadow = material !== glass;
    }
  }
  batch(body);
  batch(door);
  door.position.copy(hinge);
  door.name = 'Front passenger door';

  const motion = (p, a, b) => {
    const t = THREE.MathUtils.clamp((p - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  return {
    update(progress) {
      const opening = motion(progress, 0.01, 0.078);
      const closing = motion(progress, 0.16, 0.22);
      door.rotation.y = -1.16 * (opening - closing);
    },
    dispose() {
      car.traverse((item) => item.geometry?.dispose());
      for (const material of trimMaterial) material.dispose();
      scene.remove(car);
    },
  };
}
