import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Work in metres. Batch identical geometry/finish pairs in each room or moving
// assembly; separate room batches let Three cull the wings as the visitor turns.
export function officeGeometry(T, m) {
  const geometries = new Set();
  const register = (g) => {
    geometries.add(g);
    return g;
  };
  const boxGeometry = register(new T.BoxGeometry(1, 1, 1));
  // The first texture coordinate follows the length of each sawn piece. Share
  // these three UV layouts so battens still instance by geometry and finish.
  const timberBoxes = [0, 1, 2].map((axis) => {
    const geometry = register(boxGeometry.clone());
    const { position, normal, uv } = geometry.attributes;
    for (let i = 0; i < uv.count; i++) {
      const face = [normal.getX(i), normal.getY(i), normal.getZ(i)].findIndex(n => Math.abs(n) > 0.5);
      if (face === axis) continue;
      const coords = [position.getX(i), position.getY(i), position.getZ(i)];
      uv.setXY(i, coords[axis] + 0.5, coords[3 - face - axis] + 0.5);
    }
    return geometry;
  });
  const rounded = new Map();
  const planeGeometry = register(new T.PlaneGeometry(1, 1));
  const cylinderGeometry = register(new T.CylinderGeometry(1, 1, 1, 16));
  const planterGeometry = register(new T.CylinderGeometry(1, 0.77, 1, 18));
  const sphereGeometry = register(new T.SphereGeometry(1, 12, 9));
  const primitive = (parent, g, mat, x, y, z, sx, sy, sz) => {
    const mesh = new T.Mesh(g, mat);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  };
  function box(p, mat, x, y, z, w, h, d) {
    const geometry = mat === m.wood || mat === m.walnut
      ? timberBoxes[h > w && h > d ? 1 : d > w ? 2 : 0]
      : boxGeometry;
    return primitive(p, geometry, mat, x, y, z, w, h, d);
  }
  function softBox(p, mat, x, y, z, w, h, d, radius = 0.012) {
    const key = [w, h, d, radius].join('/');
    if (!rounded.has(key)) rounded.set(key, register(new RoundedBoxGeometry(w, h, d, 1, radius)));
    return primitive(p, rounded.get(key), mat, x, y, z, 1, 1, 1);
  }
  const panel = (p, mat, x, y, z, w, h, yaw = 0) => {
    const mesh = primitive(p, planeGeometry, mat, x, y, z, w, h, 1);
    mesh.rotation.y = yaw;
    return mesh;
  };
  const cyl = (p, mat, x, y, z, r, h) => primitive(p, cylinderGeometry, mat, x, y, z, r, h, r);
  const tapered = (p, mat, x, y, z, r, h) => primitive(p, planterGeometry, mat, x, y, z, r, h, r);
  const ball = (p, mat, x, y, z, a, b, c) => primitive(p, sphereGeometry, mat, x, y, z, a, b, c);
  const group = (parent, x = 0, y = 0, z = 0, yaw = 0) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    g.rotation.y = yaw;
    parent.add(g);
    return g;
  };
  function rod(parent, mat, a, b, r) {
    const start = new T.Vector3(...a),
      end = new T.Vector3(...b);
    const dir = end.clone().sub(start);
    const center = start.addScaledVector(dir, 0.5);
    const part = cyl(parent, mat, center.x, center.y, center.z, r, dir.length());
    part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    return part;
  }
  function mark(parent, x, y, z, w, h, map, yaw = 0, transparent = false) {
    const material = m.ink({
      map,
      transparent,
      depthWrite: !transparent,
      toneMapped: false,
      side: T.FrontSide,
    });
    return panel(parent, material, x, y, z, w, h, yaw);
  }
  function lettering(parent, x, y, z, w, h, lines, options = {}) {
    const { ink = '#e9ddc8', background, align = 'left', yaw = 0 } = options;
    const width = options.resolution || 768,
      height = Math.max(48, Math.round((width * h) / w));
    const map = m.canvasMap(width, height, (ctx, cw, ch) => {
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, cw, ch);
      }
      ctx.textAlign = align;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ink;
      for (const [text, proportion, offset, face = 'Georgia'] of lines) {
        ctx.font = `${Math.round(ch * proportion)}px ${face}`;
        const left = align === 'center' ? cw / 2 : cw * 0.045;
        ctx.fillText(text, left, ch * offset, cw * 0.91);
      }
    });
    return mark(parent, x, y, z, w, h, map, yaw, !background);
  }
  const shadowMap = m.canvasMap(64, 64, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(37,32,24,.57)');
    grad.addColorStop(0.43, 'rgba(40,35,24,.35)');
    grad.addColorStop(1, 'rgba(45,35,28,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
  const ao = m.ink({
    map: shadowMap,
    depthWrite: false,
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    toneMapped: false,
  });
  function shadow(parent, x, z, w, d, y = 0.008) {
    const mesh = panel(parent, ao, x, y, z, w, d);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }
  function batch(root) {
    root.updateWorldMatrix(true, true);
    const inverse = new T.Matrix4().copy(root.matrixWorld).invert(),
      pairs = new Map(),
      originals = [];
    root.traverse((obj) => {
      if (!obj.isMesh) return;
      const key = obj.geometry.uuid + obj.material.uuid;
      if (!pairs.has(key)) pairs.set(key, { geometry: obj.geometry, material: obj.material, matrices: [] });
      pairs.get(key).matrices.push(new T.Matrix4().multiplyMatrices(inverse, obj.matrixWorld));
      originals.push(obj);
    });
    for (const item of originals) item.removeFromParent();
    const renderParts = [];
    for (const { geometry, material, matrices } of pairs.values()) {
      let mesh;
      if (matrices.length === 1) {
        mesh = new T.Mesh(geometry, material);
        mesh.matrix.copy(matrices[0]);
        mesh.matrixAutoUpdate = false;
      } else {
        mesh = new T.InstancedMesh(geometry, material, matrices.length);
        matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix));
        mesh.computeBoundingSphere();
      }
      root.add(mesh);
      renderParts.push(mesh);
    }
    return renderParts;
  }
  return {
    box,
    softBox,
    panel,
    cyl,
    ball,
    tapered,
    group,
    rod,
    mark,
    lettering,
    shadow,
    register,
    batch,
    primitive,
    dispose: () => geometries.forEach((g) => g.dispose()),
  };
}
