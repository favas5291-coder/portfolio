// Retain the canvas during context loss so the browser can restore resources.
export function attachSceneLifecycle({ canvas, page, wakeTarget, pause, wake, recovering, restored, fail, recoveryMs = 20000, timers = globalThis }) {
  let lost = false, timer, stopped = false;
  const clear = () => { timers.clearTimeout(timer); timer = undefined; };
  const arm = () => {
    clear();
    if (lost && !page.hidden) timer = timers.setTimeout(() => {
      if (!stopped && lost) fail('The 3D renderer could not recover. You can retry.');
    }, recoveryMs);
  };
  const visibility = () => {
    pause(page.hidden || lost);
    if (page.hidden) clear(); else if (lost) arm(); else wake();
  };
  const onLost = event => { event.preventDefault(); lost = true; pause(true); recovering(); arm(); };
  const onRestored = () => { lost = false; clear(); restored(); pause(page.hidden); if (!page.hidden) wake(); };
  const request = () => { if (!page.hidden && !lost) wake(); };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  page.addEventListener('visibilitychange', visibility);
  wakeTarget.addEventListener('forge-wake', request);
  visibility();
  return () => {
    stopped = true; clear();
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    page.removeEventListener('visibilitychange', visibility);
    wakeTarget.removeEventListener('forge-wake', request);
  };
}
