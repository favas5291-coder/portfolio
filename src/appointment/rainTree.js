// Albizia-like spreading limbs and bipinnate sprays. Root, branch and leaf positions
// are deterministic so the sequence of stills and the live scene share a silhouette.
export function rainTree(T, m, g, parent, lowPower = false) {
  const rng = m.random;
  const tree = g.group(parent, -3.6, 0, -1.8);
  tree.scale.set(1.22, 1.04, 1.08);
  const positions = [],
    colors = [],
    indices = [];
  const bark = new T.Color('#736652');
  const canopy = g.group(tree);
  const leafMatrices = [];
  const dummy = new T.Object3D();
  function limb(start, finish, radius, tip, bend) {
    const a = new T.Vector3(...start),
      b = new T.Vector3(...finish);
    const mid = a
      .clone()
      .lerp(b, 0.46)
      .add(new T.Vector3(...bend));
    const curve = new T.QuadraticBezierCurve3(a, mid, b);
    const segments = radius > 0.12 ? 8 : radius > 0.05 ? 5 : lowPower ? 3 : 4;
    const sides = radius > 0.12 ? 11 : radius > 0.05 ? (lowPower ? 7 : 9) : lowPower ? 5 : 6;
    const frames = curve.computeFrenetFrames(segments, false);
    const base = positions.length / 3;
    // Always consume the same number of samples, so changing detail preserves
    // branch endpoints, leaf placement, and the authored poster silhouette.
    const mottling = Array.from({ length: 88 }, () => rng() * 0.095);
    for (let k = 0; k <= segments; k++) {
      const t = k / segments,
        center = curve.getPoint(t);
      for (let i = 0; i < sides; i++) {
        const theta = (i / sides) * Math.PI * 2;
        const r =
          (radius * (1 - t) + tip * t) *
          (1 + 0.22 * Math.sin(theta * 5 + t * 0.7) + 0.07 * Math.cos(theta * 3));
        const v = center
          .clone()
          .addScaledVector(frames.normals[k], r * Math.cos(theta))
          .addScaledVector(frames.binormals[k], r * Math.sin(theta));
        const tone = 0.77 + 0.13 * Math.sin(theta * 3.7) + mottling[(k * 11 + i) % 88];
        positions.push(v.x, v.y, v.z);
        colors.push(bark.r * tone, bark.g * tone, bark.b * tone);
        if (k < segments) {
          const start = base + k * sides,
            j = (i + 1) % sides;
          indices.push(
            start + i,
            start + j,
            start + sides + i,
            start + sides + i,
            start + j,
            start + sides + j,
          );
        }
      }
    }
  }
  // Roots flare into the soil before the distinct fork, visible from both floors.
  for (let i = 0; i < 7; i++) {
    const a = i * 0.897 + 0.18;
    limb(
      [0.01, 0.86, 0.03],
      [Math.sin(a) * 0.93, 0.03, Math.cos(a) * 0.87],
      0.12,
      0.048,
      [0.04, -0.29, 0.02],
    );
  }
  limb([0, 0.03, 0], [0.17, 2.96, -0.2], 0.38, 0.24, [-0.27, 0.05, 0.12]);
  const shade = ['#677439', '#81914a', '#98a356', '#577348', '#778542'];
  const colours = [];
  // Several forks spring from three sinuous leaders. Keep the woody limbs
  // inside the rain court until they clear the adjacent roof.
  const leaders = [
    [-0.87, 4.45, 0.41],
    [0.83, 4.76, -0.47],
    [-0.36, 4.58, -1.08],
  ];
  leaders.forEach((end, i) =>
    limb([0.12, 2.16 + i * 0.31, -0.19], end, 0.2 - i * 0.025, 0.104, [end[0] * 0.43, -0.32, end[2] * 0.3]),
  );
  for (let i = 0; i < 10; i++) {
    const origin = leaders[i % 3];
    const a = i * 2.399 + 0.23;
    const crown = [
      Math.cos(a) * (1.18 + rng() * 0.48),
      5.54 + rng() * 1.08,
      Math.sin(a) * (1.53 + rng() * 0.59),
    ];
    limb(origin, crown, 0.109 + rng() * 0.029, 0.048, [Math.cos(a) * 0.32, 0.27, Math.sin(a) * 0.41]);
    for (let l = 0; l < 4; l++) {
      const yaw = a + (l - 1.5) * 0.47;
      const end = [
        crown[0] + Math.cos(yaw) * (0.47 + rng() * 1.29),
        crown[1] + 0.52 + rng() * 0.75,
        crown[2] + Math.sin(yaw) * (0.56 + rng() * 1.13),
      ];
      limb(crown, end, 0.068, 0.024, [Math.cos(yaw) * 0.17, 0.11, Math.sin(yaw) * 0.17]);
      for (let n = 0; n < 3; n++) {
        const dir = yaw + (n - 1) * 0.55;
        const twig = [
          end[0] + Math.cos(dir) * (0.23 + rng() * 0.63),
          end[1] + 0.08 + rng() * 0.45,
          end[2] + Math.sin(dir) * (0.31 + rng() * 0.61),
        ];
        limb(end, twig, 0.032, 0.006, [0.06, 0.03, -0.04]);
        for (let v = 0; v < 6; v++) {
          dummy.position.set(
            twig[0] + (rng() - 0.5) * 0.82,
            twig[1] + (rng() - 0.5) * 0.65,
            twig[2] + (rng() - 0.5) * 0.84,
          );
          dummy.rotation.set(-0.35 - rng() * 1.06, rng() * 6.28, (rng() - 0.5) * 2.1, 'YXZ');
          dummy.scale.set(0.75 + rng() * 0.87, 0.58 + rng() * 0.6, 1);
          dummy.updateMatrix();
          leafMatrices.push(dummy.matrix.clone());
          colours.push(new T.Color(shade[Math.floor(rng() * shade.length)]));
        }
      }
    }
  }
  const branches = new T.BufferGeometry();
  branches.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  branches.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  branches.setIndex(indices);
  branches.computeVertexNormals();
  const trunk = new T.Mesh(
    g.register(branches),
    m.surface({ vertexColors: true, roughness: 0.98, side: T.DoubleSide }),
  );
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);
  const twigMap = m.canvasMap(192, 192, (ctx, w, h) => {
    ctx.strokeStyle = '#aaa083';
    ctx.lineCap = 'round';
    function stroke(ax, ay, bx, by, width) {
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    stroke(11, 168, 172, 32, 2.5);
    for (let j = 0; j < 7; j++) {
      const x = 23 + j * 22,
        y = 158 - j * 19;
      for (const sign of [-1, 1]) {
        const reach = (1 - Math.abs(j - 2.5) * 0.11) * (52 + rng() * 11);
        const vx = (sign < 0 ? -0.34 : 0.92) * reach,
          vy = (sign < 0 ? -1.05 : 0.23) * reach;
        stroke(x, y, x + vx, y + vy, 1.6);
        for (let i = 0; i < 7; i++) {
          const t = (i + 0.4) / 7;
          for (const side of [-1, 1]) {
            const leafLen = (1 - 0.48 * t) * (7 + rng() * 3);
            const ang = Math.atan2(vy, vx) + side * 0.76;
            ctx.save();
            ctx.translate(
              x + vx * t + Math.cos(ang) * leafLen * 0.6,
              y + vy * t + Math.sin(ang) * leafLen * 0.6,
            );
            ctx.rotate(ang);
            const b = 167 + Math.floor(rng() * 74);
            ctx.fillStyle = 'rgb(' + b + ',' + Math.min(255, b + 9) + ',' + Math.floor(b * 0.78) + ')';
            ctx.beginPath();
            ctx.ellipse(0, 0, leafLen, 3.0 - rng() * 0.76, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }
  });
  const foliage = m.surface({ map: twigMap, alphaTest: 0.33, side: T.DoubleSide, roughness: 1 });
  const sprays = new T.InstancedMesh(
    g.register(new T.PlaneGeometry(1.25, 1.14)),
    foliage,
    leafMatrices.length,
  );
  leafMatrices.forEach((matrix, i) => {
    sprays.setMatrixAt(i, matrix);
    sprays.setColorAt(i, colours[i]);
  });
  sprays.castShadow = true;
  sprays.receiveShadow = true;
  sprays.computeBoundingSphere();
  canopy.add(sprays);
  return {
    setVisible(visible) {
      tree.visible = visible;
    },
    update(t) {
      canopy.rotation.y = 0.0024 * Math.sin(t * 0.48);
      canopy.rotation.z = 0.0014 * Math.sin(t * 0.31);
    },
  };
}
