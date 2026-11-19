import facialSurface from './assets/cast-face.bin?url&inline';

// Each figure has four batched draws: body, head and two independently posed
// arms. Everything uses the office lighting. The coordinates below are metres.
const cast = [
  {
    role: 'reception',
    position: [2.15, -4.55],
    yaw: -0.17,
    standing: true,
    feminine: true,
    skin: '#ad7960',
    top: '#316b65',
    trousers: '#283c3a',
    trim: '#cdbd95',
    style: 'drape',
    hair: 'bun',
    height: 0.99,
  },
  {
    role: 'developer',
    position: [-3.65, -13.7],
    yaw: 0.08,
    skin: '#996a52',
    top: '#567c84',
    trousers: '#384145',
    trim: '#c9c9ae',
    style: 'shirt',
    hair: 'crop',
    height: 1.02,
  },
  {
    role: 'designer',
    position: [-5.5, -13.7],
    yaw: 0.14,
    feminine: true,
    skin: '#bb866c',
    top: '#bd7863',
    trousers: '#3a3942',
    trim: '#ead5b2',
    style: 'blouse',
    hair: 'bob',
    height: 0.96,
  },
  {
    role: 'studio-manager',
    position: [-4.8, -11.8],
    yaw: Math.PI - 0.17,
    standing: true,
    skin: '#93654b',
    top: '#79765e',
    trousers: '#444138',
    trim: '#eae2cb',
    style: 'shirt',
    hair: 'part',
    height: 1.01,
  },
  {
    role: 'client',
    position: [3.9, -19],
    yaw: -0.26,
    feminine: true,
    skin: '#bd8b6d',
    top: '#b98748',
    trousers: '#52453d',
    trim: '#eddfbd',
    style: 'drape',
    hair: 'pony',
    height: 0.98,
  },
  {
    role: 'review-manager',
    position: [2.6, -17.1],
    yaw: Math.PI - 0.39,
    skin: '#916653',
    top: '#475b72',
    trousers: '#313941',
    trim: '#ddd4ba',
    style: 'jacket',
    hair: 'part',
    height: 1.03,
  },
  {
    role: 'founder',
    position: [0.35, -26.75],
    yaw: -1.2,
    skin: '#a8755c',
    top: '#353e42',
    trousers: '#363a39',
    trim: '#e7d8ba',
    style: 'jacket',
    hair: 'crop',
    height: 1.01,
  },
];

function readFaceGeometry(THREE) {
  const bytes = Uint8Array.from(atob(facialSurface.split(',')[1]), (c) => c.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  let offset = 0;
  return Array.from({ length: 4 }, () => {
    const vertices = view.getUint32(offset, true);
    const indices = view.getUint32(offset + 4, true);
    offset += 8;
    const positions = new Float32Array(vertices * 3);
    for (let i = 0; i < positions.length; i++, offset += 2)
      positions[i] = view.getInt16(offset, true) / 30000;
    const faces = new Uint16Array(indices);
    for (let i = 0; i < faces.length; i++, offset += 2) faces[i] = view.getUint16(offset, true);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(faces, 1));
    geometry.computeVertexNormals();
    return geometry;
  });
}

// Build one indexed, vertex-coloured surface for all pieces that move together.
function sculpture(THREE, material) {
  const positions = [],
    normals = [],
    colours = [],
    indices = [];
  const matrix = new THREE.Matrix4(),
    normalMatrix = new THREE.Matrix3();
  const rotation = new THREE.Quaternion(),
    angles = new THREE.Euler();
  const point = new THREE.Vector3(),
    normal = new THREE.Vector3();
  const colour = new THREE.Color();
  function add(geometry, tint, at = [0, 0, 0], size = [1, 1, 1], euler = [0, 0, 0], shade) {
    rotation.setFromEuler(angles.set(...euler));
    matrix.compose(new THREE.Vector3(...at), rotation, new THREE.Vector3(...size));
    normalMatrix.getNormalMatrix(matrix);
    const start = positions.length / 3;
    const pos = geometry.getAttribute('position'),
      norm = geometry.getAttribute('normal');
    for (let i = 0; i < pos.count; i++) {
      point.fromBufferAttribute(pos, i);
      colour.set(tint);
      if (shade) shade(point, colour);
      point.applyMatrix4(matrix);
      normal.fromBufferAttribute(norm, i).applyNormalMatrix(normalMatrix);
      positions.push(point.x, point.y, point.z);
      normals.push(normal.x, normal.y, normal.z);
      colours.push(colour.r, colour.g, colour.b);
    }
    if (geometry.index) {
      for (const index of geometry.index.array) indices.push(start + index);
    } else {
      for (let i = 0; i < pos.count; i++) indices.push(start + i);
    }
  }
  function finish() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
    geometry.setIndex(indices);
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    return mesh;
  }
  return { add, finish };
}

// Cross-sections follow the centre line rather than forming disconnected
// cylinders. The same construction describes a sleeve, trouser leg or collar.
function cloth(THREE, sections, sides = 12, horizontal = false) {
  const positions = [],
    indices = [];
  const axis = new THREE.Vector3(1, 0, 0),
    up = new THREE.Vector3();
  const across = new THREE.Vector3(),
    forward = new THREE.Vector3();
  for (let n = 0; n < sections.length; n++) {
    const section = sections[n];
    const prev = sections[Math.max(0, n - 1)],
      next = sections[Math.min(n + 1, sections.length - 1)];
    if (horizontal) up.set(0, 1, 0);
    else up.set(next[0] - prev[0], next[1] - prev[1], next[2] - prev[2]).normalize();
    forward.crossVectors(axis, up).normalize();
    across.crossVectors(up, forward).normalize();
    for (let i = 0; i < sides; i++) {
      const t = (i * 2 * Math.PI) / sides,
        xx = section[3] * Math.cos(t),
        zz = section[4] * Math.sin(t);
      positions.push(
        section[0] + across.x * xx + forward.x * zz,
        section[1] + across.y * xx + forward.y * zz,
        section[2] + across.z * xx + forward.z * zz,
      );
      if (n) {
        const a = (n - 1) * sides + i,
          b = (n - 1) * sides + ((i + 1) % sides);
        indices.push(a, a + sides, b, b, a + sides, b + sides);
      }
    }
  }
  for (let i = 1; i < sides - 1; i++) {
    const end = (sections.length - 1) * sides;
    indices.push(0, i, i + 1, end, end + i + 1, end + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function toolsFor(THREE, batch, common) {
  function ellipsoid(at, size, tint, rotation) {
    batch.add(common.sphere, tint, at, size, rotation);
  }
  function box(at, size, tint, rotation) {
    batch.add(common.box, tint, at, size, rotation);
  }
  function profile(sections, tint, sides, horizontal) {
    const geometry = cloth(THREE, sections, sides, horizontal);
    batch.add(geometry, tint);
    geometry.dispose();
  }
  function stroke(points, radius, tint) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const geometry = new THREE.TubeGeometry(curve, Math.max(4, points.length * 2), radius, 5, false);
    batch.add(geometry, tint);
    geometry.dispose();
  }
  function panel(points, tint) {
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
    tri.setIndex(points.slice(2).flatMap((_, index) => [0, index + 1, index + 2, 0, index + 2, index + 1]));
    // Panels are perpendicular to local Z and have a visible top stitched edge.
    const normals = new Float32Array(points.length * 3);
    for (let i = 2; i < normals.length; i += 3) normals[i] = 1;
    tri.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    batch.add(tri, tint);
    tri.dispose();
  }
  return { ellipsoid, box, profile, stroke, panel };
}

function face(THREE, common, person, seed) {
  const batch = sculpture(THREE, common.material);
  const { ellipsoid, stroke } = toolsFor(THREE, batch, common);
  const faceIndex = person.feminine ? 0 : 2,
    skin = common.faces[faceIndex];
  const skinWidth = 0.96 + 0.045 * Math.sin(seed);
  const lipTint = new THREE.Color(0.86, 0.66, 0.67);
  const hair = ['#252323', '#252421', '#302825'][seed % 3];
  batch.add(skin, person.skin, [0, 0, 0], [skinWidth, 1, 1], undefined, (p, c) => {
    // Soft tint stays on the sculpted lips and ears; eyes and eyelids are built separately.
    if (p.z > 0.088 && Math.abs(p.y - 0.058) < 0.01 && Math.abs(p.x) < 0.028) c.multiply(lipTint);
    if (Math.abs(p.x) > 0.073 && p.y < 0.15) c.multiplyScalar(0.9);
  });
  batch.add(
    common.faces[faceIndex + 1],
    hair,
    [0, 0.002, -0.001],
    [skinWidth * 1.065, 1.03, 1.065],
    [0, 0, 0],
    (p, c) => {
      const wave = Math.sin((p.x * 2 + p.z * 0.64 + p.y * 0.45) * 720);
      c.multiplyScalar(1.07 + 0.15 * wave);
    },
  );
  if (person.hair === 'bun' || person.hair === 'pony') {
    ellipsoid([0, 0.135, -0.094], [0.049, 0.053, 0.042], hair, [-0.28, 0, 0]);
    if (person.hair === 'pony')
      ellipsoid([0.005, 0.064, -0.101], [0.036, 0.08, 0.025], hair, [0.15, 0, -0.1]);
  } else if (person.hair === 'bob') {
    ellipsoid([0, 0.115, -0.063], [0.079, 0.092, 0.041], hair);
    for (const side of [-1, 1])
      ellipsoid([side * 0.077, 0.111, -0.007], [0.019, 0.076, 0.055], hair, [0.05, 0, side * -0.08]);
  } else {
    ellipsoid([-0.018, 0.222, -0.006], [0.065, 0.034, 0.074], hair, [-0.05, 0, -0.08]);
  }
  for (const side of [-1, 1]) {
    const x = side * 0.031 * skinWidth;
    ellipsoid([x, 0.13, 0.078], [0.013, 0.012, 0.014], '#d4c7b3');
    ellipsoid([x - 0.0007, 0.13, 0.091], [0.0054, 0.0058, 0.0018], '#352e29');
    stroke(
      [
        [x - 0.014, 0.153, 0.099],
        [x, 0.157, 0.1],
        [x + 0.014, 0.154, 0.097],
      ],
      person.feminine ? 0.002 : 0.0028,
      hair,
    );
    if (person.role === 'reception' || person.role === 'client')
      ellipsoid([side * 0.079, 0.097, 0.001], [0.0032, 0.004, 0.003], '#c4a364');
  }
  if (person.role === 'developer') {
    for (const s of [-1, 1]) {
      const cx = s * 0.032;
      const frame = [];
      for (let j = 0; j <= 12; j++) {
        const a = (Math.PI * 2 * j) / 12;
        frame.push([
          cx + 0.023 * Math.cos(a),
          0.131 + 0.014 * Math.sin(a),
          0.101 - Math.abs(Math.cos(a)) * 0.002,
        ]);
      }
      stroke(frame, 0.0018, '#46423a');
      stroke(
        [
          [s * 0.053, 0.139, 0.095],
          [s * 0.079, 0.139, 0.048],
          [s * 0.081, 0.13, 0.009],
        ],
        0.0018,
        '#46423a',
      );
    }
    stroke(
      [
        [-0.01, 0.136, 0.102],
        [0, 0.14, 0.103],
        [0.01, 0.136, 0.102],
      ],
      0.0019,
      '#46423a',
    );
  }
  return batch.finish();
}

function buildBody(THREE, common, person, hip) {
  const batch = sculpture(THREE, common.material);
  const { profile, ellipsoid, stroke, panel } = toolsFor(THREE, batch, common);
  const h = hip;
  for (const side of [-1, 1]) {
    const x = side * 0.112;
    const knee = person.standing ? [x * 1.1, 0.47, 0.025 * side] : [x * 1.22, 0.47, 0.39 + side * 0.016];
    const ankle = person.standing ? [x * 1.25, 0.102, 0.035 * side] : [x * 1.44, 0.099, 0.355 - side * 0.035];
    profile(
      [
        [ankle[0], ankle[1] - 0.019, ankle[2], 0.066, 0.056],
        [ankle[0], ankle[1] + 0.017, ankle[2], 0.065, 0.057],
        [(ankle[0] + knee[0]) * 0.5, 0.29, (ankle[2] + knee[2]) * 0.5 - 0.011, 0.08, 0.071],
        [...knee, 0.086, 0.082],
        [(knee[0] + x) * 0.5, (knee[1] + h) * 0.5 + 0.018, knee[2] * 0.55, 0.094, 0.09],
        [x * 0.83, h + 0.007, 0.002, 0.089, 0.093],
      ],
      person.trousers,
    );
    ellipsoid([ankle[0], 0.048, ankle[2] + 0.056], [0.068, 0.043, 0.132], '#403b36');
    ellipsoid([ankle[0], 0.021, ankle[2] + 0.061], [0.07, 0.017, 0.134], '#2e2c2a');
  }
  ellipsoid([0, h + 0.022, 0.004], [0.194, 0.099, 0.119], person.trousers);
  const shoulder = person.feminine ? 0.204 : 0.22;
  const sections = [
    [0, h - 0.02, 0.022, 0.191, 0.117],
    [0, h + 0.018, 0.021, 0.192, 0.119],
    [0, h + 0.168, 0.02, person.feminine ? 0.151 : 0.174, 0.109],
    [0, h + 0.296, 0.026, person.feminine ? 0.169 : 0.182, 0.126],
    [0, h + 0.409, 0.021, shoulder * 0.94, 0.124],
    [0, h + 0.462, 0.014, shoulder, 0.101],
    [0, h + 0.494, 0.01, shoulder * 0.88, 0.083],
    [0, h + 0.523, 0.008, 0.064, 0.06],
  ];
  profile(sections, person.top, 22, true);
  profile(
    [
      [0, h + 0.49, 0.005, 0.057, 0.061],
      [0, h + 0.594, 0.02, 0.05, 0.054],
    ],
    person.skin,
  );
  // Project garment pieces onto the cut of the torso. Small span divisions
  // preserve the curvature along both the neckline and the front of the chest.
  function front(x, height, lift = 0.005) {
    const y = h + height;
    const k = sections.findIndex((section) => section[1] >= y);
    const hi = k < 0 ? sections.length - 1 : k,
      lo = Math.max(0, hi - 1);
    const a = sections[lo],
      b = sections[hi];
    const f = hi === lo ? 0 : (y - a[1]) / (b[1] - a[1]);
    const [z, wide, deep] = [2, 3, 4].map((i) => a[i] + (b[i] - a[i]) * f);
    return [x, y, z + deep * Math.sqrt(Math.max(0.005, 1 - (x / wide) ** 2)) + lift];
  }
  function fabric(rows, tint, lift) {
    const points = [];
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1],
        b = rows[i];
      const count = Math.max(1, Math.ceil(Math.abs(a[0] - b[0]) / 0.022));
      for (let j = 0; j < count; j++) points.push(a.map((v, k) => v + ((b[k] - v) * j) / count));
    }
    points.push(rows.at(-1));
    const previous = [];
    for (const [y, left, right] of points) {
      const current = Array.from({ length: 5 }, (_, i) => front(left + ((right - left) * i) / 4, y, lift));
      if (previous.length)
        for (let i = 1; i < current.length; i++)
          panel([previous[i - 1], previous[i], current[i], current[i - 1]], tint);
      previous.splice(0, previous.length, ...current);
    }
  }
  if (person.style === 'jacket' || person.style === 'shirt') {
    const suit = person.style === 'jacket';
    fabric(
      [
        [0.516, -0.057, 0.057],
        [0.483, -0.068, 0.068],
        [suit ? 0.303 : 0.459, -0.002, 0.002],
      ],
      person.trim,
      0.004,
    );
    for (const side of [-1, 1]) {
      const sideRows = (rows) => rows.map(([y, a, b]) => [y, side * a, side * b]);
      fabric(
        sideRows([
          [0.518, 0.008, 0.053],
          [0.492, 0.026, 0.087],
          [0.453, 0.056, 0.058],
        ]),
        suit ? person.trim : person.top,
        0.008,
      );
      if (suit) {
        const lapel = new THREE.Color(person.top).multiplyScalar(1.16);
        fabric(
          sideRows([
            [0.507, 0.067, 0.087],
            [0.471, 0.053, 0.13],
            [0.447, 0.046, 0.099],
            [0.428, 0.04, 0.115],
            [0.274, 0.007, 0.01],
          ]),
          lapel,
          0.009,
        );
        stroke([front(side * 0.125, 0.174), front(side * 0.073, 0.165)], 0.0022, person.trousers);
      }
    }
    stroke([front(0, 0.025), front(0, 0.16), front(0, suit ? 0.269 : 0.43)], 0.0011, person.trousers);
    for (const off of suit ? [0.119, 0.207] : [0.12, 0.21, 0.3, 0.4])
      ellipsoid(front(0, off, 0.006), [0.0035, 0.0035, 0.002], person.trim);
  } else if (person.style === 'drape') {
    const rows = [
      [0.51, -0.125, -0.063],
      [0.465, -0.176, -0.087],
      [0.415, -0.129, -0.046],
      [0.35, -0.082, 0.007],
      [0.285, -0.032, 0.06],
      [0.222, 0.02, 0.112],
      [0.15, 0.071, 0.14],
      [0.117, 0.103, 0.148],
    ];
    fabric(rows, person.trim, 0.006);
    stroke(
      rows.map(([y, a, b]) => front(a + (b - a) * 0.15, y, 0.009)),
      0.0022,
      person.top,
    );
    stroke(
      rows.map(([y, a, b]) => front(a + (b - a) * 0.23, y, 0.009)),
      0.001,
      person.top,
    );
    panel(
      [
        [-0.176, h + 0.463, 0.054],
        [-0.121, h + 0.506, -0.042],
        [-0.145, h + 0.069, -0.116],
        [-0.197, h + 0.019, -0.062],
      ],
      person.trim,
    );
  } else {
    stroke([front(-0.079, 0.508), front(0, 0.477), front(0.079, 0.508)], 0.0025, person.trim);
  }
  if (person.style === 'shirt') {
    stroke([front(0.066, 0.362), front(0.127, 0.361)], 0.002, person.trim);
  }
  return batch.finish();
}

// Resting hand targets are local to each shoulder. Poses are authored around
// the desk measurements, so palms meet a device or the edge of a work surface.
function poseFor(role, side) {
  const left = side === -1;
  switch (role) {
    case 'reception':
      return left
        ? [
            [-0.037, -0.271, 0.075],
            [0.024, -0.352, 0.316],
          ]
        : [
            [0.045, -0.267, 0.078],
            [-0.075, -0.354, 0.294],
          ];
    case 'developer':
      return left
        ? [
            [-0.04, -0.205, 0.11],
            [0.04, -0.076, 0.277],
          ]
        : [
            [0.045, -0.245, 0.11],
            [-0.005, -0.247, 0.394],
          ];
    case 'designer':
      return left
        ? [
            [-0.044, -0.224, 0.1],
            [0.021, -0.179, 0.307],
          ]
        : [
            [0.031, -0.241, 0.112],
            [-0.089, -0.169, 0.327],
          ];
    case 'studio-manager':
      return left
        ? [
            [-0.034, -0.262, 0.086],
            [0.037, -0.225, 0.311],
          ]
        : [
            [0.032, -0.24, 0.086],
            [-0.065, -0.19, 0.285],
          ];
    case 'client':
      return left
        ? [
            [-0.03, -0.237, 0.12],
            [0.025, -0.243, 0.377],
          ]
        : [
            [0.004, -0.187, 0.197],
            [-0.111, -0.181, 0.419],
          ];
    case 'review-manager':
      return left
        ? [
            [-0.035, -0.209, 0.12],
            [0.052, -0.171, 0.338],
          ]
        : [
            [0.031, -0.205, 0.122],
            [-0.101, -0.215, 0.36],
          ];
    default:
      return left
        ? [
            [-0.035, -0.222, 0.121],
            [0.027, -0.248, 0.349],
          ]
        : [
            [0.04, -0.204, 0.145],
            [-0.072, -0.214, 0.37],
          ];
  }
}

function buildArm(THREE, common, person, side) {
  const batch = sculpture(THREE, common.material);
  const { profile, ellipsoid, box, stroke } = toolsFor(THREE, batch, common);
  const [elbow, wrist] = poseFor(person.role, side);
  const interpolate = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const shoulder = [side * -0.017, 0.018, 0],
    upper = interpolate(shoulder, elbow, 0.47);
  const cuff = interpolate(elbow, wrist, 0.87);
  profile(
    [
      [...shoulder, 0.045, 0.05],
      [...interpolate(shoulder, elbow, 0.16), 0.076, 0.075],
      [...upper, 0.066, 0.068],
      [...elbow, 0.056, 0.055],
      [...interpolate(elbow, wrist, 0.28), 0.054, 0.055],
      [...cuff, 0.041, 0.04],
    ],
    person.top,
  );
  profile(
    [
      [...cuff, 0.042, 0.041],
      [...interpolate(elbow, wrist, 0.94), 0.043, 0.042],
    ],
    person.style === 'shirt' ? person.trim : person.top,
  );
  profile(
    [
      [...interpolate(elbow, wrist, 0.93), 0.03, 0.028],
      [...wrist, 0.037, 0.027],
    ],
    person.skin,
  );
  const [x, y, z] = wrist;
  const phone = person.role === 'developer' && side === -1;
  const point = person.role === 'client' && side === 1;
  ellipsoid([x, y, z + 0.039], [0.04, 0.02, 0.054], person.skin, [-0.08, -0.08 * side, 0]);
  for (let i = 0; i < 4; i++) {
    const dx = side * (0.024 - i * 0.015),
      reach = point && i === 0 ? 0.119 : phone ? 0.075 : 0.09 - Math.abs(i - 1) * 0.004;
    stroke(
      [
        [x + dx, y, z + 0.058],
        [x + dx, y + 0.002, z + 0.078],
        [x + dx * 0.91, y - (point && i ? 0.019 : 0.006), z + reach],
      ],
      0.0072,
      person.skin,
    );
  }
  ellipsoid([x - side * 0.038, y + 0.004, z + 0.047], [0.012, 0.013, 0.031], person.skin, [
    0,
    -0.42 * side,
    0,
  ]);
  if (phone) {
    box([x + 0.025, y + 0.06, z + 0.088], [0.074, 0.142, 0.009], '#383938', [-0.3, -0.18, 0.035]);
    box([x + 0.025, y + 0.061, z + 0.082], [0.064, 0.128, 0.003], '#93a9a4', [-0.3, -0.18, 0.035]);
  }
  if (person.role === 'designer' && side === -1) {
    box([x + 0.086, y + 0.059, z + 0.098], [0.19, 0.136, 0.009], '#403e39', [-0.71, -0.11, -0.04]);
    box([x + 0.086, y + 0.063, z + 0.093], [0.173, 0.119, 0.003], '#bfaaa1', [-0.71, -0.11, -0.04]);
  }
  if (person.role === 'studio-manager' && side === -1) {
    box([x + 0.065, y + 0.031, z + 0.098], [0.187, 0.246, 0.014], '#653f32', [-0.81, 0.08, -0.06]);
    box([x + 0.065, y + 0.041, z + 0.096], [0.167, 0.222, 0.003], '#ded3b9', [-0.81, 0.08, -0.06]);
  }
  if (person.role === 'founder' && side === 1) {
    stroke(
      [
        [x - 0.039, y + 0.068, z + 0.052],
        [x - 0.011, y + 0.027, z + 0.073],
        [x + 0.03, y - 0.015, z + 0.105],
      ],
      0.0038,
      '#302d29',
    );
  }
  return batch.finish();
}

export function buildPeople(THREE, scene, { mobile = false } = {}) {
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 });
  const common = {
    material,
    sphere: new THREE.SphereGeometry(1, 12, 9),
    box: new THREE.BoxGeometry(),
    faces: readFaceGeometry(THREE),
  };
  const group = new THREE.Group();
  group.name = 'Studio occupants';
  const figures = cast.map((person, i) => {
    const hip = person.standing ? 0.935 : 0.5;
    const root = new THREE.Group();
    root.name = person.role;
    root.position.set(person.position[0], 0, person.position[1]);
    root.rotation.y = person.yaw;
    root.scale.setScalar(person.height);
    const body = buildBody(THREE, common, person, hip);
    const head = face(THREE, common, person, i);
    head.position.set(0, hip + 0.55, 0.01);
    const arms = [-1, 1].map((side) => {
      const arm = buildArm(THREE, common, person, side);
      arm.position.set(side * (person.feminine ? 0.182 : 0.198), hip + 0.464, 0.01);
      return arm;
    });
    root.add(body, head, ...arms);
    group.add(root);
    return { root, head, arms, person, phase: i * 1.893, stop: [1, 3, 3, 3, 4, 4, 5][i] };
  });
  scene.add(group);
  for (const geometry of [common.sphere, common.box, ...common.faces]) geometry.dispose();

  const smooth = THREE.MathUtils.smoothstep;
  function update({ progress, time }) {
    const arrival = smooth(progress, 0.36, 0.93),
      exchange = smooth(progress, 3.73, 4.02),
      greeting = smooth(progress, 4.7, 4.98);
    for (const { root, head, arms, person, phase, stop } of figures) {
      // Preserve the reception sightline; freeze distant actions to reduce work.
      root.visible =
        Math.abs(progress - stop) < (mobile ? 1.75 : 2.6) || (person.role === 'founder' && progress > 0.6);
      if (!root.visible) continue;
      const t = time + phase;
      const breath = Math.sin(t * 0.9) * 0.004,
        glance = Math.sin(t * 0.48) * 0.025;
      head.rotation.z = Math.sin(t * 0.43) * 0.012;
      head.rotation.y = glance;
      head.rotation.x = 0.12 + breath;
      arms[0].rotation.x = Math.sin(t * 0.66) * 0.012;
      arms[1].rotation.x = Math.sin(t * 0.78) * 0.012;
      switch (person.role) {
        case 'reception':
          head.rotation.y -= 0.34 * arrival;
          head.rotation.x += 0.1 - 0.23 * arrival;
          break;
        case 'developer':
          head.rotation.y -= 0.2 + 0.17 * Math.sin(t * 0.61);
          head.rotation.x += 0.07 + 0.11 * Math.sin(t * 0.61);
          arms[0].rotation.x += 0.06 * Math.sin(t * 0.61);
          break;
        case 'designer':
          head.rotation.y += 0.2 * Math.sin(t * 0.59);
          head.rotation.x += 0.1 * (1 + Math.sin(t * 0.59));
          break;
        case 'studio-manager':
          head.rotation.y += 0.32 + 0.08 * Math.sin(t * 0.43);
          arms[1].rotation.x += 0.055 * Math.sin(t * 0.79);
          break;
        case 'client':
          head.rotation.y -= 0.15 * exchange;
          arms[1].rotation.x -= exchange * 0.095;
          break;
        case 'review-manager':
          head.rotation.y -= 0.19 * exchange;
          arms[0].rotation.y += exchange * 0.14;
          break;
        case 'founder':
          head.rotation.x += 0.16 - greeting * 0.26;
          head.rotation.y -= 0.24;
          arms[1].rotation.x += greeting * 0.1;
          break;
      }
    }
  }
  update({ progress: 0, time: 0 });
  return {
    update,
    dispose() {
      scene.remove(group);
      group.traverse((object) => object.geometry?.dispose());
      material.dispose();
    },
  };
}
