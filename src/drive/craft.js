import {
  BoxGeometry, CanvasTexture, Color, CylinderGeometry, DoubleSide, DodecahedronGeometry,
  Group, InstancedMesh, Mesh, MeshBasicMaterial, MeshLambertMaterial, Object3D,
  PlaneGeometry, SRGBColorSpace,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function seeded(seed) {
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}

export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

// All fixed scenery sharing a primitive is drawn in one call. Paint and shadows
// still vary per object, and interactive assemblies can be detached as a group.
export function craft(parent) {
  const group = new Group();
  parent.add(group);
  const primitives = {
    block: new BoxGeometry(1, 1, 1),
    soft: new RoundedBoxGeometry(1, 1, 1, 1, .054),
    post: new CylinderGeometry(.5, .5, 1, 12),
    crown: new DodecahedronGeometry(.5, 0),
  };
  const mat = new MeshLambertMaterial({ color: 0xffffff, flatShading: true });
  const items = new Map();
  const dummy = new Object3D();
  function part(kind, color, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(w,h,d);
    dummy.updateMatrix();
    if (!items.has(kind)) items.set(kind, []);
    items.get(kind).push([dummy.matrix.clone(), color]);
  }
  function finish() {
    const color = new Color();
    for (const [kind, entries] of items) {
      const mesh = new InstancedMesh(primitives[kind], mat, entries.length);
      entries.forEach(([matrix, paint], i) => {
        mesh.setMatrixAt(i, matrix);
        mesh.setColorAt(i, color.set(paint));
      });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    items.clear();
  }
  return { group, part, finish };
}

export function plane(parent, texture, x, y, z, width, height, yaw = 0) {
  const material = new MeshBasicMaterial({ map: texture, toneMapped: false, side: DoubleSide });
  const mesh = new Mesh(new PlaneGeometry(width,height),material);
  mesh.position.set(x,y,z);
  mesh.rotation.y = yaw;
  parent.add(mesh);
  return mesh;
}

export function sign(parent, text, x, y, z, width, height, options = {}) {
  const { paper='#174d41', ink='#fff1cf', serif=false, bold=true, yaw=0 } = options;
  const cw = Math.min(1024, Math.max(128, Math.round(width*100)));
  const ch = Math.max(48, Math.round(cw*height/width));
  const texture = canvasTexture(cw,ch,(ctx,w,h) => {
    ctx.fillStyle = paper;
    ctx.fillRect(0,0,w,h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = ink;
    const family = serif ? 'Georgia, serif' : 'Arial, Helvetica, sans-serif';
    let size = h * .77;
    ctx.font = (bold ? '700 ' : 'normal ') + size + 'px ' + family;
    size *= Math.min(1, (w * .92) / Math.max(1,ctx.measureText(text).width));
    ctx.font = (bold ? '700 ' : 'normal ') + size + 'px ' + family;
    ctx.fillText(text,w/2,h*.53);
  });
  return plane(parent,texture,x,y,z,width,height,yaw);
}

export function release(group) {
  const geometries = new Set(), materials = new Set(), textures = new Set();
  group.traverse(mesh => {
    if (mesh.geometry) geometries.add(mesh.geometry);
    for (const material of [].concat(mesh.material || [])) {
      materials.add(material);
      if (material.map) textures.add(material.map);
    }
    if (mesh.isInstancedMesh) mesh.dispose();
  });
  textures.forEach(t => t.dispose());
  materials.forEach(m => m.dispose());
  geometries.forEach(g => g.dispose());
  group.removeFromParent();
}
