import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';
import { readGeometry } from '../scripts/gate1/read-geometry.mjs';
import { positionCamera, doorPose } from '../src/appointment/visit.js';
import { focalTargets, sceneScale, studioAssets } from '../src/appointment/scene.config.ts';

async function geometryOnly(url) {
  const file = await readFile(new URL('../public' + url, import.meta.url));
  const scene = await readGeometry(file);
  scene.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry.boundsTree = new MeshBVH(node.geometry);
    node.raycast = acceleratedRaycast;
  });
  return scene;
}

const toThree = ([east, north, up]) => new THREE.Vector3(east, up, -north);
const car = await geometryOnly(studioAssets.car);
const shell = await geometryOnly(studioAssets.shell);
const tree = await geometryOnly(studioAssets.tree);
const hinge = car.getObjectByName(sceneScale.passengerHinge);
const door = shell.getObjectByName(sceneScale.entranceHinge);
assert.ok(hinge && door, 'Both exported hinge nodes must survive mesh compression');
const rest = [hinge.rotation.y, door.rotation.y];

function applyPose(camera, p, compact) {
  positionCamera(camera, p, compact);
  const pose = doorPose(p);
  hinge.rotation.y = rest[0] + pose.passenger;
  door.rotation.y = rest[1] + pose.entrance;
  car.updateMatrixWorld(true);
  shell.updateMatrixWorld(true);
  return [camera.matrixWorld.toArray(), camera.fov, hinge.matrixWorld.toArray(), door.matrixWorld.toArray()];
}

const solids = (root) => {
  const result = [];
  root.traverse((node) => {
    if (node.isMesh && !node.material.transparent) result.push(node);
  });
  return result;
};
const enclosed = [...solids(car), ...solids(shell)];
const exitSurfaces = [];
for (const model of [car, shell]) {
  model.traverse((node) => {
    if (node.isMesh) exitSurfaces.push(node);
  });
}
const ray = new THREE.Raycaster();
ray.firstHitOnly = true;

for (const [layout, compact, aspect] of [
  ['phone', true, 390 / 386],
  ['desktop', false, 960 / 750],
]) {
  test(`authored doors, car and threshold clear the ${layout} camera near plane in both directions`, () => {
    const camera = new THREE.PerspectiveCamera(65, aspect, 0.025, 140);
    const samples = Array.from({ length: 126 }, (_, i) => i * 0.004);
    const forward = samples.map((p) => {
      const pose = applyPose(camera, p, compact);
      // A 5×5 ray grid covers the centre, edges and corners of the frustum.
      // Each ray stops just beyond its near-plane intersection.
      for (const x of [-1, -0.5, 0, 0.5, 1])
        for (const y of [-1, -0.5, 0, 0.5, 1]) {
          ray.setFromCamera({ x, y }, camera);
          ray.near = 0;
          const corner = new THREE.Vector3(x, y, -1).unproject(camera);
          ray.far = camera.position.distanceTo(corner) + 0.012;
          const hit = ray.intersectObjects(exitSurfaces, false)[0];
          assert.ok(!hit, `p=${p} at (${x}, ${y}) clips ${hit?.object.name}`);
        }
      return pose;
    });
    for (let i = samples.length - 1; i >= 0; i--) {
      assert.deepEqual(
        applyPose(camera, samples[i], compact),
        forward[i],
        `Reverse differs at ${samples[i]}`,
      );
    }
    assert.ok(Math.abs(doorPose(0.12).passenger) > 1.1);
    assert.ok(doorPose(0.39).entrance > 1.4);
    assert.deepEqual(doorPose(0.99), { passenger: -0, entrance: 0 });
    assert.deepEqual(
      applyPose(camera, 0.984, compact),
      applyPose(camera, 1, compact),
      'Office must be motionless',
    );
  });
}

test('authored bookend apertures give a clear ray to both wheel hubs and the lit upstairs bay', () => {
  const camera = new THREE.PerspectiveCamera(65, 390 / 386, 0.025, 140);
  const shoot = (p, target, exclude) => {
    applyPose(camera, p, true);
    const point = toThree(target);
    ray.set(camera.position, point.clone().sub(camera.position).normalize());
    ray.near = 0.025;
    ray.far = camera.position.distanceTo(point) - 0.05;
    const hits = ray.intersectObjects(
      [...enclosed, ...solids(tree)].filter((mesh) => !exclude(mesh)),
      false,
    );
    assert.deepEqual(
      hits.map((hit) => hit.object.name),
      [],
      `Unexpected obstruction on ray to ${target}`,
    );
    const screen = point.project(camera);
    assert.ok(Math.abs(screen.x) < 0.99 && Math.abs(screen.y) < 0.99, 'Anchor cropped in portrait');
  };
  // Wheel hub positions lie a few centimetres inside the actual rim and tyre.
  const carMeshes = new Set(solids(car));
  shoot(1, focalTargets.westWheel, (mesh) => carMeshes.has(mesh));
  shoot(1, focalTargets.eastWheel, (mesh) => carMeshes.has(mesh));
  shoot(0, focalTargets.officeLight, () => false);
});
