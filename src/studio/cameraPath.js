// Camera and eye-line marks in metres, from the forecourt to the visitor's chair.
// Each integer is a reading stop. Between them the eye turns down the gallery
// before crossing the next partition, then turns towards the people or exhibit.
const marks = [
  [0,    [-2.10, 1.62, 7.03],  [-0.20, 1.79, -0.88]],
  [0.33, [-0.95, 1.62, 2.57],  [-0.05, 1.47, -2.8]],
  [0.64, [-0.26, 1.62,-0.35],  [ 0.48, 1.41, -6.0]],
  [1,    [-0.70, 1.61,-0.66],  [ 1.80, 1.36, -4.80]],
  [1.46, [-0.52, 1.61,-3.67],  [ 0.36, 1.43, -9.2]],
  [1.76, [ 0.03, 1.60,-5.85],  [ 2.05, 1.39, -9.0]],
  [2,    [ 0.87, 1.55,-6.38],  [ 3.94, 1.40, -8.32]],
  [2.43, [-0.05, 1.59,-8.51],  [-0.62, 1.42,-13.1]],
  [2.74, [-0.58, 1.58,-10.49], [-2.14, 1.39,-14.3]],
  [3,    [-1.44, 1.56,-11.22], [-4.67, 1.28,-13.22]],
  [3.46, [-0.74, 1.60,-13.68], [ 0.3,  1.42,-18.72]],
  [3.78, [ 0.32, 1.57,-15.86], [ 2.35, 1.28,-19.05]],
  [4,    [ 0.87, 1.52,-16.58], [ 3.76, 1.12,-18.19]],
  [4.35, [ 0.1,  1.62,-19.36], [ 0.25, 1.38,-25.13]],
  [4.61, [-0.46, 1.61,-22.35], [ 0.44, 1.29,-26.44]],
  [4.82, [-1.07, 1.55,-24.48], [ 0.31, 1.19,-26.58]],
  [5,    [-0.40, 1.19,-24.97], [ 0.35, 1.15,-26.57]],
];

// Time-scaled Hermite tangents maintain walking speed through intermediate
// marks. Zero tangents at reading stops give each composition a clean rest.
function velocity(i, component, axis) {
  if (Number.isInteger(marks[i][0])) return 0;
  const before = marks[i - 1], current = marks[i], after = marks[i + 1];
  const previous = (current[component][axis] - before[component][axis]) / (current[0] - before[0]);
  const next = (after[component][axis] - current[component][axis]) / (after[0] - current[0]);
  // A harmonic mean prevents overshooting a short stride just past a doorway.
  return previous * next > 0 ? 2 * previous * next / (previous + next) : 0;
}
const slopes = marks.map((_, i) => [1, 2].map(component =>
  [0, 1, 2].map(axis => velocity(i, component, axis))));

export function cameraPose(value) {
  const progress = Math.min(5, Math.max(0, value));
  let i = 0;
  while (i < marks.length - 2 && progress > marks[i + 1][0]) i++;
  const a = marks[i], b = marks[i + 1];
  const duration = b[0] - a[0];
  const t = (progress - a[0]) / duration;
  const t2 = t * t, t3 = t2 * t;
  const ease = 3 * t2 - 2 * t3;
  function point(component) {
    return a[component].map((start, axis) => {
      const startSpeed = slopes[i][component - 1][axis] * duration;
      const endSpeed = slopes[i + 1][component - 1][axis] * duration;
      return start + ease * (b[component][axis] - start)
        + (t3 - 2 * t2 + t) * startSpeed + (t3 - t2) * endSpeed;
    });
  }
  return { eye: point(1), aim: point(2) };
}

const wideFrame = Math.tan(67 * Math.PI / 360);

export function positionCamera(camera, value) {
  // The narrow phone stage still includes the room directory, second monitor
  // and lamp. Keep a fixed lens throughout a visit, including camera turns.
  const verticalFov = Math.min(71, Math.max(55, Math.atan(wideFrame / camera.aspect) * 360 / Math.PI));
  if (camera.fov !== verticalFov) {
    camera.fov = verticalFov;
    camera.updateProjectionMatrix();
  }
  const { eye, aim } = cameraPose(value);
  camera.position.set(...eye);
  camera.lookAt(...aim);
}
