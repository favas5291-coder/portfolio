import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { evidenceRoot, productURL } from '../data/product-evidence.js';
import { project } from '../data/portfolio.js';
import './exhibit.css';

const tee = {
  name: 'Compression Half Sleeves T-shirt',
  maker: 'Coitonic',
  material: 'Nylon–spandex',
  weight: '180 GSM',
  photos: {
    Black: '/images/projects/gymdrobe-shirt-black.webp',
    Red: '/images/projects/gymdrobe-shirt-red.webp',
  },
};
const casePage = '/projects/gymdrobe/';
function caseIsOpen() {
  const search = new URLSearchParams(location.search);
  return (search.get('case') || search.get('exhibit')) === 'gymdrobe' || location.hash === '#drive-gymdrobe';
}
const useClientLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const variantLink = (colour) => productURL + '?colour=' + colour.toUpperCase();

function ProductPhoto({ colour }) {
  return (
    <img
      data-product-photo
      src={tee.photos[colour]}
      alt={'Model wearing the ' + colour.toLowerCase() + ' compression T-shirt'}
      width="640"
      height={colour === 'Black' ? 960 : 853}
      loading="lazy"
      decoding="async"
    />
  );
}

function CaseStudy({ dismiss }) {
  const dialog = useRef(null);
  useClientLayout(() => {
    const el = dialog.current;
    el.showModal();
    const originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = originalOverflow;
      if (el.open) el.close();
    };
  }, []);
  return createPortal(
    <dialog
      className="vw-case"
      ref={dialog}
      aria-labelledby="vw-case-title"
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
    >
      <header>
        <span>Case study</span>
        <button type="button" onClick={dismiss}>
          Close
        </button>
      </header>
      <div className="vw-case-body">
        <h2 id="vw-case-title">{project.name}</h2>
        <p className="vw-case-byline">Muhammed Favas K · Founder and full-stack developer</p>
        <p>{project.description}</p>
        <img src={project.screenshot} alt={project.screenshotAlt} width="1348" height="926" />
        <h3>What I built</h3>
        <p>
          I built the React storefront, product selection, cart and checkout, and the interfaces for managing
          orders.
        </p>
        <h3>What happens when a shopper changes colour?</h3>
        <p>
          The store switches to that colour’s gallery and checks the selected size against its stock. It also
          saves the colour in the product link, so a shopper can share the same selection.
        </p>
        <a href={evidenceRoot + 'src/pages/ProductPage.jsx'}>Read the product-page source</a>
        <div className="vw-case-links">
          <a href={casePage}>Read the full case study</a>
          <a href={project.website}>Visit GymDrobe</a>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

export default function Exhibit({ width, onWidthChange }) {
  const [details, setDetails] = useState(false);
  const [colour, setColour] = useState('Black');
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(0);
  const slot = useRef(null),
    caseLink = useRef(null),
    wasCase = useRef(false),
    pendingReturn = useRef(null),
    closeFrame = useRef(0),
    dismissing = useRef(false),
    productHeading = useRef(null);
  const touchDrag = useRef(null);
  const compact = Math.min(available, 304);
  const wide = available > 465 ? available : 610;
  const virtual = Math.round(compact + (wide - compact) * width);
  const visible = Math.round(compact + (available - compact) * width);
  const scale = available ? visible / virtual : 1;
  const surfaceHeight = available && available < 480 ? 354 : 382;

  useClientLayout(() => {
    const measure = () => setAvailable(Math.round(slot.current.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot.current);
    return () => observer.disconnect();
  }, []);

  function restore(mark) {
    if (!mark) return;
    setColour(Object.hasOwn(tee.photos, mark.colour) ? mark.colour : 'Black');
    setDetails(Boolean(mark.details));
    if (Number.isFinite(mark.width)) onWidthChange(Math.max(0, Math.min(1, mark.width)));
  }

  function focusOpener(mark) {
    caseLink.current?.focus({ preventScroll: true });
    if (Number.isFinite(mark?.scroll)) window.scrollTo({ top: mark.scroll, behavior: 'instant' });
  }

  // Native dialog cleanup releases its focus trap during the same commit.
  // Restore here before paint so the next navigation can take focus immediately.
  useClientLayout(() => {
    if (open || !pendingReturn.current) return;
    const mark = pendingReturn.current;
    pendingReturn.current = null;
    focusOpener(mark);
  }, [open]);

  useEffect(() => {
    function sync(initial = false) {
      const show = caseIsOpen();
      const snapshot = history.state?.variableProof;
      // A room hash is ordinary navigation. Only a case-history transition
      // (or a restored document) should move focus or restore the operator.
      const returningDocument =
        initial && performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
      const leavingCase = wasCase.current && !show;
      wasCase.current = show;
      cancelAnimationFrame(closeFrame.current);
      closeFrame.current = 0;
      dismissing.current = false;
      if (show || leavingCase || returningDocument) restore(snapshot);
      if (leavingCase) {
        // A same-document traversal can focus its fragment after popstate.
        // Keep the dialog modal until that traversal finishes, then unmount
        // and restore in one commit before the next control can be used.
        closeFrame.current = requestAnimationFrame(() => {
          closeFrame.current = 0;
          pendingReturn.current = snapshot?.returnToCaseLink ? snapshot : {};
          setOpen(false);
        });
      } else {
        if (!show && returningDocument && snapshot?.returnToCaseLink) focusOpener(snapshot);
        setOpen(show);
      }
    }
    const pop = () => sync();
    sync(true);
    window.addEventListener('popstate', pop);
    return () => {
      cancelAnimationFrame(closeFrame.current);
      window.removeEventListener('popstate', pop);
    };
  }, [onWidthChange]);

  function openCase(event) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const mark = { details, colour, width, scroll: window.scrollY, returnToCaseLink: true };
    wasCase.current = true;
    history.replaceState({ ...history.state, variableProof: mark }, '', location.href);
    const url = new URL(location.href);
    url.searchParams.set('case', 'gymdrobe');
    url.hash = 'work';
    history.pushState({ ...history.state, variableProof: mark, variableCaseEntry: true }, '', url);
    setOpen(true);
  }
  function closeCase() {
    if (dismissing.current || closeFrame.current) return;
    if (history.state?.variableCaseEntry) {
      dismissing.current = true;
      history.back();
      return;
    }
    const url = new URL(location.href);
    url.searchParams.delete('case');
    url.searchParams.delete('exhibit');
    url.hash = 'work';
    history.replaceState(history.state, '', url);
    pendingReturn.current = {};
    wasCase.current = false;
    setOpen(false);
  }
  function changeView(next) {
    setDetails(next);
    requestAnimationFrame(() => productHeading.current?.focus({ preventScroll: true }));
  }

  function touchStart(event) {
    if (!event.isPrimary || event.button !== 0) return;
    touchDrag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, active: false };
  }
  function touchMove(event) {
    const drag = touchDrag.current;
    if (!drag || drag.id !== event.pointerId) return;
    const dx = Math.abs(event.clientX - drag.x),
      dy = Math.abs(event.clientY - drag.y);
    if (!drag.active) {
      if (dy > 6 && dy >= dx) {
        touchDrag.current = null;
        return;
      }
      if (dx < 7 || dx < dy * 1.3) return;
      drag.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    onWidthChange(
      Math.max(0, Math.min(1, (event.clientX - bounds.left - 14) / Math.max(1, bounds.width - 28))),
    );
  }

  return (
    <div className="vw-proof">
      <div className="vw-exhibit-mount" ref={slot}>
        <article
          className="vw-projection"
          aria-label="GymDrobe interactive sample"
          style={available ? { width: visible, height: Math.ceil(surfaceHeight * scale) } : undefined}
        >
          <div
            className="vw-projection-inner"
            style={
              available
                ? { width: virtual, height: surfaceHeight, transform: 'scale(' + scale + ')' }
                : undefined
            }
          >
            <div className="vw-store-mast">
              <strong>GymDrobe</strong>
              <span>Interactive sample</span>
            </div>
            <div className="vw-product" data-view={details ? 'details' : 'collection'} data-colour={colour}>
              <div className="vw-product-photo">
                <ProductPhoto colour={colour} />
              </div>
              <div className="vw-product-title">
                {details ? (
                  <button className="vw-collection-link" onClick={() => changeView(false)}>
                    Back to collection
                  </button>
                ) : (
                  <span>Training apparel</span>
                )}
                <h3 tabIndex="-1" ref={productHeading}>
                  {tee.name}
                </h3>
              </div>
              {details ? (
                <div className="vw-product-spec">
                  <p>
                    {tee.maker} · {tee.material} · {tee.weight}
                  </p>
                  <div className="vw-colours" role="group" aria-label="T-shirt colour">
                    {Object.keys(tee.photos).map((name) => (
                      <button
                        type="button"
                        key={name}
                        aria-pressed={colour === name}
                        onClick={() => setColour(name)}
                      >
                        <i data-swatch={name} aria-hidden="true" />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="vw-product-spec">
                  <p>{tee.maker} · Black and red</p>
                </div>
              )}
              <div className="vw-product-action">
                {details ? (
                  <a href={variantLink(colour)}>View at GymDrobe</a>
                ) : (
                  <button type="button" onClick={() => changeView(true)}>
                    View details
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>
      </div>
      <div className="vw-rail" role="group" aria-label="Projection width">
        <button type="button" aria-pressed={width === 0} onClick={() => onWidthChange(0)}>
          Compact
        </button>
        <div className="vw-slider">
          <input
            className="vw-width-grip"
            type="range"
            min="0"
            max="100"
            step="1"
            aria-label="Projection width"
            value={Math.round(width * 100)}
            aria-valuetext={
              width === 0 ? 'Compact' : width === 1 ? 'Wide' : Math.round(width * 100) + '% width'
            }
            onChange={(e) => onWidthChange(Number(e.target.value) / 100)}
          />
          <span
            className="vw-touch-grip"
            aria-hidden="true"
            onPointerDown={touchStart}
            onPointerMove={touchMove}
            onPointerUp={() => {
              touchDrag.current = null;
            }}
            onPointerCancel={() => {
              touchDrag.current = null;
            }}
          />
        </div>
        <button type="button" aria-pressed={width === 1} onClick={() => onWidthChange(1)}>
          Wide
        </button>
      </div>
      <div className="vw-proof-links">
        <a href={casePage} ref={caseLink} onClick={openCase}>
          View case study
        </a>
        <a href={project.website}>Visit GymDrobe</a>
      </div>
      {open && <CaseStudy dismiss={closeCase} />}
    </div>
  );
}

export { default as LayoutReview } from './Process.jsx';
