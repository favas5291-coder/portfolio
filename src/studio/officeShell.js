import { floorFinish } from './officeFloor.js';

export function makeEnvelope(T, root, m, g, plants) {
  const porch = g.group(root);
  const shell = g.group(root);
  const fixedGroups = [porch, shell];
  const floor = g.panel(shell, floorFinish(m), 0, 0.002, -10.6, 14.4, 35.8);
  floor.rotation.x = -Math.PI / 2;
  g.box(shell, m.stone, 0, -0.095, -10.6, 14.4, 0.18, 35.8);
  g.box(shell, m.plaster, 0, 3.62, -14, 14.25, 0.19, 28.35);
  g.box(shell, m.plaster, 0, 1.77, -28.11, 14.2, 3.54, 0.19);

  // The timber soffit runs through the gallery and ends at the office door.
  // Recessed seams are visible between boards; the middle of the ceiling stays light.
  for (const x of [-1.56, 1.56]) {
    g.box(shell, m.walnut, x, 3.46, -10.99, 0.22, 0.17, 22.05);
    g.box(shell, m.light, x, 3.371, -10.99, 0.025, 0.009, 22);
  }
  for (const z of [-2.0, -6.46, -10.92, -15.38, -19.84]) {
    for (let x = -1.36; x <= 1.36; x += 0.39)
      g.box(shell, m.wood, x, 3.505, z, 0.38, 0.043, 4.45);
  }

  for (const side of [-1, 1]) {
    const x = side * 7.04;
    g.box(shell, m.plaster, x, 0.34, -14, 0.24, 0.68, 27.9);
    g.softBox(shell, m.stone, x, 0.706, -14, 0.33, 0.057, 28, 0.012);
    g.box(shell, m.plaster, x, 3.35, -14, 0.24, 0.36, 28);
    for (let z = 0; z > -28; z -= 2.34) {
      g.box(shell, m.frame, x, 1.97, z, 0.086, 2.48, 0.055);
      g.box(shell, m.glass, x, 1.97, z - 1.17, 0.018, 2.48, 2.28);
      if (side < 0) {
        // Pairs of fixed deep fins stop the west sun and cast paired shadows.
        for (const offset of [0, 0.39, 1.17, 1.56]) {
          const fin = g.box(shell, m.wood, x - 0.28, 1.96, z - offset, 0.48, 2.51, 0.078);
          fin.rotation.y = 0.28;
        }
      }
    }
    g.box(shell, m.frame, x, 3.12, -14, 0.09, 0.065, 28);
  }

  // Floating acoustic ceiling panels and shadow gaps give the work bays
  // a softer enclosure than the timber-lined circulation aisle.
  for (const z of [-2.88, -7.99, -13.20, -18.78, -25.20]) {
    for (const side of [-1, 1]) {
      g.box(shell, m.walnut, side * 4.42, 3.51, z, 3.72, 0.077, 3.62);
      g.softBox(shell, m.plaster, side * 4.42, 3.43, z, 3.97, 0.103, 3.86, 0.018);
    }
  }

  // Half-height plaster pods with clear upper lights enclose the occupied wings.
  // A broad, 4.4 m gallery between them keeps the office lamp visible at reception.
  for (const z of [-5.5, -10.5, -15.9]) {
    for (const side of [-1, 1]) {
      const pod = g.group(root);
      fixedGroups.push(pod);
      const outside = side * 5.77, inside = side * 3.40;
      g.box(pod, m.plaster, outside, 1.76, z, 2.58, 3.52, 0.24);
      g.box(pod, m.plaster, inside, 0.41, z, 2.19, 0.82, 0.22);
      g.softBox(pod, m.wood, inside, 0.844, z, 2.23, 0.056, 0.26, 0.012);
      g.box(pod, m.glass, inside, 2.00, z, 2.12, 2.27, 0.022);
      for (const x of [side * 2.28, side * 4.47])
        g.box(pod, m.walnut, x, 1.76, z, 0.081, 3.52, 0.23);
      g.box(pod, m.plaster, inside, 3.34, z, 2.2, 0.36, 0.24);
      g.box(pod, m.walnut, inside, 3.15, z, 2.23, 0.055, 0.24);
      g.box(pod, m.walnut, side*4.67, 0.055, z, 4.79, 0.104, 0.249);
    }
  }

  // The last space has a lower, open, timber-lined doorway. Both jambs stand
  // outside the lamp's line of sight from the middle of the gallery.
  for (const side of [-1, 1]) {
    g.box(shell, m.plaster, side * 4.18, 1.76, -22, 5.72, 3.52, 0.24);
    g.softBox(shell, m.walnut, side * 1.31, 1.27, -22, 0.11, 2.54, 0.34, 0.01);
  }
  g.box(shell, m.plaster, 0, 3.01, -22, 2.65, 1.02, 0.24);
  g.box(shell, m.walnut, 0, 2.52, -22, 2.73, 0.11, 0.34);
  const openLeaf = g.group(shell, -1.28, 0, -22.16, Math.PI * 0.51);
  g.softBox(openLeaf, m.walnut, 0.62, 1.23, 0, 1.24, 2.45, 0.052, 0.009);
  g.box(openLeaf, m.brass, 1.11, 1.02, 0.056, 0.14, 0.022, 0.063);

  // Shaded public approach: a slim pale concrete canopy over a deeper teak soffit.
  g.softBox(porch, m.stone, 0, 3.77, -0.09, 14.62, 0.28, 3.77, 0.024);
  g.box(porch, m.bronze, 0, 3.921, -0.09, 14.66, 0.026, 3.81);
  for (let x = -7.14; x < 7.2; x += 0.285)
    g.box(porch, m.wood, x, 3.594, -0.07, 0.279, 0.08, 3.72);
  for (const x of [-6.86, 6.86, 4.86]) g.box(porch, m.stone, x, 1.78, -0.32, 0.38, 3.56, 0.49);

  // Rough mineral masonry returns behind the sign; the lettering stands proud
  // of a recessed honed limestone panel with a bronze pin in each corner.
  g.box(porch, m.laterite, -2.63, 1.77, 0.03, 2.57, 3.54, 0.61);
  g.box(porch, m.laterite, -3.70, 1.77, -0.88, 0.43, 3.54, 1.65);
  g.softBox(porch, m.stone, -2.58, 1.93, 0.348, 2.12, 1.03, 0.045, 0.014);
  g.lettering(porch, -2.56, 1.94, 0.374, 1.85, 0.88,
    [['Fazhere', 0.46, 0.34], ['S T U D I O', 0.18, 0.81, 'Arial']],
    { ink: '#26382f' });
  for (const x of [-3.57, -1.59]) for (const y of [1.49, 2.37])
    g.ball(porch, m.brass, x, y, 0.375, 0.009, 0.009, 0.005);

  // The fixed sidelight and tracks have real depth. Only the door leaves slide.
  for (const side of [-1, 1]) {
    g.box(porch, m.bronze, side * 1.31, 1.55, 0.002, 0.089, 3.11, 0.184);
    const x = side === 1 ? 3.10 : -4.45, width = side === 1 ? 3.52 : 1.0;
    g.box(porch, m.glass, x, 1.78, -0.034, width, 3.5, 0.026);
    g.box(porch, m.frame, x, 0.047, -0.027, width, 0.078, 0.084);
  }
  g.box(porch, m.bronze, 0, 3.08, 0, 2.7, 0.105, 0.181);
  g.box(porch, m.glass, 0, 3.34, -0.02, 2.66, 0.41, 0.025);
  for (const x of [-5.0, 5.0]) {
    g.box(porch, m.walnut, x, 1.77, -0.12, 0.18, 3.54, 0.32);
    for (let d = 0.22; d <= 1.82; d += 0.22) {
      const fin = g.box(porch, m.wood, x + Math.sign(x) * d, 1.77, 0.02, 0.079, 3.54, 0.39);
      fin.rotation.y = 0.26;
    }
  }

  // Two planted beds run towards the facade, leaving a clear path to the door.
  // The return wall in the near left garden gives the first step some parallax.
  g.softBox(porch, m.stone, -4.45, 0.19, 1.21, 2.09, 0.38, 3.37, 0.018);
  g.box(porch, m.leather, -4.45, 0.383, 1.21, 1.96, 0.01, 3.23);
  const leftBed = g.group(porch, 0, 0.387, 0);
  plants.palm(leftBed, -4.56, 0.59, 2.03, false);
  for (const [x, z, h] of [[-4.28,1.57,0.87],[-4.56,2.4,1.05],[-3.86,2.45,0.68]]) plants.broad(leftBed, x,z,h,false);
  g.softBox(porch, m.stone, 4.43, 0.26, 1.30, 3.71, 0.52, 1.38, 0.018);
  g.box(porch, m.leather, 4.43, 0.522, 1.30, 3.55, 0.01, 1.25);
  const rightBed = g.group(porch, 0, 0.53, 0);
  for (const [x, h, z] of [[3.18,1.37,1.25],[3.87,1.62,1.26],[4.62,1.10,1.38],[5.42,1.51,1.24],[5.87,1.22,1.45]])
    plants.broad(rightBed, x,z,h,false);
  plants.palm(rightBed, 5.2, 1.2, 2.21, false);

  g.softBox(porch, m.charcoal, 0, 0.012, 0.67, 2.36, 0.018, 0.88, 0.008);
  for (let z = 0.263; z < 1.08; z += 0.043) g.box(porch, m.leather, 0, 0.023, z, 2.30, 0.005, 0.012);
  g.box(porch, m.bronze, 0, 0.012, -0.035, 2.58, 0.016, 0.122);
  const doorLeaves = [];
  for (const sign of [-1, 1]) {
    const door = g.group(root, sign * 0.621, 0, 0.04), w = 1.23;
    g.box(door, m.glass, 0, 1.51, 0, w, 3.00, 0.024);
    for (const side of [-1, 1]) g.box(door, m.bronze, side*w/2, 1.52, 0, 0.029, 3.04, 0.051);
    g.box(door, m.bronze, 0, 0.054, 0, w, 0.092, 0.057);
    g.box(door, m.bronze, 0, 2.992, 0, w, 0.065, 0.056);
    const pull = -sign * 0.398;
    g.cyl(door, m.brass, pull, 1.20, 0.127, 0.023, 0.59);
    for (const y of [0.951, 1.449])
      g.rod(door, m.brass, [pull, y, 0.012], [pull, y, 0.125], 0.016);
    // Small frosted marks identify the glass with the view through it intact.
    for (const x of [-0.31,-0.155,0,0.155,0.31]) g.box(door, m.sheen, x, 1.55, 0.014, 0.074, 0.024, 0.003);
    g.batch(door);
    doorLeaves.push({ door, sign });
  }
  return { fixedGroups, doorLeaves };
}
