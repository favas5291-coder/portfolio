import { useCallback, useEffect, useRef, useState } from 'react';
import { chapters } from '../data/portfolio';
import { gentleMotion, readPreferences, savePreferences } from '../experience/preferences.js';
import { chapterStops, sampleScroll } from '../experience/scroll.js';

export function useExperience() {
  const [active, setActive] = useState('home');
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState('three');
  const [initialized, setInitialized] = useState(false);
  const [systemReduced, setSystemReduced] = useState(false);
  const [motionChoice, setMotionChoice] = useState('system');
  const [reason, setReason] = useState('');
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneStatus, setSceneStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState({ loaded: 0, total: 0 });
  const [selected, setSelected] = useState('React');
  const reduced = gentleMotion(systemReduced, motionChoice);
  const preferences = useRef({ view: 'three', motion: 'system' });
  const motion = useRef({ position: 0, pointer: [0, 0], selected: 'React', visible: true, gentle: false, smoothedScroll: false });
  const scrollEngine = useRef(null);
  const progressElement = useRef(null);
  const cursor = useRef(null);
  const revealDone = useRef(false);
  const wake = () => window.dispatchEvent(new Event('forge-wake'));

  useEffect(() => { motion.current.selected = selected; wake(); }, [selected]);
  useEffect(() => { motion.current.gentle = reduced; wake(); }, [reduced]);
  useEffect(() => {
    let storage;
    try { storage = window.localStorage; } catch { /* unavailable */ }
    const saved = readPreferences(storage);
    preferences.current = saved;
    setMode(saved.view); setMotionChoice(saved.motion);
    if (saved.view === 'static') { setReason('2D view selected'); setSceneStatus('user-static'); }
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setSystemReduced(media.matches);
    change(); media.addEventListener('change', change); setInitialized(true);
    return () => media.removeEventListener('change', change);
  }, []);

  const remember = useCallback(patch => {
    preferences.current = { ...preferences.current, ...patch };
    try { savePreferences(window.localStorage, preferences.current); } catch { /* session only */ }
  }, []);
  const fallback = useCallback((message) => {
    setMode('static'); setSceneReady(false); setSceneStatus('error');
    setReason(typeof message === 'string' ? message : '3D could not load. You can retry.');
    // Automatic failure must never overwrite the visitor's view preference.
  }, []);
  const ready = useCallback(() => { setSceneReady(true); setSceneStatus('ready'); setReason(''); }, []);
  const recovering = useCallback(() => { setSceneReady(false); setSceneStatus('recovering'); }, []);
  const loadProgress = useCallback(value => setLoading(value), []);
  const retry = useCallback(() => {
    remember({ view: 'three' }); setAttempt(value => value + 1);
    setSceneReady(false); setLoading({ loaded: 0, total: 0 });
    setSceneStatus('loading'); setReason(''); setMode('three');
  }, [remember]);
  const toggleMode = useCallback(() => {
    if (mode === 'static') { retry(); return; }
    remember({ view: 'static' }); setMode('static'); setSceneReady(false);
    setSceneStatus('user-static'); setReason('2D view selected');
  }, [mode, remember, retry]);
  const toggleMotion = useCallback(() => {
    const next = reduced ? 'full' : 'gentle';
    remember({ motion: next }); setMotionChoice(next);
  }, [reduced, remember]);

  useEffect(() => {
    let raf = 0, measure = true, previousIndex = -1, previousProgress = -1;
    let stops = [], viewportHeight = 0, fullHeight = 0;
    // svh does not change when the browser address bar retracts. Use it for
    // chapter anchors, while the canvas still follows the visible viewport.
    const viewportProbe = document.createElement('div');
    viewportProbe.setAttribute('aria-hidden', 'true');
    viewportProbe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none;contain:strict';
    document.body.append(viewportProbe);
    const publish = () => {
      const sample = sampleScroll(stops, window.scrollY, fullHeight, viewportHeight);
      motion.current.position = sample.position;
      if (sample.progress !== previousProgress) { previousProgress = sample.progress; setProgress(sample.progress); }
      if (sample.index !== previousIndex) { previousIndex = sample.index; setActive(chapters[sample.index].id); }
      if (progressElement.current) progressElement.current.style.transform = `scaleX(${sample.progress / 100})`;
      // Wake after writing the timeline; the last touch-scroll event must not
      // leave a demand frame reading stale progress and then going idle.
      wake();
    };
    const update = () => {
      raf = 0;
      if (document.hidden) return;
      if (measure) {
        viewportHeight = document.documentElement.clientHeight || innerHeight;
        fullHeight = document.documentElement.scrollHeight;
        const stableHeight = viewportProbe.clientHeight || viewportHeight;
        const y = window.scrollY;
        stops = chapterStops(chapters.map(c => (document.getElementById(c.id)?.getBoundingClientRect().top || 0) + y), stableHeight);
        measure = false;
      }
      publish();
    };
    const request = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(update); };
    const scroll = () => {
      if (document.hidden) return;
      // Touch scroll already arrives at the browser's scroll cadence. Publish
      // the cached geometry now so the next WebGL frame sees the latest input;
      // scheduling a second RAF here leaves the scene one extra frame behind.
      if (scrollEngine.current) { request(); return; }
      // Browser-toolbar resizing can dirty the geometry during the same swipe.
      // Refresh it once here, and replace its queued measurement frame.
      if (raf) cancelAnimationFrame(raf);
      update();
    };
    const resize = () => { measure = true; request(); };
    const visibility = () => {
      motion.current.visible = !document.hidden;
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else resize();
    };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    window.addEventListener('pageshow', resize);
    window.visualViewport?.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', visibility);
    const observer = new ResizeObserver(resize);
    const main = document.querySelector('main'); if (main) observer.observe(main);
    let disposed = false;
    document.fonts?.ready.then(() => { if (!disposed) resize(); }); request();
    return () => {
      disposed = true; observer.disconnect(); cancelAnimationFrame(raf); viewportProbe.remove();
      window.removeEventListener('scroll', scroll); window.removeEventListener('resize', resize);
      window.removeEventListener('orientationchange', resize); window.removeEventListener('pageshow', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  useEffect(() => {
    if (!initialized || reduced || mode === 'static') return;
    let dispose, stopped = false;
    import('../motion/setupMotion').then(({ setupMotion }) => {
      if (stopped) return;
      dispose = setupMotion({ scrollEngine, cursor, motion, reveal: !revealDone.current });
      revealDone.current = true;
    }).catch(() => { /* Native scrolling and visible content remain available. */ });
    return () => { stopped = true; dispose?.(); };
  }, [initialized, reduced, mode]);

  const navigate = useCallback((event, id) => {
    if (event && (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button > 0)) return;
    const node = document.getElementById(id); if (!node) return;
    event?.preventDefault(); history.replaceState(null, '', `#${id}`); node.focus({ preventScroll: true });
    const offset = innerWidth < 768 ? 112 : 90;
    if (scrollEngine.current) scrollEngine.current.scrollTo(node, { offset: -offset, duration: 1.35 });
    else window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - offset, behavior: 'instant' });
  }, []);

  return { active, progress, mode, initialized, reduced, reason, sceneReady, sceneStatus, attempt, loading, selected, setSelected, motion, progressElement, cursor, navigate, toggleMode, toggleMotion, retry, ready, recovering, fallback, loadProgress };
}
