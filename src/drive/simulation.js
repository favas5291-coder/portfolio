import { COLLIDERS, DRIVE_BOUNDS, KERBS, LOADING_BAY, RAMP, SPAWN, STOPS } from './layout.js';

export const FIXED_STEP = 1 / 60;

// World units are metres, speed is metres/second; at heading zero the bonnet faces −Z.
const wheelbase = 1.84;
const bodyRadius = 0.68;
const propOrigins = [
  { kind: 'cone', x: 0.38, z: 2.3, radius: 0.24 },
  { kind: 'tyre', x: 1.65, z: 0.35, radius: 0.4 },
  { kind: 'sign', x: -2.1, z: -3.1, radius: 0.45 },
];

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const approach = (current, target, delta) =>
  current + clamp(target - current, -delta, delta);
const inside = (rect, x, z) =>
  Math.abs(x - rect.x) <= rect.width * 0.5 && Math.abs(z - rect.z) <= rect.depth * 0.5;
const inCircle = (zone, x, z) =>
  (x - zone.x) ** 2 + (z - zone.z) ** 2 <= zone.radius ** 2;

function newProps() {
  return propOrigins.map(origin => ({
    ...origin, vx: 0, vz: 0, yaw: 0, tilt: 0, tiltVelocity: 0, spin: 0,
    tipped: false, cooldown: 0, hits: 0,
  }));
}

function atSpawn() {
  return {
    x: SPAWN.x, y: 0, z: SPAWN.z, heading: SPAWN.heading,
    speed: 0, steer: 0, wheelAngle: 0, wheelSpin: 0,
    pitch: 0, pitchVelocity: 0, roll: 0, rollVelocity: 0,
    heave: 0.055, heaveVelocity: 0, verticalSpeed: 0,
    grounded: true, jumpHeld: false, braking: false, onRamp: false, rampFlight: false,
    nearby: null, flash: false, flashClock: 0,
  };
}

export function createDriveState() {
  return { ...atSpawn(), props: newProps(), impacts: 0, rampLanded: false, unlocked: false };
}

export function respawn(state) {
  Object.assign(state, atSpawn());
  // A displaced cone should never make the return point unusable.
  state.props = newProps();
  state.rampLanded = state.unlocked;
}

function groundAt(x, z) {
  if (inside(RAMP, x, z)) {
    const t = (RAMP.z + RAMP.depth * 0.5 - z) / RAMP.depth;
    return RAMP.height * clamp(t, 0, 1);
  }
  let y = 0;
  for (const kerb of KERBS) {
    if (inside(kerb, x, z)) y = Math.max(y, kerb.height);
  }
  return y;
}

function integrateHeight(state, jump, dt) {
  const nowOnRamp = inside(RAMP, state.x, state.z);
  const ground = groundAt(state.x, state.z);
  const jumpPressed = jump && !state.jumpHeld;
  state.jumpHeld = jump;
  const launchedOffLip = state.onRamp && !nowOnRamp && state.grounded &&
    state.y > RAMP.height * 0.75 && state.z <= RAMP.z - RAMP.depth * 0.5 && state.speed > 2;
  if (state.grounded && (jumpPressed || launchedOffLip)) {
    state.grounded = false;
    state.verticalSpeed = jumpPressed ? 4.2 : (1.4 + state.speed * 0.23);
    state.rampFlight = launchedOffLip || (state.onRamp && state.y > RAMP.height * 0.38);
  }
  state.onRamp = nowOnRamp;
  if (state.grounded && state.y - ground > 0.25) {
    state.grounded = false;
    state.verticalSpeed = 0;
  }
  if (state.grounded) {
    const bump = ground - state.y;
    if (bump > 0.045) state.heaveVelocity += bump * 2.8;
    state.y = ground;
  } else {
    state.verticalSpeed -= 12.6 * dt;
    state.y += state.verticalSpeed * dt;
    if (state.y <= ground) {
      state.y = ground;
      state.heaveVelocity += clamp(state.verticalSpeed * 0.09, -0.7, 0);
      state.grounded = true;
      state.verticalSpeed = 0;
      if (state.rampFlight) state.rampLanded = true;
      state.rampFlight = false;
    }
  }
}

function resolveWalls(state, forwardX, forwardZ) {
  // Two rounded contacts approximate the long shape without snagging on corners.
  let struck = 0;
  for (const offset of [-0.7, 0.77]) {
    for (const wall of COLLIDERS) {
      const cx = state.x + forwardX * offset;
      const cz = state.z + forwardZ * offset;
      const halfX = wall.width * 0.5, halfZ = wall.depth * 0.5;
      let dx = cx - clamp(cx, wall.x - halfX, wall.x + halfX);
      let dz = cz - clamp(cz, wall.z - halfZ, wall.z + halfZ);
      const distSq = dx * dx + dz * dz;
      if (distSq >= bodyRadius ** 2) continue;
      let gap = bodyRadius - Math.sqrt(distSq);
      if (distSq < 1e-10) {
        const px = halfX - Math.abs(cx - wall.x);
        const pz = halfZ - Math.abs(cz - wall.z);
        gap += Math.min(px, pz);
        dx = px < pz ? Math.sign(cx - wall.x) || 1 : 0;
        dz = px < pz ? 0 : Math.sign(cz - wall.z) || 1;
      } else {
        const distance = Math.sqrt(distSq);
        dx /= distance;
        dz /= distance;
      }
      state.x += dx * gap;
      state.z += dz * gap;
      struck = Math.max(struck, -(forwardX * dx + forwardZ * dz) * Math.sign(state.speed));
    }
  }
  const edgeX = clamp(state.x, DRIVE_BOUNDS.minX + 1.25, DRIVE_BOUNDS.maxX - 1.25);
  const edgeZ = clamp(state.z, DRIVE_BOUNDS.minZ + 1.25, DRIVE_BOUNDS.maxZ - 1.25);
  if (edgeX !== state.x) struck = Math.max(struck, Math.abs(forwardX));
  if (edgeZ !== state.z) struck = Math.max(struck, Math.abs(forwardZ));
  state.x = edgeX;
  state.z = edgeZ;
  if (struck > 0.1) state.speed *= 1 - Math.min(0.98, struck);
}

function moveProps(state, forwardX, forwardZ, dt) {
  for (const prop of state.props) {
    prop.cooldown = Math.max(0, prop.cooldown - dt);
    const rx = prop.x - state.x, rz = prop.z - state.z;
    const along = clamp(rx * forwardX + rz * forwardZ, -0.81, 0.82);
    const dx = rx - along * forwardX, dz = rz - along * forwardZ;
    const distance = Math.hypot(dx, dz);
    const overlap = bodyRadius + prop.radius - distance;
    if (state.y < 0.53 && overlap > 0 && Math.abs(state.speed) > 0.38 && !prop.cooldown) {
      const direction = Math.sign(state.speed);
      const nx = distance > 0.01 ? dx / distance : forwardX * direction;
      const nz = distance > 0.01 ? dz / distance : forwardZ * direction;
      const hitSpeed = Math.min(10, Math.abs(state.speed));
      prop.cooldown = 0.22;
      prop.hits++;
      state.impacts++;
      prop.yaw = Math.atan2(nx, nz);
      if (prop.kind === 'sign') {
        const swing = Math.sign(-forwardZ * direction || -nz || 1);
        prop.tiltVelocity = swing * Math.min(5, 0.85 + hitSpeed * 0.56);
        state.speed *= 0.86;
      } else {
        const gain = prop.kind === 'tyre' ? 0.73 : 1.1;
        prop.vx += (forwardX * direction * 0.52 + nx * 0.88) * (hitSpeed + 1) * gain;
        prop.vz += (forwardZ * direction * 0.52 + nz * 0.88) * (hitSpeed + 1) * gain;
        prop.x += nx * Math.min(overlap, 0.25);
        prop.z += nz * Math.min(overlap, 0.25);
        prop.tipped = prop.kind === 'cone' || prop.tipped;
        state.speed *= prop.kind === 'tyre' ? 0.86 : 0.97;
      }
    }

    if (prop.kind === 'sign') {
      prop.tiltVelocity += (-20 * prop.tilt - 4.4 * prop.tiltVelocity) * dt;
      prop.tilt += prop.tiltVelocity * dt;
    } else {
      prop.x = clamp(prop.x + prop.vx * dt, DRIVE_BOUNDS.minX + 0.5, DRIVE_BOUNDS.maxX - 0.5);
      prop.z = clamp(prop.z + prop.vz * dt, DRIVE_BOUNDS.minZ + 0.5, DRIVE_BOUNDS.maxZ - 0.5);
      const damping = Math.exp(-dt * (prop.kind === 'tyre' ? 1.55 : 3.1));
      prop.vx *= damping;
      prop.vz *= damping;
      if (prop.kind === 'tyre') {
        const rate = Math.hypot(prop.vx, prop.vz);
        if (rate > 0.02) prop.yaw = Math.atan2(-prop.vx, -prop.vz);
        prop.spin -= rate / prop.radius * dt;
      } else if (prop.tipped) {
        prop.tiltVelocity += ((1.32 - prop.tilt) * 52 - 7 * prop.tiltVelocity) * dt;
        prop.tilt += prop.tiltVelocity * dt;
      }
    }
  }
}

function spring(value, velocity, target, dt, stiffness, damping) {
  return velocity + ((target - value) * stiffness - damping * velocity) * dt;
}

// Call once per fixed physics tick. The renderer can run independently of this clock.
export function stepDrive(state, input, dt = FIXED_STEP) {
  if (!(dt > 0)) return;
  // Keep the solver stable if a caller accidentally supplies a render-frame delta.
  dt = Math.min(dt, 1 / 30);
  const throttle = clamp(input.throttle || 0, -1, 1);
  const steer = clamp(input.steer || 0, -1, 1);
  const previousSpeed = state.speed;
  state.braking = Boolean(input.brake);
  const desiredSpeed = state.braking ? 0 : throttle * (throttle < 0 ? 4.4 : 9.8);
  const swapping = throttle !== 0 && state.speed * throttle < 0;
  const rate = state.braking || swapping ? 17.5 : throttle ? 7.9 : 4.4;
  state.speed = approach(state.speed, desiredSpeed, dt * rate * (state.grounded ? 1 : 0.2));
  state.steer = approach(state.steer, steer, dt * (steer ? 5.7 : 7));
  state.wheelAngle = -state.steer * (0.62 - 0.20 * Math.min(1, Math.abs(state.speed) / 9.8));
  const yawChange = (Math.tan(state.wheelAngle) / wheelbase) * state.speed * dt;
  if (state.grounded) state.heading += yawChange;
  const forwardX = -Math.sin(state.heading), forwardZ = -Math.cos(state.heading);
  state.x += forwardX * state.speed * dt;
  state.z += forwardZ * state.speed * dt;
  resolveWalls(state, forwardX, forwardZ);
  integrateHeight(state, Boolean(input.jump), dt);
  moveProps(state, forwardX, forwardZ, dt);
  state.wheelSpin -= state.speed * dt / 0.342;
  const acceleration = clamp((state.speed - previousSpeed) / dt, -18, 10);
  const rampPitch = state.onRamp ? -Math.atan(RAMP.height / RAMP.depth) * forwardZ : 0;
  const pitchTarget = (state.grounded ? rampPitch : state.verticalSpeed * 0.023) + acceleration * 0.0042;
  // Body roll follows lateral acceleration and reverses naturally when backing up.
  const rollTarget = clamp(-state.speed * yawChange / dt * 0.0082, -0.12, 0.12);
  state.pitchVelocity = spring(state.pitch, state.pitchVelocity, pitchTarget, dt, 88, 13);
  state.rollVelocity = spring(state.roll, state.rollVelocity, rollTarget, dt, 96, 14);
  state.heaveVelocity = spring(state.heave, state.heaveVelocity, 0, dt, 120, 12);
  state.pitch += state.pitchVelocity * dt;
  state.roll += state.rollVelocity * dt;
  state.heave += state.heaveVelocity * dt;

  const stop = STOPS.find(zone => inCircle(zone, state.x, state.z));
  state.nearby = stop?.id ?? null;
  if (!state.unlocked && state.rampLanded && Math.abs(state.speed) < 0.75 && inCircle(LOADING_BAY, state.x, state.z)) {
    state.unlocked = true;
    state.flashClock = 1.05;
  }
  state.flashClock = Math.max(0, state.flashClock - dt);
  state.flash = state.flashClock > 0.8 || (state.flashClock > 0.24 && state.flashClock < 0.48);
}
