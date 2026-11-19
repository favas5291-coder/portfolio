// Furnish the rooms around their real working positions. Animated pieces are
// independent assemblies so moving a screen or notebook never rebuilds a room.
export function furnishRooms(T, root, m, g, f, plants) {
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
  g.box(reception, m.stone, 2.39, 0.932, -3.69, 2.59, 0.1, 0.96);
  g.box(reception, m.bronze, 2.39, 0.087, -3.249, 2.46, 0.042, 0.045);
  g.lettering(reception, 2.36, 0.568, -3.229, 1.22, 0.236, [['Reception', 0.66, 0.5]], {
    ink: '#fbefcf',
    align: 'center',
  });
  f.paperStack(reception, 1.7, 0.984, -3.55, 0.28, 0.23);
  const checkIn = g.group(reception, 3.14, 1.077, -3.77, -0.16);
  g.box(checkIn, m.charcoal, 0, 0, 0, 0.4, 0.21, 0.025);
  g.box(checkIn, m.bronze, 0, -0.075, 0.045, 0.15, 0.038, 0.16);
  plants.broad(reception, 4.47, -4.67, 1.79);
  sofa(reception, -4.3, -3.2, 0.13);
  f.art(reception, -3.9, 1.75, -5.4, 1.03, 1.39, 0, ['#ece2ca', '#e4b979', '#5d6d56']);
  f.pendant(reception, 2.48, -3.67, 0.54, 0.25);
  const directory = g.group(reception, 4.11, 0, -3.45, -0.54);
  g.box(directory, m.bronze, 0, 0.69, 0, 0.043, 1.32, 0.046);
  g.box(directory, m.stone, 0, 0.063, 0, 0.62, 0.077, 0.48);
  g.box(directory, m.charcoal, 0, 1.57, 0, 0.95, 1.16, 0.052);
  const route = ['Reception', 'Project Room', 'Development Studio', 'Client Review', 'Founder’s Office'];
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
    ctx.moveTo(48, 123);
    ctx.lineTo(48, 390);
    ctx.stroke();
    route.forEach((name, i) => {
      const y = 129 + i * 65;
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
  const indicator = g.group(root, 4.11, 0, -3.45, -0.54);
  const dot = g.ball(indicator, m.amber, -0.338, 1.83, 0.042, 0.014, 0.014, 0.007);
  // Museum monitor with current manifest capture and a separate compact product
  // display. The smaller FABEA exhibit has its own photography and identity.
  const plinth = g.group(exhibit, 3.8, 0, -8.47, -0.92);
  g.box(plinth, m.walnut, 0, 0.335, -0.11, 2.74, 0.67, 0.52);
  g.shadow(plinth, 0, -0.1, 3.65, 1.13);
  g.box(plinth, m.stone, 0, 0.696, 0, 2.88, 0.125, 1.0);
  f.display(plinth, 0, 1.68, -0.23, 2.4, 1.52, 0, gymdrobe.screenshot, false);
  g.box(plinth, m.bronze, 0, 0.865, -0.315, 0.22, 0.24, 0.075);
  g.lettering(plinth, -0.49, 0.847, 0.29, 1.42, 0.14, [['GymDrobe', 0.79, 0.5]], { ink: '#26382a' });
  const sample = f.display(
    plinth,
    0.85,
    0.972,
    0.23,
    0.34,
    0.39,
    0.06,
    '/images/projects/gymdrobe-shirt-black.webp',
    false,
  );
  const productFinish = sample.screen.material;
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
  f.table(studio, -4.56, -12.95, 4.0, 0.87);
  for (const [i, x] of [-3.65, -5.5].entries()) {
    f.chair(studio, x, -13.68);
    f.display(
      studio,
      x,
      1.16,
      -12.82,
      0.69,
      0.46,
      Math.PI + (i ? -0.14 : 0.15),
      i ? fabea.screenshot : gymdrobe.screenshot,
    );
    f.keyboard(studio, x, 0.75, -13.18, 0.34, Math.PI);
    f.paperStack(studio, x + 0.46, 0.75, -12.96, 0.186, 0.236);
    g.ball(studio, m.charcoal, x + 0.285, 0.774, -13.15, 0.038, 0.024, 0.061);
  }
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
  f.table(review, 3.65, -18.1, 2.8, 1.3, 0.75, m.wood);
  f.chair(review, 3.9, -19.0, 0, m.leather);
  f.chair(review, 2.6, -17.1, Math.PI);
  const reviewer = g.group(root, 3.73, 1.132, -17.85, -0.75);
  f.display(reviewer, 0, 0, 0, 0.67, 0.423, 0, gymdrobe.screenshot);
  g.batch(reviewer);
  const phone = g.group(review, 3.9, 0.757, -18.57, 0.1);
  g.box(phone, m.charcoal, 0, 0.009, 0, 0.076, 0.016, 0.154);
  const face = g.mark(phone, 0, 0.018, 0, 0.067, 0.139, f.image(fabea.mobile.screenshot));
  face.rotation.x = -Math.PI / 2;
  g.cyl(review, m.linen, 2.65, 0.82, -17.85, 0.043, 0.13);
  f.paperStack(review, 4.5, 0.751, -18.09, 0.235, 0.29);
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
  f.art(founder, -0.36, 2.18, -27.78, 1.42, 1.05, 0, ['#ede3c8', '#c8865e', '#5a705a']);
  f.bookcase(founder, 2.63, -27.51, 1.72, 1.92);
  plants.broad(founder, -2.62, -27.01, 2.24);
  f.table(founder, 0.3, -25.9, 2.57, 0.87, 0.75, m.walnut);
  f.chair(founder, 0.35, -26.75, -0.73, m.leather);
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
  const mat = g.group(founder, -0.28, 0.754, -25.91, -0.06);
  g.box(mat, m.leather, 0, 0.003, 0, 0.99, 0.006, 0.51);
  const laptop = g.group(founder, -0.49, 0.764, -25.97, Math.PI + 0.23);
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
  f.paperStack(founder, 0.2, 0.752, -26.13, 0.244, 0.288);
  const cover = g.group(root, 0.08, 0.783, -26.13);
  g.box(cover, m.leather, 0.121, 0, 0, 0.242, 0.007, 0.29);
  g.batch(cover);
  f.pendant(founder, -1.3, -26.67, 0.45, 0.17);
  return {
    rooms,
    update(progress, room) {
      dot.position.y = 1.57 + 0.56 - ((129 + (Math.max(1, Math.min(5, room)) - 1) * 65) / 480) * 1.12;
      const smooth = T.MathUtils.smoothstep(progress, 3.84, 4.03);
      reviewer.rotation.y = -0.75 - 0.29 * smooth;
      cover.rotation.z = Math.PI * 0.79 * (1 - T.MathUtils.smoothstep(progress, 4.74, 4.99));
    },
    colour(colour) {
      productFinish.map = f.image(
        colour === 'Red'
          ? '/images/projects/gymdrobe-shirt-red.webp'
          : '/images/projects/gymdrobe-shirt-black.webp',
      );
    },
  };
}
