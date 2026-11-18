// World-space metres. North is -z; the public-facing shopfronts look south.
export const SPAWN = { x: 0, z: 7, heading: 0 };
export const DRIVE_BOUNDS = { minX: -26, maxX: 26, minZ: -27, maxZ: 20 };
export const BUILDINGS = [
  { id: 'gymdrobe', x: 0, z: -14.75, width: 12, depth: 9 },
  { id: 'luxvibe', x: -16, z: -14.1, width: 6.2, depth: 5.8 },
  { id: 'fabea', x: 16, z: -14.1, width: 6.8, depth: 5.8 },
  { id: 'workshop', x: -17, z: 2.7, width: 7.4, depth: 5.2 },
  { id: 'office', x: 16.4, z: 3.2, width: 6.4, depth: 5.2 },
  { id: 'tea', x: -8.8, z: -1.1, width: 3.7, depth: 3.1 },
];
export const STOPS = [
  { id: 'gymdrobe', x: 0, z: -6.5, radius: 3.15 },
  { id: 'luxvibe', x: -16, z: -7.8, radius: 3.0 },
  { id: 'fabea', x: 16, z: -7.8, radius: 3.0 },
  { id: 'workshop', x: -17, z: 8.5, radius: 3.0 },
  { id: 'office', x: 16.4, z: 8.9, radius: 3.0 },
];
export const KERBS = BUILDINGS.map(({ x, z, width, depth }) => ({
  x, z: z + 0.45, width: width + 1, depth: depth + 1.9, height: 0.14,
}));
export const RAMP = { x: 8.8, z: -18.1, width: 3.1, depth: 3.9, height: 0.93 };
export const LOADING_BAY = { x: 0, z: -22.4, radius: 3.0 };
