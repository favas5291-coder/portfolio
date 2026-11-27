import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { project, profile } from '../data/portfolio.js';
import { productURL } from '../data/product-evidence.js';
import { PHONE_DISPLAY, PHONE_HREF, services, processSteps, whatsappHref } from '../data/site.js';
import { exhibits, shopColours } from '../studio/studioContent.js';
import { readDraft, updateDraft } from '../enquiries/draft.js';
import './rooms.css';

const RoomContext = createContext(null);
const useClientLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const caseSource = project.repository + '/blob/6e93a5643feb745c673936cb16e5937b9f8761db/src/pages/ProductPage.jsx#L160-L238';
const needs = {
  'business-websites': ['I need a business website', 'See how a service leads to contact', '/services/business-websites/'],
  'ecommerce-development': ['I want to sell online', 'See product choices at GymDrobe', exhibits.gymdrobe.page],
  'landing-pages': ['I need enquiries for one offer', 'Follow a landing page enquiry', '/services/landing-pages/'],
  'website-redesign': ['I want to improve my website', 'See the mobile contact page', '/contact/'],
};
const enquiryURL = (slug) => slug ? '/contact/?service=' + encodeURIComponent(slug) + '#project-enquiry' : '/contact/#project-enquiry';

function readProject() {
  const url = new URL(location.href);
  const id = url.searchParams.get('exhibit') || url.searchParams.get('case');
  return Object.hasOwn(exhibits, id) ? id : null;
}
function hasDialog() {
  return typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function';
}

export function AppointmentRooms({ children, onInspecting, onProjectChange }) {
  const [opened, setOpened] = useState(null);
  const [lastProject, setLastProject] = useState('gymdrobe');
  const [service, setService] = useState('');
  const [note, setNote] = useState('');
  const anchor = useRef(null);
  const closing = useRef(false);
  const restorePosition = useRef(false);
  const syncDraft = useCallback(() => {
    const draft = readDraft();
    setService(services.find(item => item.name === draft.service)?.slug || '');
    setNote(draft.message || '');
  }, []);
  useEffect(() => {
    function sync() {
      const id = readProject();
      closing.current = false;
      if (id && hasDialog()) {
        if (!anchor.current) {
          const room = document.getElementById('reception');
          const saved = history.state?.appointmentReturn;
          if (!Number.isFinite(saved)) room?.scrollIntoView({ behavior: 'instant' });
          anchor.current = { top: Number.isFinite(saved) ? saved : scrollY, el: room?.querySelector('[data-inspect="' + id + '"]') };
        }
        setOpened(id);
      } else {
        restorePosition.current = !!anchor.current;
        setOpened(null);
      }
    }
    try {
      const restored = sessionStorage.getItem('fazhere.last-project');
      if (Object.hasOwn(exhibits, restored)) setLastProject(restored);
    } catch { /* No storage is needed to inspect projects. */ }
    sync();
    syncDraft();
    window.addEventListener('popstate', sync);
    window.addEventListener('pageshow', syncDraft);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('pageshow', syncDraft);
    };
  }, [syncDraft]);
  useClientLayout(() => {
    onInspecting?.(Boolean(opened));
    if (opened) {
      setLastProject(opened);
      try { sessionStorage.setItem('fazhere.last-project', opened); } catch { /* In-memory state still works. */ }
    } else if (restorePosition.current && anchor.current) {
      const { top, el } = anchor.current;
      anchor.current = null;
      restorePosition.current = false;
      const frame = requestAnimationFrame(() => {
        window.scrollTo({ top, behavior: 'instant' });
        el?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [opened, onInspecting]);
  useEffect(() => {
    onProjectChange?.(exhibits[lastProject].preview.screenshot);
  }, [lastProject, onProjectChange]);
  function open(event, id) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !hasDialog()) return;
    event.preventDefault();
    const top = window.scrollY;
    anchor.current = { el: event.currentTarget, top };
    const url = new URL(location.href);
    url.searchParams.set('exhibit', id);
    history.pushState({ ...history.state, appointmentDialog: id, appointmentReturn: top }, '', url);
    closing.current = false;
    setOpened(id);
  }
  function close() {
    if (closing.current) return;
    if (history.state?.appointmentDialog === opened) {
      closing.current = true;
      history.back();
    } else {
      const url = new URL(location.href);
      url.searchParams.delete('exhibit');
      url.searchParams.delete('case');
      history.replaceState(history.state, '', url);
      restorePosition.current = true;
      setOpened(null);
    }
  }
  function chooseService(slug) {
    setService(slug);
    updateDraft({ service: services.find(item => item.slug === slug)?.name || '' });
  }
  function writeNote(value) {
    setNote(value);
    updateDraft({ message: value });
  }
  return <RoomContext.Provider value={{ open, service, chooseService, note, writeNote, lastProject }}>
    {children}
    {opened && <ProjectSheet key={opened} id={opened} onClose={close} />}
  </RoomContext.Provider>;
}

export function ProjectLink({ id, children, ...props }) {
  const { open } = useContext(RoomContext);
  return <a {...props} data-inspect={id} href={exhibits[id].page} onClick={event => open(event, id)}>{children}</a>;
}

function Capture({ id, imageRef }) {
  const exhibit = exhibits[id], capture = exhibit.preview;
  const paired = capture.mobile?.matchesDesktop === capture.screenshot;
  const [device, setDevice] = useState(() => paired && window.matchMedia('(max-width: 660px)').matches ? 'Mobile' : 'Desktop');
  const view = device === 'Mobile' && paired ? capture.mobile : capture;
  const zoom = useRef(null);
  const opener = useRef(null);
  const closing = useRef(false);
  useClientLayout(() => {
    const sync = () => {
      closing.current = false;
      const view = history.state?.appointmentZoom;
      if (view?.id === id) {
        setDevice(view.device === 'Mobile' && paired ? 'Mobile' : 'Desktop');
        if (!zoom.current.open) zoom.current.showModal();
      } else if (zoom.current.open) {
        zoom.current.close();
      }
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [id, paired]);
  function enlarge() {
    history.pushState({ ...history.state, appointmentZoom: { id, device } }, '', location.href);
    zoom.current.showModal();
  }
  function closeImage() {
    if (closing.current) return;
    if (history.state?.appointmentZoom?.id === id) {
      closing.current = true;
      history.back();
    } else zoom.current.close();
  }
  return <figure className="ap-capture">
    <header>
      <span className="ap-small">Storefront capture</span>
      {paired && <div className="ap-toggle" role="group" aria-label="Capture view">
        {['Desktop', 'Mobile'].map(type => <button type="button" key={type} aria-pressed={type === device} onClick={() => setDevice(type)}>{type}</button>)}
      </div>}
    </header>
    <button className="ap-image-button" type="button" ref={opener} aria-label={'Enlarge ' + exhibit.name + ' screenshot'} onClick={enlarge}>
      <img ref={imageRef} src={view.screenshot} width={view.width} height={view.height} alt={exhibit.name + ' ' + device.toLowerCase() + ' storefront'} />
    </button>
    <figcaption><time dateTime={view.capturedAt}>{date.format(new Date(view.capturedAt))}</time><span>Tap image to enlarge</span></figcaption>
    <dialog ref={zoom} className="ap-lightbox" aria-label={exhibit.name + ' enlarged screenshot'} onCancel={event => { event.preventDefault(); event.stopPropagation(); closeImage(); }} onClose={() => opener.current?.focus({ preventScroll: true })}>
      <header><span>{exhibit.name} · {device}</span><button type="button" onClick={closeImage}>Close image</button></header>
      <div><img src={view.screenshot} width={view.width} height={view.height} alt={'Full-size ' + exhibit.name + ' storefront'} /></div>
    </dialog>
  </figure>;
}

function ColourDemo({ headingRef }) {
  const [colour, setColour] = useState(() => shopColours.find(item => item.name === history.state?.appointmentColour) || shopColours[0]);
  function selectColour(item) {
    history.replaceState({ ...history.state, appointmentColour: item.name }, '', location.href);
    setColour(item);
  }
  return <section className="ap-demo" aria-labelledby="ap-product-title">
    <div className="ap-photo">
      <img src={colour.photo} alt={'Model wearing the ' + colour.name.toLowerCase() + ' COITONIC compression shirt'} width="420" height="630" />
    </div>
    <div className="ap-demo-copy">
      <p className="ap-small">Interactive demo · GymDrobe</p>
      <h3 ref={headingRef} tabIndex="-1" id="ap-product-title">Share the colour you chose.</h3>
      <p>Try two colours of the COITONIC compression shirt. The photo changes here. Open the product link and the store remembers that colour.</p>
      <div className="ap-swatches" role="group" aria-label="Shirt colour">
        {shopColours.map(item => <button type="button" key={item.name} onClick={() => selectColour(item)} aria-pressed={item.name === colour.name}>
          <i style={{ backgroundColor: item.tone }} aria-hidden="true" />{item.name}
        </button>)}
      </div>
      <a href={productURL + '?colour=' + colour.name.toUpperCase()} className="ap-underline">Open {colour.name.toLowerCase()} at GymDrobe</a>
    </div>
  </section>;
}

// Match the visible monitor to the *painted image* inside its contain box.
function matchMonitor(dialog, image) {
  const canvas = document.querySelector('.ap-visit[data-render="live"] .ap-canvas');
  const from = canvas?.appointmentMonitorBounds;
  if (!from || !image?.animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = image.getBoundingClientRect();
  const ratio = Number(image.getAttribute('width')) / Number(image.getAttribute('height'));
  const width = Math.min(box.width, box.height * ratio);
  const height = width / ratio;
  if (!width || !height || from.width < 10 || from.height < 10) return;
  const left = box.left + (box.width - width) / 2, top = box.top + (box.height - height) / 2;
  const sheet = image.cloneNode(false);
  sheet.alt = '';
  sheet.setAttribute('aria-hidden', 'true');
  Object.assign(sheet.style, {
    position: 'fixed', zIndex: 3, pointerEvents: 'none', transformOrigin: 'top left',
    maxWidth: 'none', left: left + 'px', top: top + 'px', width: width + 'px', height: height + 'px',
  });
  dialog.append(sheet);
  const animation = sheet.animate([
    { transform: 'translate(' + (from.left-left) + 'px,' + (from.top-top) + 'px) scale(' + from.width/width + ',' + from.height/height + ')' },
    { transform: 'none' },
  ], { duration: 310, easing: 'cubic-bezier(.23,.72,.25,1)' });
  animation.onfinish = () => sheet.remove();
  return () => { animation.cancel(); sheet.remove(); };
}

function ProjectSheet({ id, onClose }) {
  const dialog = useRef(null), image = useRef(null), demoHeading = useRef(null);
  const content = exhibits[id];
  const flagship = id === 'gymdrobe';
  useClientLayout(() => {
    const node = dialog.current;
    const before = document.documentElement.style.overflow;
    node.showModal();
    document.documentElement.style.overflow = 'hidden';
    const stopHandoff = id === 'gymdrobe' ? matchMonitor(node, image.current) : null;
    return () => {
      stopHandoff?.();
      document.documentElement.style.overflow = before;
      node.close();
    };
  }, []);
  return createPortal(<dialog ref={dialog} className="ap-sheet" aria-labelledby="ap-exhibit-name"
    onCancel={event => {
      // A nested screenshot dialog owns its Escape.
      if (event.target === dialog.current) { event.preventDefault(); onClose(); }
    }}>
    <header className="ap-sheet-bar"><span className="ap-small">Project room</span><button type="button" onClick={onClose} autoFocus>Back to the visit</button></header>
    <article>
      <p className="ap-small">{content.role}</p><h2 id="ap-exhibit-name">{content.name}</h2>
      <p>{content.summary}</p>
      {flagship ? <button className="ap-jump" type="button" onClick={() => {
        demoHeading.current?.focus({ preventScroll: true });
        demoHeading.current?.closest('section')?.scrollIntoView({ block: 'start', behavior: 'instant' });
      }}>Try the colour selection</button> : <p className="ap-disclosure">{id === 'fabea' ? 'Independent storefront concept with sample products and generated photography.' : 'Independent boutique concept with illustrative inventory, generated imagery and simulated owner tools.'}</p>}
      <Capture id={id} imageRef={image} />
      {flagship && <ColourDemo headingRef={demoHeading} />}
      <div className="ap-build-notes"><h3>What I built</h3><p>{content.contribution}</p>
      {flagship && <a className="ap-underline" href={caseSource}>Read the colour-selection code</a>}</div>
      <div className="ap-actions">
        <a className="ap-solid" href={content.live}>{flagship ? 'Visit live store' : 'Open working demo'}</a>
        <a className="ap-underline" href={content.page}>Read case study</a>
        {flagship && <a className="ap-underline" href={project.repository}>View code</a>}
      </div>
      <a className="ap-underline" data-contact="whatsapp" href={whatsappHref('Hi Favas, I’d like to discuss a store like ' + content.name + ' for my business.')}>Discuss a similar store</a>
    </article>
  </dialog>, document.body);
}

export function ReceptionRoom() {
  return <div className="ap-room-copy">
    <p className="ap-small">The project room</p><h2>GymDrobe.</h2>
    <p>I founded a fitness store and built the path from choosing a product to checking out. Try sharing a shirt in the colour you picked.</p>
    <div className="ap-actions"><ProjectLink id="gymdrobe" className="ap-solid">Explore GymDrobe</ProjectLink><a className="ap-underline" href={project.website}>Visit live store</a><a className="ap-underline" href={project.repository}>View code</a></div>
    <details className="ap-details"><summary>More projects</summary>
      <ul>{Object.entries(exhibits).filter(([id]) => id !== 'gymdrobe').map(([id, entry]) =>
        <li key={id} id={'drive-' + id}><ProjectLink id={id}>{entry.name}</ProjectLink><span>{entry.role}</span></li>)}</ul>
    </details>
  </div>;
}

export function StudioRoom() {
  const { service, chooseService } = useContext(RoomContext);
  const current = services.find(item => item.slug === service);
  return <div className="ap-room-copy">
    <p className="ap-small">The working studio</p><h2>What do you need to build?</h2>
    <label className="ap-field-label" htmlFor="ap-need">Choose a business need</label>
    <select id="ap-need" value={service} onChange={event => chooseService(event.target.value)}>
      <option value="">Select a need</option>
      {services.map(item => <option key={item.slug} value={item.slug}>{needs[item.slug]?.[0] || item.name}</option>)}
    </select>
    {current && <div className="ap-service-result" aria-live="polite">
      <h3>{current.name}</h3><p>{current.deliverables[0]}.</p>
      {needs[service] && <a className="ap-underline" href={needs[service][2]}>{needs[service][1]}</a>}
      <a className="ap-underline" href={'/services/' + current.slug + '/'}>Service details</a>
      <a className="ap-underline" href="#office">Discuss this at the desk</a>
      <a className="ap-underline" href={enquiryURL(service)}>Open prefilled enquiry</a>
    </div>}
    <a className="ap-underline" href="/services/">Browse all services</a>
  </div>;
}

export function LandingRoom() {
  return <div className="ap-room-copy">
    <p className="ap-small">The courtyard landing</p><h2>From brief to handover.</h2>
    <ol className="ap-process">{processSteps.map(([label, description]) => <li key={label}>
      <details><summary>{label}</summary><p>{description}</p></details>
    </li>)}</ol>
    <a href="#office" className="ap-underline">Go to founder’s office</a>
  </div>;
}

export function OfficeRoom() {
  const { service, note, writeNote, lastProject } = useContext(RoomContext);
  const current = services.find(item => item.slug === service);
  const message = ['Hi Favas, I’d like to discuss a project for my business.', current && 'Service: ' + current.name, note.trim()].filter(Boolean).join('\n\n');
  return <div className="ap-room-copy">
    <p className="ap-small">The founder’s office</p><h2>What are you planning to build?</h2>
    {current && <p className="ap-service-slip">{current.name} · <a href="#studio">Change service</a></p>}
    <label className="ap-field-label" htmlFor="ap-note">Your project idea</label>
    <textarea id="ap-note" rows="3" maxLength="3000" value={note} onChange={event => writeNote(event.target.value)} placeholder="Tell me what you want your customers to do." />
    <div className="ap-actions"><a className="ap-solid" href={whatsappHref(message)} data-contact="whatsapp">Chat on WhatsApp</a><a className="ap-underline" href={enquiryURL(service)}>Open enquiry form</a></div>
    <p className="ap-desk-project">On the monitor · <ProjectLink id={lastProject}>{exhibits[lastProject].name}</ProjectLink></p>
    <div className="ap-direct"><a href={'mailto:' + profile.email} data-contact="email">{profile.email}</a><a href={PHONE_HREF} data-contact="call">{PHONE_DISPLAY}</a></div>
  </div>;
}
