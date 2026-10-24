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
    device: THREE.MathUtils.smoothstep(position, 2.55, 2.98) * (1 - THREE.MathUtils.smoothstep(position, 3.8, 4)),
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
  const local = new THREE.Vector3();
  const corners = Array.from({ length: 136 }, () => new THREE.Vector3());
  const aligned = corners.map(() => new THREE.Vector3());
  const frame = { position: new THREE.Vector3(), target: new THREE.Vector3(), offsetX: 0, offsetY: 0 };
  const verticalTangent = Math.tan(THREE.MathUtils.degToRad(42 / 2));

  return (pose, width, height) => {
    width = Math.max(1, width); height = Math.max(1, height);
    const mobile = width < 768;
    if (!mobile && !(width < 1100 && height > width)) {
      frame.position.fromArray(pose.camera); frame.target.fromArray(pose.target);
      frame.offsetX = 0; frame.offsetY = 0; return frame;
    }
    // Keep the authored object translations/rotations on every device. Only the
    // lens framing changes: dolly along the authored viewing ray, then lens-shift
    // into the free area. Do not replace the timeline with a fixed mobile pose.
    object.fromArray(pose.object);
    rotation.setFromEuler(euler.set(...pose.rotation));
    scale.setScalar(1.08);
    matrix.compose(object, rotation, scale);
    let count = 0;
    const box = (x, y, z, hx, hy, hz, turn = 0, shrink = 1) => {
      const cos = Math.cos(turn), sin = Math.sin(turn);
      for (let i = 0; i < 8; i++) {
        local.set(i & 1 ? hx : -hx, i & 2 ? hy : -hy, i & 4 ? hz : -hz);
        corners[count++].set(x + (local.x * cos + local.z * sin) * shrink,
          y + local.y * shrink, z + (-local.x * sin + local.z * cos) * shrink).applyMatrix4(matrix);
      }
    };
    const device = pose.device || 0, spread = pose.spread;
    for (let index = 0; index < 6; index++) {
      const side = index % 2 ? 1 : -1, row = Math.floor(index / 2);
      const radius = [1.04, 1.04, 0.9, 0.9, 0.73, 0.73][index];
      box(side * (0.85 + row * 0.34 + spread * (0.35 + row * 0.35)),
        (row - 1) * spread * 0.87, side * 0.2 * spread,
        0.2, radius + 0.12, radius, spread * side * 0.18, 1 - device * 0.7);
      // During a quick reverse scroll, spring-driven plates are still settling.
      // Include their actual positions as well as their new destinations.
      const part = pose.parts?.[index];
      if (part) box(part.position.x,part.position.y,part.position.z,
        0.2,radius+0.12,radius,part.rotation.y,part.scale.x);
    }
    // Shaft, cables/core, fasteners, screen and stand (including pointer tilt).
    box(0, 0, 0, 2.1 * (1 + spread * 0.4), 0.15, 0.15);
    box(0, -0.5 * (1 - device), 0, 1.95, 1.3, 0.85, spread * 0.42, 1 - device);
    box(0, 0, 0, 1.53 + spread * 0.8, 0.97, 0.97);
    box(0, 0, 0.4, 2.18, 1.57, 0.5, 0, device);
    box(0, -2.08 * device, 0.4, 1, 0.2, 0.6, 0, device);
    frame.target.fromArray(pose.target);
    direction.fromArray(pose.camera).sub(delta.fromArray(pose.target)).normalize();
    right.set(0, 1, 0).cross(direction).normalize();
    up.copy(direction).cross(right).normalize();
    const horizontalTangent = verticalTangent * width / height;
    const paneWidth = mobile ? 0.88 : 0.44;
    const paneHeight = Math.min(0.46, 340 / height);
    let nearest = 0;
    for (let index = 0; index < count; index++) {
      delta.copy(corners[index]).sub(frame.target);
      aligned[index].set(delta.dot(right), delta.dot(up), delta.dot(direction));
      nearest = Math.max(nearest, aligned[index].z + 0.2);
    }
    let minX, maxX, minY, maxY;
    const project = distance => {
      minX = minY = Infinity; maxX = maxY = -Infinity;
      for (let index = 0; index < count; index++) {
        const point = aligned[index], depth = distance - point.z;
        const x = point.x / (depth * horizontalTangent), y = point.y / (depth * verticalTangent);
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
      return maxX - minX <= paneWidth * 2 && maxY - minY <= paneHeight * 2;
    };
    let lower = Math.max(nearest, delta.fromArray(pose.camera).distanceTo(frame.target)), upper = lower;
    while (!project(upper) && upper < 120) upper *= 1.25;
    for (let iteration = 0; iteration < 16; iteration++) {
      const middle = (lower + upper) / 2;
      if (project(middle)) upper = middle; else lower = middle;
    }
    const distance = upper + 0.15;
    project(distance);
    frame.position.copy(frame.target).addScaledVector(direction, distance);
    const centerX = mobile ? 0.5 : 0.27;
    const centerY = mobile ? 0.53 : Math.min(0.48, 390 / height);
    frame.offsetX = width * (0.5 - centerX + (minX + maxX) / 4);
    frame.offsetY = height * (0.5 - centerY - (minY + maxY) / 4);
    return frame;
  };
}
