import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { profile, project, skills } from './data/portfolio.js';
import { services, processSteps, PHONE_HREF, PHONE_DISPLAY, whatsappHref } from './data/site.js';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';
import { characterAsset, tourSteps, tourDurationSeconds } from './guide/tourConfig.js';
import { useGuidedTour } from './guide/useGuidedTour.js';
import './studio.css';
import { StudioWorkbench, ProcessWorkshop, StudioSetDecoration } from './experience/StudioInteractions.jsx';
import './experience/studioInteractions.css';

const Character = lazy(() => import('./guide/GuideCharacter.jsx'));
const Arrow = () => <span aria-hidden="true">↗</span>;
function External({ children, href, ...props }) { return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}<span className="sr-only"> (opens in a new tab)</span></a>; }
class CharacterBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function CharacterStage({ tour, staticMode, onHeroVisibility, chapter, gesture }) {
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [inHero, setInHero] = useState(true);
  const [wide, setWide] = useState(false);
  const [mobileTop, setMobileTop] = useState(null);
  const fail = useCallback(() => { setFailed(true); setReady(false); }, []);
  const mounted = useCallback(() => setReady(true), []);
  useEffect(() => {
    const idle = window.requestIdleCallback ? requestIdleCallback(() => setLoad(true), { timeout: 1800 }) : setTimeout(() => setLoad(true), 800);
    const position = () => {
      const slot = document.querySelector('.hero-character-space');
      setMobileTop(window.innerWidth <= 767 && slot ? slot.getBoundingClientRect().top + window.scrollY : null);
    };
    position();
    const layoutObserver = new ResizeObserver(position);
    const copy = document.querySelector('.welcome-copy'); if (copy) layoutObserver.observe(copy);
    window.addEventListener('resize', position);
    document.fonts?.ready.then(position);
    const observer = new IntersectionObserver(([entry]) => { setInHero(entry.isIntersecting); onHeroVisibility(entry.isIntersecting); }, { threshold: .12 });
    const hero = document.getElementById('home'); if (hero) observer.observe(hero);
    return () => { observer.disconnect(); layoutObserver.disconnect(); window.removeEventListener('resize', position); window.cancelIdleCallback ? cancelIdleCallback(idle) : clearTimeout(idle); };
  }, []);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1101px)');
    const update = () => setWide(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const compact = tour.active;
  const exploreGuide = !compact && !inHero && wide && chapter !== 'home';
  const chapterAction = { home: 'wave', about: 'welcome', services: 'present', projects: 'point', process: 'present', skills: 'present', contact: 'welcome' }[chapter] || 'idle';
  const stage = useRef(null);
  const previousBounds = useRef(null);
  useLayoutEffect(() => {
    const next = stage.current?.getBoundingClientRect();
    const previous = previousBounds.current;
    if (next && previous && !tour.reducedMotion) stage.current.animate([{ transform: `translate(${previous.left - next.left}px, ${previous.top - next.top}px) scale(${previous.width / next.width}, ${previous.height / next.height})`, transformOrigin: 'top left' }, { transform: 'none', transformOrigin: 'top left' }], { duration: 650, easing: 'cubic-bezier(.2,.7,.25,1)' });
    previousBounds.current = next;
  }, [compact, tour.reducedMotion]);
  const show3D = load && !staticMode && !failed;
  return <aside ref={stage} style={!compact && mobileTop !== null ? { top: mobileTop } : undefined} className={`character-stage ${compact ? 'compact-guide' : ''} ${exploreGuide ? 'explore-guide' : ''} ${ready && show3D ? 'character-ready' : ''} ${!inHero && !compact && !exploreGuide ? 'character-away' : ''}`} aria-label={characterAsset.description}>
    <div className="character-halo" aria-hidden="true"/>
    <img className="character-portrait" src={characterAsset.portrait} alt="An illustrated character concept of Favas, wearing his dark pinstripe suit and welcoming you." width="800" height="1200" decoding="async" fetchPriority="high"/>
    {show3D && <div className="character-canvas" aria-hidden="true"><CharacterBoundary onError={fail}><Suspense fallback={null}><Character modelUrl={characterAsset.model} clipNames={characterAsset.animations} action={tour.active ? tour.step.action : (gesture || chapterAction)} speaking={tour.speaking} paused={tour.hidden || (!inHero && !compact && !exploreGuide) || (tour.active && tour.state.status === 'paused')} reducedMotion={tour.reducedMotion} onReady={mounted} onError={fail}/></Suspense></CharacterBoundary></div>}
    <div className="character-label"><span className="live-dot"/>{characterAsset.label}<span className="sr-only"> — temporary likeness</span></div>
  </aside>;
}
function TourConsole({ tour, onInspect }) {
  const { state, step, dispatch } = tour;
  const play = () => {
    document.getElementById(step.target)?.scrollIntoView({ behavior: tour.reducedMotion ? 'instant' : 'smooth', block: 'start' });
    dispatch({ type: 'PLAY' });
  };
  if (!tour.active && state.status !== 'completed') return null;
  if (state.status === 'completed') return <aside className="tour-console tour-complete" aria-label="Tour complete"><div><span className="eyebrow">THANKS FOR DROPPING BY</span><p>Now, let’s talk about your idea.</p></div><a href="#contact" className="studio-button" onClick={tour.skip}>Let’s talk <Arrow/></a><button onClick={() => tour.start(state.sound)} className="tour-text-button">Replay tour</button><button onClick={tour.skip} className="tour-close" aria-label="Close tour">×</button></aside>;
  return <aside className="tour-console" aria-label="Guided portfolio tour">
    <div className="tour-topline"><span className="eyebrow"><span className={`speech-light ${tour.speaking ? 'is-speaking' : ''}`}/>FAVAS, YOUR GUIDE</span><span className="tour-counter">0{state.index + 1} / 0{tourSteps.length}</span><button className="tour-text-button" onClick={tour.skip}>Skip tour <span aria-hidden="true">×</span></button></div>
    <nav className="tour-chapters" aria-label="Tour chapters">{tourSteps.map((item, index) => <button key={item.id} aria-current={state.index === index ? 'step' : undefined} onClick={() => dispatch({ type: 'SELECT', index })} aria-label={`Go to ${item.title}`}><span/>{item.title}</button>)}</nav>
    <p className="tour-caption" role="status" aria-live="polite" aria-atomic="true">{step.segments[state.segment].text}</p>
    {state.blocked && <p className="tour-audio-note">Sound couldn’t start. Try Play, or turn sound off to continue with captions.</p>}
    {tour.capability === 'captions' && <p className="tour-audio-note">Voice isn’t available in this browser. Captions will guide you.</p>}
    <div className="tour-controls"><button className="tour-play" onClick={() => state.status === 'playing' ? dispatch({ type: 'PAUSE' }) : play()} aria-label={state.status === 'playing' ? 'Pause tour' : 'Play tour'}>{state.status === 'playing' ? 'Ⅱ Pause' : '▶ Play'}</button><button onClick={() => dispatch({ type: 'SOUND' })} aria-pressed={state.sound} aria-label={state.sound ? 'Turn sound off' : 'Turn sound on'}>{state.sound ? 'Sound on' : 'Sound off'}</button><span className="tour-control-spacer"/>{step.inspect && <button onClick={onInspect} className="tour-inspect">Inspect project <Arrow/></button>}<button onClick={() => dispatch({ type: 'PREVIOUS' })} disabled={state.index === 0} aria-label="Previous tour section">← <span className="control-word">Previous</span></button><button onClick={() => dispatch({ type: 'NEXT' })} aria-label="Next tour section">{state.index === tourSteps.length - 1 ? 'Finish' : 'Next'} →</button></div>
  </aside>;
}
function SectionLabel({ number, children }) { return <p className="section-index"><span>{number}</span>{children}<i aria-hidden="true"/></p>; }
export default function App() {
  const tour = useGuidedTour();
  const [staticMode, setStaticMode] = useState(false);
  const [chapter, setChapter] = useState('home');
  const [gesture, setGesture] = useState(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialog = useRef(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    // Observe the chapter occupying the reading area; no scroll hijacking.
    const ids = ['home', 'about', 'services', 'projects', 'process', 'skills', 'contact'];
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length) setChapter(visible[0].target.id);
    }, { rootMargin: '-15% 0px -55% 0px', threshold: [0, .2, .5] });
    ids.forEach(id => { const section = document.getElementById(id); if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, []);
  useEffect(() => setGesture(null), [chapter]);
  useEffect(() => { if (dialogOpen) dialog.current?.showModal(); }, [dialogOpen]);
  const inspect = () => { tour.dispatch({ type: 'PAUSE' }); setDialogOpen(true); };
  const browse = () => { tour.skip(); document.getElementById('services')?.scrollIntoView({ behavior: tour.reducedMotion ? 'instant' : 'smooth' }); };
  const navClick = () => { setMenuOpen(false); tour.dispatch({ type: 'PAUSE' }); };
  return <div className={`studio ${tour.active ? 'tour-active' : ''}`} data-tour-status={tour.state.status} data-chapter={chapter}>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="studio-header"><a className="studio-wordmark" href="#home" onClick={navClick} aria-label="Favas home"><span className="forge-mark" aria-hidden="true"><i/><i/><i/></span>favas<span>.</span></a><button className="studio-menu" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="studio-nav">{menuOpen ? 'Close' : 'Menu'}</button><nav id="studio-nav" className={menuOpen ? 'menu-open' : ''} aria-label="Main navigation"><a href="#services" onClick={navClick}>What I do</a><a href="#projects" onClick={navClick}>Selected work</a><a href="#process" onClick={navClick}>The process</a></nav><button className="meet-button" onClick={() => tour.start(true)}><span className="live-dot"/>Meet Favas <span aria-hidden="true">↗</span></button></header>
    <CharacterStage tour={tour} staticMode={staticMode} onHeroVisibility={setHeroVisible} chapter={chapter} gesture={gesture}/>
    <nav className="studio-story-rail" aria-label="Explore chapters">{['home', 'services', 'projects', 'process', 'contact'].map((id, index) => <a key={id} href={`#${id}`} aria-current={chapter === id ? 'location' : undefined} onClick={navClick}><span>0{index}</span><i aria-hidden="true"/><span>{id === 'home' ? 'Welcome' : id[0].toUpperCase() + id.slice(1)}</span></a>)}</nav>
    <main id="main" tabIndex={-1}>
      <section id="home" className="studio-hero" aria-labelledby="welcome-title">
        <div className="hero-orbit orbit-one" aria-hidden="true"/><div className="hero-orbit orbit-two" aria-hidden="true"/>
        <div id="welcome-copy" className="welcome-copy"><p className="eyebrow"><span className="accent-line"/>INDEPENDENT DEVELOPER. PERSONAL APPROACH.</p><h1 id="welcome-title" tabIndex={-1}>Websites & apps.<br/>With a <em>human</em><br/>touch<span className="orange-period">.</span></h1><p className="studio-intro">I’m Favas. I build websites and apps that help businesses grow. Step inside my creative studio and see how I turn an idea into something useful.</p><div className="welcome-actions"><button className="studio-button" onClick={() => tour.start(true)}><span aria-hidden="true">▶</span>{tour.dismissed ? 'Replay welcome with sound' : 'Start tour with sound'}<Arrow/></button><button className="studio-text-button" onClick={browse}>Explore myself <span aria-hidden="true">↓</span></button></div><p className="welcome-note">About {tourDurationSeconds} seconds. Captions included. You’re always in control.</p></div>
        <StudioSetDecoration/><div className="hero-character-space" aria-hidden="true"/>
        <div className="hero-bottomline"><span>MUHAMMED FAVAS K<span className="hero-location">KOZHIKODE, KERALA · WORKING REMOTELY</span></span><button onClick={() => setStaticMode(!staticMode)} aria-pressed={staticMode}>{staticMode ? 'Enable 3D character' : 'Use static character'} <span aria-hidden="true">↗</span></button><a href="#services" onClick={navClick}>SCROLL TO DISCOVER <span aria-hidden="true">↓</span></a></div>
      </section>
      <section id="about" className="studio-about studio-section" aria-labelledby="about-title"><p className="eyebrow">A PERSON BEHIND THE PIXELS</p><h2 id="about-title" tabIndex={-1}>Good work starts<br/>with a <em>conversation.</em></h2><div><p>I’m {profile.name}, a full stack developer based in Kozhikode. I connect the details people see with the systems that make them work.</p><p>My tools are JavaScript, React, Node.js, Express and MongoDB. My starting point is your business, your customers, and what they need to do.</p><a href="#contact" className="studio-text-button" onClick={navClick}>Tell me about your idea <Arrow/></a></div></section>
      <section id="services" className="studio-section studio-services" aria-labelledby="services-title"><SectionLabel number="01">WHAT I CAN BUILD</SectionLabel><div className="section-heading"><h2 id="services-title" tabIndex={-1}>Made for your<br/><em>next move.</em></h2><p>A useful website should feel simple.<br/>Here’s where I can help.</p></div><StudioWorkbench services={services} onSelect={() => setGesture('present')}/><a className="studio-text-button" href="/services/">Explore all services <Arrow/></a></section>
      <section id="projects" className="studio-section studio-work" aria-labelledby="work-title"><SectionLabel number="02">BUILT, NOT JUST IMAGINED</SectionLabel><div className="section-heading"><h2 id="work-title" tabIndex={-1}>Ideas out<br/><em>in the world.</em></h2><p>One connected product.<br/>A closer look at how I build.</p></div><article className="studio-project"><div className="project-browser" id="project-preview"><div className="browser-bar"><span><i/><i/><i/></span><span>gymdrobe.com</span><External href={project.website} aria-label="Open GymDrobe live website">↗</External></div><button className="project-image-button" onClick={inspect} aria-label="Enlarge GymDrobe project screenshot">{imageFailed ? <span className="project-image-error">Preview unavailable. Visit the live website below.</span> : <img src={project.screenshot} alt={project.screenshotAlt} width="1348" height="926" loading="lazy" decoding="async" onError={() => setImageFailed(true)}/>}<span className="image-expand">View closer <span aria-hidden="true">↗</span></span></button></div><div className="studio-project-meta"><div><p className="eyebrow">FITNESS E-COMMERCE / OWN PROJECT</p><h3>{project.name}</h3><p>{project.description}</p><p className="project-role-copy">{project.contribution}</p><ul className="project-stack">{project.stack.map(item => <li key={item}>{item}</li>)}</ul></div><div className="project-actions"><External className="studio-button" href={project.website} onClick={navClick}>Visit website <Arrow/></External><a className="studio-text-button" href="/projects/gymdrobe/">Read case study <Arrow/></a><External className="studio-text-button" href={project.repository}>View source <Arrow/></External><span className="capture-date">Preview captured {project.screenshotCaptured}</span></div></div></article></section>
      <section id="process" className="studio-section studio-process" aria-labelledby="process-title"><SectionLabel number="03">FROM FIRST HELLO TO LAUNCH</SectionLabel><div className="section-heading"><h2 id="process-title" tabIndex={-1}>Clear steps.<br/><em>Shared progress.</em></h2><p>You know what’s happening,<br/>and what comes next.</p></div><ProcessWorkshop steps={processSteps} onSelect={() => setGesture('point')}/></section>
      <section id="skills" className="studio-section studio-skills" aria-labelledby="skills-title"><h2 id="skills-title" tabIndex={-1}>The tools behind the work.</h2><ul>{skills.map(skill => <li key={skill.name}>{skill.name}</li>)}</ul></section>
      <section id="contact" className="studio-section studio-contact" aria-labelledby="contact-title"><SectionLabel number="04">YOUR IDEA STARTS HERE</SectionLabel><div className="contact-composition"><h2 id="contact-title" tabIndex={-1}>Let’s build<br/>something<br/><em>useful.</em><span className="orange-period">↗</span></h2><div id="contact-options"><p>Have a project in mind? Tell me what you’re planning. We’ll talk through the idea, the scope, and the next step.</p><a className="studio-button" href="/contact/">Discuss your project <Arrow/></a><External className="contact-direct" href={whatsappHref()} data-contact="whatsapp">WhatsApp me <Arrow/></External><a className="contact-direct" href={`mailto:${profile.email}`} data-contact="email">{profile.email} <Arrow/></a><a className="contact-direct" href={PHONE_HREF} data-contact="call">{PHONE_DISPLAY} <Arrow/></a></div></div></section>
    </main>
    <footer className="studio-footer"><a href="#home" className="studio-wordmark">favas<span>.</span></a><p>{profile.name}<br/>{profile.location}</p><nav aria-label="Footer navigation"><a href="/services/">Services</a><External href={profile.github}>GitHub</External><External href={profile.linkedin}>LinkedIn</External><a href="/privacy/">Privacy</a></nav><AnalyticsPreference/><span>BUILT WITH INTENTION. © {new Date().getFullYear()}</span></footer>
    {!tour.active && tour.state.status !== 'completed' && (tour.dismissed || !heroVisible) && <button className="tour-reopen" onClick={() => tour.start(true)}><span className="live-dot"/>Take a personal tour <span aria-hidden="true">▶</span></button>}
    <TourConsole tour={tour} onInspect={inspect}/>
    {dialogOpen && <dialog ref={dialog} className="studio-image-dialog" aria-label="GymDrobe project screenshot" onClose={() => setDialogOpen(false)} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}><div><span>GYMDROBE / REAL STOREFRONT</span><button onClick={() => dialog.current.close()} aria-label="Close screenshot">Close ×</button></div><img src={project.screenshot} alt={project.screenshotAlt} width="1348" height="926"/><p>Captured {project.screenshotCaptured}. <External href={project.website}>Open live website ↗</External></p></dialog>}
  </div>;
}
