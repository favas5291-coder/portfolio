// Architectural dimensions are metres in (east, north, up). Blender uses the
// same convention. Only the camera adapter converts them to Three's Y-up axes.
const chapterDefinitions = [
  ['arrival', 'Passenger seat', 0],
  ['pavement', 'Outside the studio', 0.2],
  ['reception', 'Entrance threshold', 0.4],
  ['studio', 'Working studio', 0.6],
  ['landing', 'Courtyard landing', 0.8],
  ['office', 'Founder’s office', 1],
] as const;

export const chapters = chapterDefinitions.map(([id, label, progress], index) => ({
  id,
  label,
  progress,
  range: [
    index === 0 ? 0 : (chapterDefinitions[index - 1][2] + progress) / 2,
    index === chapterDefinitions.length - 1 ? 1 : (chapterDefinitions[index + 1][2] + progress) / 2,
  ],
  wide: `/appointment/${id}-wide.webp`,
  compact: `/appointment/${id}-compact.webp`,
}));

export const studioAssets = {
  shell: '/appointment/models/shell.glb',
  car: '/appointment/models/car.glb',
  tree: '/appointment/models/tree.glb',
  sky: '/appointment/environment/after-rain.hdr',
  basis: '/appointment/basis/',
};

export const sceneScale = {
  entranceHinge: 'EntranceHinge',
  passengerHinge: 'PassengerHinge',
  officeMonitor: 'OfficeScreen',
  passengerOpen: 68,
  entranceOpen: 85,
  sunAzimuth: 248,
  sunElevation: 16,
  glass: { west: 5.42, east: 7.86, sill: 3.66, head: 5.57, north: 0 },
  canopy: { west: 2.8, east: 5.0, north: 0, south: -1.8, soffit: 2.9 },
  car: { hinge: [7.83, -5.81], roof: 1.51, kerb: -5.5, wheelXs: [5.03, 7.75], wheelNorth: -5.79 },
  composition: { wide: [960, 750], compact: [390, 386] },
};

// Progress, eye, yaw clockwise from north, pitch above level, vertical lens in
// degrees [wide, portrait]. Repeated poses are motionless reading holds.
export const cameraStops = [
  [0, [7.02, -6.23, 1.13], 4, 5, [69, 72]],
  [0.016, [7.02, -6.23, 1.13], 4, 5, [69, 72]],
  [0.058, [7, -6.15, 1.1], -14, 3, [69, 72]],
  [0.082, [6.9, -5.92, 1.1], -17, 0, [67, 72]],
  [0.107, [6.82, -5.5, 1.12], -19, 0, [66, 70]],
  [0.135, [6.78, -5.13, 1.28], -20, 2, [66, 70]],
  [0.171, [6.66, -4.9, 1.74], -7, 10, [68, 72]],
  [0.216, [6.66, -4.9, 1.74], -7, 10, [68, 72]],
  [0.268, [5.27, -3.42, 1.74], -18, 3, [63, 67]],
  [0.31, [4.44, -2.05, 1.74], -8, -2, [62, 65]],
  [0.345, [4.12, -1.19, 1.74], -2, -2, [61, 64]],
  [0.4, [4.09, 0.48, 1.74], -4, -1, [61, 64]],
  [0.42, [4.09, 0.48, 1.74], -4, -1, [61, 64]],
  [0.507, [4.12, 3.8, 1.74], -9, -1, [62, 66]],
  [0.57, [4.04, 5.78, 1.74], -51, -1, [62, 66]],
  [0.6, [3.85, 6.65, 1.74], -89, 0, [62, 66]],
  [0.63, [3.85, 6.65, 1.74], -89, 0, [62, 66]],
  [0.666, [1.7, 6.86, 1.74], -140, 3, [62, 66]],
  [0.685, [1.7, 6.86, 1.74], -180, 15, [62, 66]],
  [0.763, [1.7, 4.68, 3.37], -178, 0, [64, 66]],
  [0.79, [1.7, 4.25, 3.37], -145, 0, [64, 66]],
  [0.8, [1.7, 4.25, 3.37], -145, 0, [64, 66]],
  [0.813, [2.89, 4.25, 3.37], -248, 1, [64, 66]],
  [0.824, [2.89, 4.68, 3.37], -360, 14, [64, 66]],
  [0.855, [2.89, 6.82, 5], -332, 2, [62, 66]],
  [0.867, [3.58, 6.65, 5], -281, 0, [62, 66]],
  [0.895, [9.42, 6.63, 5], -238, 0, [62, 66]],
  [0.919, [9.42, 3.76, 5], -171, -4, [62, 66]],
  [0.95, [7.29, 2.11, 4.94], -159, -13, [60, 64]],
  [0.984, [6.55, 1.3, 4.6], -191, -16, [57, 62]],
  [1, [6.55, 1.3, 4.6], -191, -16, [57, 62]],
] as const;

// Positions shared by the architectural check and the camera composition.
export const focalTargets = {
  entry: [4.03, 0, 1.56],
  officeLight: [6.64, 0, 4.65],
  mirror: [7.58, -5.47, 1.05],
  westWheel: [5.03, -5.79, 0.32],
  eastWheel: [7.75, -5.79, 0.32],
};

export const doorStops = {
  passenger: [
    [0, 0],
    [0.016, 0],
    [0.058, 51],
    [0.082, 63],
    [0.107, 68],
    [0.218, 68],
    [0.274, 0],
    [1, 0],
  ],
  entrance: [
    [0, 0],
    [0.298, 0],
    [0.335, 63],
    [0.358, 85],
    [0.473, 85],
    [0.49, 42],
    [0.515, 7],
    [0.532, 0],
    [1, 0],
  ],
};
