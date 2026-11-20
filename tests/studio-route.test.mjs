import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { cameraPose, positionCamera } from '../src/studio/cameraPath.js';
import { reviewPerformance, visitorSeat } from '../src/studio/sceneBlocking.js';

test('the walk clears both thresholds and ends in the visitor chair', () => {
  const route = Array.from({ length: 501 }, (_, i) => cameraPose(i / 100));
  for (const threshold of [0, -22]) {
    const entering = route.findIndex(({ eye }) => eye[2] <= threshold);
    assert.ok(entering > 0, 'the visitor approaches from outside the doorway');
    const [x, height] = route[entering].eye;
    assert.ok(Math.abs(x) < 0.8, 'room for both shoulders inside the opening');
    assert.ok(height > 1.45 && height < 1.8, 'visitor crosses the door standing');
  }
  const [x, height, z] = route.at(-1).eye;
  assert.ok(Math.hypot(x - visitorSeat.x, z - visitorSeat.z) < 0.12);
  assert.ok(height >= 1.1 && height <= 1.35);
  assert.deepEqual(cameraPose(6), route.at(-1), 'more scrolling leaves the seated camera at rest');
});

test('reversing the scroll retraces a continuous level-horizon route', () => {
  const forward = Array.from({ length: 501 }, (_, i) => cameraPose(i / 100));
  const camera = new PerspectiveCamera();
  const right = new Vector3();
  for (let i = 500; i > 0; i--) {
    const pose = cameraPose(i / 100);
    assert.deepEqual(pose, forward[i]);
    const distance = Math.hypot(...pose.eye.map((v, axis) => v - forward[i - 1].eye[axis]));
    assert.ok(distance < 0.2, 'camera has no discontinuity between marks');
    assert.ok(pose.aim[2] < pose.eye[2], 'the next view is in front of the visitor');
    positionCamera(camera, i / 100);
    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    assert.ok(Math.abs(right.y) < 1e-6, 'the camera has no roll');
  }
});

test('the manager follows the client’s point before turning the display', () => {
  const cue = reviewPerformance();
  const arriving = cue(4, 0);
  assert.ok(arriving.point > 0);
  assert.equal(arriving.turn, 0);
  const following = cue(4, 1.75);
  assert.ok(following.follow > 0 && following.reach > 0);
  assert.equal(following.turn, 0);
  const holding = cue(4, 8);
  assert.equal(holding.turn, 1);
  assert.equal(holding.reach, 0);
  cue(2, 10);
  assert.deepEqual(cue(4, 15), arriving, 'returning to the table replays the exchange');
});
