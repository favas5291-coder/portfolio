import { officeGeometry } from '../studio/officeGeometry.js';
import { officeMaterials } from '../studio/officeMaterials.js';
import { officePlants } from '../studio/officePlants.js';
import { rainTree } from './rainTree.js';
import { architecturalFinishes } from './finishes.js';

// South-facing street elevation is z=+2.4. The court, stair and both window
// sightlines share one coordinate system; all dimensions are in metres.
export function buildArchitecture(T, scene, options = {}) {
  const { previewUrl, onInvalidate, onFailure, blankScreens = false } = options;
  const root = new T.Group();
  root.name = 'Rain tree courtyard studio';
  scene.add(root);
  const m = officeMaterials(T),
    g = officeGeometry(T, m);
  architecturalFinishes(T, m, options);
  const b = g.box,
    p = g.panel;
  const street = g.group(root),
    shell = g.group(root),
    court = g.group(root),
    interior = g.group(root);
  const door = g.group(root, -0.98, 0, 2.4);
  const plants = officePlants(T, m, g);
  // Wet street / dry stone transition at the canopy's drip line.
  b(street, m.asphalt, 0, -0.22, 24, 82, 0.18, 26);
  b(street, m.wet, 0, -0.1, 6.78, 26, 0.16, 8.47);
  for (let i = -11; i <= 11; i++) b(street, m.stone, i * 1.32, -0.057, 10.97, 1.313, 0.16, 0.21);
  b(street, m.stone, -0.1, -0.037, 3.22, 8.65, 0.092, 2.49);
  for (const side of [-1, 1]) {
    b(street, m.soil, side * 6.67, -0.015, 5.8, 4.1, 0.1, 5.6);
    b(street, m.concrete, side * 4.6, 0.025, 5.8, 0.11, 0.17, 5.82);
    b(street, m.concrete, side * 6.67, 0.025, 8.65, 4.26, 0.17, 0.11);
    for (let j = 0; j < 7; j++)
      plants.broad(street, side * (5.1 + (j % 2) * 1.5), 3.65 + j * 0.64, 0.52 + 0.26 * m.random(), false);
  }
  // Kerb drain and expansion seams add a near, legible scale cue as the door swings.
  for (const x of [-4.5, 3.8]) {
    b(street, m.charcoal, x, -0.115, 11.3, 0.66, 0.018, 0.33);
    for (let i = 0; i < 13; i++) b(street, m.bronze, x - 0.3 + i * 0.049, -0.102, 11.3, 0.023, 0.013, 0.31);
  }
  b(street, m.concrete, 0, -0.139, 19.5, 73, 0.01, 0.08);
  for (let j = -6; j < 7; j++) b(street, m.stone, j * 4.6, -0.122, 17.9, 2.24, 0.012, 0.08);
  // The shallow floor plates wrap an open rectangle around the living tree.
  b(shell, m.stone, 3.02, -0.13, -2.3, 9.18, 0.25, 9.63);
  b(shell, m.stone, -6.72, -0.13, -2.3, 1.82, 0.25, 9.63);
  b(shell, m.stone, -3.68, -0.13, -5.91, 4.26, 0.25, 2.43);
  b(shell, m.stone, -3.68, -0.13, 1.91, 4.26, 0.25, 1.2);
  b(court, m.soil, -3.68, -0.04, -1.7, 4.25, 0.08, 6.0);
  for (const x of [-5.8, -1.55]) b(court, m.concrete, x, 0.1, -1.69, 0.155, 0.2, 6.1);
  for (const z of [-4.69, 1.29]) b(court, m.concrete, -3.68, 0.1, z, 4.26, 0.2, 0.15);
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4,
      r = 1.17 + 0.64 * m.random();
    plants.broad(court, -3.65 + Math.cos(a) * r, -1.76 + Math.sin(a) * r, 0.32 + 0.39 * m.random(), false);
  }
  const tree = rainTree(T, m, g, root, Boolean(options.lowPower || options.mobile));
  // Left service wing is the heavy anchor. The occupied wing reads as an
  // offset, lightweight pavilion; a timber-lined reveal separates the bands.
  b(shell, m.laterite, -7.45, 3.06, -2.3, 0.34, 6.22, 9.65);
  b(shell, m.laterite, -6.62, 2.93, 2.32, 1.95, 5.88, 0.32);
  b(shell, m.plaster, 7.49, 3.09, -2.3, 0.25, 6.27, 9.57);
  b(shell, m.plaster, 0.02, 3.1, -7.04, 15.22, 6.28, 0.22);
  b(shell, m.laterite, -3.25, 1.46, 2.3, 3.42, 2.93, 0.26);
  b(shell, m.laterite, -5.71, 1.39, -1.7, 0.24, 2.78, 5.86);
  b(shell, m.reveal, 3.0, 3.04, 2.32, 9.14, 0.13, 0.38);
  const floorY = 3.26;
  // The project table sits in a double-height opening, visible from the landing.
  b(shell, m.concrete, 0.45, floorY, 0.61, 3.96, 0.18, 3.78);
  b(shell, m.concrete, 0.45, floorY, -5.96, 3.96, 0.18, 2.2);
  b(shell, m.concrete, -1.06, floorY, -3.06, 0.96, 0.18, 3.58);
  b(shell, m.concrete, 5.66, floorY, -2.28, 3.92, 0.18, 9.56);
  b(shell, m.concrete, 3.06, floorY, 1.28, 1.27, 0.18, 2.44);
  b(shell, m.concrete, 3.06, floorY, -6.29, 1.27, 0.18, 1.51);
  b(shell, m.concrete, -6.58, floorY, -2.3, 2.16, 0.18, 9.58);
  b(shell, m.concrete, -3.53, floorY, -6.05, 3.94, 0.18, 2.07);
  function roofStrip(x, z, w, d) {
    b(shell, m.wood, x, 6.17, z, w, 0.065, d);
    b(shell, m.reveal, x, 6.25, z, w + 0.04, 0.1, d + 0.04);
    b(shell, m.concrete, x, 6.4, z, w + 0.08, 0.2, d + 0.08);
    b(shell, m.frame, x, 6.515, z, w + 0.13, 0.032, d + 0.13);
  }
  roofStrip(3.22, -2.0, 10.39, 12.0);
  roofStrip(-7.03, -2.04, 2.9, 11.94);
  roofStrip(-3.78, -6.82, 3.62, 2.4);
  // A clear skylight above the central entrance lets the guest see the arrival
  // car through the upstairs window. The deep opaque eaves remain on either side.
  function eave(x, width) {
    b(shell, m.wood, x, 3.018, 3.35, width, 0.078, 2.41);
    b(shell, m.concrete, x, 3.16, 3.35, width + 0.03, 0.21, 2.5);
    b(shell, m.bronze, x, 3.282, 3.35, width + 0.04, 0.041, 2.56);
    for (let i = 0.1; i < width; i += 0.3)
      b(shell, m.reveal, x - width / 2 + i, 2.977, 3.35, 0.014, 0.009, 2.34);
  }
  eave(-3.6, 3.76);
  eave(3.67, 3.23);
  const roofGlass = p(shell, m.glass, 0.165, 3.13, 3.19, 3.76, 2.1);
  roofGlass.rotation.x = -Math.PI / 2;
  b(shell, m.bronze, 0.165, 3.12, 4.23, 3.76, 0.04, 0.047);
  b(shell, m.bronze, 0.165, 3.12, 2.54, 3.76, 0.032, 0.035);
  for (const x of [-5.08, 4.72]) {
    b(shell, m.frame, x, 1.5, 4.14, 0.095, 2.98, 0.095);
    b(shell, m.bronze, x, 0.047, 4.14, 0.18, 0.085, 0.18);
  }
  for (const x of [-4.2, 3.65]) {
    g.cyl(shell, m.charcoal, x, 2.964, 3.69, 0.083, 0.022);
    g.cyl(shell, m.light, x, 2.952, 3.69, 0.054, 0.012);
  }
  // Thin thermally-broken bronze window frames. The front founder pane has
  // a deliberately low sill; a visitor sees the same car through it upstairs.
  function glazing(parent, x0, x1, low, high, z, bays, lowRail = true) {
    const width = x1 - x0,
      height = high - low;
    for (let i = 0; i < bays; i++) {
      p(
        parent,
        m.glass,
        x0 + (width * (i + 0.5)) / bays,
        (high + low) / 2,
        z,
        width / bays - 0.036,
        height - 0.061,
      );
    }
    for (let i = 0; i <= bays; i++)
      b(parent, m.frame, x0 + (width * i) / bays, (high + low) / 2, z, 0.043, height, 0.09);
    if (lowRail) b(parent, m.bronze, (x0 + x1) / 2, low, z, width, 0.055, 0.1);
    b(parent, m.frame, (x0 + x1) / 2, high, z, width, 0.062, 0.1);
  }
  glazing(shell, -1.53, -0.98, 0.035, 2.89, 2.4, 1);
  glazing(shell, 1.07, 7.43, 0.035, 2.89, 2.4, 4);
  glazing(shell, -1.23, 4.7, 3.54, 6.12, 2.4, 3);
  b(shell, m.plaster, 1.73, 3.43, 2.37, 5.98, 0.18, 0.2);
  glazing(shell, 4.7, 7.42, 3.58, 6.12, 2.4, 2);
  // Screens protect the east end; leave an open picture window over the entry.
  for (let i = 0; i < 17; i++) {
    const blade = b(shell, m.wood, 4.43 + i * 0.193, 4.84, 2.72, 0.057, 2.48, 0.24);
    blade.rotation.y = -0.44;
  }
  for (const y of [3.58, 6.11]) b(shell, m.walnut, 5.95, y, 2.71, 3.2, 0.065, 0.26);
  b(shell, m.laterite, -1.5, 4.7, 1.52, 0.27, 2.78, 2.04);
  b(shell, m.plaster, 4.53, 4.73, -2.32, 0.19, 2.77, 9.33);
  // The actual entrance leaf and its pull rotate together about the left jamb.
  b(door, m.frame, 0.98, 0.065, 0, 1.96, 0.075, 0.074);
  b(door, m.frame, 0.98, 2.83, 0, 1.96, 0.075, 0.074);
  for (const x of [0.03, 1.93]) b(door, m.frame, x, 1.45, 0, 0.057, 2.82, 0.074);
  p(door, m.glass, 0.98, 1.43, 0, 1.86, 2.69);
  for (const z of [-0.085, 0.085]) {
    g.cyl(door, m.bronze, 1.77, 1.07, z, 0.017, 0.49);
    for (const y of [0.87, 1.27]) b(door, m.bronze, 1.77, y, z / 2, 0.028, 0.026, 0.08);
  }
  b(door, m.bronze, 0.38, 2.72, -0.065, 0.41, 0.076, 0.069);
  g.lettering(shell, -3.28, 1.85, 2.437, 2.74, 0.72, [['Fazhere Studio', 0.55, 0.52, 'Georgia']], {
    ink: '#fff1d2',
    resolution: 768,
  });
  // Rose-coloured lower lip catches grazing sunlight below the flush sign.
  b(shell, m.orange, -4.48, 1.29, 2.451, 0.2, 0.024, 0.031);
  // Lateral glazing frames the courtyard at both standing and landing eye levels.
  for (let i = 0; i < 5; i++) {
    b(shell, m.frame, -1.55, 1.54, 0.85 - i * 1.31, 0.067, 3.08, 0.055);
    p(shell, m.glass, -1.56, 1.53, 0.195 - i * 1.31, 1.245, 2.98, Math.PI / 2);
  }
  // Stair: eighteen 186 mm risers. Each tread has a bright nosing with a
  // recessed stringer below to articulate the smooth incline of the camera.
  const rise = 3.35 / 18,
    run = 5 / 18;
  for (let i = 0; i < 18; i++) {
    const z = -5 + (i + 0.5) * run,
      top = (i + 1) * rise;
    b(shell, m.stone, 3.05, top - 0.048, z, 1.12, 0.096, run + 0.026);
    b(shell, m.reveal, 3.05, top - rise / 2, z - run / 2 + 0.04, 1.05, rise, 0.078);
    b(shell, m.bronze, 3.05, top - 0.016, z - run / 2 - 0.008, 1.1, 0.018, 0.02);
  }
  for (const x of [2.49, 3.61]) {
    g.rod(shell, m.frame, [x, 0.018, -5.0], [x, 3.25, 0.01], 0.047);
    g.rod(shell, m.wood, [x, 0.99, -5.0], [x, 4.36, 0.04], 0.037);
    for (let i = 0; i < 8; i++) {
      const t = i / 7;
      b(shell, m.frame, x, 0.53 + 3.35 * t, -4.945 + t * 4.95, 0.024, 0.97, 0.024);
    }
  }
  for (const z of [-5.44, -4.56, -3.68, -2.8, -1.92, -1.04])
    b(shell, m.frame, 2.42, 3.84, z, 0.028, 0.98, 0.028);
  b(shell, m.wood, 2.42, 4.345, -3.06, 0.058, 0.074, 5.03);
  // Guard the edge of the double-height project room, leaving a clear view down.
  for (const x of [-0.59, 0.05, 0.69, 1.33, 1.96, 2.42]) {
    b(shell, m.frame, x, 3.84, -1.285, 0.022, 0.98, 0.022);
  }
  b(shell, m.wood, 0.92, 4.345, -1.285, 3.06, 0.061, 0.067);
  p(shell, m.glass, 0.92, 3.81, -1.285, 2.98, 0.85);
  b(shell, m.wood, -0.585, 4.345, -3.08, 0.064, 0.06, 3.58);
  for (const z of [-1.31, -2.19, -3.08, -3.96, -4.83]) b(shell, m.frame, -0.585, 3.84, z, 0.022, 0.98, 0.022);
  // The ceiling above the founder's room and its back wall carry warm, bounced
  // light, visible through the tree even before the deferred furnishings load.
  const lightWall = m.surface({
    color: '#e9c694',
    roughness: 0.96,
    emissive: '#cf9853',
    emissiveIntensity: 0.58,
  });
  b(shell, lightWall, 1.12, 4.75, -5.18, 2.92, 2.77, 0.14);
  b(shell, m.wood, 0.12, 5.86, -5.08, 1.12, 0.092, 0.2);
  b(shell, m.light, 0.12, 5.805, -5.07, 0.98, 0.022, 0.1);
  // Fixed perforated timber on the rear office wall gives the opening depth.
  for (let i = 0; i < 18; i++) b(shell, m.wood, -1.29 + i * 0.14, 4.68, -5.07, 0.05, 2.54, 0.08);
  b(interior, m.plaster, -0.29, 1.49, -5.75, 2.34, 3.0, 0.14);
  g.lettering(interior, -0.22, 1.83, -5.669, 1.98, 0.6, [['Project room', 0.48, 0.5, 'Georgia']], {
    ink: '#4a4032',
  });
  // A pendulum lamp is part of the building silhouette even while the
  // rest of the founder's fit-out has yet to load.
  g.rod(shell, m.bronze, [2.53, 6.16, 0.49], [2.53, 5.39, 0.49], 0.012);
  g.ball(shell, m.amber, 2.53, 5.2, 0.49, 0.21, 0.205, 0.21);
  g.cyl(shell, m.brass, 2.53, 5.404, 0.49, 0.052, 0.032);
  const focusPlane = p(interior, m.ink({ color: '#322d28' }), 1.6, 1.42, -2.6, 1.18, 0.81);
  const projectCache = new Map();
  const loader = new T.TextureLoader();
  let alive = true;
  function image(url) {
    if (!url) return null;
    if (!projectCache.has(url)) {
      const texture = loader.load(url, () => {
        if (alive) onInvalidate?.();
      });
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = 4;
      projectCache.set(url, texture);
      m.maps.add(texture);
    }
    return projectCache.get(url);
  }
  function screenMaterial(url) {
    return m.ink({
      map: blankScreens ? null : image(url),
      toneMapped: false,
      color: blankScreens ? '#222825' : '#ffffff',
    });
  }
  focusPlane.material = screenMaterial(previewUrl);
  b(interior, m.charcoal, 1.6, 1.42, -2.64, 1.208, 0.838, 0.07);
  b(interior, m.bronze, 1.6, 1.02, -2.65, 0.1, 0.29, 0.063);
  b(interior, m.bronze, 1.6, 0.854, -2.6, 0.44, 0.035, 0.27);
  b(interior, m.wood, 1.6, 0.8, -2.57, 1.73, 0.079, 1.0);
  for (const x of [0.87, 2.32]) b(interior, m.laterite, x, 0.38, -2.57, 0.17, 0.76, 0.69);
  g.shadow(interior, 1.6, -2.57, 2.13, 1.44, 0.007);
  const warmed = m.ink({ color: '#edcb9c', transparent: true, opacity: 0.19, depthWrite: false });
  b(interior, warmed, 1.6, 0.82, -2.065, 0.86, 0.013, 0.008);
  let upperScreen = null,
    requestedUrl = previewUrl,
    decorate = null,
    decorations = null;
  const anchors = {};
  function anchor(name, mesh) {
    const a = new T.Object3D();
    a.position.copy(mesh.position);
    a.quaternion.copy(mesh.quaternion);
    a.scale.copy(mesh.scale);
    mesh.parent.add(a);
    anchors[name] = a;
  }
  anchor('reception', focusPlane);
  function getScreenCorners(name) {
    const a = anchors[name];
    if (!a) return null;
    a.updateWorldMatrix(true, false);
    return [
      [-0.5, 0.5],
      [0.5, 0.5],
      [0.5, -0.5],
      [-0.5, -0.5],
    ].map(([x, y]) => new T.Vector3(x, y, 0).applyMatrix4(a.matrixWorld));
  }
  function setProject(url) {
    requestedUrl = url || previewUrl;
    if (upperScreen && !blankScreens) {
      upperScreen.material.map = image(requestedUrl);
      upperScreen.material.needsUpdate = true;
    }
  }
  function batch(group) {
    for (const mesh of g.batch(group)) {
      const surface = mesh.material;
      mesh.castShadow = !surface.transparent && !surface.isMeshBasicMaterial;
      mesh.receiveShadow = !surface.isMeshBasicMaterial;
    }
  }
  [street, shell, court, interior, door].forEach(batch);
  // Keep the immutable structure ready for both bookend views. Furnishing work
  // is split from the shell and instantiated only in the relevant part of the visit.
  function update(progress, t = 0) {
    const smooth = T.MathUtils.smoothstep;
    door.rotation.y = (smooth(progress, 0.24, 0.347) - smooth(progress, 0.405, 0.48)) * 1.49;
    // These composed shots look inward or across the road. The courtyard and
    // street are behind their cameras, so their silhouettes are already baked
    // into the shadow map and their detail can be excluded from the colour pass.
    const outward =
      progress < 0.385 || (progress > 0.455 && progress < 0.537) || (progress > 0.67 && progress < 0.94);
    tree.setVisible(outward);
    street.visible = progress < 0.385 || progress > 0.88;
    tree.update(t);
    if (progress > 0.34 && !decorate) {
      decorate = import('./furnishings.js')
        .then(({ furnishRooms }) => {
          if (!alive) return;
          decorations = furnishRooms(T, root, m, g, {
            batch,
            anchor,
            screenMaterial,
            project: requestedUrl,
            previewUrl,
          });
          upperScreen = decorations.officeScreen;
          setProject(requestedUrl);
          decorations.update(progress);
          onInvalidate?.();
        })
        .catch((error) => {
          if (alive) {
            console.warn('Studio furniture could not load', error);
            onFailure?.('furnishings-unavailable');
          }
        });
    }
    decorations?.update(progress);
  }
  return {
    update,
    setProject,
    getScreenCorners,
    dispose() {
      alive = false;
      decorations?.dispose();
      root.traverse((item) => {
        if (item.isInstancedMesh) item.dispose();
      });
      root.removeFromParent();
      g.dispose();
      m.dispose();
    },
  };
}
