import { officeMaterials } from './officeMaterials.js';
import { officeGeometry } from './officeGeometry.js';
import { officePlants } from './officePlants.js';
import { officeFurniture } from './officeFurniture.js';
import { makeEnvelope } from './officeShell.js';
import { furnishRooms } from './officeRooms.js';
import { buildLandscape } from './officeLandscape.js';

// Dimensions and camera positions use metres. The centre gallery stays clear
// from the public threshold all the way to the visitor's side of Favas's desk.
export function buildOffice(T, scene, { mobile = false, loadingManager } = {}) {
  const root = new T.Group();
  root.name = 'Fazhere Studio';
  scene.add(root);
  scene.background = new T.Color('#d7e1d6');
  const materials = officeMaterials(T, loadingManager);
  const geometry = officeGeometry(T, materials);
  const plants = officePlants(T, materials, geometry);
  const furniture = officeFurniture(T, materials, geometry, loadingManager);
  const { fixedGroups, doorLeaves } = makeEnvelope(T, root, materials, geometry, plants);
  const rooms = furnishRooms(T, root, materials, geometry, furniture, plants);
  root.add(new T.HemisphereLight('#edf2f2', '#d9cbb4', 1.72));
  const sun = new T.DirectionalLight('#fff0d6', 3.10);
  sun.position.set(-20, 9.15, 1.3);
  sun.target.position.set(0, 0, -13);
  root.add(sun, sun.target);
  sun.castShadow = true;
  const shadowSize = mobile ? 1024 : 2048;
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -21, right: 21, top: 12, bottom: -12, near: 1, far: 58 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.019;
  const bounce = new T.DirectionalLight('#dae9ec', 0.46);
  bounce.position.set(6, 4, -7);
  root.add(bounce);
  const batches = [...fixedGroups, ...rooms.rooms].flatMap((group) => geometry.batch(group));
  // Static daylight occlusion is rendered once. Glass, movement, and labels
  // remain independent of the baked shadow pass.
  for (const part of batches) {
    if (!part.material.isMeshStandardMaterial) continue;
    part.castShadow = true;
    part.receiveShadow = true;
  }
  const landscape = buildLandscape(T, root, loadingManager);
  materials.glass.uniforms.panorama.value = landscape.horizonMap;
  const selected = document.querySelector('.studio-colours button[aria-pressed="true"]');
  if (selected) rooms.colour(selected.textContent.trim());
  function selectProduct(event) {
    rooms.colour(event.detail?.colour);
  }
  window.addEventListener('studio:product-colour', selectProduct);
  return {
    update({ progress, room, time }) {
      const open = T.MathUtils.smoothstep(progress, 0, 0.43);
      for (const { door, sign } of doorLeaves) door.position.x = sign * (0.621 + 1.24 * open);
      rooms.update(progress, Number.isInteger(room) ? room : Math.round(progress), time);
    },
    dispose() {
      window.removeEventListener('studio:product-colour', selectProduct);
      landscape?.dispose();
      sun.shadow.dispose();
      scene.remove(root);
      // Instanced draw buffers need explicit release on renderer re-creation.
      const rendered = new Set(batches);
      root.traverse((item) => {
        if (item.isInstancedMesh) rendered.add(item);
      });
      rendered.forEach((item) => {
        if (item.isInstancedMesh) item.dispose();
      });
      geometry.dispose();
      materials.dispose();
    },
  };
}
