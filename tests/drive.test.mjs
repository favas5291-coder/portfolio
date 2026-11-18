import test from 'node:test';
import assert from 'node:assert/strict';
import { createDriveState, FIXED_STEP, respawn, stepDrive } from '../src/drive/simulation.js';
import { BUILDINGS, DRIVE_BOUNDS, KERBS, LOADING_BAY, RAMP, SPAWN, STOPS } from '../src/drive/layout.js';

function tick(state, frames, input = {}) {
  for (let i = 0; i < frames; i++) stepDrive(state, input, FIXED_STEP);
}

test('a new driver can bump a cone and brake in the flagship bay from spawn', () => {
  const s = createDriveState();
  tick(s, 102, { throttle: 1 });
  assert.ok(s.speed > 9 && s.speed < 10);
  tick(s, 6, { brake: true });
  assert.ok(s.pitch < 0, 'the bonnet dips on braking');
  tick(s, 70, { brake: true });
  assert.equal(s.nearby, 'gymdrobe');
  assert.equal(s.speed, 0);
  assert.equal(s.props[0].hits, 1);
  assert.ok(s.props[0].tilt > 1, 'cone falls over');
  assert.ok(Math.abs(s.z - STOPS[0].z) < 0.5);
  tick(s, 160);
  assert.ok(Math.abs(s.pitch) < 0.0001 && Math.abs(s.roll) < 0.0001);
});

test('right input turns right going forward and reverses the turn in reverse gear', () => {
  const s = createDriveState();
  tick(s, 40, { throttle: 1, steer: 1 });
  assert.ok(s.x > 0 && s.heading < 0 && s.wheelAngle < 0 && s.roll > 0);
  tick(s, 50, { brake: true });
  const heading = s.heading, z = s.z;
  tick(s, 40, { throttle: -1, steer: 1 });
  assert.ok(s.speed < 0 && s.heading > heading && s.z > z);
});

test('the pickup stops at shop walls and can reverse out', () => {
  const s = createDriveState();
  const gym = BUILDINGS.find(b => b.id === 'gymdrobe');
  tick(s, 300, { throttle: 1 });
  assert.ok(s.z > gym.z + gym.depth / 2 + 1.2);
  assert.ok(s.speed < 0.02);
  const before = s.z;
  tick(s, 50, { throttle: -1 });
  assert.ok(s.z > before + 1);
});

test('the kerb can be climbed, and world boundaries remain recoverable', () => {
  const s = createDriveState(), kerb = KERBS[0];
  s.x = kerb.x + kerb.width / 2 - .1;
  s.z = kerb.z + kerb.depth / 2 - .13;
  stepDrive(s, {});
  assert.equal(s.y, kerb.height);
  assert.ok(s.heaveVelocity > 0);
  Object.assign(s, { x: 8, z: DRIVE_BOUNDS.minZ + 1.5 });
  tick(s, 120, { throttle: 1 });
  assert.ok(s.z >= DRIVE_BOUNDS.minZ && s.speed < 0.05);
  tick(s, 60, { throttle: -1 });
  assert.ok(s.z > DRIVE_BOUNDS.minZ + 3);
});

test('a held jump fires once; a released and pressed jump works again', () => {
  const s = createDriveState();
  stepDrive(s, { jump: true });
  assert.equal(s.grounded, false);
  tick(s, 120, { jump: true });
  assert.equal(s.grounded, true);
  assert.equal(s.rampLanded, false);
  stepDrive(s, {});
  stepDrive(s, { jump: true });
  assert.equal(s.grounded, false);
});

test('loose tyres travel and spin; the sign swings on a fixed foot and settles', () => {
  for (const kind of ['tyre', 'sign']) {
    const s = createDriveState(), prop = s.props.find(p => p.kind === kind);
    const oldX = prop.x, oldZ = prop.z;
    s.x = oldX; s.z = oldZ + 3;
    tick(s, 65, { throttle: 1 });
    assert.ok(prop.hits > 0);
    if (kind === 'tyre') {
      assert.ok(Math.hypot(prop.x - oldX, prop.z - oldZ) > 0.2);
      assert.ok(Math.abs(prop.spin) > 0.2);
    } else {
      assert.equal(prop.x, oldX); assert.equal(prop.z, oldZ);
      assert.ok(Math.abs(prop.tilt) > 0.01);
      tick(s, 300, { brake: true });
      assert.ok(Math.abs(prop.tilt) < 0.001);
    }
  }
});

test('the loading bay needs a real ramp landing and a stationary pickup', () => {
  const s = createDriveState();
  Object.assign(s, { x: LOADING_BAY.x, z: LOADING_BAY.z });
  stepDrive(s, {});
  assert.equal(s.unlocked, false);
  Object.assign(s, { x: RAMP.x, z: RAMP.z + 8 });
  tick(s, 112, { throttle: 1 });
  assert.equal(s.rampFlight, true);
  assert.equal(s.rampLanded, false);
  tick(s, 90, { brake: true });
  assert.equal(s.rampLanded, true);
  assert.equal(s.unlocked, false);
  Object.assign(s, { x: LOADING_BAY.x, z: LOADING_BAY.z, speed: 2 });
  stepDrive(s, {});
  assert.equal(s.unlocked, false);
  tick(s, 10, { brake: true });
  assert.equal(s.unlocked, true);
  let flashes = Number(s.flash);
  for (let i = 0; i < 120; i++) {
    const wasLit = s.flash;
    stepDrive(s, {});
    if (!wasLit && s.flash) flashes += 1;
  }
  assert.equal(flashes, 2);
  respawn(s);
  assert.equal(s.unlocked, true);
  assert.equal(s.z, SPAWN.z);
  assert.equal(s.heading, SPAWN.heading);
  assert.equal(s.speed, 0);
  assert.equal(s.props.every(p => !p.hits && !p.tipped), true);
});

test('the delivery secret is reachable from spawn with the normal thumb controls', () => {
  const s = createDriveState();
  // Approach wide, line up with the ramp, then turn left behind the flagship.
  const stops = [
    { x: 6.2, z: -0.7, throttle: 0.62, tolerance: 1.6 },
    { x: RAMP.x, z: -8.5, throttle: 0.55, tolerance: 1.1 },
    { x: RAMP.x, z: RAMP.z + 1.9, throttle: 0.48, tolerance: 1.3 },
    { x: RAMP.x, z: -22, throttle: 0.43, tolerance: 1.2 },
    { ...LOADING_BAY, throttle: 0.35, tolerance: 1.4 },
  ];
  let targetIndex = 0;
  for (let frame = 0; frame < 15 / FIXED_STEP && !s.unlocked; frame++) {
    const target = stops[targetIndex];
    if (!target) {
      stepDrive(s, { brake: true });
      continue;
    }
    const dx = target.x - s.x, dz = target.z - s.z;
    const angle = Math.atan2(-dx, -dz) - s.heading;
    const steeringError = Math.atan2(Math.sin(angle), Math.cos(angle));
    stepDrive(s, { throttle: target.throttle, steer: Math.max(-1, Math.min(1, -2.2 * steeringError)) });
    if (Math.hypot(dx, dz) < target.tolerance) targetIndex++;
  }
  assert.equal(s.unlocked, true);
});
