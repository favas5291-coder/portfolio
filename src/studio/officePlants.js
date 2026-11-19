// Folded, curved leaf blades and pierced palm fronds. Shared meshes let dozens
// of leaflets catch side light while costing one instanced draw per finish.
export function officePlants(T, m, g) {
  function foliageGeometry(palm) {
    const vertices = [],
      indices = [];
    const triangle = (a, b, c) => {
      const k = vertices.length / 3;
      vertices.push(...a, ...b, ...c);
      indices.push(k, k + 1, k + 2);
    };
    const spine = (t) => [0, 0.64 * Math.sin(Math.PI * t * 0.82) - 0.24 * t * t, t];
    if (palm) {
      for (let i = 0; i < 21; i++) {
        const t = 0.06 + i / 24,
          u = Math.min(1, t + 0.055),
          v = spine(t),
          next = spine(u);
        const width = 0.24 * Math.pow(Math.sin(Math.PI * t), 0.65);
        triangle([-0.007, v[1], v[2]], [0.007, v[1], v[2]], next);
        for (const side of [-1, 1]) {
          const point = [side * width, v[1] - 0.15 * width + 0.018, v[2] + 0.14];
          const ridge = [side * width * 0.55, v[1] + 0.022, v[2] + 0.065];
          triangle(v, ridge, next);
          triangle(ridge, point, next);
        }
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const t = i / 10,
          u = (i + 1) / 10;
        const a = spine(t),
          b = spine(u);
        for (const sign of [-1, 1]) {
          const edge = (v, s) => [
            sign * Math.sin(s * Math.PI) * 0.19,
            v[1] - 0.048 * Math.sin(s * Math.PI),
            s,
          ];
          triangle(a, edge(a, t), b);
          triangle(b, edge(a, t), edge(b, u));
        }
      }
    }
    const mesh = new T.BufferGeometry();
    mesh.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    mesh.setIndex(indices);
    mesh.computeVertexNormals();
    return g.register(mesh);
  }
  const frond = foliageGeometry(true),
    blade = foliageGeometry(false);
  const leaves = [m.green, m.leafLight, m.leafDark];
  function palm(parent, x, z, height, planter = true) {
    const potHeight = planter ? height * 0.27 : 0;
    if (planter) {
      g.tapered(parent, m.stone, x, potHeight / 2, z, height * 0.16, potHeight);
      g.cyl(parent, m.leather, x, potHeight, z, height * 0.15, 0.014);
    }
    for (let stem = 0; stem < 3; stem++) {
      const dx = Math.cos(stem * 2.4) * height * 0.11,
        dz = Math.sin(stem * 2.4) * height * 0.12;
      const crown = height * (0.66 + 0.1 * stem);
      g.rod(
        parent,
        m.bark,
        [x + dx * 0.19, potHeight, z + dz * 0.19],
        [x + dx, crown, z + dz],
        height * (planter ? 0.012 : 0.019),
      );
      for (let j = 0; j < 8; j++) {
        const length = height * (0.28 + 0.18 * m.random());
        const leaf = g.primitive(
          parent,
          frond,
          leaves[(j + stem) % 3],
          x + dx,
          crown,
          z + dz,
          length,
          length,
          length,
        );
        leaf.rotation.y = j * 2.4 + stem;
        leaf.rotation.x = (j % 3) * 0.16;
      }
    }
    g.shadow(parent, x, z, height * 0.65, height * 0.5);
  }
  function broad(parent, x, z, height, planter = true) {
    const base = planter ? height * 0.26 : 0.03;
    if (planter) {
      g.tapered(parent, m.stone, x, base / 2, z, height * 0.17, base);
      g.cyl(parent, m.leather, x, base, z, height * 0.158, 0.012);
    }
    for (let i = 0; i < 12; i++) {
      const angle = i * 2.4,
        length = height * (0.28 + 0.27 * m.random()),
        start = height * (0.23 + 0.4 * m.random());
      const a = [x, base, z],
        b = [x + Math.sin(angle) * length * 0.17, start, z + Math.cos(angle) * length * 0.17];
      g.rod(parent, m.green, a, b, height * 0.005);
      const leaf = g.primitive(parent, blade, leaves[i % 3], ...b, length * 1.15, length, length);
      leaf.rotation.y = angle;
      leaf.rotation.x = -0.12 - 0.23 * m.random();
    }
    g.shadow(parent, x, z, height * 0.6, height * 0.46);
  }
  return { palm, broad };
}
