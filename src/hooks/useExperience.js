import { useCallback, useEffect, useRef, useState } from 'react';
import { chapters } from '../data/portfolio';

export function useExperience() {
  const [active, setActive] = useState('home');
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState('static');
  const [initialized, setInitialized] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [reason, setReason] = useState('');
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [loading, setLoading] = useState({ loaded: 0, total: 0 });
  const [selected, setSelected] = useState('React');
  const motion = useRef({ position: 0, pointer: [0, 0], selected: 'React', visible: true });
  const scrollEngine = useRef(null);
  const progressElement = useRef(null);
  const cursor = useRef(null);
  const initializedRef = useRef(false);
  const revealDone = useRef(false);

  useEffect(() => { motion.current.selected = selected; window.dispatchEvent(new Event('forge-wake')); }, [selected]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const choose = () => {
      setReduced(media.matches);
      let saved = false;
      try { saved = localStorage.getItem('forge-view') === 'static'; } catch { /* private browsing */ }
      const lowPower = navigator.connection?.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
      let supportsWebGL = false;
      if (!media.matches && !lowPower && !saved) {
        try { const c = document.createElement('canvas'); const gl = c.getContext('webgl2'); supportsWebGL = !!gl; gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* fallback */ }
      }
      setWebglUnavailable(!media.matches && !lowPower && !saved && !supportsWebGL);
      setMode(supportsWebGL ? 'three' : 'static');
      setReason(media.matches ? 'Reduced motion' : lowPower ? 'Lightweight view' : saved ? '2D view' : supportsWebGL ? '' : '2D view');
      setInitialized(true); initializedRef.current = true;
    };
    choose(); media.addEventListener('change', choose);
    return () => media.removeEventListener('change', choose);
  }, []);

  const fallback = useCallback(() => { setMode('static'); setSceneReady(false); setReason('2D view'); }, []);
  const ready = useCallback(() => setSceneReady(true), []);
  const loadProgress = useCallback(value => setLoading(value), []);
  const toggleMode = useCallback(() => {
    if (reduced) return;
    if (mode === 'static') {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2');
        if (!gl) { setWebglUnavailable(true); return; }
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch { setWebglUnavailable(true); return; }
    }
    setMode(value => { const next = value === 'three' ? 'static' : 'three'; try { localStorage.setItem('forge-view', next); } catch { /* temporary preference */ } setReason(next === 'static' ? '2D view' : ''); setSceneReady(false); return next; });
  }, [reduced, mode]);

  useEffect(() => {
    if (mode !== 'three' || sceneReady) return;
    const timer = setTimeout(fallback, 12000);
    return () => clearTimeout(timer);
  }, [mode, sceneReady, fallback]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const nodes = chapters.map(c => document.getElementById(c.id));
      const y = scrollY;
      const stops = nodes.map(node => Math.max(0, (node?.getBoundingClientRect().top || 0) + y - Math.max(140, innerHeight * 0.18)));
      let index = 0;
      while (index < stops.length - 1 && y >= stops[index + 1]) index++;
      const next = stops[index + 1];
      const local = next ? Math.min(1, Math.max(0, (y - stops[index]) / (next - stops[index]))) : 0;
      motion.current.position = index + local;
      const full = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const p = Math.min(1, Math.max(0, y / full));
      setProgress(Math.round(p * 100));
      if (progressElement.current) progressElement.current.style.transform = `scaleX(${p})`;
      setActive(chapters[index].id);
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(update); };
    const visibility = () => { motion.current.visible = !document.hidden; if (!document.hidden) request(); };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    document.addEventListener('visibilitychange', visibility);
    const resizeObserver = new ResizeObserver(request);
    resizeObserver.observe(document.querySelector('main'));
    request();
    return () => { resizeObserver.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('scroll', request); window.removeEventListener('resize', request); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    if (!initialized || reduced || mode === 'static') return;
    let dispose; let stopped = false;
    import('../motion/setupMotion').then(({ setupMotion }) => {
      if (stopped) return;
      dispose = setupMotion({ scrollEngine, cursor, motion, reveal: !revealDone.current });
      revealDone.current = true;
    }).catch(() => { /* native scrolling and visible content remain available */ });
    return () => { stopped = true; dispose?.(); };
  }, [initialized, reduced, mode]);

  const navigate = useCallback((event, id) => {
    if (event && (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button > 0)) return;
    const node = document.getElementById(id); if (!node) return;
    event?.preventDefault();
    history.replaceState(null, '', `#${id}`);
    node.focus({ preventScroll: true });
    if (scrollEngine.current) scrollEngine.current.scrollTo(node, { offset: -80, duration: 1.35 });
    else window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY - (innerWidth < 768 ? 112 : 90), behavior: 'instant' });
  }, []);

  return { active, progress, mode, initialized, reduced, webglUnavailable, reason, sceneReady, loading, selected, setSelected, motion, progressElement, cursor, navigate, toggleMode, ready, fallback, loadProgress };
}
