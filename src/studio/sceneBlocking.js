// Distances are metres. Share furniture and actor marks so moving a workstation
// also moves its occupant, chair and screen through the same rigid transform.
export const bench = { x: -4.6, z: -13.35, yaw: -1.07 };
export function benchSeat(x) {
  const z = -0.7;
  return [
    bench.x + x * Math.cos(bench.yaw) + z * Math.sin(bench.yaw),
    bench.z - x * Math.sin(bench.yaw) + z * Math.cos(bench.yaw),
  ];
}
export const meeting = {
  client: [3.54, -18.85],
  clientYaw: 0.1,
  manager: [3.62, -17.32],
  managerYaw: 2.73,
  phone: [3.685, -18.33],
  screen: [4.0, -17.86],
};
export const visitorSeat = { x: -0.4, z: -24.95, yaw: 2.75 };

// The client indicates the phone first. The manager follows, swivels the display,
// then both hold the composition. Entering the room again replays the exchange.
export function reviewPerformance() {
  let started = null;
  const ramp = (a, b, n) => {
    const t = Math.min(1, Math.max(0, (n - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  return (progress, time) => {
    if (progress < 3.65 || progress > 4.52) started = null;
    else if (started === null) started = time;
    const beat = started === null ? 0 : Math.max(0, time - started) + ramp(3.65, 4, progress) * 0.9;
    return {
      point: ramp(0, 1.4, beat) * (1 - ramp(3.9, 5.6, beat)),
      follow: ramp(0.9, 2.0, beat),
      reach: ramp(1.8, 3.1, beat) * (1 - ramp(4.45, 5.8, beat)),
      turn: ramp(2.8, 4.5, beat),
    };
  };
}
