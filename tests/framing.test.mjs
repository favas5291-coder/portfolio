import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import { cameraTimeline } from '../src/data/portfolio.js';
import { createCameraFraming, sampleCameraPose } from '../src/scene/framing.js';

function sculpturePoints(pose, mobile, stage) {
  const points = [];
  const transform = new THREE.Matrix4().compose(
    new THREE.Vector3(...pose.object),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...pose.rotation)),
    new THREE.Vector3().setScalar(1.08),
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
    new THREE.Vector3(0.2, radius, radius).multiplyScalar(1-pose.device*0.7), new THREE.Euler(0, pose.spread * side * 0.18, 0));
  }
  addBox(new THREE.Vector3(), new THREE.Vector3(0.6, 0.6, 0.6).multiplyScalar(1-pose.device), new THREE.Euler(0,pose.spread*0.42,0));
  addBox(new THREE.Vector3(0, -0.6*(1-pose.device), 0), new THREE.Vector3(1.85, 1.1, 0.7).multiplyScalar(1-pose.device), new THREE.Euler(0,pose.spread*0.42,0));
  if (stage >= 2.55 && stage <= 4) {
    addBox(new THREE.Vector3(0, 0, 0.4), new THREE.Vector3(2, 1.42, 0.1).multiplyScalar(pose.device));
    addBox(new THREE.Vector3(0, -2.08*pose.device, 0.4), new THREE.Vector3(0.9, 0.05, 0.45).multiplyScalar(pose.device));
  }
  return points;
}

for (const [width, height] of [[320, 780], [375, 812], [390, 844], [430, 932], [740, 390], [768, 1024], [820, 1180], [1024, 1366]]) {
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

test('responsive camera keeps the laptop viewing direction and fills the scene area',()=>{
  const fit=createCameraFraming();
  for(const [width,height] of [[320,780],[390,844],[430,932],[820,1180]])for(const stage of [0,0.5,1,1.5,2,2.5,3,3.5,4]) {
    const pose=sampleCameraPose(stage),frame=fit(pose,width,height);
    const authored=new THREE.Vector3(...pose.camera).sub(new THREE.Vector3(...pose.target)).normalize();
    const actual=frame.position.clone().sub(frame.target).normalize();
    assert.ok(actual.distanceTo(authored)<1e-10);
    assert.deepEqual(frame.target.toArray(),pose.target);
    const camera=new THREE.PerspectiveCamera(42,width/height,0.1,150);
    camera.position.copy(frame.position);camera.lookAt(frame.target);
    camera.setViewOffset(width,height,frame.offsetX,frame.offsetY,width,height);camera.updateMatrixWorld();
    const points=sculpturePoints(pose,width<768,stage).map(p=>p.project(camera));
    const spanX=Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x));
    const spanY=Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y));
    assert.ok(spanX>0.6||spanY>0.45,`sculpture too small at ${width}, stage ${stage}`);
  }
});

test('fast reverse scrolling keeps still-settling plates inside the phone viewport',()=>{
  const pose=sampleCameraPose(0),lagged={...pose,spread:1.35};
  const parts=Array.from({length:6},(_,index)=>{
    const part=new THREE.Object3D(),side=index%2?1:-1,row=Math.floor(index/2);
    part.position.set(side*(0.85+row*0.34+lagged.spread*(0.35+row*0.35)),(row-1)*lagged.spread*0.87,side*0.2*lagged.spread);
    part.rotation.y=lagged.spread*side*0.18;return part;
  });
  const frame=createCameraFraming()({...pose,parts},390,844);
  const camera=new THREE.PerspectiveCamera(42,390/844,0.1,150);
  camera.position.copy(frame.position);camera.lookAt(frame.target);
  camera.setViewOffset(390,844,frame.offsetX,frame.offsetY,390,844);camera.updateMatrixWorld();
  for(const point of sculpturePoints(lagged,true,0).slice(0,48)) {
    const projected=point.project(camera);
    assert.ok(Math.abs(projected.x)<0.96&&Math.abs(projected.y)<0.96);
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
