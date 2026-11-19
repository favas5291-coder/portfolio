// Draw seams, contact occlusion and slatted daylight once into the floor map.
// It carries the same light direction into the three wings on low-power GPUs.
export function floorFinish(m, mobile) {
  const xMin = -7.2,
    zMin = -28.5,
    width = 14.4,
    depth = 35.8;
  const resolution = mobile ? 768 : 1024;
  const map = m.canvasMap(resolution, resolution * 2, (ctx, pw, ph) => {
    const X = (x) => ((x - xMin) / width) * pw,
      Z = (z) => ((z - zMin) / depth) * ph;
    ctx.fillStyle = '#c5b8a3';
    ctx.fillRect(0, 0, pw, ph);
    function rectangle(x, z, w, d, fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(X(x), Z(z), (w / width) * pw, (d / depth) * ph);
    }
    const colors = ['#c7bba7', '#c5b9a7', '#cbbeac', '#c2b6a2', '#c8bdad'];
    for (let row = 0; row < 32; row++)
      for (let col = -1; col < 11; col++) {
        const x = xMin + (col + (row % 2) * 0.5) * 1.57,
          z = zMin + row * 1.15;
        rectangle(x, z, 1.57, 1.15, colors[Math.floor(m.random() * colors.length)]);
        rectangle(x, z, 1.57, 0.008, 'rgba(77,70,59,.38)');
        rectangle(x, z, 0.008, 1.15, 'rgba(77,70,59,.36)');
      }
    for (let i = 0; i < 70000; i++) {
      ctx.fillStyle = m.random() > 0.46 ? 'rgba(61,51,40,.074)' : 'rgba(255,254,240,.12)';
      ctx.fillRect(m.random() * pw, m.random() * ph, 0.5 + m.random() * 2, 0.4 + m.random());
    }
    // A planted clerestory runs along the west side. Its strips of sun land
    // diagonally on the same floor the visitor walks through.
    for (let room = 0; room < 6; room++) {
      ctx.save();
      ctx.beginPath();
      const z = 0.9 - room * 4.85;
      const corners = [
        [-7, z],
        [-7, z - 3.9],
        [1.6, z - 5.8],
        [2.2, z - 2.1],
      ];
      corners.forEach(([x, d], i) => (i ? ctx.lineTo(X(x), Z(d)) : ctx.moveTo(X(x), Z(d))));
      ctx.closePath();
      ctx.clip();
      const patch = ctx.createLinearGradient(X(-7), 0, X(2.2), 0);
      patch.addColorStop(0, 'rgba(255,233,166,.62)');
      patch.addColorStop(0.8, 'rgba(255,237,184,.32)');
      patch.addColorStop(1, 'rgba(255,239,191,.025)');
      ctx.fillStyle = patch;
      ctx.fillRect(0, 0, pw, ph);
      ctx.strokeStyle = 'rgba(92,75,53,.21)';
      ctx.lineWidth = 2.2;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(X(-7), Z(z - i * 0.72));
        ctx.lineTo(X(3), Z(z - 2.5 - i * 0.72));
        ctx.stroke();
      }
      ctx.restore();
    }
    const edge = ctx.createLinearGradient(0, 0, pw, 0);
    edge.addColorStop(0, 'rgba(69,59,46,.3)');
    edge.addColorStop(0.11, 'rgba(69,59,46,0)');
    edge.addColorStop(0.9, 'rgba(69,59,46,0)');
    edge.addColorStop(1, 'rgba(69,59,46,.35)');
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, pw, ph);
  });
  return m.surface({ map, roughness: 0.81 });
}
