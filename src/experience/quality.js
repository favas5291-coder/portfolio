export const QUALITY = [
  { name: 'low', dpr: 0.75, segments: 16, cableSegments: 16, textureSize: 512, shadowSize: 0, effects: false },
  { name: 'medium', dpr: 1, segments: 32, cableSegments: 28, textureSize: 1024, shadowSize: 512, effects: false },
  { name: 'high', dpr: 1.5, segments: 48, cableSegments: 40, textureSize: 2048, shadowSize: 1024, effects: true },
];
export function initialQuality({ width, coarse = false, saveData = false, memory, cores }) {
  return width < 900 || coarse || saveData || (memory && memory <= 4) || (cores && cores <= 4) ? 0 : 2;
}
// Only consecutive frames are sampled. Idle demand frames and suspended tabs
// are not poor GPU performance. Hysteresis and a cooldown prevent churn.
export function createQualityMonitor(initial, maximum = 2) {
  let tier = initial, elapsed = 0, frames = 0, slow = 0, fast = 0, cooldown = 0, changes = 0;
  return {
    reset() { elapsed = 0; frames = 0; slow = 0; fast = 0; },
    setTier(value) { tier = value; cooldown = 10; this.reset(); },
    sample(delta) {
      if (!(delta > 0) || delta > 0.25) { this.reset(); return null; }
      cooldown = Math.max(0, cooldown - delta); elapsed += delta; frames++;
      if (elapsed < 1.5 || frames < 20) return null;
      const fps = frames / elapsed;
      elapsed = 0; frames = 0;
      slow = fps < 34 ? slow + 1 : 0; fast = fps > 55 ? fast + 1 : 0;
      if (cooldown > 0) return null;
      let next = tier;
      if (slow >= 2) next = Math.max(0, tier - 1);
      else if (fast >= 4 && changes < 4) next = Math.min(maximum, tier + 1);
      if (next === tier) return null;
      tier = next; changes++; cooldown = 10; slow = 0; fast = 0;
      return tier;
    },
  };
}
