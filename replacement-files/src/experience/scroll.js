export function chapterStops(tops, stableViewportHeight) {
  const offset = Math.max(140, stableViewportHeight * 0.18);
  return tops.map(top => Math.max(0, top - offset));
}

export function sampleScroll(stops, y, fullHeight, viewportHeight) {
  let index = 0;
  while (index < stops.length - 1 && y >= stops[index + 1]) index++;
  const next = stops[index + 1], span = next - stops[index];
  const local = span > 0 ? Math.min(1, Math.max(0, (y - stops[index]) / span)) : 0;
  return { index, position: index + local, progress: Math.round(Math.min(1, Math.max(0, y / Math.max(1, fullHeight - viewportHeight))) * 100) };
}
