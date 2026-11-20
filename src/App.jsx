import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, MapPin, MessageCircle, Pause, Play } from 'lucide-react';
import { fabea, luxvibe, profile, project } from './data/portfolio.js';
import { PHONE_DISPLAY, PHONE_HREF, services, whatsappHref } from './data/site.js';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';
import Exhibit, { LayoutReview } from './variable/Exhibit.jsx';
import './variable/visit.css';

const stops = ['home', 'work', 'process', 'contact'];
const pictures = [
  ['/variable/arrival.webp', '/variable/arrival-mobile.webp'],
  ['/variable/work.webp', '/variable/work-mobile.webp'],
  ['/variable/process.webp', '/variable/process-mobile.webp'],
  ['/variable/contact.webp', '/variable/contact-mobile.webp'],
];
const narrowWork = '/variable/work-compact.webp';
const wideMobileWork = '/variable/work-wide-mobile.webp';
const views = [
  'A suspended cobalt fin curves above the orange width control in the projection studio.',
  'The operator’s table faces a luminous project surface between two cobalt fins.',
  'The review wall sits at a right angle to the project surface.',
  'A sheet for your brief sits between the blue fins of the studio.',
];
const enquiries = {
  Website: 'a website',
  'Online store': 'an online store',
  'Web app': 'a web app',
};
const contactURL = (choice) =>
  whatsappHref(
    choice
      ? 'Hi Favas, I’d like to discuss ' + enquiries[choice] + ' for my business.'
      : 'Hi Favas, I’d like to discuss a project for my business.',
  );
const aliases = {
  home: ['entrance', 'about'],
  work: ['projects', 'project-room', 'demonstration', 'drive-gymdrobe', 'drive-fabea', 'drive-luxvibe'],
  process: [
    'skills',
    'services',
    'reception',
    'development-studio',
    'client-review',
    'drive-map',
    'drive-controls',
    'drive-workshop',
  ],
  contact: ['founder-office', 'drive-office'],
};

function Still({ stop, width, first = false }) {
  const [desktop, mobile] = pictures[stop];
  return (
    <picture>
      <source media="(max-width: 740px)" srcSet={stop === 1 && width >= 0.5 ? wideMobileWork : mobile} />
      <img
        className="vw-scene-poster"
        src={stop === 1 && width < 0.5 ? narrowWork : desktop}
        alt={views[stop]}
        fetchPriority={first ? 'high' : 'auto'}
      />
    </picture>
  );
}

function Signature() {
  return (
    <span className="vw-signature">
      <img src="/variable/studio-mark.svg" alt="" width="31" height="31" />
      Fazhere Studio
    </span>
  );
}

function Navigation({ stop }) {
  return (
    <header className="vw-header">
      <a href="#home" aria-label="Fazhere Studio, home">
        <Signature />
      </a>
      <nav aria-label="Studio visit">
        {stops.slice(1).map((id, index) => (
          <a key={id} href={'#' + id} aria-current={stop === index + 1 ? 'location' : undefined}>
            {id}
          </a>
        ))}
      </nav>
      <a className="vw-header-contact" href={contactURL()} data-contact="whatsapp">
        <MessageCircle size={16} aria-hidden="true" />
        <span>Talk to Favas</span>
      </a>
    </header>
  );
}

function VisitSection({ id, children }) {
  return (
    <section className={'vw-chapter vw-' + id} id={id} tabIndex={-1} data-visit-chapter>
      {aliases[id].map((alias) => (
        <span className="vw-anchor" id={alias} key={alias} aria-hidden="true" />
      ))}
      <noscript>
        <div className="vw-noscript-scene">
          <Still stop={stops.indexOf(id)} width={0} />
        </div>
      </noscript>
      {children}
    </section>
  );
}

function Offerings() {
  return (
    <div className="vw-directory">
      <div>
        <h3>Services</h3>
        <ul>
          {services.map(({ name, slug, short }) => (
            <li key={slug}>
              <a href={'/services/' + slug + '/'}>
                <span>
                  <strong>{name}</strong>
                  <small>{short}</small>
                </span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Other projects</h3>
        <ul>
          {[fabea, luxvibe].map((item, i) => (
            <li key={item.name}>
              <a href={item.caseStudy}>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {i === 0
                      ? 'An editorial bags and heels storefront concept.'
                      : 'A boutique shopping concept with a WhatsApp enquiry bag.'}
                  </small>
                </span>
                <ArrowUpRight size={18} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Brief() {
  const [choice, setChoice] = useState(null);
  return (
    <div className="vw-brief">
      <p className="vw-kicker">Start a conversation</p>
      <h2>
        Your project<span>.</span>
      </h2>
      <p className="vw-question">What would you like your customers to be able to do?</p>
      <fieldset>
        <legend>
          Project type <span>(optional)</span>
        </legend>
        {Object.keys(enquiries).map((type) => (
          <label key={type}>
            <input
              type="radio"
              name="brief-type"
              value={type}
              checked={choice === type}
              onChange={() => setChoice(type)}
            />
            <span>{type}</span>
          </label>
        ))}
      </fieldset>
      <a className="vw-button" data-contact="whatsapp" href={contactURL(choice)}>
        <MessageCircle size={18} aria-hidden="true" />
        Talk to Favas on WhatsApp
      </a>
      <a className="vw-email" href={'mailto:' + profile.email} data-contact="email">
        {profile.email}
      </a>
    </div>
  );
}

function Footer() {
  return (
    <footer className="vw-footer">
      <a href="#home">
        <Signature />
      </a>
      <div>
        <a href="/contact/">Project enquiry</a>
        <a href={PHONE_HREF}>{PHONE_DISPLAY}</a>
        <a href={profile.github}>GitHub</a>
        <a href={profile.linkedin}>LinkedIn</a>
        <a href={project.repository}>GymDrobe source</a>
        <a href="/privacy/">Privacy</a>
      </div>
      <AnalyticsPreference />
    </footer>
  );
}

export default function App() {
  const host = useRef(null);
  const main = useRef(null);
  const pose = useRef({ progress: 0, width: 1 });
  const [width, setWidth] = useState(1);
  const [stop, setStop] = useState(0);
  const [render, setRender] = useState('still');
  const [paused, setPaused] = useState(false);
  const [canToggle, setCanToggle] = useState(false);
  const explicitMotion = useRef(false);

  useEffect(() => {
    performance.mark('vw-interactive');
    const restored = history.state?.variableProof?.width;
    setWidth(Number.isFinite(restored) ? restored : matchMedia('(max-width:740px)').matches ? 0 : 1);
  }, []);
  useEffect(() => {
    pose.current.width = width;
  }, [width]);

  useEffect(() => {
    const sections = Array.from(main.current.querySelectorAll('[data-visit-chapter]'));
    let anchors = [];
    let frame;
    function update() {
      frame = 0;
      const y = window.scrollY;
      let index = 0;
      while (index + 1 < anchors.length && y + 1 >= anchors[index + 1]) index++;
      let amount = 0;
      if (index + 1 < anchors.length) {
        if (index === 0) {
          const stride = Math.min(anchors[1] - anchors[0], Math.max(240, innerHeight * 0.53));
          amount = Math.min(1, Math.max(0, (y - anchors[0]) / stride));
        } else {
          // Hold the working surface until the final part of the chapter leaves view.
          const stride = Math.min(innerHeight * 0.45, anchors[index + 1] - anchors[index]);
          amount = Math.min(1, Math.max(0, (y - anchors[index + 1] + stride) / stride));
        }
      }
      pose.current.progress = index + amount;
      host.current.dataset.progress = pose.current.progress.toFixed(3);
      setStop(Math.round(pose.current.progress));
    }
    function measure() {
      anchors = sections.map((el) => el.getBoundingClientRect().top + scrollY);
      update();
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    const observer = new ResizeObserver(measure);
    sections.forEach((el) => observer.observe(el));
    measure();
    const linked = location.hash && document.getElementById(location.hash.slice(1));
    if (linked && !window.scrollY) linked.scrollIntoView({ behavior: 'instant' });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('pageshow', measure);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('pageshow', measure);
    };
  }, []);

  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let engine,
      generation = 0,
      timer;
    function stopScene() {
      generation++;
      clearTimeout(timer);
      engine?.dispose();
      engine = null;
      setRender('still');
    }
    function connect() {
      stopScene();
      const allowed = !preference.matches && !navigator.connection?.saveData;
      setCanToggle(allowed);
      if (!allowed || paused) return;
      const ticket = generation;
      timer = setTimeout(async () => {
        try {
          const { mountScene } = await import('./variable/scene.js');
          if (ticket !== generation || !host.current) return;
          engine = mountScene(host.current, {
            readState: () => pose.current,
            onReady: () => {
              if (ticket === generation) setRender('live');
            },
            onSlow: () => {
              if (ticket === generation && !explicitMotion.current) setPaused(true);
            },
            onFailure: () => {
              if (ticket !== generation) return;
              stopScene();
              setCanToggle(false);
            },
          });
        } catch {
          if (ticket === generation) {
            stopScene();
            setCanToggle(false);
          }
        }
      }, 120);
    }
    connect();
    preference.addEventListener('change', connect);
    return () => {
      preference.removeEventListener('change', connect);
      stopScene();
    };
  }, [paused]);

  return (
    <div className="vw-visit" data-stop={stops[stop]} data-render={render}>
      <a className="skip-link" href="#work">
        Skip to my work
      </a>
      <Navigation stop={stop} />
      <div className="vw-stage">
        <Still stop={stop} width={width} first={stop === 0} />
        <div className="vw-scene" ref={host} data-progress="0" aria-hidden="true" />
      </div>
      <main ref={main} className="vw-main">
        <VisitSection id="home">
          <div className="vw-opening-copy">
            <p className="vw-kicker">
              <span className="vw-stud" aria-hidden="true" />
              Independent software developer
            </p>
            <h1>
              Muhammed
              <br />
              Favas K<span aria-hidden="true">.</span>
            </h1>
            <p className="vw-offer">I build websites, online stores, and web apps for businesses.</p>
            <div className="vw-actions">
              <a className="vw-button" href="#work">
                Explore my work
              </a>
              <a className="vw-text-action" data-contact="whatsapp" href={contactURL()}>
                Talk to Favas
              </a>
            </div>
          </div>
          <p className="vw-location">
            <MapPin size={15} aria-hidden="true" />
            Kozhikode, Kerala
          </p>
        </VisitSection>
        <VisitSection id="work">
          <div className="vw-work-layout">
            <div className="vw-work-intro">
              <p className="vw-kicker">Working exhibit</p>
              <h2>
                GymDrobe<span>.</span>
              </h2>
              <p>I founded GymDrobe and built its storefront, product selection and checkout.</p>
              <p>
                Find the compression shirt and open its details. Narrow the projection to see how the same
                product fits a phone.
              </p>
            </div>
            <div className="vw-exhibit-slot">
              <Exhibit width={width} onWidthChange={setWidth} />
            </div>
          </div>
        </VisitSection>
        <VisitSection id="process">
          <div className="vw-process-layout">
            <div className="vw-process-intro">
              <p className="vw-kicker">Design review</p>
              <h2>
                Review the layout<span>.</span>
              </h2>
              <p>
                When the product image fills a phone screen, where should the shopping action go? Compare
                two illustrative proposals and choose the placement you’d approve for your store.
              </p>
            </div>
            <LayoutReview />
          </div>
          <Offerings />
        </VisitSection>
        <VisitSection id="contact">
          <Brief />
        </VisitSection>
      </main>
      {canToggle && (
        <button
          className="vw-motion"
          type="button"
          aria-label={paused ? 'Resume 3D motion' : 'Use still views'}
          onClick={() => {
            if (paused) explicitMotion.current = true;
            setPaused(!paused);
          }}
        >
          {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          <span>{paused ? 'Resume 3D' : 'Still view'}</span>
        </button>
      )}
      <Footer />
      <noscript>
        <style>
          {
            '.vw-stage,.vw-motion{display:none}.vw-noscript-scene{position:absolute;inset:0;height:100svh;z-index:-1}.vw-noscript-scene img{width:100%;height:100%;object-fit:cover}'
          }
        </style>
      </noscript>
    </div>
  );
}
