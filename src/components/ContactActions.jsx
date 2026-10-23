import { useEffect, useRef, useState } from 'react';
import { PHONE_DISPLAY, PHONE_HREF, whatsappHref } from '../data/site.js';
import { profile } from '../data/portfolio.js';

export function ContactActions({ quote = true, compact = false }) {
  return <div className={`enquiry-actions ${compact ? 'compact' : ''}`}>
    {quote && <a className="button-solid" href="/contact/">Discuss Your Website <span aria-hidden="true">↗</span></a>}
    <a className={quote ? 'button-outline' : 'button-solid'} href={whatsappHref()} target="_blank" rel="noopener noreferrer" data-contact="whatsapp">WhatsApp Me <span className="sr-only">(opens in a new tab)</span><span aria-hidden="true">↗</span></a>
    {!compact && <a className="text-link" href={PHONE_HREF} data-contact="call">Call {PHONE_DISPLAY}</a>}
  </div>;
}
export function ContactDetails({ showEmail = true }) {
  return <div className="direct-contact"><a href={PHONE_HREF} data-contact="call">Call {PHONE_DISPLAY}</a>{showEmail && <a href={`mailto:${profile.email}`} data-contact="email">{profile.email}</a>}<p>{profile.location}<br/>Remote projects across India.</p></div>;
}
export function MobileContact() {
  const button = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    let dispose = () => {};
    const configure = () => {
      dispose(); setVisible(false);
      if (!media.matches || !button.current) return;
      const hero = document.getElementById('hero-visual') || document.querySelector('.marketing-hero');
      const selector = 'main p, main h1, main h2, main h3, main li, main a, main button, main label, main img, main input, main select, main textarea, main summary, .view-controls, .scene-loader, header, footer';
      let blockers = [], refreshTargets = true, raf = 0, disposed = false, wasVisible = false;
      const publish = next => {
        if (next !== wasVisible) { wasVisible = next; setVisible(next); }
      };
      const measure = () => {
        raf = 0;
        if (disposed) return;
        if (document.hidden || (hero && hero.getBoundingClientRect().bottom > 0)) { publish(false); return; }
        if (refreshTargets) { blockers = [...document.querySelectorAll(selector)]; refreshTargets = false; }
        const rect = button.current.getBoundingClientRect();
        if (!rect.width || !rect.height) { publish(false); return; }
        // One scheduled read pass per scroll/layout change, no continuous loop.
        // Keep the icon out of text, controls, screenshots and footer content.
        const overlaps = blockers.some(target => {
          if (!target.isConnected) return false;
          const box = target.getBoundingClientRect();
          return box.width > 0 && box.height > 0 && box.left < rect.right &&
            box.right > rect.left && box.top < rect.bottom && box.bottom > rect.top;
        });
        publish(!overlaps);
      };
      const request = () => { if (!raf && !disposed) raf = requestAnimationFrame(measure); };
      const changed = () => { refreshTargets = true; request(); };
      const mutations = new MutationObserver(changed);
      mutations.observe(document.querySelector('main')?.parentElement || document.body, { childList: true, subtree: true });
      const resize = new ResizeObserver(request);
      const main = document.querySelector('main'); if (main) resize.observe(main);
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
      window.visualViewport?.addEventListener('resize', request);
      document.addEventListener('visibilitychange', request);
      document.fonts?.ready.then(() => { if (!disposed) request(); });
      request();
      dispose = () => {
        disposed = true; cancelAnimationFrame(raf); mutations.disconnect(); resize.disconnect();
        window.removeEventListener('scroll', request); window.removeEventListener('resize', request);
        window.visualViewport?.removeEventListener('resize', request);
        document.removeEventListener('visibilitychange', request);
      };
    };
    configure(); media.addEventListener('change', configure);
    return () => { dispose(); media.removeEventListener('change', configure); };
  }, []);
  return <a ref={button} className="mobile-contact" data-visible={visible} aria-hidden={!visible} tabIndex={visible ? 0 : -1} href={whatsappHref()} target="_blank" rel="noopener noreferrer" data-contact="whatsapp" aria-label="Discuss your website on WhatsApp (opens in a new tab)">
    <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M27 15.7A11.1 11.1 0 0 1 10.5 25.5L4 27l1.8-6.2A11.1 11.1 0 1 1 27 15.7Z"/><path d="M12 9.5c-.8 0-1.7 1.2-1.7 2.6 0 3.5 5.2 8.7 8.9 8.7 1.3 0 2.5-1.2 2.5-2l-3-1.6-1.4 1.1c-1.8-.8-3.5-2.5-4.2-4.2l1-1.4Z"/></svg>
  </a>;
}
