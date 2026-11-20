// One continuous UV layout across the forecourt, threshold and gallery. The
// diffuse image carries slab joints and stone variation; the sun casts the fins.
export function floorFinish(m) {
  return m.surface({ map: m.imageMap('/studio/finishes/gallery-stone.webp'), roughness: 0.69 });
}
