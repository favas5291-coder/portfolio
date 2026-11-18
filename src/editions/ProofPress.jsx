import ActionMark from '../components/ActionMark.jsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { projectPreviews } from '../data/project-previews.js';
import { editions } from './evidence.js';

const printedDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
});

function useMedia(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const condition = window.matchMedia(query);
    const read = () => setMatches(condition.matches);
    read();
    condition.addEventListener('change', read);
    return () => condition.removeEventListener('change', read);
  }, [query]);
  return matches;
}

function usePressScene(stage, capture, edition, allowMotion) {
  const scene = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    input.current = {
      src: capture.screenshot, width: capture.width, height: capture.height,
      title: edition.name, decision: edition.decision, detail: edition.detail.label,
    };
    scene.current?.setProof(input.current);
    if (scene.current && stage.current?.dataset.face === 'back') scene.current.setTurn(1);
  }, [stage, capture, edition]);

  useEffect(() => {
    if (!allowMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const mount = stage.current;
    let cancelled = false;
    let loading = false;
    let visible = false;
    async function load() {
      if (!visible || document.hidden || loading || cancelled) return;
      loading = true;
      try {
        const { mountPress } = await import('./PressScene.js');
        if (cancelled) return;
        scene.current = mountPress(mount);
        scene.current?.setProof(input.current);
        scene.current?.setTurn(Number(mount.style.getPropertyValue('--turn') || 0), 1);
      } catch {
        // Contact, captures and the paper controls all live in the HTML layer.
        delete mount.dataset.renderer;
      }
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      load();
    });
    observer.observe(mount);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', load);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [stage, allowMotion]);
  return scene;
}

function ProofDetail({ detail }) {
  return (
    <div className={'ed-specimen' + (detail.images ? ' illustrated' : '')}>
      <span className="ed-specimen-label">{detail.label}</span>
      {detail.images ? <div className="ed-samples">{detail.images.map((image, i) =>
        <figure key={image.src}><img src={image.src} alt={image.alt} loading="lazy"/><figcaption>{detail.lines[i]}</figcaption></figure>
      )}</div> : <div className="ed-slip">{detail.lines.map(line => <p key={line}>{line}</p>)}</div>}
    </div>
  );
}

export default function ProofPress({ edition, visit }) {
  const stage = useRef(null);
  const heading = useRef(null);
  const dialog = useRef(null);
  const opener = useRef(null);
  const phone = useMedia('(max-width: 600px)');
  const reduced = useMedia('(prefers-reduced-motion: reduce)');
  const preview = projectPreviews[edition.id];
  const paired = preview.mobile?.matchesDesktop === preview.screenshot;
  const [override, setOverride] = useState(null);
  const mobile = paired && (override?.id === edition.id ? override.mobile : phone);
  const capture = mobile ? preview.mobile : preview;
  const scene = usePressScene(stage, capture, edition, !reduced);
  const progress = useRef(0);
  const grab = useRef(1);
  const gesture = useRef(null);
  const tween = useRef(0);
  const target = useRef(0);
  const suppressClick = useRef(false);
  const [back, setBack] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  const paint = useCallback(value => {
    progress.current = value;
    const element = stage.current;
    if (!element) return;
    element.style.setProperty('--turn', value);
    element.toggleAttribute('data-turning', value > 0 && value < 1);
    scene.current?.setTurn(value, grab.current);
  }, [scene]);
  const finish = useCallback(value => {
    cancelAnimationFrame(tween.current);
    tween.current = 0;
    target.current = value;
    setBack(Boolean(value));
    paint(value);
  }, [paint]);
  const settle = value => {
    cancelAnimationFrame(tween.current);
    target.current = value;
    const from = progress.current;
    if (reduced || document.hidden || Math.abs(value - from) < 0.001) return finish(value);
    const since = performance.now();
    const duration = 320 + 360 * Math.abs(value - from);
    const tick = now => {
      const t = Math.min(1, (now - since) / duration);
      const ease = t * t * (3 - 2 * t);
      paint(from + (value - from) * ease);
      if (t === 1) finish(value);
      else tween.current = requestAnimationFrame(tick);
    };
    tween.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    gesture.current = null;
    suppressClick.current = false;
    finish(0);
    if (visit) heading.current?.focus({ preventScroll: true });
  }, [edition.id, visit, finish]);
  useEffect(() => {
    if (reduced) finish(target.current);
    const endHidden = () => {
      if (document.hidden) {
        gesture.current = null;
        finish(target.current);
      }
    };
    document.addEventListener('visibilitychange', endHidden);
    return () => {
      document.removeEventListener('visibilitychange', endHidden);
      cancelAnimationFrame(tween.current);
    };
  }, [finish, reduced]);

  function startDrag(e) {
    if (e.button !== 0 || !e.isPrimary) return;
    cancelAnimationFrame(tween.current);
    suppressClick.current = false;
    const bounds = stage.current.querySelector('.press-sheet').getBoundingClientRect();
    grab.current = Math.max(0, Math.min(1, (e.clientY - bounds.top) / bounds.height));
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, width: bounds.width, start: progress.current, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveDrag(e) {
    const drag = gesture.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = drag.x - e.clientX;
    if (!drag.moved && Math.abs(dx) < 5) return;
    if (!drag.moved && Math.abs(e.clientY - drag.y) > Math.abs(dx)) return;
    drag.moved = true;
    paint(Math.max(0, Math.min(1, drag.start + dx / (drag.width * 0.70))));
  }
  function endDrag(e, cancel = false) {
    const drag = gesture.current;
    if (!drag || drag.id !== e.pointerId) return;
    gesture.current = null;
    if (drag.moved || cancel) {
      suppressClick.current = true;
      settle(cancel ? target.current : Number(progress.current >= 0.5));
    }
  }
  function toggle() { settle(1 - target.current); }

  function closeEnlargement() {
    setEnlarged(false);
    // The dialog close event can arrive after the browser has already restored
    // focus and the visitor has tabbed onward. Only restore abandoned focus.
    const active = document.activeElement;
    if (!active || active === document.body || active === dialog.current || dialog.current?.contains(active)) {
      opener.current?.focus({ preventScroll: true });
    }
  }

  return (
    <div className="ed-feature" id="demonstration">
      {editions.map(item => <span key={item.id} id={'proof-' + item.id} className="ed-proof-anchor" />)}
      <div className="ed-press-heading">
        <div><p className="ed-small ed-press-label">On the press</p><h2 ref={heading} tabIndex={-1}>{edition.name}</h2></div>
        <span className="ed-page-no">{String(editions.indexOf(edition) + 1).padStart(2, '0')} <i>/</i> {String(editions.length).padStart(2, '0')}</span>
      </div>
      <div className="ed-stage" ref={stage} data-edition={edition.id} data-face={back ? 'back' : 'front'}>
        <div className="ed-bed" aria-hidden="true"><span className="ed-fallback-roller"/><span className="ed-fallback-handle"/><i/><i/></div>
        <div className="press-canvas" aria-hidden="true" />
        <div className="press-sheet">
          <div className="ed-page-container">
            <div className="ed-face ed-front" aria-hidden={back}>
              <img src={capture.screenshot} width={capture.width} height={capture.height} alt={edition.name + ' ' + (mobile ? 'mobile' : 'desktop') + ' storefront capture'} fetchPriority="high" />
              <i className="ed-register" aria-hidden="true"/>
            </div>
            <div className="ed-face ed-reverse" aria-hidden={!back}>
              <ProofDetail detail={edition.detail}/>
            </div>
          </div>
        </div>
        <button type="button" className="ed-corner" data-turn-corner="" aria-label={back ? 'Turn paper to the storefront' : 'Turn paper to the project detail'}
          onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={e => endDrag(e, true)} onLostPointerCapture={e => endDrag(e, true)}
          onClick={() => { if (!suppressClick.current) toggle(); suppressClick.current = false; }}><span aria-hidden="true"/></button>
      </div>
      <div className="ed-controls">
        <button type="button" className="ed-turn" onClick={toggle} aria-pressed={back}><span aria-hidden="true"><ActionMark icon="turn"/></span>{back ? 'Show front' : 'Turn the proof'}</button>
        <button type="button" className="ed-minor" ref={opener} onClick={() => { setEnlarged(true); dialog.current.showModal(); }}>Enlarge <ActionMark icon="enlarge"/></button>
        <a className="ed-minor" href={edition.live}>{edition.id === 'gymdrobe' ? 'Visit live website' : 'Visit live demo'} <ActionMark/></a>
      </div>
      {back ? <section className="ed-decision" aria-live="polite">
        <h3>{edition.decision}</h3><p>{edition.impact}</p>
        <div className="ed-evidence-links"><a href={edition.detail.href}>{edition.detail.linkLabel} <ActionMark/></a><a href={edition.caseStudy}>Read case study</a>{edition.source && <a href={edition.source}>View code <ActionMark/></a>}</div>
      </section> : <p className="ed-caption">{edition.disclosure} <span>Captured {printedDate.format(new Date(capture.capturedAt))}.</span> {edition.source && <a href={edition.source}>View code <ActionMark/></a>}</p>}
      <dialog className="ed-modal" ref={dialog} aria-label={edition.name + ' enlarged proof'} onClose={closeEnlargement}
        onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
        {enlarged && <div className="ed-modal-inner">
          <header><h2>{edition.name}</h2><button type="button" autoFocus onClick={() => dialog.current.close()}>Close ×</button></header>
          {paired && <div className="ed-devices" role="group" aria-label="Compare captures">{['Desktop', 'Mobile'].map((label, index) =>
            <button type="button" key={label} aria-pressed={mobile === Boolean(index)} onClick={() => setOverride({ id: edition.id, mobile: Boolean(index) })}>{label}</button>
          )}</div>}
          <img src={capture.screenshot} width={capture.width} height={capture.height} alt={'Enlarged ' + edition.name + ' ' + (mobile ? 'mobile' : 'desktop') + ' capture'}/>
          <footer>{mobile ? 'Mobile' : 'Desktop'} capture · {printedDate.format(new Date(capture.capturedAt))} <a href={edition.live}>Open website <ActionMark/></a></footer>
        </div>}
      </dialog>
    </div>
  );
}
