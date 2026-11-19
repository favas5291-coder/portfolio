// X and Z are measured in metres. The central circulation aisle stays clear
// between x = -1.6 and +1.6, including the turn towards each work area.
const stops = [
  { eye: [-1.66, 1.58, 8.0], aim: [-0.38, 1.86, -1.1] },
  { eye: [-0.76, 1.58, -0.95], aim: [1.85, 1.43, -4.9] },
  { eye: [0.16, 1.56, -6.05], aim: [3.7, 1.38, -8.52] },
  { eye: [-0.05, 1.55, -10.88], aim: [-3.85, 1.22, -13.24] },
  { eye: [0.05, 1.53, -16.18], aim: [3.62, 1.2, -18.5] },
  { eye: [-0.64, 1.29, -23.58], aim: [0.32, 1.15, -26.35] },
];
const ease = (x) => x * x * (3 - 2 * x);
const mix = (a, b, t) => a + (b - a) * t;

export function positionCamera(camera, value, lookX = 0, lookY = 0) {
  const progress = Math.max(0, Math.min(5, value));
  const index = Math.min(4, Math.floor(progress));
  const fraction = ease(progress - index);
  const a = stops[index],
    b = stops[index + 1];
  camera.position.set(...a.eye.map((v, i) => mix(v, b.eye[i], fraction)));
  const target = a.aim.map((v, i) => mix(v, b.aim[i], fraction));
  // Turn towards the next doorway between exhibits, keeping the horizon level.
  if (index > 0 && index < 4) target[2] -= Math.sin(Math.PI * fraction) * 2.4;
  camera.lookAt(target[0] + lookX * 0.16, target[1] + lookY * 0.09, target[2]);
}
