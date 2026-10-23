import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);
export function setupMotion({ scrollEngine, cursor, motion, reveal }) {
  const fine = matchMedia('(pointer: fine)').matches;
  // Native touch scroll owns the timeline on phones; Lenis is desktop-only.
  ScrollTrigger.config({ ignoreMobileResize: true });
  const lenis = fine ? new Lenis({ duration: 1.15, smoothWheel: true, syncTouch: false, anchors: false, prevent: node => node.closest?.('dialog') }) : null;
  scrollEngine.current = lenis;
  lenis?.on('scroll', ScrollTrigger.update);
  const tick = time => { if (!document.hidden) lenis?.raf(time * 1000); };
  if (lenis) gsap.ticker.add(tick);
  const context = gsap.context(() => {
    if (reveal) {
      gsap.fromTo('.hero-name .line-inner', { yPercent: 105 }, { yPercent: 0, duration: 1.45, stagger: 0.12, ease: 'expo.out', clearProps: 'transform' });
      gsap.utils.toArray('[data-reveal]').forEach(el => {
        gsap.fromTo(el, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
      });
    }
    gsap.to('.hero-name', { y: -70, ease: 'none', scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: 1 } });
  });
  const listeners = [];
  const listen = (el, type, fn) => { el.addEventListener(type, fn); listeners.push(() => el.removeEventListener(type, fn)); };
  if (fine && cursor.current) {
    document.documentElement.classList.add('custom-pointer');
    const el = cursor.current;
    const x = gsap.quickTo(el, 'x', { duration: 0.32, ease: 'power3.out' });
    const y = gsap.quickTo(el, 'y', { duration: 0.32, ease: 'power3.out' });
    listen(window, 'pointermove', e => { x(e.clientX); y(e.clientY); el.classList.add('visible'); motion.current.pointer = [(e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2]; window.dispatchEvent(new Event('forge-wake')); });
    listen(document, 'pointerover', e => {
      const target = e.target.closest?.('[data-cursor],a,button,summary');
      el.classList.toggle('is-link', !!target);
      el.textContent = target?.dataset.cursor || '';
    });
    listen(document, 'pointerout', e => { if (!e.relatedTarget) el.classList.remove('visible'); });
    document.querySelectorAll('[data-magnetic]').forEach(button => {
      listen(button, 'pointermove', e => { const r = button.getBoundingClientRect(); gsap.to(button, { x: (e.clientX - r.left - r.width / 2) * 0.13, y: (e.clientY - r.top - r.height / 2) * 0.18, duration: 0.4, ease: 'power3.out' }); });
      listen(button, 'pointerleave', () => gsap.to(button, { x: 0, y: 0, duration: 0.65, ease: 'expo.out' }));
    });
  }
  const refresh = () => ScrollTrigger.refresh();
  document.addEventListener('toggle', refresh, true);
  let disposed = false;
  document.fonts?.ready.then(() => { if (!disposed) refresh(); });
  return () => {
    disposed = true;
    document.documentElement.classList.remove('custom-pointer');
    document.removeEventListener('toggle', refresh, true);
    listeners.forEach(remove => remove());
    context.revert(); gsap.ticker.remove(tick); lenis?.destroy(); scrollEngine.current = null;
    if (cursor.current) { cursor.current.classList.remove('visible'); gsap.killTweensOf(cursor.current); }
    document.querySelectorAll('[data-magnetic]').forEach(el => { gsap.killTweensOf(el); gsap.set(el, { clearProps: 'transform' }); });
  };
}
