// Original courtyard planting. Each stand shares one coloured mesh, so the trees
// outside the glass do not add draw calls per leaf or per frond.
export function buildLandscape(T, root) {
  const garden = new T.Group();
  garden.name = 'Courtyard garden';
  root.add(garden);
  const materials = [],
    geometries = [];
  let seed = 72451;
  function random() {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  const positions = [],
    colors = [];
  const shade = new T.Color();
  const earth = new T.Color('#b3a087'),
    palms = ['#657744', '#526d3c', '#7c8946', '#45603d'];
  function triangle(a, b, c, color, value = 1) {
    shade.copy(color).multiplyScalar(value);
    positions.push(...a, ...b, ...c);
    for (let i = 0; i < 3; i++) colors.push(shade.r, shade.g, shade.b);
  }
  function quad(a, b, c, d, color, value = 1) {
    triangle(a, b, c, color, value);
    triangle(c, d, a, color, value);
  }
  function mix(a, b, t) {
    return a.map((value, i) => value + (b[i] - value) * t);
  }

  // Ringed, gently leaning coconut trunk, with a crown of arching pinnate fronds.
  function coconut(x, z, height, leanX, leanZ) {
    const radius = height * 0.024,
      rings = 18,
      sides = 8,
      angle = random() * Math.PI * 2;
    const stem = (t) => [x + leanX * t * t, height * t, z + leanZ * t * t];
    function ring(t, offset) {
      const center = stem(t),
        r = radius * (1 - 0.48 * t + 0.36 * Math.exp(-t * 12));
      return Array.from({ length: sides }, (_, i) => {
        const a = (2 * Math.PI * i) / sides + angle;
        return [center[0] + Math.cos(a) * r * offset, center[1], center[2] + Math.sin(a) * r * offset];
      });
    }
    let prior = ring(0, 1);
    for (let j = 1; j <= rings; j++) {
      const t = j / rings,
        neck = ring(t - 0.007, 1),
        rim = ring(t, 1.055);
      const shadeValue = 0.58 + random() * 0.32;
      for (let i = 0; i < sides; i++) {
        const k = (i + 1) % sides;
        quad(prior[i], prior[k], neck[k], neck[i], earth, shadeValue);
        quad(neck[i], neck[k], rim[k], rim[i], earth, shadeValue * 1.22);
      }
      prior = rim;
    }
    const origin = stem(1),
      count = 12,
      repeats = 16;
    for (let j = 0; j < count; j++) {
      const yaw = j * 2.39996 + angle,
        dirX = Math.cos(yaw),
        dirZ = Math.sin(yaw);
      const reach = height * (0.28 + random() * 0.13),
        rise = height * (0.09 + random() * 0.18);
      const sag = height * (0.12 + random() * 0.22),
        bend = (random() - 0.5) * 0.45;
      const green = new T.Color(palms[j % palms.length]);
      function point(t, lateral, lower) {
        const arc = bend * t * t + lateral;
        return [
          origin[0] + reach * t * dirX - arc * dirZ,
          origin[1] + 3 * rise * t * (1 - t) + (rise - sag) * t * t - lower,
          origin[2] + reach * t * dirZ + arc * dirX,
        ];
      }
      for (let k = 0; k < repeats; k++) {
        const t = k / repeats,
          next = (k + 1) / repeats;
        quad(
          point(t, -0.024, 0),
          point(t, 0.024, 0),
          point(next, 0.016, 0.002),
          point(next, -0.016, 0.002),
          green,
          1.15,
        );
        const width = ((0.12 + 0.55 * Math.sin(Math.PI * Math.pow(t, 0.75))) * reach) / 2.6;
        for (const sign of [-1, 1]) {
          const base = point(t, 0, 0),
            shoulder = point(t + 0.15 / repeats, sign * width * 0.45, 0.04);
          const tip = point(Math.min(1, t + 0.13), sign * width, width * (0.38 + random() * 0.5));
          const edge = point(Math.min(1, next), sign * width * 0.18, 0.035);
          quad(base, shoulder, tip, edge, green, 0.84 + random() * 0.26);
        }
      }
    }
  }

  // Banana leaves have a central crease, curved edge and an occasional split.
  function banana(x, z, h) {
    const offset = random() * 6.28;
    const baseY = -0.31,
      crownY = h * 0.29;
    const stemColor = new T.Color('#91a067'),
      sides = 7;
    for (let k = 0; k < sides; k++) {
      const a = (2 * Math.PI * k) / sides,
        b = (2 * Math.PI * (k + 1)) / sides,
        radius = h * 0.036;
      function at(angle, y, r) {
        return [x + Math.cos(angle) * r, y, z + Math.sin(angle) * r];
      }
      quad(
        at(a, baseY, radius),
        at(b, baseY, radius),
        at(b, crownY, radius * 0.57),
        at(a, crownY, radius * 0.57),
        stemColor,
        0.76 + random() * 0.25,
      );
    }
    for (let i = 0; i < 9; i++) {
      const a = offset + i * 2.39996,
        d = [Math.cos(a), Math.sin(a)];
      const len = h * (0.68 + random() * 0.38),
        reach = len * (0.45 + random() * 0.32);
      const fold = new T.Color(palms[(i + 1) % palms.length]);
      function point(t, side) {
        const width = side * len * 0.135 * Math.sin(Math.PI * t) ** 0.65 * Math.min(1, t * 2.9);
        return [
          x + d[0] * reach * t - d[1] * width,
          crownY + len * (1.7 * t - 1.23 * t * t) - Math.abs(width) * (0.38 + 0.12 * Math.sin(t * 28)),
          z + d[1] * reach * t + d[0] * width,
        ];
      }
      for (let n = 0; n < 15; n++) {
        const t = n / 15,
          end = (n + 1) / 15;
        for (const sign of [-1, 1]) {
          const ridge = point(t, 0),
            edge = point(t, sign),
            next = point(end, sign);
          if (n > 3 && n % 3 === 0) {
            triangle(ridge, edge, mix(ridge, next, 0.86), fold, sign < 0 ? 0.86 : 1.04);
            triangle(ridge, next, point(end, 0), fold, sign < 0 ? 0.9 : 1.09);
          } else quad(ridge, edge, next, point(end, 0), fold, (sign < 0 ? 0.84 : 1.0) + random() * 0.15);
        }
      }
    }
  }

  for (const [x, z, h, dx, dz] of [
    [-8.5, 0.6, 6.5, 1.4, -1],
    [9.2, 1.5, 6.9, -1, -0.8],
    [-10, -6, 8.4, 0.7, 1.6],
    [11, -7.2, 6.3, -0.6, -0.5],
    [-8.5, -14, 6.1, -0.5, 1.2],
    [10.4, -15, 7.5, 1.3, -0.5],
    [-9, -21, 7.1, 0.65, -1],
    [10.2, -24, 6.7, -1, 0.6],
    [-5.1, -32, 7, 1, -0.4],
    [3, -35.6, 8.1, -1.1, 0.7],
  ])
    coconut(x, z, h, dx, dz);
  for (const side of [-1, 1])
    for (let z = 1; z > -30; z -= 2.45 + random() * 2.25) {
      banana(side * (8.8 + random() * 1.85), z, 2.1 + random() * 1.4);
    }
  const leaves = new T.BufferGeometry();
  leaves.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  leaves.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  leaves.computeVertexNormals();
  const foliage = new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide });
  garden.add(new T.Mesh(leaves, foliage));
  geometries.push(leaves);
  materials.push(foliage);

  const soil = new T.PlaneGeometry(110, 110);
  const grass = new T.MeshLambertMaterial({ color: '#89945e' });
  const lawn = new T.Mesh(soil, grass);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, -0.3, -13);
  garden.add(lawn);
  geometries.push(soil);
  materials.push(grass);

  const shrubMap = new T.TextureLoader().load('/studio/undergrowth.webp');
  shrubMap.colorSpace = T.SRGBColorSpace;
  const shrubGeometry = new T.PlaneGeometry(1, 1);
  const shrubMaterial = new T.MeshBasicMaterial({
    map: shrubMap,
    alphaTest: 0.25,
    side: T.DoubleSide,
    toneMapped: false,
  });
  const stand = new T.InstancedMesh(shrubGeometry, shrubMaterial, 38);
  const dummy = new T.Object3D();
  for (let i = 0; i < 38; i++) {
    const side = i < 19 ? -1 : 1,
      column = i % 19;
    const h = 0.84 + random() * 0.64;
    dummy.position.set(side * (9.8 + random() * 1.0), -0.23 + h / 2, 3 - column * 1.93 + random() * 0.7);
    dummy.rotation.y = side * (Math.PI * 0.52 + (random() - 0.5) * 0.75);
    dummy.scale.set(2.85 + random() * 0.82, h, 1);
    dummy.updateMatrix();
    stand.setMatrixAt(i, dummy.matrix);
  }
  stand.computeBoundingSphere();
  garden.add(stand);
  materials.push(shrubMaterial);
  geometries.push(shrubGeometry);

  // A tonemapped local derivative keeps the distant sky and tree line inexpensive.
  // Rooitou Park by Greg Zaal, CC0: https://polyhaven.com/a/rooitou_park
  const map = new T.TextureLoader().load('/studio/garden-horizon.webp');
  map.colorSpace = T.SRGBColorSpace;
  const dome = new T.SphereGeometry(52, 40, 20);
  const skyline = new T.MeshBasicMaterial({
    map,
    side: T.BackSide,
    toneMapped: false,
    fog: false,
    depthWrite: false,
  });
  const horizon = new T.Mesh(dome, skyline);
  horizon.position.set(0, 0, -13);
  horizon.rotation.y = 2.15;
  horizon.renderOrder = -2;
  garden.add(horizon);
  geometries.push(dome);
  materials.push(skyline);
  return {
    horizonMap: map,
    dispose() {
      garden.removeFromParent();
      map.dispose();
      shrubMap.dispose();
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
    },
  };
}
