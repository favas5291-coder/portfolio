// Fractional powers of the original 60 Hz spring update. At 60 Hz the response
// is unchanged; at 30/90/120 Hz it follows the same damped trajectory instead of
// changing stiffness or slowing down. Position and velocity are mutated in place.
const step = 1 / 60;
const damping = Math.exp(-13 * step);
const radius = Math.sqrt(damping);
const a = 1 - 75 * step * step * damping;
const b = step * damping;
const c = -75 * step * damping;
const cosine = (a + damping) / (2 * radius);
const angle = Math.acos(cosine);
const sine = Math.sin(angle);

export function animationDelta(delta) {
  // Idle demand frames and tab suspension must not advance the opening reveal.
  return delta > 0 && delta <= 0.25 ? delta : step;
}

export function advanceSpring(position, velocity, target, delta) {
  const count = animationDelta(delta) / step;
  const decay = Math.pow(radius, count);
  const blend = Math.sin(angle * count) / sine;
  const phase = Math.cos(angle * count);
  const xx = decay * (phase + (a / radius - cosine) * blend);
  const xv = decay * b / radius * blend;
  const vx = decay * c / radius * blend;
  const vv = decay * (phase + (damping / radius - cosine) * blend);
  for (const axis of ['x', 'y', 'z']) {
    const offset = position[axis] - target[axis];
    const speed = velocity[axis];
    position[axis] = target[axis] + xx * offset + xv * speed;
    velocity[axis] = vx * offset + vv * speed;
  }
}
