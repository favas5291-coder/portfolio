import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Decode the shipping mesh buffers, transforms and hierarchy with the same
// loader as the browser. Replace only texture-dependent shading in Node.
export async function readGeometry(raw) {
  const end = 20 + raw.readUInt32LE(12);
  const json = JSON.parse(raw.subarray(20, end).toString());
  const opaque = json.materials.map((material) => ({
    name: material.name,
    doubleSided: true,
    alphaMode: material.alphaMode,
  }));
  json.materials = opaque;
  delete json.textures;
  delete json.images;
  for (const key of ['extensionsUsed', 'extensionsRequired']) {
    if (json[key])
      json[key] = json[key].filter(
        (extension) => !['KHR_texture_transform', 'KHR_texture_basisu'].includes(extension),
      );
  }
  const text = Buffer.from(JSON.stringify(json));
  const padded = Math.ceil(text.length / 4) * 4;
  const file = Buffer.alloc(20 + padded + raw.length - end, 0x20);
  raw.copy(file, 0, 0, 20);
  file.writeUInt32LE(file.length, 8);
  file.writeUInt32LE(padded, 12);
  text.copy(file, 20);
  raw.copy(file, 20 + padded, end);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const { scene } = await loader.parseAsync(
    file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
    '',
  );
  scene.updateMatrixWorld(true);
  return scene;
}
