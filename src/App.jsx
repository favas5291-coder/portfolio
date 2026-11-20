import { useEffect, useRef, useState } from 'react';
import { ChevronDown, MapPin, Map, MessageCircle, Pause, Play } from 'lucide-react';
import RoomContent from './studio/RoomContent.jsx';
import { shopColours, tourWhatsapp } from './studio/studioContent.js';
import { StudioSound } from './studio/StudioSound.jsx';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';
import './studio/tour.css';

const rooms = [
  ['entrance', 'Entrance', 'A shaded stone path leads to the glazed entrance of Fazhere Studio.', ['home']],
  [
    'reception',
    'Reception',
    'The receptionist and directory stand beside a long, daylit corridor.',
    ['about', 'services', 'drive-map', 'drive-controls'],
  ],
  [
    'project-room',
    'Project room',
    'The GymDrobe and FABEA storefronts on the project room displays.',
    ['projects', 'demonstration', 'drive-gymdrobe', 'drive-luxvibe', 'drive-fabea'],
  ],
  [
    'development-studio',
    'Development studio',
    'The development team compares mobile and desktop work at shared desks.',
    ['skills', 'process', 'drive-workshop'],
  ],
  [
    'client-review',
    'Client review',
    'A client and manager look at the same storefront in the meeting room.',
    [],
  ],
  [
    'founder-office',
    'Founder’s office',
    'The visitor’s view across the founder’s desk and its warm lamp.',
    ['contact', 'drive-office'],
  ],
];
// Literal asset paths also allow the self-contained review build to embed them.
const roomViews = [
  ['/studio/entrance.webp', '/studio/entrance-mobile.webp'],
  ['/studio/reception.webp', '/studio/reception-mobile.webp'],
  ['/studio/project-room.webp', '/studio/project-room-mobile.webp'],
  ['/studio/development-studio.webp', '/studio/development-studio-mobile.webp'],
  ['/studio/client-review.webp', '/studio/client-review-mobile.webp'],
  ['/studio/founder-office.webp', '/studio/founder-office-mobile.webp'],
];
const redProjectViews = ['/studio/project-room-red.webp', '/studio/project-room-red-mobile.webp'];

function RoomView({ index, colour, staticPhoto = false }) {
  const views = index === 2 && colour?.name === 'Red' ? redProjectViews : roomViews[index];
  return (
    <picture>
      <source media="(max-width:760px)" srcSet={views[1]} />
      <img
        className={staticPhoto ? 'studio-static-photo' : 'studio-poster'}
        src={views[0]}
        alt={rooms[index][2]}
        loading={staticPhoto && index > 0 ? 'lazy' : 'eager'}
        fetchPriority={index === 0 ? 'high' : 'auto'}
      />
    </picture>
  );
}

// The entrance is at the left. The central gallery runs between the work rooms
// and finishes at the founder’s desk. Numerals correspond to the directory links.
const planStops = [[12, 42], [63, 54], [110, 54], [161, 25], [211, 54], [262, 40]];
function FloorPlan({ active }) {
  return (
    <svg className="studio-plan" viewBox="0 0 291 80" aria-hidden="true">
      <path className="plan-footprint" d="M32 33V8H282V71H32V48 M82 8V28 M82 48V71 M133 8V28 M133 48V71 M184 8V28 M184 48V71 M235 8V28 M235 48V71" />
      <path className="plan-route" d="M12 42H48L63 54L78 40H95L110 54L125 40H145L161 25L177 40H196L211 54L227 40H262" />
      {planStops.map(([x, y], i) => (
        <g key={i} className={i === active ? 'plan-current' : 'plan-stop'}>
          <circle cx={x} cy={y} r="8.3" />
          <text x={x} y={y} dy=".34em" textAnchor="middle">{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

function StudioMark() {
  return (
    <span className="studio-wordmark">
      <span className="studio-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      Fazhere <em>Studio</em>
    </span>
  );
}

function RoomMenu({ active }) {
  const menu = useRef(null);
  useEffect(() => {
    function outside(event) {
      if (!menu.current?.contains(event.target)) menu.current.open = false;
    }
    function escape(event) {
      if (event.key !== 'Escape' || !menu.current.open) return;
      menu.current.open = false;
      menu.current.querySelector('summary').focus();
    }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  return (
    <details className="studio-directory" ref={menu}>
      <summary>
        <Map size={17} aria-hidden="true" />
        Jump to a room
        <ChevronDown size={14} aria-hidden="true" />
      </summary>
      <nav aria-label="Room directory">
        <FloorPlan active={active} />
        {rooms.map(([id, label], i) => (
          <a
            key={id}
            href={'#' + id}
            aria-current={active === i ? 'location' : undefined}
            onClick={(event) => {
              if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
              menu.current.open = false;
              requestAnimationFrame(() => document.getElementById(id)?.focus({ preventScroll: true }));
            }}
          >
            <small>{String(i + 1).padStart(2, '0')}</small>
            {label}
          </a>
        ))}
      </nav>
    </details>
  );
}

export default function App() {
  const [room, setRoom] = useState(0);
  const [colour, setColour] = useState(shopColours[0]);
  const [render, setRender] = useState('still');
  const [paused, setPaused] = useState(false);
  const [limited, setLimited] = useState(false);
  const explicitMotion = useRef(false);
  const [canToggle, setCanToggle] = useState(false);
  const stage = useRef(null),
    header = useRef(null),
    chapters = useRef(null);
  const host = useRef(null),
    progress = useRef(0);

  useEffect(() => {
    const restored = shopColours.find((choice) => choice.name === history.state?.studioColour);
    if (restored) setColour(restored);
  }, []);
  function selectColour(choice) {
    setColour(choice);
    history.replaceState({ ...history.state, studioColour: choice.name }, '');
    window.dispatchEvent(new CustomEvent('studio:product-colour', {
      detail: { colour: choice.name, photo: choice.photo },
    }));
  }

  useEffect(() => {
    const sections = [...chapters.current.querySelectorAll('[data-office-room]')];
    let anchors = [],
      readingHeight = 0,
      tick = 0;
    function measure() {
      const mobile = matchMedia('(max-width:760px)').matches;
      const top = header.current.offsetHeight + (mobile ? stage.current.offsetHeight : 0);
      readingHeight = Math.max(1, innerHeight - top);
      anchors = sections.map((el) => el.getBoundingClientRect().top + scrollY - top);
      update();
    }
    function update() {
      tick = 0;
      const y = scrollY + 1;
      let i = 0;
      while (i + 1 < anchors.length && y >= anchors[i + 1]) i++;
      // A short first stride opens the door. Later turns start as the last
      // half-screen of the current room’s reading panel leaves the viewport.
      let travel = 0;
      if (i + 1 < anchors.length) {
        const stride = i === 0 ? 130 : readingHeight * 0.56;
        const start = i === 0 ? anchors[0] : anchors[i + 1] - stride;
        travel = Math.max(0, Math.min(1, (scrollY - start) / stride));
      }
      progress.current = i + travel;
      setRoom(Math.round(progress.current));
    }
    function scroll() {
      if (!tick) tick = requestAnimationFrame(update);
    }
    const observer = new ResizeObserver(measure);
    for (const element of [...sections, header.current, stage.current]) observer.observe(element);
    measure();
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('pageshow', measure);
    // Fragment navigation on a client-rendered development build may precede React.
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target && !scrollY) target.scrollIntoView({ behavior: 'instant' });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(tick);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('pageshow', measure);
    };
  }, []);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let engine,
      generation = 0,
      timer;
    function stop() {
      generation++;
      clearTimeout(timer);
      engine?.dispose();
      engine = null;
      setRender('still');
    }
    function start() {
      stop();
      const allowed = !reduce.matches && !navigator.connection?.saveData;
      setCanToggle(allowed);
      if (!allowed || paused) return;
      const ticket = generation;
      timer = setTimeout(async () => {
        try {
          const { startOffice } = await import('./studio/engine.js');
          if (ticket !== generation || !host.current) return;
          engine = startOffice(host.current, {
            readPosition: () => progress.current,
            onSlow: () => {
              if (ticket !== generation || explicitMotion.current) return;
              setLimited(true);
              setPaused(true);
            },
            onReady: () => {
              if (ticket === generation) setRender('live');
            },
            onFailure: () => {
              if (ticket === generation) {
                stop();
                setCanToggle(false);
              }
            },
          });
        } catch {
          if (ticket === generation) {
            stop();
            setCanToggle(false);
          }
        }
      }, 120);
    }
    start();
    reduce.addEventListener('change', start);
    return () => {
      reduce.removeEventListener('change', start);
      stop();
    };
  }, [paused]);

  return (
    <div
      className="studio-tour"
      data-room={rooms[room][0]}
      data-render={render}
      data-motion={limited ? 'limited' : paused ? 'paused' : 'auto'}
    >
      <a href="#main" className="skip-link">
        Skip to the tour
      </a>
      <header className="studio-masthead" ref={header}>
        <a href="#entrance" aria-label="Fazhere Studio, entrance">
          <StudioMark />
        </a>
        <span className="studio-address"><MapPin size={15} aria-hidden="true" /> Kozhikode, Kerala</span>
        <div className="studio-header-tools">
          <RoomMenu active={room} />
          <a
            className="studio-contact-short"
            href={tourWhatsapp}
            data-contact="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={17} aria-hidden="true" />
            <span>Talk to Favas</span>
          </a>
        </div>
      </header>
      <main className="studio-main" id="main" tabIndex={-1}>
        <figure className="studio-stage" ref={stage} aria-label={'Office view: ' + rooms[room][1]}>
          <div className="studio-viewport">
            <RoomView index={room} colour={colour} />
            <div className="studio-canvas" ref={host} aria-hidden="true" />
            <div className="studio-media-tools">
              {canToggle && (
                <button
                  type="button"
                  className={'studio-sound' + (limited ? ' studio-retry' : '')}
                  aria-label={paused ? 'Resume 3D animation' : 'Pause 3D animation'}
                  title={paused ? 'Resume 3D visit' : 'Use still room views'}
                  onClick={() => {
                    if (paused) explicitMotion.current = true;
                    setLimited(false);
                    setPaused(!paused);
                  }}
                >
                  {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
                  {limited && <span>Resume 3D</span>}
                </button>
              )}
              <StudioSound />
            </div>
          </div>
          <figcaption className="studio-filmstrip">
            <div>
              <span className="studio-frame-count">{String(room + 1).padStart(2, '0')} / 06</span>
              <strong>{rooms[room][1]}</strong>
            </div>
            <nav aria-label="Tour stops">
              {rooms.map(([id, label], i) => (
                <a
                  key={id}
                  aria-label={'Go to ' + label}
                  aria-current={room === i ? 'location' : undefined}
                  href={'#' + id}
                  title={label}
                >
                  <i />
                  <span>{label}</span>
                </a>
              ))}
            </nav>
          </figcaption>
        </figure>
        <div className="studio-chapters" ref={chapters}>
          {rooms.map(([id, label, , aliases], i) => (
            <section
              key={id}
              id={id}
              data-office-room=""
              className="studio-room"
              tabIndex={-1}
              aria-label={label}
            >
              {aliases.map((alias) => (
                <span key={alias} id={alias} className="studio-anchor" aria-hidden="true" />
              ))}
              <noscript>
                <RoomView index={i} staticPhoto />
              </noscript>
              <div className="studio-room-inner">
                <div className="studio-place">
                  <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <b>{label}</b>
                  {i === 0 && <small>Kozhikode, Kerala</small>}
                </div>
                <RoomContent index={i} colour={colour} onSelectColour={selectColour} />
              </div>
            </section>
          ))}
        </div>
      </main>
      <footer className="studio-footer">
        <a href="#entrance">
          <StudioMark />
        </a>
        <span>
          <MapPin size={14} aria-hidden="true" /> Kozhikode, Kerala
        </span>
        <a href="/privacy/">Privacy</a>
        <AnalyticsPreference />
      </footer>
      <noscript>
        <style>
          {
            '.studio-stage{display:none!important}.studio-main{display:block!important}.studio-tour .studio-room{min-height:0;padding:2em;scroll-margin-top:var(--studio-header)}.studio-room-inner{width:min(100%,46rem);margin:1.5rem auto}.studio-static-photo{width:min(100%,70rem);margin:auto}.studio-chapters .studio-room{display:block}.studio-tour .studio-anchor{scroll-margin-top:var(--studio-header)}'
          }
        </style>
      </noscript>
    </div>
  );
}
