import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, MessageCircle, Pause, Play } from 'lucide-react';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';
import { project, profile } from './data/portfolio.js';
import { whatsappHref } from './data/site.js';
import {
  AppointmentRooms,
  ProjectLink,
  ReceptionRoom,
  StudioRoom,
  LandingRoom,
  OfficeRoom,
} from './appointment/Rooms.jsx';
import { ScreenStill } from './appointment/ScreenStill.jsx';
import { StudioSound } from './appointment/StudioSound.jsx';
import { chapters, chapterAt } from './appointment/visit.js';
import './appointment/visit.css';

const aliases = {
  arrival: ['home', 'entrance'],
  pavement: ['about'],
  reception: ['work', 'projects', 'project-room', 'demonstration', 'drive-gymdrobe'],
  studio: [
    'skills',
    'services',
    'development-studio',
    'client-review',
    'drive-map',
    'drive-controls',
    'drive-workshop',
  ],
  landing: ['process'],
  office: ['contact', 'founder-office', 'drive-office'],
};
const views = [
  'The passenger window frames the studio and its upstairs office.',
  'A sheltered entrance and timber screens face the wet pavement.',
  'From the sheltered threshold, the open glass door leads into reception.',
  'The working floor looks across to the courtyard stair.',
  'The stair landing brings the courtyard branches to eye level.',
  'From the guest chair the office window looks back toward the parked car.',
];
const whatsApp = whatsappHref('Hi Favas, I’d like to discuss a project for my business.');

function Wordmark() {
  return (
    <a className="ap-mark" href="#arrival" aria-label="Fazhere Studio home">
      <img src="/variable/studio-mark.svg" alt="" width="27" height="27" />
      Fazhere Studio
    </a>
  );
}

function Header() {
  const menu = useRef(null);
  useEffect(() => {
    const close = (e) => {
      if (!menu.current?.contains(e.target)) menu.current.open = false;
    };
    const escape = (e) => {
      if (e.key === 'Escape' && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector('summary').focus();
      }
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', escape);
    };
  }, []);
  return (
    <header className="ap-header">
      <Wordmark />
      <div className="ap-nav">
        <details ref={menu} className="ap-browse">
          <summary aria-label="Browse portfolio">
            Browse<span className="ap-long">&nbsp;portfolio</span> <ChevronDown size={14} />
          </summary>
          <nav
            aria-label="Portfolio"
            onClick={(e) => {
              if (e.target.closest('a')) menu.current.open = false;
            }}
          >
            <a href="#reception">Skip to GymDrobe</a>
            <a href="/services/">Services</a>
            <a href="#landing">How I work</a>
            <a href="#office">Go to founder’s office</a>
            <a href="/contact/">Project enquiry</a>
          </nav>
        </details>
        <a className="ap-header-chat" aria-label="Chat on WhatsApp" href={whatsApp} data-contact="whatsapp">
          <MessageCircle size={16} aria-hidden="true" />
          <span>
            <span className="ap-long">Chat on </span>WhatsApp
          </span>
        </a>
      </div>
    </header>
  );
}

function Still({ chapter, projectUrl, first = false }) {
  const index = chapters.indexOf(chapter);
  return (
    <>
      <picture>
        <source media="(max-width: 760px)" srcSet={chapter.compact} />
        <img
          className="ap-poster"
          src={chapter.wide}
          alt={views[index]}
          fetchPriority={first ? 'high' : 'auto'}
        />
      </picture>
      <ScreenStill chapter={chapter} projectUrl={projectUrl} />
    </>
  );
}

function Room({ chapter, children }) {
  return (
    <section id={chapter.id} className={'ap-room ap-' + chapter.id} data-room={chapter.id} tabIndex={-1}>
      {aliases[chapter.id]?.map((id) => (
        <span key={id} className="ap-anchor" id={id} aria-hidden="true" />
      ))}
      <noscript>
        <div className="ap-static-view">
          <Still chapter={chapter} />
        </div>
      </noscript>
      <div className="ap-room-inner">{children}</div>
    </section>
  );
}

function Arrival() {
  return (
    <div className="ap-invitation">
      <p className="ap-place">The Appointment <span aria-hidden="true">/</span> Virtual studio, Kozhikode</p>
      <h1 className="ap-byline">
        Muhammed Favas K <span className="ap-role">· Full-stack developer</span>
      </h1>
      <p className="ap-offer">I build websites and apps that help businesses grow.</p>
      <div className="ap-opening-links">
        <ProjectLink id="gymdrobe" className="ap-featured-link" aria-label="View GymDrobe">
          <img src={project.screenshot} alt={project.screenshotAlt} width="1348" height="926" />
          <span>
            <strong>View GymDrobe</strong>
            <small>The fitness store I founded</small>
          </span>
          <ArrowUpRight size={18} aria-hidden="true" />
        </ProjectLink>
        <a className="ap-action ap-chat" href={whatsApp} data-contact="whatsapp">
          <MessageCircle size={17} aria-hidden="true" />
          Chat on WhatsApp
        </a>
        <a className="ap-cue" href="#pavement">
          <ArrowDown size={15} aria-hidden="true" />
          Scroll to step outside
        </a>
      </div>
    </div>
  );
}

function Outside() {
  return (
    <div>
      <p className="ap-eyebrow">The entrance</p>
      <h2>
        Come <em>inside.</em>
      </h2>
      <p className="ap-copy">
        Welcome to my virtual studio in Kozhikode. The window above the rain tree is my office. On the way up,
        I’ll show you the store I founded and built.
      </p>
      <div className="ap-route-links">
        <a href="#reception">See the project room</a>
        <a href="#office">Go to founder’s office</a>
      </div>
    </div>
  );
}

function useVisit(main, stage, engine, position, setChapter) {
  useEffect(() => {
    const sections = Array.from(main.current.querySelectorAll('[data-room]'));
    const media = window.matchMedia('(max-width: 760px)');
    let frame = 0,
      offsets = [];
    function update() {
      frame = 0;
      const y = window.scrollY;
      let i = 0;
      while (i < offsets.length - 1 && y >= offsets[i + 1] - 1) i++;
      const part =
        i < offsets.length - 1
          ? Math.max(0, Math.min(1, (y - offsets[i]) / Math.max(1, offsets[i + 1] - offsets[i])))
          : 0;
      // Hold the work and service screens for reading; the final length of their rooms moves the camera on.
      const travel = i < 2 ? part : Math.max(0, (part - 0.48) / 0.52);
      position.current =
        chapters[i].progress + travel * ((chapters[i + 1]?.progress ?? 1) - chapters[i].progress);
      stage.current.dataset.progress = position.current.toFixed(4);
      setChapter(chapterAt(position.current));
      engine.current?.invalidate();
    }
    function measure() {
      const top = parseFloat(getComputedStyle(sections[0]).scrollMarginTop) || 0;
      offsets = sections.map((el) => Math.max(0, el.getBoundingClientRect().top + scrollY - top));
      update();
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(measure);
    sections.forEach((el) => observer.observe(el));
    observer.observe(stage.current);
    measure();
    if (location.hash && !window.scrollY)
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pageshow', measure);
    window.addEventListener('resize', measure);
    media.addEventListener('change', measure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('pageshow', measure);
      window.removeEventListener('resize', measure);
      media.removeEventListener('change', measure);
    };
  }, [main, stage, engine, position, setChapter]);
}

function Footer() {
  return (
    <footer className="ap-footer">
      <Wordmark />
      <nav aria-label="Footer">
        <a href="/services/">Services</a>
        <a href="/contact/">Project enquiry</a>
        <a href={profile.github}>GitHub</a>
        <a href={profile.linkedin}>LinkedIn</a>
        <a href="/privacy/">Privacy</a>
      </nav>
      <AnalyticsPreference />
    </footer>
  );
}

export default function App() {
  const main = useRef(null),
    stage = useRef(null),
    canvas = useRef(null),
    engine = useRef(null);
  const position = useRef(0),
    currentProject = useRef(project.screenshot),
    inspecting = useRef(false);
  const [deskProject, setDeskProject] = useState(project.screenshot);
  const [isInspecting, showInspecting] = useState(false);
  const [chapter, setChapter] = useState(chapters[0]);
  const [slow, setSlow] = useState(false);
  const [motion, setMotion] = useState('auto'),
    [render, setRender] = useState('still'),
    [canSwitch, setCanSwitch] = useState(false);
  const index = chapters.indexOf(chapter);
  useVisit(main, stage, engine, position, setChapter);
  const setProject = useCallback((url) => {
    currentProject.current = url;
    setDeskProject(url);
    engine.current?.invalidate();
  }, []);
  const explore = useRef(false);
  const setInspecting = useCallback((value) => {
    inspecting.current = value;
    showInspecting(value);
    engine.current?.invalidate();
  }, []);
  useEffect(() => {
    try {
      if (sessionStorage.getItem('appointment-motion') === 'still') setMotion('still');
    } catch {}
  }, []);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let generation = 0,
      timeout = 0,
      idle = 0;
    let removeIntent = () => {};
    function reset() {
      generation++;
      removeIntent();
      clearTimeout(timeout);
      window.cancelIdleCallback?.(idle);
      engine.current?.dispose();
      engine.current = null;
      setRender('still');
    }
    function connect() {
      reset();
      const allowed = !preference.matches && !navigator.connection?.saveData;
      setCanSwitch(allowed);
      if (!allowed || motion === 'still') return;
      const ticket = generation;
      const begin = async () => {
        try {
          const { mountStudio } = await import('./appointment/scene.js');
          if (ticket !== generation) return;
          engine.current = mountStudio(canvas.current, {
            progress: () => position.current,
            project: () => currentProject.current,
            isPaused: () => inspecting.current,
            onReady: () => {
              if (ticket === generation) setRender('live');
            },
            onSlow: () => {
              if (ticket === generation) setSlow(true);
            },
            onFailure: (reason) => {
              if (ticket === generation) {
                reset();
                if (reason === 'slow-device') setMotion('still');
                else setCanSwitch(false);
              }
            },
          });
        } catch {
          if (ticket === generation) {
            reset();
            setCanSwitch(false);
          }
        }
      };
      function startAfterInput() {
        if (ticket !== generation || inspecting.current) return;
        removeIntent();
        explore.current = true;
        if ('requestIdleCallback' in window) idle = window.requestIdleCallback(begin, { timeout: 180 });
        else timeout = window.setTimeout(begin, 0);
      }
      function key(event) {
        if (
          ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key) &&
          !event.target.closest('input,textarea,select,dialog')
        )
          startAfterInput();
      }
      if (explore.current || scrollY > 2) startAfterInput();
      else {
        window.addEventListener('scroll', startAfterInput, { passive: true });
        window.addEventListener('wheel', startAfterInput, { passive: true });
        canvas.current.parentElement.addEventListener('touchmove', startAfterInput, { passive: true });
        window.addEventListener('keydown', key);
        const view = canvas.current.parentElement;
        removeIntent = () => {
          window.removeEventListener('scroll', startAfterInput);
          window.removeEventListener('wheel', startAfterInput);
          view.removeEventListener('touchmove', startAfterInput);
          window.removeEventListener('keydown', key);
        };
      }
    }
    connect();
    preference.addEventListener('change', connect);
    return () => {
      preference.removeEventListener('change', connect);
      reset();
    };
  }, [motion]);
  function toggleMotion() {
    const next = motion === 'still' ? 'auto' : 'still';
    try {
      sessionStorage.setItem('appointment-motion', next);
    } catch {}
    if (next === 'auto') explore.current = true;
    setSlow(false);
    setMotion(next);
  }
  return (
    <AppointmentRooms onProjectChange={setProject} onInspecting={setInspecting}>
      <div className="ap-visit" data-render={render} data-chapter={chapter.id}>
        <a className="skip-link" href="#reception">
          Skip to GymDrobe
        </a>
        <Header />
        <div className="ap-layout">
          <div ref={stage} className="ap-stage" data-progress="0">
            <div className="ap-view">
              <Still chapter={chapter} projectUrl={deskProject} first={chapter.id === 'arrival'} />
              <canvas ref={canvas} className="ap-canvas" aria-hidden="true" />
            </div>
            <div className="ap-viewbar">
              <p>{chapter.label}</p>
              <div className="ap-controls">
                <StudioSound chapter={chapter} inspecting={isInspecting} />
                {canSwitch && (
                  <button
                    type="button"
                    className={slow ? 'ap-slow-option' : undefined}
                    onClick={toggleMotion}
                    aria-label={motion === 'still' ? 'Enable 3D movement' : 'Use still views'}
                    title={motion === 'still' ? 'Enable 3D movement' : 'Use still views'}
                  >
                    {motion === 'still' ? <Play size={16} /> : <Pause size={16} />}{' '}
                    {slow && <span>Use stills</span>}
                  </button>
                )}
                {index > 0 && (
                  <a
                    href={'#' + chapters[index - 1].id}
                    aria-label={'Previous room: ' + chapters[index - 1].label}
                  >
                    <ChevronLeft size={18} />
                  </a>
                )}
                {index < chapters.length - 1 && (
                  <a
                    href={'#' + chapters[index + 1].id}
                    aria-label={'Next room: ' + chapters[index + 1].label}
                  >
                    <ChevronRight size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
          <main ref={main} className="ap-main">
            <Room chapter={chapters[0]}>
              <Arrival />
            </Room>
            <Room chapter={chapters[1]}>
              <Outside />
            </Room>
            <Room chapter={chapters[2]}>
              <ReceptionRoom />
            </Room>
            <Room chapter={chapters[3]}>
              <StudioRoom />
            </Room>
            <Room chapter={chapters[4]}>
              <LandingRoom />
            </Room>
            <Room chapter={chapters[5]}>
              <OfficeRoom />
            </Room>
          </main>
        </div>
        <Footer />
        <noscript>
          <style>
            {
              '.ap-layout{display:block}.ap-stage{display:none}.ap-main{width:100%}.ap-room{min-height:0;display:block;padding-block:2rem}.ap-static-view{display:block;height:min(48vh,420px);margin-bottom:2rem}.ap-cue,.ap-controls{display:none}'
            }
          </style>
        </noscript>
      </div>
    </AppointmentRooms>
  );
}
