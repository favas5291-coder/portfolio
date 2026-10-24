import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { profile, chapters, skillGroups, skills, project } from './data/portfolio';
import { useExperience } from './hooks/useExperience';
import ForgeFallback from './components/ForgeFallback';
import { ContactActions, ContactDetails, MobileContact } from './components/ContactActions.jsx';
import { services, whatsappHref } from './data/site.js';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError('The 3D renderer could not start. You can retry.'); }
  render() { return this.state.failed ? null : this.props.children; }
}
function Arrow({ down = false }) { return <svg aria-hidden="true" viewBox="0 0 24 24" className={down ? 'arrow down' : 'arrow'}><path d="M5 19 19 5M5 5h14v14"/></svg>; }
function External({ href, children, className = '', ...props }) { return <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...props}>{children}<span className="sr-only"> (opens in a new tab)</span></a>; }
function ChapterLabel({ id, title }) { const c = chapters.find(item => item.id === id); return <div className="chapter-label"><span>{c.number}</span><p>{title || c.title}</p></div>; }
function Mask({ children, className = '' }) { return <span className={`line-mask ${className}`}><span className="line-inner">{children}</span></span>; }

function Header({ experience: e }) {
  return <header className="site-header">
    <a href="#home" className="wordmark" onClick={event => e.navigate(event, 'home')} aria-label="Favas home"><span className="forge-mark" aria-hidden="true"><i/><i/><i/></span>{profile.shortName.toUpperCase()}<span className="wordmark-period">.</span></a>
    <nav aria-label="Main navigation">{chapters.map(c => <a href={`/#${c.id}`} key={c.id} aria-current={e.active === c.id ? 'location' : undefined} onClick={event => e.navigate(event, c.id)}>{c.label}</a>)}<a href="/services/">Services</a></nav>
    <a href="/contact/" className="header-contact" data-cursor="Hello">LET’S TALK <Arrow/></a>
    <div ref={e.progressElement} className="scroll-line" aria-hidden="true"/>
    <span className="sr-only" role="progressbar" aria-label="Page scroll progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={e.progress}/>
  </header>;
}
function Hero({ experience: e }) {
  return <div id="home" tabIndex="-1" className="chapter hero-opening">
    <section id="hero-visual" aria-labelledby="hero-name" className="hero">
      <div className="hero-kicker"><span className="mono">MERN / FULL STACK DEVELOPMENT</span><span className="mono">THE FORGE — PORTFOLIO</span></div>
      <p id="hero-name" className="hero-name" aria-label={profile.name}>{profile.displayName.map(line => <Mask key={line}>{line}</Mask>)}</p>
      <p className="role mono hero-role"><span/> {profile.role}</p>
      <div className="hero-scene-space" aria-hidden="true"/>
      <div className="hero-work"><a href="/#projects" onClick={event => e.navigate(event,'projects')} className="text-link" data-cursor="View">View My Work <Arrow/></a></div>
      <div className="object-caption mono"><span>FIG. 01 / THE ASSEMBLY</span><span>IDEA → STRUCTURE → EXPERIENCE</span></div>
      <div className="hero-footer mono"><span>{profile.location}</span><a href="#about" onClick={event => e.navigate(event,'about')}>SCROLL TO DISASSEMBLE <Arrow down/></a></div>
    </section>
    <section id="business-introduction" aria-labelledby="hero-services" className="business-intro text-panel">
      <h1 id="hero-services">{profile.headline}</h1><p className="intro">{profile.intro}</p><ContactActions compact/>
    </section>
  </div>;
}

function About() {
  return <section id="about" tabIndex="-1" aria-labelledby="about-title" className="chapter about">
    <ChapterLabel id="about"/><span className="chapter-numeral" aria-hidden="true">01</span>
    <div className="about-copy text-panel" data-reveal><p className="mono overline">THE PERSON BEHIND THE PARTS</p><h2 id="about-title" className="display-heading">{profile.aboutTitle.map((line,i)=><span key={line} className={i === 1 ? 'muted' : ''}>{line}</span>)}</h2><p>{profile.about}</p><p>{profile.approach}</p><div className="home-services"><h3>Websites for your next step.</h3><ul>{services.map(service => <li key={service.slug}><a href={`/services/${service.slug}/`}>{service.name} <span aria-hidden="true">↗</span></a></li>)}</ul><a className="text-link" href="/services/">Explore website development services <Arrow/></a></div><div className="about-signoff"><span className="signature">{profile.signature}</span><span className="mono">DEVELOPER<br/>{profile.location}</span></div></div>
  </section>;
}
function Skills({ experience: e }) {
  const chosen = skills.find(skill => skill.name === e.selected) || skills[1];
  return <section id="skills" tabIndex="-1" aria-labelledby="skills-title" className="chapter skills">
    <ChapterLabel id="skills"/><span className="chapter-numeral" aria-hidden="true">02</span>
    <div className="skills-copy text-panel"><p className="mono overline" data-reveal>DIFFERENT PARTS. ONE SYSTEM.</p><h2 id="skills-title" className="display-heading" data-reveal>The working<br/><span className="muted">parts.</span></h2><div className="skill-groups">{skillGroups.map((group,index) => <div key={group.name} className="skill-group"><div className="skill-group-heading"><span className="mono">0{index+1}</span><h3>{group.name}</h3></div><p>{group.description}</p><div className="skill-names" role="group" aria-label={group.name}>{skills.filter(s=>s.group===group.name).map(s=><button key={s.name} aria-pressed={e.selected===s.name} onClick={()=>e.setSelected(s.name)} data-cursor="Inspect">{s.name}<span aria-hidden="true">↗</span></button>)}</div></div>)}</div><div className="skill-detail" aria-live="polite"><span className="mono">IN PRACTICE / {chosen.name}</span><p>{chosen.detail}</p>{chosen.file ? <External href={`${project.repository}/blob/${project.commit}/${chosen.file}`} className="text-link">Inspect the code <Arrow/></External> : <a href="#projects" className="text-link" onClick={event=>e.navigate(event,'projects')}>See the project <Arrow/></a>}</div></div>
    <p className="parts-note mono">SELECT A PART.<br/>SEE HOW IT FITS.</p>
  </section>;
}
function Projects() {
  const dialog = useRef(null);
  const [imageFailed,setImageFailed] = useState(false);
  return <section id="projects" tabIndex="-1" aria-labelledby="project-title" className="chapter projects">
    <ChapterLabel id="projects"/>
    <div className="project-intro text-panel" data-reveal><p className="mono overline">SELECTED WORK / 01</p><h2 id="project-title" className="project-title">{project.name}<span aria-hidden="true">↗</span></h2><p className="project-tagline">{project.tagline}</p><p>{project.description}</p><div className="project-links"><External href={project.website} className="button-solid" data-magnetic data-cursor="Visit">Visit Website <Arrow/></External><External href={project.repository} className="text-link" data-cursor="Code">View Code <Arrow/></External></div><a href="/projects/gymdrobe/" className="text-link case-link">Read the GymDrobe case study <Arrow/></a><p className="mono project-role">{project.role}<br/>{project.stack.join(' / ')}</p></div>
    <div className="project-visual"><button className="project-screenshot" onClick={()=>dialog.current?.showModal()} data-cursor="View" aria-label="Enlarge real GymDrobe screenshot">{!imageFailed ? <img src={project.screenshot} alt={project.screenshotAlt} width="1348" height="926" loading="lazy" decoding="async" onError={()=>setImageFailed(true)}/> : <span>GYMDROBE<br/>Storefront screenshot unavailable</span>}<span className="screenshot-action mono">ACTUAL STOREFRONT <Arrow/></span></button><span className="mono image-caption">GYMDROBE.COM — CAPTURED {project.reviewed}</span></div>
    <div className="case-study text-panel">
      <div className="case-meta"><span className="mono">A CLOSER LOOK</span><p>A shopping flow.<br/>A connected system.</p></div>
      <div className="case-body"><div className="case-overview"><div><h3 className="mono">THE PROBLEM</h3><p>{project.problem}</p></div><div><h3 className="mono">MY ROLE</h3><p>{project.contribution}</p></div></div><div className="feature-row"><h3 className="mono">FEATURES</h3><ul>{project.features.map(feature=><li key={feature}>{feature}</li>)}</ul></div><div className="stack-row"><h3 className="mono">STACK</h3><p>{project.stack.join(' / ')}</p></div><div className="decisions"><h3 className="mono">CHALLENGES & DECISIONS</h3>{project.decisions.map((d,index)=><details key={d.title}><summary><span className="mono">0{index+1}</span><span>{d.title}</span><span className="detail-plus" aria-hidden="true">+</span></summary><div className="decision-content"><p><strong>The challenge.</strong> {d.challenge}</p><p><strong>The decision.</strong> {d.decision}</p><p><strong>The takeaway.</strong> {d.takeaway}</p><External href={`${project.repository}/blob/${project.commit}/${d.file}`} className="text-link">Read the implementation <Arrow/></External></div></details>)}</div><p className="evidence-note">{project.evidence}</p></div>
    </div>
    <dialog ref={dialog} className="image-dialog" aria-label="GymDrobe storefront screenshot" onClick={event=>{if(event.target===dialog.current)dialog.current.close();}}><div><span className="mono">GYMDROBE / REAL STOREFRONT</span><button onClick={()=>dialog.current.close()} aria-label="Close screenshot">CLOSE <span aria-hidden="true">×</span></button></div><img src={project.screenshot} width="1348" height="926" alt={project.screenshotAlt}/><p>Captured from the public storefront on {project.reviewed}.</p></dialog>
  </section>;
}
function Contact() {
  const [copyState,setCopyState] = useState('');
  const timer = useRef(null);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const copy = async()=>{try { await navigator.clipboard.writeText(profile.email);setCopyState('Email copied.');}catch{setCopyState('Select the email address to copy it, or use the email link.');}clearTimeout(timer.current);timer.current=setTimeout(()=>setCopyState(''),6000);};
  return <section id="contact" tabIndex="-1" aria-labelledby="contact-title" className="chapter contact"><ChapterLabel id="contact"/><div className="contact-copy text-panel"><p className="mono overline" data-reveal>THE NEXT BUILD STARTS HERE</p><h2 id="contact-title" className="contact-title" data-reveal>{profile.contactTitle.map((line,i)=><span key={line} className={i===1?'accent':''}>{line}</span>)}</h2><p className="contact-intro">{profile.contactIntro}</p><ContactActions compact/><ContactDetails showEmail={false}/><a href={`mailto:${profile.email}`} className="email-link" data-contact="email" data-magnetic data-cursor="Hello">{profile.email} <Arrow/></a><div className="contact-links"><External href={whatsappHref()} data-contact="whatsapp" className="text-link">WhatsApp · +91 8156805806 <Arrow/></External><External href={profile.github} className="text-link">GitHub <Arrow/></External>{profile.linkedin && <External href={profile.linkedin} className="text-link">LinkedIn <Arrow/></External>}{profile.cv && <a href={profile.cv} className="text-link" download>Download CV <Arrow/></a>}<button className="copy-email" onClick={copy}>Copy email address</button></div><p className="copy-status" role="status">{copyState}</p></div><div className="contact-location mono">{profile.location}</div></section>;
}
export default function App() {
  const e = useExperience();
  const ForgeScene = useMemo(() => lazy(() => import('./scene/ForgeScene')), [e.attempt]);
  const percent = e.loading.total ? Math.round(e.loading.loaded/e.loading.total*100) : null;
  return <div className={`portfolio ${e.mode === 'three' && e.sceneReady ? 'has-three' : 'has-poster'} ${e.mode === 'static' ? 'static-mode' : 'motion-mode'}`} data-chapter={e.active} data-scene-status={e.sceneStatus} data-motion={e.reduced?'gentle':'full'}>
    <a href="#main" className="skip-link">Skip to content</a>
    <div className="world"><ForgeFallback/>{e.initialized && e.mode==='three' && <SceneBoundary key={e.attempt} onError={e.fallback}><Suspense fallback={null}><ForgeScene motion={e.motion} onReady={e.ready} onRecovering={e.recovering} onError={e.fallback} onProgress={e.loadProgress} onSelect={e.setSelected}/></Suspense></SceneBoundary>}<div className="world-vignette"/></div>
    <div className="film-grain" aria-hidden="true"/>
    <Header experience={e}/>
    <main id="main" tabIndex="-1"><Hero experience={e}/><About/><Skills experience={e}/><Projects/><Contact/></main>
    <footer className="site-footer"><span className="mono">{profile.name} / THE FORGE</span><nav className="home-footer-links" aria-label="Footer navigation"><a href="/services/">Services</a><a href="/projects/gymdrobe/">GymDrobe case study</a><a href="/contact/">Request a Quote</a><a href="/privacy/">Privacy</a></nav><a href="#home" onClick={event=>e.navigate(event,'home')} className="text-link">Back to top <Arrow/></a><AnalyticsPreference/></footer>
    <MobileContact/>
    <div className="view-controls"><span className="mono scroll-counter" aria-hidden="true">{String(e.progress).padStart(2,'0')} / 100</span>{e.initialized && <div className="experience-options"><button className="view-toggle" onClick={e.toggleMotion} aria-pressed={!e.reduced}>{e.reduced?'Enable full motion':'Use gentle motion'}</button><button className="view-toggle" onClick={e.toggleMode} aria-pressed={e.mode==='static'}>{e.mode==='three'?'Switch to 2D':e.sceneStatus==='error'?'Retry 3D':'Enable 3D'}<span className="view-dot"/></button></div>}</div>
    {e.initialized && e.mode==='three' && !e.sceneReady && <div className="scene-loader" role="status"><span className="mono">{e.sceneStatus==='recovering'?'RESTORING THE FORGE':'ASSEMBLING THE FORGE'} {percent===null?'':`${percent}%`}</span>{e.loading.total>0 && <progress value={e.loading.loaded} max={e.loading.total} aria-label="3D assets loaded"/>}<button onClick={e.toggleMode}>Use 2D view <span aria-hidden="true">↗</span></button></div>}
    {e.sceneStatus==='error' && <div className="scene-loader" role="status"><p>{e.reason}</p><button onClick={e.retry}>Retry 3D <span aria-hidden="true">↗</span></button></div>}
    <div ref={e.cursor} className="custom-cursor" aria-hidden="true"/>
  </div>;
}
