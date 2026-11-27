import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { buildCar } from '../src/appointment/car.js';
import { positionCamera } from '../src/appointment/visit.js';

// Includes the seated hold, the door swing, movement across the sill and closure.
const exitSamples = Array.from({ length: 57 }, (_, index) => index / 250);

for (const [layout, aspect, compact] of [
  ['phone', 390 / 338, true],
  ['desktop', 885 / 822, false],
]) {
  test(`passenger exit clears the actual car and reverses in the ${layout} camera`, (t) => {
    const scene = new THREE.Scene();
    const car = buildCar(THREE, scene);
    t.after(() => car.dispose());
    const door = scene.getObjectByName('Front passenger door');
    const camera = new THREE.PerspectiveCamera(61, aspect, 0.035, 100);
    const ray = new THREE.Raycaster();
    const aim = new THREE.Vector2();
    const poseAt = (progress) => {
      positionCamera(camera, progress, compact);
      camera.updateMatrixWorld();
      car.update(progress);
      scene.updateMatrixWorld();
      return [camera.matrixWorld.toArray(), camera.fov, door.matrixWorld.toArray()];
    };

    const solid = [];
    scene.traverse((item) => {
      if (item.isMesh && !item.material.transparent) solid.push(item);
    });
    const forward = exitSamples.map((progress) => {
      const pose = poseAt(progress);
      ray.setFromCamera(aim.set(0, 0), camera);
      const centered = ray.intersectObjects(solid, false);
      assert.equal(centered.length, 0, `Car blocks the central sightline at ${progress}`);

      // View-space depth catches geometry slicing the near plane at the
      // edges as well as anything that would fill the center of the view.
      for (const x of [-0.95, 0, 0.95]) {
        for (const y of [-0.95, 0, 0.95]) {
          ray.setFromCamera(aim.set(x, y), camera);
          const [hit] = ray.intersectObjects(solid, false);
          if (hit) {
            const depth = -hit.point.applyMatrix4(camera.matrixWorldInverse).z;
            assert.ok(depth > camera.near, `Car clips the view at ${progress} (${x}, ${y})`);
          }
        }
      }
      return pose;
    });

    poseAt(0);
    const closed = door.rotation.y;
    poseAt(0.1);
    assert.ok(Math.abs(door.rotation.y - closed) > 1, 'Passenger door opens wide enough to exit');
    poseAt(exitSamples.at(-1));
    assert.equal(door.rotation.y, closed, 'Door is closed after the visitor steps away');

    for (let i = exitSamples.length - 1; i >= 0; i--) {
      assert.deepEqual(poseAt(exitSamples[i]), forward[i], `Reverse diverges at ${exitSamples[i]}`);
    }
  });
}
