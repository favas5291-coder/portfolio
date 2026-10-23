import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { cameraTimeline } from '../src/data/portfolio.js';
import { createCameraFraming, sampleCameraPose } from '../src/scene/framing.js';

function sculpturePoints(pose, mobile, stage) {
  const points = [];
  const transform = new THREE.Matrix4().compose(
    new THREE.Vector3(mobile ? 0 : pose.object[0], mobile ? -0.25 : pose.object[1], 0),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...pose.rotation)),
    new THREE.Vector3().setScalar(mobile ? 1.12 : 1.08),
  );
  const addBox = (center, halfSize, rotation = new THREE.Euler()) => {
    const local = new THREE.Matrix4().compose(center,
      new THREE.Quaternion().setFromEuler(rotation), new THREE.Vector3(1, 1, 1));
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      points.push(new THREE.Vector3(x * halfSize.x, y * halfSize.y, z * halfSize.z)
        .applyMatrix4(local).applyMatrix4(transform));
    }
  };
  for (let index = 0; index < 6; index++) {
    const side = index % 2 ? 1 : -1;
    const row = Math.floor(index / 2);
    const radius = [1.04, 1.04, 0.9, 0.9, 0.73, 0.73][index];
    addBox(new THREE.Vector3(side * (0.85 + row * 0.34 + pose.spread * (0.35 + row * 0.35)),
      (row - 1) * pose.spread * 0.87, (index % 2 ? 0.2 : -0.2) * pose.spread),
    new THREE.Vector3(0.2, radius, radius), new THREE.Euler(0, pose.spread * side * 0.18, 0));
  }
  addBox(new THREE.Vector3(), new THREE.Vector3(0.6, 0.6, 0.6));
  addBox(new THREE.Vector3(0, -0.6, 0), new THREE.Vector3(1.85, 1.1, 0.7));
  if (stage >= 2.55 && stage <= 4) {
    addBox(new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(2, 1.42, 0.1));
    addBox(new THREE.Vector3(0, -2.08, 0.4), new THREE.Vector3(0.9, 0.05, 0.45));
  }
  return points;
}

for (const [width, height] of [[320, 780], [390, 844], [430, 932], [740, 390], [768, 1024], [820, 1180], [1024, 1366]]) {
  test(`settled sculpture remains in view throughout the timeline at ${width} × ${height}`, () => {
    const fit = createCameraFraming();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 150);
    for (let step = 0; step <= 80; step++) {
      const stage = step / 20;
      const pose = sampleCameraPose(stage);
      const frame = fit(pose, width, height);
      camera.position.copy(frame.position);
      camera.lookAt(frame.target);
      camera.setViewOffset(width, height, frame.offsetX, frame.offsetY, width, height);
      camera.updateMatrixWorld();
      for (const point of sculpturePoints(pose, width < 768, stage)) {
        const projected = point.project(camera);
        assert.ok(Math.abs(projected.x) < 0.96 && Math.abs(projected.y) < 0.96,
          `cropped at stage ${stage}: ${projected.x}, ${projected.y}`);
        assert.ok(projected.z > -1 && projected.z < 1, `outside clipping planes at stage ${stage}`);
      }
    }
  });
}

test('camera direction and pose meet continuously at each authored chapter', () => {
  const fit = createCameraFraming();
  for (let chapter = 1; chapter < cameraTimeline.length - 1; chapter++) {
    const before = fit(sampleCameraPose(chapter - 0.0001), 390, 844).position.clone();
    const after = fit(sampleCameraPose(chapter + 0.0001), 390, 844).position.clone();
    assert.ok(before.distanceTo(after) < 0.001, `camera jumps at chapter ${chapter}`);
    assert.deepEqual(sampleCameraPose(chapter).rotation, cameraTimeline[chapter].rotation);
  }
});

for (const [width,height] of [[844,390],[1024,768],[1348,900],[1920,1080]]) {
  test(`desktop camera preserves the authored path at ${width} x ${height}`,()=>{
    const frame=createCameraFraming();
    for(let step=0;step<=80;step++) {
      const pose=sampleCameraPose(step/20), result=frame(pose,width,height);
      assert.deepEqual(result.position.toArray(),pose.camera);
      assert.deepEqual(result.target.toArray(),pose.target);
      assert.equal(result.offsetX,0);assert.equal(result.offsetY,0);
    }
  });
}
