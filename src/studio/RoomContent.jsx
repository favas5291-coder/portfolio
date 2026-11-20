import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DoorOpen, MessageCircle } from 'lucide-react';
import { profile, project } from '../data/portfolio.js';
import { evidenceRoot, productURL } from '../data/product-evidence.js';
import { PHONE_DISPLAY, PHONE_HREF, services } from '../data/site.js';
import {
  clientQuestions,
  exhibits,
  projectStages,
  shopColours,
  tourEmail,
  tourWhatsapp,
} from './studioContent.js';
import './roomContent.css';

export { tourEmail, tourWhatsapp } from './studioContent.js';

function Intro() {
  return (
    <>
      <h1 className="studio-intro-title">
        Muhammed <span>Favas K</span>
      </h1>
      <p className="studio-role">Full-stack developer and founder of GymDrobe.</p>
      <p className="studio-lead">I build websites, online stores, and web apps for businesses.</p>
      <div className="studio-actions">
        <a className="studio-button" href="#reception">
          <DoorOpen size={17} aria-hidden="true" />
          Scroll to enter
        </a>
        <a className="studio-link" href={tourWhatsapp} data-contact="whatsapp">
          Talk to Favas
        </a>
      </div>
    </>
  );
}

function Reception() {
  return (
    <>
      <h2 className="studio-room-title">
        What brings <em>you in?</em>
      </h2>
      <p className="studio-lead">
        Welcome to my virtual studio in Kozhikode. Here’s what I build. Along the corridor, an
        illustrative team shows how we’d take your project from an idea to a working site.
      </p>
      <ul className="studio-service-list">
        {services.map(({ name, slug }) => (
          <li key={slug}>
            <a href={'/services/' + slug + '/'}>{name}</a>
          </li>
        ))}
      </ul>
      <a className="studio-link" href="/services/">
        See service details
      </a>
    </>
  );
}

function readExhibit() {
  const url = new URL(window.location.href);
  const id = url.searchParams.get('exhibit') || (url.hash.startsWith('#drive-') && url.hash.slice(7));
  return Object.hasOwn(exhibits, id) ? id : null;
}

function ExhibitDialog({ id, colour, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    window.dispatchEvent(new CustomEvent('studio:case-visibility', { detail: { open: true } }));
    element.querySelector('button').focus({ preventScroll: true });
    return () => {
      if (element.open) element.close();
      window.dispatchEvent(new CustomEvent('studio:case-visibility', { detail: { open: false } }));
    };
  }, []);
  const exhibit = exhibits[id];
  const capture = exhibit.preview;
  const hasPhoneCapture = capture.mobile?.matchesDesktop === capture.screenshot;
  const flagship = id === 'gymdrobe';
  return createPortal(
    <dialog
      ref={dialog}
      className="studio-case-dialog"
      aria-labelledby="studio-case-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="studio-case-bar">
        <span>Project room</span>
        <button type="button" onClick={onClose} aria-label="Close case study">
          Close <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="studio-case-body">
        <p className="studio-case-kicker">{exhibit.role}</p>
        <h2 id="studio-case-title" className="studio-room-title">
          {exhibit.name}
        </h2>
        <p className="studio-case-intro">{exhibit.summary}</p>
        <picture className="studio-case-capture">
          {hasPhoneCapture && (
            <source
              media="(max-width: 540px)"
              srcSet={capture.mobile.screenshot}
              width={capture.mobile.width}
              height={capture.mobile.height}
            />
          )}
          <img
            src={capture.screenshot}
            width={capture.width}
            height={capture.height}
            alt={exhibit.name + ' storefront homepage'}
          />
        </picture>
        <h3>What I built</h3>
        <p>{exhibit.contribution}</p>
        {flagship ? (
          <>
            <h3>Keeping a colour selection consistent</h3>
            <p>
              A colour change selects the matching gallery and records the choice in the product link. A
              visitor opening that link sees the same colour when the store still offers it.
            </p>
            <div className="studio-case-links">
              <a href={productURL + '?colour=' + colour.name.toUpperCase()}>Open the product in {colour.name.toLowerCase()}</a>
              <a href={evidenceRoot + 'src/pages/ProductPage.jsx'}>Inspect the implementation</a>
            </div>
          </>
        ) : (
          <p className="studio-case-note">
            {exhibit.name} is an independent storefront concept. The demo uses sample products and generated
            imagery.
          </p>
        )}
        <div className="studio-actions">
          <a className="studio-button" href={exhibit.live}>
            {flagship ? 'Visit GymDrobe' : 'Try the demo'}
          </a>
          <a className="studio-link" href={exhibit.page}>
            Full case study
          </a>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}

function ProductSample({ colour, onSelectColour }) {
  return (
    <div className="studio-product">
      <img
        src={colour.photo}
        alt={colour.name + ' COITONIC compression shirt'}
        loading="lazy"
        width="84"
        height="96"
      />
      <div>
        <p className="studio-product-title">Compression training tee</p>
        <div className="studio-colours" role="group" aria-label="Choose a product colour">
          {shopColours.map((item) => (
            <button
              type="button"
              key={item.name}
              aria-pressed={colour.name === item.name}
              data-photo={item.photo}
              onClick={() => onSelectColour(item)}
            >
              <i style={{ background: item.tone }} aria-hidden="true" />
              {item.name}
            </button>
          ))}
        </div>
        <noscript>
          <style>{'.studio-product .studio-colours{display:none}'}</style>
          <a className="studio-link" href={productURL}>
            See the product colours
          </a>
        </noscript>
      </div>
    </div>
  );
}

function ProjectRoom({ colour, onSelectColour }) {
  const [exhibit, setExhibit] = useState(null);
  const returnPlace = useRef(null);
  const wasOpen = useRef(false);
  const closing = useRef(false);
  useEffect(() => {
    let closeFrame;
    const sync = () => {
      cancelAnimationFrame(closeFrame);
      if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;
      const next = readExhibit();
      closing.current = false;
      if (next && !returnPlace.current) {
        const target = document.querySelector('[data-exhibit="' + next + '"]');
        const savedTop = window.history.state?.studioReturnY;
        if (!Number.isFinite(savedTop)) {
          // A shared exhibit URL opens over its own room on a fresh visit.
          document.getElementById('project-room')?.scrollIntoView({ behavior: 'instant' });
        }
        returnPlace.current = { target, top: Number.isFinite(savedTop) ? savedTop : window.scrollY };
      }
      // Chromium restores fragment focus and scroll after firing popstate.
      // Keep the dialog modal until that traversal finishes, then restore the reader.
      if (!next && returnPlace.current) {
        closeFrame = requestAnimationFrame(() => setExhibit(null));
      } else {
        setExhibit(next);
      }
    };
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      cancelAnimationFrame(closeFrame);
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);
  useLayoutEffect(() => {
    if (exhibit) {
      wasOpen.current = true;
    } else if (wasOpen.current && returnPlace.current) {
      const { target, top } = returnPlace.current;
      wasOpen.current = false;
      returnPlace.current = null;
      target?.focus({ preventScroll: true });
      window.scrollTo({ top, behavior: 'instant' });
    }
  }, [exhibit]);
  function open(event, id) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      typeof HTMLDialogElement === 'undefined' ||
      !HTMLDialogElement.prototype.showModal
    )
      return;
    event.preventDefault();
    const url = new URL(window.location.href);
    // A local HTML preview can change its fragment even in browsers that restrict file URL queries.
    if (url.protocol === 'file:') url.hash = 'drive-' + id;
    else url.searchParams.set('exhibit', id);
    returnPlace.current = { target: event.currentTarget, top: window.scrollY };
    window.history.pushState(
      { ...window.history.state, studioExhibit: id, studioReturnY: window.scrollY },
      '',
      url,
    );
    setExhibit(id);
  }
  function close() {
    if (closing.current) return;
    closing.current = true;
    if (window.history.state?.studioExhibit === exhibit) {
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('exhibit');
    url.hash = 'project-room';
    window.history.replaceState(window.history.state, '', url);
    closing.current = false;
    setExhibit(null);
  }
  return (
    <>
      <h2 className="studio-room-title">GymDrobe</h2>
      <p className="studio-lead">
        I founded GymDrobe and built its storefront, cart and checkout for workout clothing and equipment.
        Try a colour on the display.
      </p>
      <ProductSample colour={colour} onSelectColour={onSelectColour} />
      <p className="studio-engineering-note">
        The product link remembers the colour, so a shared link opens the matching gallery.{' '}
        <a href={evidenceRoot + 'src/pages/ProductPage.jsx'}>See the source</a>
      </p>
      <div className="studio-actions">
        <a
          className="studio-button"
          data-exhibit="gymdrobe"
          href={exhibits.gymdrobe.page}
          onClick={(event) => open(event, 'gymdrobe')}
        >
          View case study
        </a>
        <a className="studio-link" href={project.website}>
          Visit GymDrobe
        </a>
      </div>
      <div className="studio-other-exhibits">
        <a
          className="studio-fabea"
          data-exhibit="fabea"
          href={exhibits.fabea.page}
          onClick={(event) => open(event, 'fabea')}
        >
          <img src="/demos/fabea/assets/editorial-small.webp" alt="" width="64" height="64" loading="lazy" />
          <span>
            <strong>FABEA</strong>
            <small>Bags &amp; heels · Independent concept</small>
          </span>
        </a>
        <a
          className="studio-link"
          data-exhibit="luxvibe"
          href={exhibits.luxvibe.page}
          onClick={(event) => open(event, 'luxvibe')}
        >
          Luxvibe boutique concept
        </a>
      </div>
      {exhibit && <ExhibitDialog key={exhibit} id={exhibit} colour={colour} onClose={close} />}
    </>
  );
}

function Development() {
  return (
    <>
      <h2 className="studio-room-title">
        From brief <em>to release.</em>
      </h2>
      <p className="studio-lead">
        Say you want to sell a shirt in two colours. Here’s how we would take that request from a first sketch
        to a working store.
      </p>
      <div className="studio-questions">
        {projectStages.map(([stage, detail], i) => (
          <details key={stage} name="studio-project-stage" open={i === 0}>
            <summary>{stage}</summary>
            <p>{detail}</p>
          </details>
        ))}
      </div>
    </>
  );
}

function Review() {
  return (
    <>
      <h2 className="studio-room-title">
        A seat at <em>the table.</em>
      </h2>
      <p className="studio-lead">
        We sit down with the working site and walk through what your customer will see.
      </p>
      <div className="studio-questions">
        {clientQuestions.map(([question, answer], i) => (
          <details key={question} name="studio-client-question" open={i === 0}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}

function Founder() {
  return (
    <>
      <p className="studio-founder-name">{profile.name}</p>
      <h2 className="studio-room-title">
        What are <em>you building?</em>
      </h2>
      <p className="studio-lead">
        Tell me about your idea, where you are with it, and what you’d like help with.
      </p>
      <div className="studio-actions">
        <a className="studio-button" href={tourWhatsapp} data-contact="whatsapp">
          <MessageCircle size={17} aria-hidden="true" />
          Talk to Favas on WhatsApp
        </a>
        <a className="studio-link" href={tourEmail} data-contact="email">
          Email me
        </a>
      </div>
      <details className="studio-founder-links">
        <summary>Other ways to reach me</summary>
        <div>
          <a href={PHONE_HREF} data-contact="call">
            {PHONE_DISPLAY}
          </a>
          <a href="/contact/">Contact page</a>
          <a href={profile.github}>GitHub</a>
          <a href={profile.linkedin}>LinkedIn</a>
          <a href={project.repository}>GymDrobe source</a>
        </div>
      </details>
    </>
  );
}

const contentByRoom = [Intro, Reception, ProjectRoom, Development, Review, Founder];
export function RoomContent({ index, colour, onSelectColour }) {
  const Content = contentByRoom[index];
  return Content ? (
    <div className="studio-copy">
      <Content colour={colour} onSelectColour={onSelectColour} />
    </div>
  ) : null;
}
export default RoomContent;
