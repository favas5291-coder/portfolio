import { cameraStops, chapters, doorStops, sceneScale } from './scene.config.ts';

export { cameraStops, chapters };

export function chapterAt(progress) {
  return chapters.find((chapter) => progress < chapter.range[1]) || chapters.at(-1);
}

// Monotone Hermite interpolation flattens repeated poses and corners. Each
// component stays within its authored segment. No previous-frame state enters.
function channel(times, values) {
  const widths = times.slice(1).map((time, i) => time - times[i]);
  const rates = widths.map((width, i) => (values[i + 1] - values[i]) / width);
  const slopes = times.map((_, i) => {
    if (!i || i === times.length - 1 || rates[i - 1] * rates[i] <= 0) return 0;
    const a = 2 * widths[i] + widths[i - 1];
    const b = widths[i] + 2 * widths[i - 1];
    return (a + b) / (a / rates[i - 1] + b / rates[i]);
  });
  return (p) => {
    if (p <= times[0]) return values[0];
    if (p >= times.at(-1)) return values.at(-1);
    let i = 0;
    while (p >= times[i + 1]) ++i;
    const t = (p - times[i]) / widths[i];
    const s = 1 - t;
    return (
      s * s * (1 + 2 * t) * values[i] +
      t * t * (3 - 2 * t) * values[i + 1] +
      widths[i] * s * t * (s * slopes[i] - t * slopes[i + 1])
    );
  };
}

const times = cameraStops.map(([progress]) => progress);
const position = [0, 1, 2].map((axis) =>
  channel(
    times,
    cameraStops.map((stop) => stop[1][axis]),
  ),
);
const yawAt = channel(
  times,
  cameraStops.map((stop) => stop[2]),
);
const pitchAt = channel(
  times,
  cameraStops.map((stop) => stop[3]),
);
const lenses = [0, 1].map((layout) =>
  channel(
    times,
    cameraStops.map((stop) => stop[4][layout]),
  ),
);
const doorAngles = Object.fromEntries(
  Object.entries(doorStops).map(([door, stops]) => [
    door,
    channel(
      stops.map(([time]) => time),
      stops.map(([, angle]) => angle),
    ),
  ]),
);
const radians = Math.PI / 180;

export function positionCamera(camera, progress, compact) {
  const [east, north, up] = position.map((sample) => sample(progress));
  camera.position.set(east, up, -north);
  const yaw = yawAt(progress) * radians;
  const pitch = pitchAt(progress) * radians;
  camera.lookAt(
    east + Math.sin(yaw) * Math.cos(pitch),
    up + Math.sin(pitch),
    -north - Math.cos(yaw) * Math.cos(pitch),
  );
  const lens = lenses[compact ? 1 : 0](progress);
  const [width, height] = sceneScale.composition[compact ? 'compact' : 'wide'];
  const crop = Math.min(1, width / height / camera.aspect);
  const fov = (2 * Math.atan(Math.tan((lens * radians) / 2) * crop)) / radians;
  if (camera.fov !== fov) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }
  camera.updateMatrixWorld();
}

export function doorPose(progress) {
  return {
    passenger: -doorAngles.passenger(progress) * radians,
    entrance: doorAngles.entrance(progress) * radians,
  };
}
