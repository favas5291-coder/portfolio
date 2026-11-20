import { projectPreviews } from '../data/project-previews.js';

export function officeFurniture(T, m, g, loadingManager) {
  const edge = g.softBox;
  const loaded = new Map(),
    loader = new T.TextureLoader(loadingManager);
  function image(url) {
    if (!loaded.has(url)) {
      const texture = loader.load(url);
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = 2;
      loaded.set(url, texture);
      m.maps.add(texture);
    }
    return loaded.get(url);
  }
  function imageScreen(p, url, w, h, face = 0.023) {
    return g.mark(p, 0, 0, face, w, h, image(url));
  }
  function display(parent, x, y, z, w, h, yaw, url, feet = true) {
    const p = g.group(parent, x, y, z, yaw);
    edge(p, m.charcoal, 0, 0, 0, w + 0.026, h + 0.026, 0.044, 0.009);
    const screen = imageScreen(p, url, w, h);
    if (feet) {
      g.box(p, m.frame, 0, -h * 0.5 - 0.09, -0.003, 0.055, 0.19, 0.045);
      g.box(p, m.bronze, 0, -h * 0.5 - 0.185, 0.016, w * 0.42, 0.018, 0.2);
    }
    return { p, screen };
  }
  function table(parent, x, z, w, d, h = 0.75, finish = m.wood, yaw = 0) {
    const p = g.group(parent, x, 0, z, yaw);
    g.shadow(p, 0, 0, w * 1.35, d * 1.7);
    edge(p, finish, 0, h - 0.028, 0, w, 0.056, d, 0.014);
    g.box(p, m.frame, 0, h - 0.082, 0, w - 0.16, 0.055, d * 0.7);
    for (const dx of [-1, 1])
      for (const dz of [-1, 1]) {
        g.box(p, m.frame, dx * (w / 2 - 0.1), (h - 0.07) / 2, dz * (d / 2 - 0.09), 0.049, h - 0.07, 0.049);
        g.shadow(p, dx * (w / 2 - 0.1), dz * (d / 2 - 0.09), 0.2, 0.18, 0.009);
      }
    return p;
  }
  function chair(parent, x, z, yaw = 0, upholstery = m.jade) {
    const p = g.group(parent, x, 0, z, yaw);
    g.shadow(p, 0, 0.01, 0.84, 0.7);
    g.cyl(p, m.frame, 0, 0.265, 0, 0.035, 0.32);
    for (let i = 0; i < 5; i++) {
      const theta = (i * Math.PI * 2) / 5,
        dx = Math.cos(theta) * 0.27,
        dz = Math.sin(theta) * 0.27;
      g.rod(p, m.frame, [0, 0.18, 0], [dx, 0.087, dz], 0.021);
      g.ball(p, m.charcoal, dx, 0.054, dz, 0.041, 0.04, 0.034);
    }
    g.ball(p, upholstery, 0, 0.45, 0, 0.262, 0.075, 0.235);
    const back = g.ball(p, upholstery, 0, 0.7, -0.215, 0.24, 0.245, 0.05);
    back.rotation.x = -0.13;
    for (const dx of [-0.246, 0.246]) {
      g.box(p, m.frame, dx, 0.54, -0.035, 0.021, 0.17, 0.025);
      g.box(p, m.leather, dx, 0.625, -0.022, 0.043, 0.031, 0.18);
    }
  }
  function taskLamp(parent, x, y, z) {
    g.cyl(parent, m.bronze, x, y + 0.013, z, 0.13, 0.026);
    g.rod(parent, m.brass, [x, y + 0.02, z], [x, y + 0.47, z], 0.014);
    g.rod(parent, m.brass, [x, y + 0.45, z], [x - 0.14, y + 0.47, z], 0.013);
    // A honey-coloured opal diffuser is visible at a distance through the
    // gallery. A slim brass lid and finial describe the real fixture up close.
    const opal = m.surface({
      color: '#ffe2aa',
      emissive: '#eeab51',
      emissiveIntensity: 0.42,
      roughness: 0.37,
    });
    g.ball(parent, opal, x - 0.14, y + 0.43, z, 0.168, 0.093, 0.16);
    g.cyl(parent, m.brass, x - 0.14, y + 0.377, z, 0.126, 0.008);
    g.ball(parent, m.brass, x - 0.14, y + 0.498, z, 0.117, 0.031, 0.111);
    g.cyl(parent, m.bronze, x - 0.14, y + 0.532, z, 0.018, 0.022);
  }
  function paperStack(p, x, y, z, w = 0.255, d = 0.28) {
    g.shadow(p, x, z, w * 1.28, d * 1.22, y + 0.001);
    g.box(p, m.paper, x, y + 0.009, z, w, 0.015, d);
    const lid = g.box(p, m.linen, x, y + 0.02, z, w + 0.006, 0.006, d + 0.004);
    lid.rotation.y = 0.03;
    g.box(p, m.bronze, x - w * 0.4, y + 0.026, z, 0.011, 0.006, d * 0.97);
  }
  function keyboard(p, x, y, z, w = 0.35, yaw = 0) {
    const key = g.group(p, x, y, z, yaw);
    g.shadow(key, 0, 0, w * 1.18, 0.163, 0.001);
    g.box(key, m.charcoal, 0, 0.008, 0, w, 0.014, 0.127);
    for (let row = 0; row < 4; row++)
      for (let col = 0; col < 11; col++) {
        g.box(key, m.leather, (w * (col - 5)) / 12, 0.017, (row - 1.5) * 0.025, w / 15, 0.004, 0.015);
      }
  }
  function art(p, x, y, z, w, h, yaw, palette) {
    const map = m.canvasMap(256, 326, (ctx, cw, ch) => {
      ctx.fillStyle = palette[0];
      ctx.fillRect(0, 0, cw, ch);
      ctx.fillStyle = palette[1];
      ctx.beginPath();
      ctx.arc(cw * 0.54, ch * 0.4, cw * 0.31, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = palette[2];
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 28; i++) {
        ctx.beginPath();
        ctx.moveTo(cw * 0.1, ch * 0.95 - i * 3);
        ctx.bezierCurveTo(
          cw * 0.68,
          ch * 1.12 - i * 5,
          cw * 0.44,
          ch * 0.48 - i * 2,
          cw * 0.9,
          ch * 0.55 - i * 4,
        );
        ctx.stroke();
      }
    });
    const frame = g.group(p, x, y, z, yaw);
    g.box(frame, m.walnut, 0, 0, 0, w + 0.06, h + 0.06, 0.058);
    g.box(frame, m.paper, 0, 0, 0.032, w, h, 0.012);
    g.mark(frame, 0, 0, 0.041, w * 0.84, h * 0.86, map);
  }
  function coastalPrint(parent, x, y, z) {
    const width = 1.36,
      height = 0.83;
    const print = m.canvasMap(768, 440, (ctx, w, h) => {
      ctx.fillStyle = '#e3d3af';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ba714d';
      ctx.beginPath();
      ctx.arc(w * 0.73, h * 0.34, h * 0.105, 0, Math.PI * 2);
      ctx.fill();
      const banks = [
        ['#9fa38a', 0.57, 13],
        ['#718779', 0.65, 20],
        ['#3e6256', 0.8, 27],
      ];
      banks.forEach(([ink, altitude, amplitude], i) => {
        ctx.fillStyle = ink;
        ctx.beginPath();
        for (let xx = 0; xx <= w; xx += 2) {
          const yy = h * altitude + amplitude * Math.sin(xx * 0.007 + i * 2.4) + 3 * Math.sin(xx * 0.049);
          if (xx === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
      });
      ctx.strokeStyle = '#d7c89e';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 60; i++) {
        const xx = m.random() * w,
          yy = h * 0.75 + m.random() * h * 0.24;
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx + 8 + m.random() * 35, yy);
        ctx.stroke();
      }
      for (const [xx, yy, rise] of [
        [132, 370, 168],
        [173, 359, 114],
        [95, 378, 99],
      ]) {
        ctx.strokeStyle = '#304f45';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(xx + 12, yy);
        ctx.quadraticCurveTo(xx - 7, yy - rise * 0.6, xx, yy - rise);
        ctx.stroke();
        for (let f = 0; f < 11; f++) {
          const a = (Math.PI * f) / 10,
            dx = Math.cos(a) * rise * 0.37,
            dy = -Math.sin(a) * 21;
          ctx.beginPath();
          ctx.moveTo(xx, yy - rise);
          ctx.quadraticCurveTo(xx + dx * 0.68, yy - rise + dy - 16, xx + dx, yy - rise + dy + 10);
          ctx.stroke();
        }
      }
    });
    const frame = g.group(parent, x, y, z);
    edge(frame, m.walnut, 0, 0, 0, width + 0.145, height + 0.145, 0.048, 0.01);
    g.box(frame, m.paper, 0, 0, 0.027, width + 0.093, height + 0.093, 0.008);
    g.mark(frame, 0, 0, 0.033, width, height, print);
  }
  function pendant(p, x, z, length = 0.38, r = 0.19, y = 3.54) {
    g.cyl(p, m.charcoal, x, y - 0.02, z, 0.058, 0.04);
    g.rod(p, m.frame, [x, y - 0.025, z], [x, y - length, z], 0.005);
    g.ball(p, m.jade, x, y - length - 0.06, z, r, 0.104, r);
    g.ball(p, m.light, x, y - length - 0.105, z, r * 0.86, 0.018, r * 0.86);
  }
  function bookcase(p, x, z, w = 2.3, h = 1.95) {
    g.box(p, m.walnut, x, h / 2, z - 0.14, w, h, 0.06);
    for (const side of [-1, 1]) g.box(p, m.walnut, x + (side * w) / 2, h / 2, z, 0.045, h, 0.36);
    for (let row = 0; row < 4; row++) {
      const y = 0.1 + (row * (h - 0.18)) / 3;
      g.box(p, m.wood, x, y, z, w, 0.04, 0.36);
      if (row === 3) continue;
      let xx = -w * 0.39;
      for (let i = 0; i < (row === 1 ? 6 : 11); i++) {
        const bookW = 0.045 + m.random() * 0.08,
          bookH = 0.19 + m.random() * 0.16;
        const cover = [m.jade, m.linen, m.leather, m.charcoal, m.paper][(i + row) % 5];
        g.box(p, cover, x + xx, y + 0.023 + bookH / 2, z + 0.04, bookW, bookH, 0.2 + m.random() * 0.04);
        g.box(p, m.brass, x + xx, y + bookH * 0.3, z + 0.147, 0.6 * bookW, 0.009, 0.008);
        xx += bookW + 0.012;
      }
    }
  }
  return {
    image,
    display,
    table,
    chair,
    taskLamp,
    paperStack,
    keyboard,
    art,
    pendant,
    coastalPrint,
    bookcase,
    projectPreviews,
  };
}
