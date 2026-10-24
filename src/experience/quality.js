export const QUALITY = [
  { name: 'balanced', dpr: 1, segments: 32, cableSegments: 28, textureSize: 2048, shadowSize: 512, bloomScale: 0.25 },
  { name: 'detailed', dpr: 1.25, segments: 48, cableSegments: 40, textureSize: 2048, shadowSize: 1024, bloomScale: 0.35 },
  { name: 'high', dpr: 1.5, segments: 48, cableSegments: 40, textureSize: 2048, shadowSize: 1024, bloomScale: 0.5 },
];
// Appearance is never inferred from touch input, viewport width or hardware hints.
export function initialQuality() { return QUALITY.length - 1; }

// Small canvases can afford more pixels per CSS pixel without exceeding the
// laptop's buffer budget. Retain its 1.5 DPR at ordinary laptop/desktop sizes.
export function renderDpr(tier, width, height, nativeDpr = 1, maxDimension = 8192) {
  const area = Math.max(1, width * height);
  const detail = tier === 2 ? Math.max(1.5, Math.min(2, Math.sqrt(1350000 / area))) : QUALITY[tier].dpr;
  return Math.min(Math.max(0.5, nativeDpr || 1), detail, Math.sqrt(4800000 / area),
    maxDimension / Math.max(1, width, height));
}
// Only consecutive frames are sampled. Idle demand frames and suspended tabs
// are not poor GPU performance. Hysteresis and a cooldown prevent churn.
export function createQualityMonitor(initial, maximum = 2) {
  let tier = initial, elapsed = 0, frames = 0, slow = 0, fast = 0, cooldown = 0;
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
      else if (fast >= 4) next = Math.min(maximum, tier + 1);
      if (next === tier) return null;
      tier = next; cooldown = 10; slow = 0; fast = 0;
      return tier;
    },
  };
}
