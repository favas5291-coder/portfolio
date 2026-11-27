// Metres, Y up. The front of the studio faces +Z. These point-of-view stops,
// the chapter links and the frames for still mode all use the same progress.
export const chapters = [
  ['arrival', 'Passenger seat', 0],
  ['pavement', 'Outside the studio', 0.2],
  ['reception', 'Project room', 0.4],
  ['studio', 'Working studio', 0.6],
  ['landing', 'Courtyard landing', 0.8],
  ['office', 'Founder’s office', 1],
].map(([id, label, progress]) => ({
  id, label, progress,
  wide: `/appointment/${id}-wide.webp`,
  compact: `/appointment/${id}-compact.webp`,
}));

export function chapterAt(progress) {
  return chapters[Math.max(0, Math.min(chapters.length - 1, Math.round(progress * 5)))];
}

// at, eye, look-at point, vertical field of view [wide, narrow]. The head
// clears the sill before it rises. Two equal stops create a real reading hold.
export const cameraStops = [
  [0,     [-1.03,1.10,13.15], [ 0.59,2.49, 2.40], [61,65]],
  [0.036, [-1.09,1.10,13.09], [-0.90,1.85, 4.20], [61,65]],
  [0.077, [-1.27,1.10,12.93], [-1.43,1.20, 6.30], [62,66]],
  [0.112, [-1.36,1.08,12.12], [-1.40,1.16, 5.95], [62,66]],
  [0.151, [-1.39,1.46,11.25], [-0.63,2.37, 1.60], [62,65]],
  [0.19,  [-1.46,1.63,10.63], [ 0.00,2.72, 1.65], [62,67]],
  [0.218, [-1.46,1.63,10.63], [ 0.00,2.72, 1.65], [62,67]],
  [0.262, [-1.00,1.64, 7.92], [-0.15,1.96, 1.62], [60,64]],
  [0.306, [-0.27,1.62, 4.42], [ 0.28,1.44,-1.66], [59,64]],
  [0.336, [ 0.00,1.61, 2.53], [ 0.72,1.34,-2.45], [59,64]],
  [0.369, [ 0.82,1.58, 0.54], [ 1.44,1.41,-2.60], [57,61]],
  [0.40,  [ 1.60,1.48,-0.76], [ 1.60,1.42,-2.60], [54,58]],
  [0.443, [ 1.60,1.48,-0.76], [ 1.60,1.42,-2.60], [54,58]],
  [0.473, [ 2.12,1.56,-0.28], [ 3.08,1.50,-1.91], [58,62]],
  [0.502, [ 4.03,1.61, 0.42], [ 4.26,1.44,-1.97], [61,65]],
  [0.55,  [ 4.04,1.63,-2.22], [ 5.16,1.15,-3.56], [61,65]],
  [0.60,  [ 3.91,1.55,-3.48], [ 5.13,1.07,-3.48], [59,63]],
  [0.625, [ 3.91,1.55,-3.48], [ 5.13,1.07,-3.48], [59,63]],
  [0.65,  [ 4.02,1.62,-4.54], [ 4.22,1.45,-6.25], [59,63]],
  [0.673, [ 3.62,1.63,-5.74], [ 2.85,1.54,-6.19], [61,64]],
  [0.695, [ 3.09,1.63,-5.32], [ 2.26,2.48,-3.83], [61,64]],
  [0.726, [ 3.05,2.28,-4.03], [ 2.95,3.22,-1.93], [61,64]],
  [0.761, [ 3.05,3.89,-1.63], [ 2.30,4.18, 0.53], [61,65]],
  [0.785, [ 3.19,4.97, 0.23], [ 1.17,3.34,-2.14], [63,66]],
  [0.815, [ 3.19,4.97, 0.23], [ 1.17,3.34,-2.14], [63,66]],
  [0.851, [ 2.78,4.97, 0.55], [ 0.49,4.77,-0.87], [60,64]],
  [0.90,  [ 1.81,4.97,-0.70], [ 0.54,4.61,-1.62], [60,64]],
  [0.926, [ 1.15,4.95,-1.39], [ 0.13,4.62,-0.32], [59,64]],
  [0.962, [ 0.82,4.83,-0.96], [ 0.63,4.17, 3.20], [58,62]],
  [0.993, [ 0.60,4.67,-0.40], [ 0.60,3.94, 4.60], [58,62]],
  [1,     [ 0.60,4.67,-0.40], [ 0.60,3.94, 4.60], [58,62]],
];

// Shape-preserving cubic interpolation. Tangents flatten at corners and
// repeated waypoints so a fast reverse retraces the same collision-free route.
function slope(a, b, spanA, spanB) {
  if (a * b <= 0) return 0;
  const w1 = 2 * spanB + spanA;
  const w2 = spanB + 2 * spanA;
  return (w1 + w2) / (w1 / a + w2 / b);
}

function channel(samples) {
  const times = cameraStops.map(stop => stop[0]);
  const spans = times.slice(1).map((t, i) => t - times[i]);
  const rates = spans.map((h, i) => (samples[i + 1] - samples[i]) / h);
  const tangents = samples.map((_, i) => {
    if (i === 0 || i === samples.length - 1) return 0;
    return slope(rates[i - 1], rates[i], spans[i - 1], spans[i]);
  });
  return (index, t) => {
    const t2 = t * t, t3 = t2 * t;
    const h = spans[index];
    return (2*t3 - 3*t2 + 1)*samples[index] + (t3 - 2*t2 + t)*h*tangents[index] +
      (-2*t3 + 3*t2)*samples[index + 1] + (t3 - t2)*h*tangents[index + 1];
  };
}

const eye = [0,1,2].map(axis => channel(cameraStops.map(stop => stop[1][axis])));
const aim = [0,1,2].map(axis => channel(cameraStops.map(stop => stop[2][axis])));
const fov = [0,1].map(axis => channel(cameraStops.map(stop => stop[3][axis])));

export function positionCamera(camera, progress, compact) {
  const p = Math.min(1, Math.max(0, progress));
  let i = 0;
  while (i < cameraStops.length - 2 && p >= cameraStops[i + 1][0]) i++;
  const t = (p - cameraStops[i][0]) / (cameraStops[i + 1][0] - cameraStops[i][0]);
  camera.position.set(...eye.map(read => read(i,t)));
  camera.lookAt(...aim.map(read => read(i,t)));
  const nextFov = fov[compact ? 1 : 0](i,t);
  if (camera.fov !== nextFov) {
    camera.fov = nextFov;
    camera.updateProjectionMatrix();
  }
}
