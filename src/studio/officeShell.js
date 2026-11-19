import { floorFinish } from './officeFloor.js';

export function makeEnvelope(T, root, m, g, plants, mobile) {
  const fixed = g.group(root),
    porch = g.group(fixed),
    shell = g.group(fixed),
    fixedGroups = [porch, shell];
  // The west wall is a band of glazing shaded by timber fins. Transverse walls
  // stop before the two metre gallery, preserving a view of the founder's lamp.
  const floor = g.panel(shell, floorFinish(m, mobile), 0, 0.002, -10.6, 14.4, 35.8);
  floor.rotation.x = -Math.PI / 2;
  g.box(shell, m.stone, 0, -0.095, -10.6, 14.4, 0.18, 35.8);
  g.box(shell, m.outsideGreen, 0, -0.24, -12, 85, 0.16, 85);
  // The public approach extends behind the visitor's starting position.
  for (let row = 0; row < 4; row++)
    for (let col = -3; col <= 3; col++) {
      g.box(porch, m.stone, col * 1.83, -0.053, 8.2 + row * 1.8, 1.82, 0.105, 1.79);
    }
  for (const side of [-1, 1]) {
    for (const z of [3.36, 6.85, 10.4]) {
      const x = side * 4.54;
      g.cyl(porch, m.bronze, x, 0.223, z, 0.06, 0.44);
      g.cyl(porch, m.light, x, 0.39, z, 0.061, 0.027);
      g.shadow(porch, x, z, 0.38, 0.3);
    }
  }
  g.box(shell, m.plaster, 0, 3.62, -14, 14.25, 0.19, 28.35);
  g.box(shell, m.walnut, 0, 3.49, -14, 3.12, 0.067, 28);
  for (let x = -1.5; x < 1.6; x += 0.147) g.box(shell, m.wood, x, 3.44, -14, 0.088, 0.075, 28.1);
  for (const x of [-1.51, 1.51]) g.box(shell, m.light, x, 3.431, -14, 0.022, 0.018, 28);
  g.box(shell, m.plaster, 0, 1.77, -28.11, 14.2, 3.54, 0.19);
  for (const sign of [-1, 1]) {
    const x = sign * 7.04;
    g.box(shell, m.plaster, x, 0.35, -14, 0.14, 0.7, 27.9);
    g.box(shell, m.stone, x, 0.739, -14, 0.23, 0.07, 28);
    g.box(shell, m.plaster, x, 3.36, -14, 0.21, 0.34, 28);
    for (let z = -1.2; z > -29; z -= 2.3) {
      g.box(shell, m.frame, x, 2.01, z, 0.082, 2.58, 0.058);
      g.box(shell, m.glass, x, 1.98, z - 0.99, 0.017, 2.42, 2.05);
      g.box(shell, m.frame, x, 2.76, z - 0.99, 0.058, 0.029, 2.29);
      const fin = g.box(shell, m.wood, x + sign * 0.17, 2.0, z, 0.075, 2.5, 0.28);
      fin.rotation.y = sign * 0.23;
    }
    g.box(shell, m.frame, x, 3.15, -14, 0.07, 0.064, 28);
    g.box(shell, m.frame, x, 0.79, -14, 0.065, 0.045, 28);
  }
  for (const z of [-5.5, -10.5, -15.9, -21.4]) {
    for (const sign of [-1, 1]) {
      // Glazed partition with a solid acoustic wall at the far end.
      const stop = g.group(fixed);
      fixedGroups.push(stop);
      const outer = sign * 5.7,
        inner = sign * 3.38;
      g.box(stop, m.plaster, outer, 1.76, z, 2.66, 3.52, 0.15);
      g.box(stop, m.glass, inner, 1.71, z, 2.23, 3.32, 0.025);
      for (const x of [sign * 2.29, sign * 4.43]) {
        g.box(stop, m.frame, x, 1.75, z, 0.045, 3.5, 0.063);
      }
      g.box(stop, m.frame, inner, 0.065, z, 2.18, 0.069, 0.06);
      g.box(stop, m.frame, inner, 3.42, z, 2.2, 0.06, 0.06);
      g.box(stop, m.sheen, inner, 1.22, z + 0.016, 2.12, 0.034, 0.004);
      g.box(stop, m.bronze, outer, 0.07, z + 0.083, 2.66, 0.13, 0.023);
    }
  }
  // Street-facing gallery: basalt plinth, bush-hammered piers, teak soffit.
  g.box(porch, m.walnut, 0, 3.82, -0.21, 14.6, 0.43, 3.75);
  g.box(porch, m.bronze, 0, 3.73, 1.7, 14.6, 0.31, 0.1);
  for (let x = -7.15; x < 7.2; x += 0.21) g.box(porch, m.wood, x, 3.56, -0.04, 0.153, 0.08, 3.38);
  for (const x of [-6.9, 6.9, -4.85, 4.85]) g.box(porch, m.stone, x, 1.76, -0.31, 0.38, 3.52, 0.49);
  // A tall sign cut into the blade wall is visible on the first step.
  g.box(porch, m.walnut, -2.55, 1.75, -0.12, 2.18, 3.5, 0.34);
  for (let x = -3.56; x < -1.48; x += 0.083) g.box(porch, m.wood, x, 1.72, 0.066, 0.052, 3.43, 0.042);
  g.box(porch, m.charcoal, -2.33, 1.91, 0.12, 1.55, 0.82, 0.095);
  g.lettering(
    porch,
    -2.33,
    1.91,
    0.172,
    1.49,
    0.77,
    [
      ['Fazhere', 0.4, 0.32],
      ['Studio', 0.37, 0.74],
    ],
    { ink: '#f7edd7' },
  );
  for (const side of [-1, 1]) {
    const x = side * 1.28;
    g.box(porch, m.frame, x, 1.72, 0, 0.069, 3.45, 0.087);
    const panelX = side === 1 ? 3.06 : -4.22,
      width = side === 1 ? 3.46 : 1.16;
    g.box(porch, m.glass, panelX, 1.72, -0.01, width, 3.39, 0.02);
    g.box(porch, m.frame, panelX, 0.066, 0, width, 0.075, 0.061);
    g.box(porch, m.sheen, panelX, 1.27, 0.009, width, 0.029, 0.014);
  }
  g.box(porch, m.frame, 0, 3.1, 0, 2.58, 0.066, 0.09);
  for (const sign of [-1, 1])
    for (let x = 5.16; x < 6.91; x += 0.27) {
      g.box(porch, m.wood, sign * x, 1.72, -0.1, 0.093, 3.44, 0.18);
    }
  g.box(porch, m.stone, 4.27, 0.18, 1.1, 3.38, 0.36, 1.01);
  g.box(porch, m.leather, 4.27, 0.363, 1.1, 3.24, 0.03, 0.87);
  for (const [x, h, z] of [
    [3.2, 1.4, 1.06],
    [4.12, 1.8, 1.14],
    [4.94, 1.13, 1.0],
    [5.63, 1.21, 1.13],
  ])
    plants.broad(porch, x, z, h, false);
  plants.palm(porch, -4.13, 1.1, 2.65);
  plants.palm(porch, 6.27, 0.79, 2.82);
  plants.broad(porch, -5.24, 1.64, 1.2);
  g.box(porch, m.charcoal, 0, 0.011, 0.65, 2.35, 0.016, 0.81);
  for (let z = 0.29; z < 1.03; z += 0.045) g.box(porch, m.leather, 0, 0.023, z, 2.29, 0.004, 0.012);
  // Two thin, framed sheets travel behind the fixed facade glazing.
  const doorLeaves = [];
  for (const sign of [-1, 1]) {
    const door = g.group(root, sign * 0.621, 0, 0.022),
      w = 1.23;
    g.box(door, m.glass, 0, 1.52, 0, w, 3.03, 0.034);
    for (const dx of [-1, 1]) g.box(door, m.frame, (dx * w) / 2, 1.52, 0, 0.039, 3.04, 0.062);
    g.box(door, m.frame, 0, 0.055, 0, w, 0.072, 0.064);
    g.box(door, m.frame, 0, 3.005, 0, w, 0.061, 0.067);
    g.box(door, m.sheen, 0, 1.24, 0.019, w, 0.027, 0.006);
    g.box(door, m.brass, -sign * 0.38, 1.24, 0.072, 0.027, 0.36, 0.03);
    for (const y of [1.08, 1.4]) g.box(door, m.bronze, -sign * 0.38, y, 0.052, 0.027, 0.026, 0.058);
    g.batch(door);
    doorLeaves.push({ door, sign });
  }
  return { fixedGroups, doorLeaves };
}
