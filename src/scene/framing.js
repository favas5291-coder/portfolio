import * as THREE from 'three';
import { cameraTimeline } from '../data/portfolio.js';

// Preserve the authored camera directions, then fit the sculpture into the
// empty part of the layout. A fixed z distance crops exploded parts on phones.
export function sampleCameraPose(progress) {
  const position = THREE.MathUtils.clamp(progress, 0, cameraTimeline.length - 1);
  const index = Math.min(cameraTimeline.length - 2, Math.floor(position));
  const t = THREE.MathUtils.smoothstep(position - index, 0, 1);
  const a = cameraTimeline[index];
  const b = cameraTimeline[index + 1];
  const blend = key => a[key].map((value, axis) => THREE.MathUtils.lerp(value, b[key][axis], t));
  return {
    camera: blend('camera'), target: blend('target'), object: blend('object'),
    rotation: blend('rotation'), spread: THREE.MathUtils.lerp(a.spread, b.spread, t),
  };
}

export function createCameraFraming() {
  const rotation = new THREE.Quaternion();
  const matrix = new THREE.Matrix4();
  const direction = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const delta = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const object = new THREE.Vector3();
  const euler = new THREE.Euler();
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const frame = { position: new THREE.Vector3(), target: new THREE.Vector3(), offsetX: 0, offsetY: 0 };
  const verticalTangent = Math.tan(THREE.MathUtils.degToRad(42 / 2));

  return (pose, width, height) => {
    width = Math.max(1, width); height = Math.max(1, height);
    const mobile = width < 768;
    if (!mobile && !(width < 1100 && height > width)) {
      frame.position.fromArray(pose.camera); frame.target.fromArray(pose.target);
      frame.offsetX = 0; frame.offsetY = 0; return frame;
    }
    object.set(mobile ? 0 : pose.object[0], mobile ? -0.25 : pose.object[1], 0);
    rotation.setFromEuler(euler.set(...pose.rotation));
    scale.setScalar(mobile ? 1.12 : 1.08);
    matrix.compose(object, rotation, scale);
    // Conservative bounds include the plates, cables, fasteners and device stand.
    const halfWidth = 2.2 + pose.spread * 1.1;
    const halfHeight = 2.2 + pose.spread * 0.87;
    for (let index = 0; index < 8; index++) {
      corners[index].set(index & 1 ? halfWidth : -halfWidth,
        index & 2 ? halfHeight : -halfHeight, index & 4 ? 1.45 : -1.45).applyMatrix4(matrix);
    }
    frame.target.copy(object);
    direction.fromArray(pose.camera).sub(delta.fromArray(pose.target)).normalize();
    right.set(0, 1, 0).cross(direction).normalize();
    up.copy(direction).cross(right).normalize();
    const horizontalTangent = verticalTangent * width / height;
    const paneWidth = mobile ? 0.88 : 0.44;
    const paneHeight = Math.min(0.5, 320 / height);
    let distance = 0;
    for (const corner of corners) {
      delta.copy(corner).sub(frame.target);
      const depth = delta.dot(direction);
      distance = Math.max(distance,
        depth + Math.abs(delta.dot(right)) / (horizontalTangent * paneWidth),
        depth + Math.abs(delta.dot(up)) / (verticalTangent * paneHeight));
    }
    frame.position.copy(frame.target).addScaledVector(direction, distance + 0.2);
    const centerX = mobile ? 0.5 : 0.27;
    const centerY = Math.min(0.48, 340 / height);
    frame.offsetX = width * (0.5 - centerX);
    frame.offsetY = height * (0.5 - centerY);
    return frame;
  };
}
