import { bench, meeting, reviewPerformance, visitorSeat } from './sceneBlocking.js';
import { shopColours } from './studioContent.js';

// Furnish the rooms around their real working positions. Animated pieces are
// independent assemblies so moving a screen or notebook never rebuilds a room.
export function furnishRooms(T, root, m, g, f, plants) {
  const edge = g.softBox;
  const reviewCue = reviewPerformance();
  const rooms = Array.from({ length: 5 }, () => g.group(root));
  const [reception, exhibit, studio, review, founder] = rooms;
  const { gymdrobe, fabea } = f.projectPreviews;
  function plaque(p, x, y, z, w, text, yaw = 0) {
    const board = g.group(p, x, y, z, yaw);
    g.box(board, m.charcoal, 0, 0, 0, w, 0.24, 0.038);
    g.lettering(board, 0, 0, 0.021, w * 0.97, 0.214, [[text, 0.47, 0.53, 'Arial']], { ink: '#faefd9' });
  }
  function sofa(p, x, z, yaw = 0) {
    const base = g.group(p, x, 0, z, yaw);
    g.shadow(base, 0, 0, 2.2, 1.15);
    g.box(base, m.walnut, 0, 0.17, -0.02, 1.67, 0.23, 0.62);
    g.box(base, m.jade, 0, 0.4, 0, 1.72, 0.22, 0.67);
    g.box(base, m.jade, 0, 0.65, -0.27, 1.71, 0.44, 0.17);
    for (const dx of [-0.88, 0.88]) g.box(base, m.wood, dx, 0.49, 0, 0.078, 0.19, 0.69);
    for (const dx of [-0.43, 0.43]) g.ball(base, m.jade, dx, 0.48, 0, 0.43, 0.078, 0.31);
  }
  // Reception desk with fluted oak fascia, travertine writing ledge and a lowered
  // staff side. The director's lamp remains visible to the left of the desk.
  g.shadow(reception, 2.39, -3.69, 3.1, 1.7);
  g.box(reception, m.walnut, 2.39, 0.45, -3.7, 2.5, 0.86, 0.85);
  for (let x = 1.18; x < 3.64; x += 0.085) g.box(reception, m.wood, x, 0.46, -3.258, 0.057, 0.78, 0.038);
  edge(reception, m.stone, 2.39, 0.932, -3.69, 2.59, 0.1, 0.96, 0.023);
  g.box(reception, m.bronze, 2.39, 0.087, -3.249, 2.46, 0.042, 0.045);
  g.lettering(reception, 1.135, 0.69, -3.67, 0.7, 0.15, [['Reception', 0.76, 0.5]], {
    yaw: -Math.PI / 2,
    ink: '#fbefcf',
    align: 'center',
  });
  // The register is on the staff edge, directly below the receptionist’s writing hand.
  edge(reception, m.walnut, 2.12, 1.008, -4.08, 0.51, 0.05, 0.28, 0.008);
  g.box(reception, m.paper, 2.12, 1.04, -4.08, 0.44, 0.013, 0.24);
  g.box(reception, m.leather, 2.12, 1.047, -4.08, 0.007, 0.003, 0.24);
  for (let i = 0; i < 5; i++) {
    g.box(reception, m.bronze, 2.22, 1.049, -4.15 + i * 0.031, 0.158, 0.0015, 0.002);
  }
  g.shadow(reception, 2.16, -4.56, 0.65, 0.5);
  // A fluted return gives the desk its own background and shields the project
  // screen from arrivals. The corridor and the founder's lamp remain in sight.
  g.box(reception, m.walnut, 2.70, 1.42, -5.395, 2.94, 2.84, 0.075);
  for (let i = 0; i < 38; i++) {
    g.box(reception, m.wood, 1.26 + i * 0.077, 1.42, -5.347, 0.038, 2.79, 0.022);
  }
  const checkIn = g.group(reception, 3.14, 1.077, -3.77, -0.16);
  g.box(checkIn, m.charcoal, 0, 0, 0, 0.4, 0.21, 0.025);
  g.box(checkIn, m.bronze, 0, -0.075, 0.045, 0.15, 0.038, 0.16);
  plants.broad(reception, 4.47, -4.67, 1.79);
  sofa(reception, -4.3, -3.2, 0.13);
  f.art(reception, -3.9, 1.75, -5.4, 1.03, 1.39, 0, ['#ece2ca', '#e4b979', '#5d6d56']);
  f.pendant(reception, 2.48, -3.67, 0.54, 0.25);
  const directory = g.group(reception, 1.49, 0, -5.12, -0.47);
  g.box(directory, m.bronze, 0, 0.69, 0, 0.043, 1.32, 0.046);
  g.box(directory, m.stone, 0, 0.063, 0, 0.62, 0.077, 0.48);
  g.box(directory, m.charcoal, 0, 1.57, 0, 0.95, 1.16, 0.052);
  const route = [
    'Entrance',
    'Reception',
    'Project Room',
    'Development Studio',
    'Client Review',
    'Founder’s Office',
  ];
  const directoryMap = m.canvasMap(384, 480, (ctx, w, h) => {
    ctx.fillStyle = '#283b34';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e9ddc5';
    ctx.font = '34px Georgia';
    ctx.fillText('Visitor directory', 25, 67);
    ctx.font = '17px Arial';
    ctx.fillStyle = '#cdb78a';
    ctx.fillText('F A Z H E R E   S T U D I O', 25, 31);
    ctx.strokeStyle = '#7f8b7c';
    ctx.beginPath();
    ctx.moveTo(48, 114);
    ctx.lineTo(48, 421);
    ctx.stroke();
    route.forEach((name, i) => {
      const y = 114 + i * 61;
      ctx.fillStyle = '#273d35';
      ctx.strokeStyle = '#c9b38d';
      ctx.beginPath();
      ctx.arc(48, y, 4.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#f1e7d3';
      ctx.font = '23px Arial';
      ctx.fillText(name, 70, y + 8);
    });
  });
  g.mark(directory, 0, 1.57, 0.029, 0.9, 1.12, directoryMap);
  const indicator = g.group(root, 1.49, 0, -5.12, -0.47);
  const dot = g.ball(indicator, m.amber, -0.338, 1.83, 0.042, 0.014, 0.014, 0.007);
  // Museum monitor with current manifest capture and a separate compact product
  // display. The smaller FABEA exhibit has its own photography and identity.
  const plinth = g.group(exhibit, 3.7, 0, -8.47, -0.97);
  g.shadow(plinth, 0, -0.07, 3.9, 1.32);
  edge(plinth, m.walnut, 0, 0.365, -0.065, 3.15, 0.67, 0.68, 0.025);
  g.box(plinth, m.charcoal, 0, 0.043, -0.08, 2.96, 0.086, 0.61);
  edge(plinth, m.stone, 0, 0.735, 0, 3.32, 0.09, 0.96, 0.018);
  // The large storefront and portrait variant screen have independent bezels.
  // Each rests on the same stone worktop and displays its native image ratio.
  f.display(
    plinth,
    -0.49,
    1.694,
    -0.18,
    2.08,
    (2.08 * gymdrobe.height) / gymdrobe.width,
    0,
    gymdrobe.screenshot,
  );
  const sample = f.display(plinth, 1.1, 1.437, -0.14, 0.63, 0.945, -0.04, shopColours[0].photo, false);
  edge(plinth, m.bronze, 1.1, 0.876, -0.19, 0.083, 0.205, 0.072, 0.01);
  g.box(plinth, m.charcoal, 1.1, 0.788, -0.18, 0.31, 0.015, 0.23);
  g.shadow(plinth, -0.49, -0.17, 0.94, 0.31, 0.781);
  g.shadow(plinth, 1.1, -0.18, 0.42, 0.31, 0.781);
  const productFinish = sample.screen.material;
  g.lettering(plinth, -0.49, 0.44, 0.284, 1.48, 0.165, [['GymDrobe', 0.83, 0.5, 'Georgia']], {
    ink: '#fff0cf',
  });
  g.lettering(plinth, 1.1, 0.44, 0.284, 0.79, 0.112, [['Colour study', 0.8, 0.52, 'Arial']], {
    ink: '#fff0cf',
    align: 'center',
  });
  const side = g.group(exhibit, 5.27, 0, -6.71, -1.38);
  f.table(side, 0, 0, 1.12, 0.57, 0.739, m.walnut);
  f.display(side, 0, 1.29, -0.04, 0.85, 0.584, 0, fabea.screenshot, true);
  g.lettering(side, 0, 0.864, 0.228, 0.96, 0.14, [['FABEA', 0.78, 0.52, 'Georgia']], {
    ink: '#e5d8c1',
    align: 'center',
    background: '#514535',
  });
  f.pendant(exhibit, 3.61, -8.12, 0.39, 0.22);
  plants.palm(exhibit, 5.88, -9.88, 2.55);
  // West wing: two working stations, a standing review position and a project
  // pin-up. Chairs face their monitors and the visitor enters from the side.
  const benchGroup = g.group(studio, bench.x, 0, bench.z, bench.yaw);
  f.table(benchGroup, 0, 0, 3.7, 0.88);
  for (const [i, x] of [0.9, -0.9].entries()) {
    f.chair(benchGroup, x, -0.7);
    f.display(
      benchGroup,
      x,
      1.151,
      0.085,
      0.68,
      0.44,
      Math.PI + (i ? -0.16 : 0.11),
      i ? fabea.screenshot : gymdrobe.screenshot,
    );
    f.keyboard(benchGroup, x, 0.75, -0.22, 0.34, Math.PI);
    f.paperStack(benchGroup, x + 0.48, 0.75, -0.01, 0.186, 0.236);
    g.ball(benchGroup, m.charcoal, x + 0.26, 0.78, -0.22, 0.038, 0.024, 0.058);
  }
  g.shadow(studio, -5.34, -12.13, 0.62, 0.49);
  g.shadow(studio, -5.98, -11.52, 0.63, 0.48);
  const pin = g.group(studio, -4.4, 1.9, -15.82);
  g.box(pin, m.walnut, 0, 0, 0, 2.65, 1.22, 0.061);
  g.box(pin, m.linen, 0, 0, 0.036, 2.57, 1.16, 0.018);
  for (const [i, dx] of [-0.82, -0.29, 0.25, 0.81].entries()) {
    const layout = g.group(pin, dx, -0.015, 0.052, ((i % 2) - 0.5) * 0.07);
    g.box(layout, m.paper, 0, 0, 0, 0.41, 0.57, 0.011);
    g.box(layout, m.jade, -0.095, 0.1, 0.008, 0.145, 0.15, 0.003);
    for (let k = 0; k < 4; k++) g.box(layout, m.leather, 0.08, 0.155 - k * 0.04, 0.008, 0.12, 0.008, 0.002);
    g.box(layout, m.walnut, 0, -0.1, 0.008, 0.32, 0.011, 0.003);
    g.ball(layout, m.brass, 0, 0.258, 0.015, 0.013, 0.013, 0.009);
  }
  f.pendant(studio, -4.25, -12.99, 0.4, 0.2);
  plants.broad(studio, -6.15, -15.1, 1.5);
  plaque(studio, -5.75, 2.94, -15.8, 1.67, 'Development Studio');
  // A woven rug defines the review area and gives the feet of the furniture
  // a tactile reference against the full-height glazing.
  const weave = m.canvasMap(384, 320, (ctx, w, h) => {
    ctx.fillStyle = '#a9a388';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 2) {
      ctx.fillStyle = i % 4 ? '#afaa90' : '#9c987e';
      ctx.fillRect(i, 0, 1, h);
    }
    ctx.fillStyle = 'rgba(209,202,173,.32)';
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    ctx.strokeStyle = '#817f6b';
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.strokeStyle = '#cec4a9';
    ctx.lineWidth = 1;
    ctx.strokeRect(12, 12, w - 24, h - 24);
  });
  const rug = g.panel(review, m.surface({ map: weave, roughness: 1 }), 3.62, 0.005, -18.08, 3.83, 2.98);
  rug.rotation.x = -Math.PI / 2;
  // Review table keeps the two faces and the phone in one sightline. The
  // widescreen pivots a few degrees with the manager's gesture on arrival.
  f.table(review, 3.67, -18.08, 1.88, 1.05, 0.75, m.wood);
  f.chair(review, ...meeting.client, meeting.clientYaw, m.leather);
  f.chair(review, ...meeting.manager, meeting.managerYaw);
  const [sx, sz] = meeting.screen;
  edge(review, m.bronze, sx, 0.764, sz, 0.24, 0.025, 0.205, 0.009);
  g.cyl(review, m.frame, sx, 0.869, sz, 0.029, 0.199);
  const reviewer = g.group(root, sx, 1.152, sz, -0.99);
  f.display(reviewer, 0, 0, 0, 0.68, 0.438, 0, gymdrobe.screenshot, false);
  g.batch(reviewer);
  const phone = g.group(review, meeting.phone[0], 0.753, meeting.phone[1], meeting.clientYaw);
  edge(phone, m.charcoal, 0, 0.009, 0, 0.077, 0.016, 0.157, 0.006);
  const face = g.mark(phone, 0, 0.018, 0, 0.068, 0.144, f.image(gymdrobe.mobile.screenshot));
  face.rotation.x = -Math.PI / 2;
  g.cyl(review, m.linen, 3.0, 0.817, -17.92, 0.042, 0.131);
  g.cyl(review, m.leather, 3.0, 0.883, -17.92, 0.034, 0.003);
  f.paperStack(review, 3.04, 0.751, -18.25, 0.201, 0.255);
  f.art(review, 5.42, 1.75, -21.3, 1.25, 1.25, 0, ['#dad5ba', '#91a897', '#665742']);
  f.pendant(review, 3.61, -18.05, 0.45, 0.23);
  plants.palm(review, 5.97, -20.42, 2.29);
  plaque(review, 2.79, 2.76, -21.31, 1.46, 'Client Review');
  // The founder's desk sits in front of a reeded wall, a local landscape
  // print and reading shelves. The amber task light is physically the same
  // object that visitors see from the entrance.
  const wall = g.group(founder, 0, 0, -27.94);
  g.box(wall, m.walnut, 0, 1.75, 0, 8.1, 3.5, 0.12);
  for (let x = -3.98; x < 4.01; x += 0.127) g.box(wall, m.wood, x, 1.76, 0.1, 0.074, 3.46, 0.072);
  f.coastalPrint(founder, -0.58, 2.08, -27.78);
  const nameplate = g.group(founder, 0.52, 1.69, -27.76);
  edge(nameplate, m.bronze, 0, 0, 0, 0.94, 0.172, 0.036, 0.008);
  g.lettering(nameplate, 0, 0, 0.019, 0.89, 0.145, [['Muhammed Favas K', 0.57, 0.5, 'Arial']], {
    ink: '#fff1d2',
    align: 'center',
  });
  f.bookcase(founder, 2.63, -27.51, 1.72, 1.92);
  plants.broad(founder, -2.62, -27.01, 2.24);
  f.table(founder, 0.3, -25.9, 2.57, 0.87, 0.75, m.walnut);
  f.chair(founder, 0.35, -26.68, -0.98, m.leather);
  f.chair(founder, visitorSeat.x, visitorSeat.z, visitorSeat.yaw, m.jade);
  f.taskLamp(founder, 1.05, 0.75, -25.95);
  const warm = new T.PointLight('#ffd285', 1.15, 2.2, 2);
  warm.position.set(0.91, 1.13, -25.95);
  founder.add(warm);
  // A warm pool anchors the lamp visually even with all shadow maps disabled.
  const lampPool = m.canvasMap(64, 64, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.5);
    gradient.addColorStop(0, 'rgba(255,203,117,.62)');
    gradient.addColorStop(1, 'rgba(255,203,117,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
  const glow = g.mark(founder, 0.9, 0.753, -25.85, 0.94, 0.68, lampPool, 0, true);
  glow.rotation.x = -Math.PI / 2;
  const mat = g.group(founder, -0.04, 0.754, -25.94, -0.06);
  g.box(mat, m.leather, 0, 0.003, 0, 0.99, 0.006, 0.51);
  const laptop = g.group(founder, -0.29, 0.764, -25.99, Math.PI + 0.27);
  g.box(laptop, m.bronze, 0, 0.009, 0, 0.348, 0.017, 0.237);
  const lid = g.group(laptop, 0, 0.025, -0.103);
  lid.rotation.x = -0.21;
  g.box(lid, m.bronze, 0, 0.112, 0, 0.349, 0.225, 0.011);
  g.box(lid, m.charcoal, 0, 0.115, 0.0065, 0.329, 0.198, 0.003);
  const keys = g.group(laptop, 0, 0.017, 0.006);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 12; col++)
      g.box(keys, m.frame, (col - 5.5) * 0.025, 0.003, (row - 1.5) * 0.018, 0.02, 0.003, 0.013);
  g.box(laptop, m.stone, 0, 0.02, 0.073, 0.101, 0.002, 0.051);
  g.cyl(founder, m.linen, -0.73, 0.808, -26.11, 0.041, 0.117);
  g.cyl(founder, m.leather, -0.73, 0.868, -26.11, 0.035, 0.002);
  g.box(founder, m.jade, -0.19, 0.772, -26.14, 0.171, 0.023, 0.239);
  f.paperStack(founder, 0.15, 0.752, -26.21, 0.244, 0.288);
  const cover = g.group(root, 0.03, 0.783, -26.21);
  g.box(cover, m.leather, 0.121, 0, 0, 0.242, 0.007, 0.29);
  g.batch(cover);
  // Shoe contacts sit inside the larger shadows of the chairs.
  function shoeContacts(parent, x, z, yaw, standing = false) {
    const feet = g.group(parent, x, 0, z, yaw);
    for (const side of [-1, 1]) {
      g.shadow(
        feet,
        side * (standing ? 0.14 : 0.16),
        standing ? 0.06 + 0.035 * side : 0.416 - 0.035 * side,
        0.23,
        0.36,
        0.013,
      );
    }
  }
  shoeContacts(reception, 2.15, -4.55, -0.17, true);
  shoeContacts(benchGroup, 0.9, -0.7, 0.08);
  shoeContacts(benchGroup, -0.9, -0.7, 0.08);
  shoeContacts(review, ...meeting.client, meeting.clientYaw);
  shoeContacts(review, ...meeting.manager, meeting.managerYaw);
  shoeContacts(founder, 0.35, -26.68, -0.98);
  f.pendant(founder, -1.3, -26.67, 0.45, 0.17);
  return {
    rooms,
    update(progress, room, time = 0) {
      dot.position.y = 1.57 + 0.56 - ((114 + Math.max(0, Math.min(5, room)) * 61) / 480) * 1.12;
      const cue = reviewCue(progress, time);
      reviewer.rotation.y = -0.99 - 0.85 * cue.turn;
      cover.rotation.z = Math.PI * 0.99 * T.MathUtils.smoothstep(progress, 4.66, 4.97);
    },
    colour(colour) {
      const choice = shopColours.find((item) => item.name === colour) || shopColours[0];
      const photo = f.image(choice.photo);
      // The two source photographs have slightly different crops. Preserve
      // their proportions inside the fixed 2:3 product display.
      const ratio = choice.name === 'Red' ? 640 / 853 : 640 / 960;
      photo.repeat.x = 2 / 3 / ratio;
      photo.offset.x = (1 - photo.repeat.x) / 2;
      productFinish.map = photo;
    },
  };
}
