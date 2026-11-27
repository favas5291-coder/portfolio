import { buildPeople } from '../studio/officePeople.js';
import { officeFurniture } from '../studio/officeFurniture.js';
import { officePlants } from '../studio/officePlants.js';
import { projectPreviews } from '../data/project-previews.js';

// Downstairs workshop and founder fit-out share the building coordinate system.
// Batches are separate from hinged or held objects so a review gesture costs
// four compact transforms rather than rebuilding a desk full of geometry.
export function furnishRooms(T, root, m, g, { batch, anchor, screenMaterial, project, previewUrl }) {
  const f = officeFurniture(T, m, g),
    plants = officePlants(T, m, g);
  const projectRoom = g.group(root),
    studio = g.group(root),
    upper = g.group(root, 0, 3.35, 0);
  const b = g.box,
    p = g.panel;
  function monitor(parent, x, y, z, width, height, yaw, url) {
    const rig = g.group(parent, x, y, z, yaw);
    b(rig, m.charcoal, 0, 0, 0, width + 0.026, height + 0.028, 0.041);
    b(rig, m.bronze, 0, -height * 0.5 - 0.046, -0.012, 0.049, 0.14, 0.031);
    b(rig, m.frame, 0, -height * 0.5 - 0.112, 0.011, width * 0.34, 0.015, 0.126);
    return p(rig, screenMaterial(url), 0, 0, 0.022, width, height);
  }
  // A quiet reception console and built-in reading bench face the courtyard.
  b(projectRoom, m.walnut, -0.93, 0.4, -3.76, 0.6, 0.8, 2.26);
  b(projectRoom, m.stone, -0.93, 0.824, -3.76, 0.68, 0.049, 2.31);
  f.paperStack(projectRoom, -0.9, 0.849, -3.26);
  plants.broad(projectRoom, -0.9, -4.39, 0.49, true);
  f.keyboard(projectRoom, 1.64, 0.842, -2.31, 0.43);
  f.paperStack(projectRoom, 1.04, 0.845, -2.42, 0.25, 0.26);
  b(projectRoom, m.walnut, -0.7, 0.19, -5.0, 1.34, 0.35, 0.62);
  b(projectRoom, m.linen, -0.7, 0.395, -5, 1.37, 0.073, 0.63);
  b(projectRoom, m.linen, -0.7, 0.53, -5.24, 1.37, 0.23, 0.09);
  plants.palm(projectRoom, -0.97, -1.81, 1.5);
  f.art(projectRoom, -1.03, 1.17, -5.659, 0.38, 0.49, 0, ['#d7b38a', '#827658', '#b65a34']);
  g.shadow(projectRoom, -0.68, -4.99, 1.94, 0.81);
  // The internal window is a long, framed opening above a plaster sill.
  b(studio, m.plaster, 4.51, 0.31, -3.92, 0.15, 0.62, 5.1);
  b(studio, m.walnut, 4.48, 0.645, -3.92, 0.21, 0.055, 5.12);
  for (const z of [-6.43, -4.95, -2.31, -1.38]) b(studio, m.frame, 4.48, 1.78, z, 0.054, 2.27, 0.055);
  p(studio, m.glass, 4.48, 1.76, -3.91, 4.97, 2.16, -Math.PI / 2);
  b(studio, m.frame, 4.48, 2.88, -3.92, 0.092, 0.06, 5.12);
  // A valid desktop/phone capture pair belongs to the same published example.
  // A missing pair leaves its phone in sketch mode rather than inventing a capture.
  const paired = Object.values(projectPreviews).find(
    (preview) => preview.mobile?.matchesDesktop === preview.screenshot,
  );
  f.table(studio, 5.78, -3.68, 1.46, 2.45, 0.745);
  const desktop = paired || { screenshot: previewUrl, width: 1348, height: 926 };
  const studioScreen = monitor(
    studio,
    5.96,
    1.105,
    -3.94,
    0.68,
    (0.68 * desktop.height) / desktop.width,
    -Math.PI / 2,
    desktop.screenshot,
  );
  anchor('studio', studioScreen);
  f.keyboard(studio, 5.59, 0.748, -3.94, 0.4, -Math.PI / 2);
  f.paperStack(studio, 5.91, 0.748, -2.82);

  plants.palm(studio, 6.83, -5.72, 1.69);
  const rearShelf = g.group(studio, 7.09, 0, -3.59, -Math.PI / 2);
  f.bookcase(rearShelf, 0, 0, 2.13, 1.72);
  // The same hand rig and licensed seated figures as the original studio:
  // the supported phone rotates with its owner while a colleague follows it.
  const cast = buildPeople(T, root, {
    placements: [
      { role: 'developer', position: [5.58, -2.4], yaw: -2.85 },
      { role: 'designer', position: [6.48, -3.0], yaw: -1.32 },
    ],
  });
  const presenter = cast.figure('developer'),
    colleague = cast.figure('designer');
  presenter.root.visible = colleague.root.visible = true;
  f.chair(studio, 5.58, -2.4, -2.85, m.jade);
  f.chair(studio, 6.48, -3.0, -1.32, m.linen);
  const handset = presenter.arms[0].getObjectByName('Handset screen');
  if (paired) {
    const face = p(handset, screenMaterial(paired.mobile.screenshot), 0, 0, 0.008, 0.063, 0.132);
    face.material.side = T.DoubleSide;
    anchor('phone', face);
  }
  cast.figure('designer').head.rotation.y = -0.23;
  // Upper floor fit-out is set back to preserve the lower-left car sightline.
  const desk = g.group(upper, 1.99, 0, 1.21);
  b(desk, m.wood, -0.065, 0.757, 0, 1.91, 0.062, 0.81);
  b(desk, m.bronze, -0.065, 0.714, 0, 1.85, 0.016, 0.76);
  for (const x of [-0.7, 0.7]) b(desk, m.walnut, x, 0.345, 0, 0.076, 0.69, 0.63);
  g.shadow(upper, 1.99, 1.21, 2.24, 1.42);
  const officeScreen = monitor(upper, 1.56, 1.14, 1.44, 0.65, (0.65 * 926) / 1348, Math.PI - 0.11, project);
  anchor('office', officeScreen);
  f.keyboard(upper, 1.56, 0.789, 1.17, 0.37, Math.PI - 0.11);
  f.taskLamp(upper, 2.66, 0.786, 1.4);
  f.paperStack(upper, 2.45, 0.789, 1.01, 0.215, 0.29);
  f.chair(upper, 2.32, 1.96, -0.48, m.jade);
  f.chair(upper, 1.5, 0.18, Math.PI + 0.24, m.linen);
  plants.broad(upper, 3.96, 1.79, 1.22);
  const plate = g.group(upper, 1.24, 0.796, 1.06, Math.PI - 0.09);
  const sign = b(plate, m.bronze, 0, 0.065, 0, 0.56, 0.122, 0.026);
  sign.rotation.x = -0.14;
  g.lettering(plate, 0, 0.07, 0.019, 0.52, 0.1, [['Muhammed Favas K', 0.48, 0.51, 'Georgia']], {
    ink: '#fff3d2',
    resolution: 512,
  });
  const bookCorner = g.group(upper, -1.12, 0, -3.31, Math.PI / 2);
  f.bookcase(bookCorner, 0, 0, 1.36, 1.15);
  plants.broad(upper, -1.05, -2.23, 1.0);
  for (const group of [projectRoom, studio, upper]) batch(group);
  return {
    officeScreen,
    dispose() {
      cast.dispose();
    },
    update(progress) {
      const turn = T.MathUtils.smoothstep(progress, 0.537, 0.597);
      presenter.head.rotation.y = -0.28 * turn;
      presenter.head.rotation.x = 0.075;
      presenter.arms[0].rotation.y = 0.86 * turn;
      presenter.arms[0].rotation.x = -0.13 * turn;
      colleague.head.rotation.y = -0.22 - 0.14 * turn;
      colleague.head.rotation.x = 0.1;
    },
  };
}
