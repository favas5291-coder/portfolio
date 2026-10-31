import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { profile, project, skills } from './data/portfolio.js';
import { services, processSteps, PHONE_HREF, PHONE_DISPLAY, whatsappHref } from './data/site.js';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';
import { tourSteps, tourDurationSeconds, characterAsset } from './guide/tourConfig.js';
import { useGuidedTour } from './guide/useGuidedTour.js';
import './cinema/CinematicPortfolio.css';
import './cinema/ImmersiveChapters.css';
import { HeroProof, CapabilityProof, EngineeringLab, ClientBrief } from './components/ClientConfidence.jsx';
import './components/ClientConfidence.css';

const ImmersiveWorld = lazy(() => import('./cinema/ImmersiveWorld.jsx'));
const chapters = [{id:'home',name:'Home'},{id:'services',name:'Services'},{id:'projects',name:'Real work'},{id:'process',name:'Process'},{id:'contact',name:'Contact'}];
const External = ({href,children,...props})=><a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}<span className="sr-only"> (opens in a new tab)</span></a>;
const Arrow = ()=> <span aria-hidden="true">↗</span>;
class SceneBoundary extends Component {
  state = {error:false};
  static getDerivedStateFromError(){return {error:true};}
  render(){return this.state.error?<div className="cinema-render-fallback" role="status">The animated studio could not load. You can still explore every service, project and contact option below.</div>:this.props.children;}
}
function ChapterMarker({index,title}) {
  return <div className="cinema-chapter-marker"><span>{String(index+1).padStart(2,'0')} / 05</span><i aria-hidden="true"/><span>{title}</span></div>;
}
function TourPanel({tour,onInspect}) {
  const {state,step,dispatch}=tour;
  if(!tour.active && state.status!=='completed') return null;
  if(state.status==='completed')return <aside className="cinema-tour-panel cinema-tour-finished" aria-label="Tour complete">
    <span>END OF THE TOUR — STATE 05 / THE NEXT</span><p>Have a project in mind? Let's discuss it.</p><div><a href="#contact" onClick={tour.skip}>Let's talk <Arrow/></a><button onClick={()=>tour.start(state.sound)}>Replay the tour</button><button onClick={tour.skip} aria-label="Close tour">×</button></div>
  </aside>;
  return <aside className="cinema-tour-panel" aria-label="Guided studio tour">
    <div className="cinema-tour-heading"><span><i className={tour.speaking?'is-speaking':''}/>FAVAS IS YOUR GUIDE</span><span>{state.index+1} OF {tourSteps.length}</span><button onClick={tour.skip}>Skip <span aria-hidden="true">×</span></button></div>
    <nav aria-label="Tour chapters" className="cinema-tour-progress">{tourSteps.map((item,index)=><button key={item.id} aria-label={'Go to '+item.title} aria-current={index===state.index?'step':undefined} onClick={()=>dispatch({type:'SELECT',index})}><span/></button>)}</nav>
    <p className="cinema-tour-caption" role="status" aria-live="polite" aria-atomic="true">{step.segments[state.segment].text}</p>
    {state.blocked && <p className="cinema-tour-notice">Speech is blocked. Try Play, or switch sound off to continue with captions.</p>}
    {tour.capability==='captions' && <p className="cinema-tour-notice">Voice is unavailable. The caption tour remains available.</p>}
    <div className="cinema-tour-controls">
      <button className="cinema-tour-primary" onClick={()=>dispatch({type:state.status==='playing'?'PAUSE':'PLAY'})}>{state.status==='playing'?'Ⅱ Pause':'▶ Play'}</button>
      <button onClick={()=>dispatch({type:'SOUND'})} aria-pressed={state.sound}>{state.sound?'◖ Sound on':'Sound off'}</button>
      {step.inspect && <button onClick={onInspect}>Inspect work <Arrow/></button>}
      <span className="tour-flex"/>
      <button disabled={state.index===0} onClick={()=>dispatch({type:'PREVIOUS'})} aria-label="Previous chapter">←</button>
      <button onClick={()=>dispatch({type:'NEXT'})}>{state.index===tourSteps.length-1?'Finish':'Next →'}</button>
    </div>
  </aside>;
}
function ServiceSelection({selected,onSelect}) {
  const current=services[selected];
  return <div className="cinema-service-board" id="services-list">
    <div className="cinema-service-rail" role="group" aria-label="Select a service">
      {services.map((service,index)=><button type="button" key={service.slug} className={selected===index?'is-active':''} aria-pressed={selected===index} onClick={()=>onSelect(index)}>
        <span>0{index+1}</span><strong>{service.name}</strong><span aria-hidden="true">↗</span>
      </button>)}
    </div>
    <div className="cinema-service-details" role="status" aria-live="polite">
      <small>FROM AN IDEA TO A USEFUL DIGITAL EXPERIENCE</small>
      <h3>{current.heading}</h3>
      <p>{current.short}</p>
      <a href={'/services/'+current.slug+'/'}>Explore this service <Arrow/></a>
      <span className="cinema-stage-instruction">3D CONCEPT DEMOS — NOT COMPLETED CLIENT PROJECTS</span>
    </div>
  </div>;
}
function ProcessSelection({selected,onSelect}) {
  return <div className="cinema-process-console" id="process-list">
    <div className="cinema-process-steps" role="group" aria-label="Collaboration stages">
      {processSteps.map(([title,description],index)=><button key={title} onClick={()=>onSelect(index)} className={index===selected?'is-active':''} aria-pressed={index===selected}>
        <span>{String(index+1).padStart(2,'0')}</span><strong>{title}</strong><span aria-hidden="true">{index===selected?'●':'↗'}</span>
      </button>)}
    </div>
    <div className="cinema-process-explain"><small>STEP {String(selected+1).padStart(2,'0')} / {String(processSteps.length).padStart(2,'0')}</small><h3>{processSteps[selected][0]}</h3><p>{processSteps[selected][1]}</p><button onClick={()=>onSelect((selected+1)%processSteps.length)}>See {selected===processSteps.length-1?'the process again':'what comes next'} →</button></div>
  </div>;
}
export default function App() {
  const tour=useGuidedTour();
  const [chapter,setChapter]=useState('home');
  const [serviceIndex,setServiceIndex]=useState(0);
  const [processIndex,setProcessIndex]=useState(0);
  const [sceneEnabled,setSceneEnabled]=useState(true);
  const [worldMounted,setWorldMounted]=useState(false);
  const [hidden,setHidden]=useState(false);
  const [heroVisible,setHeroVisible]=useState(true);
  const [menuOpen,setMenuOpen]=useState(false);
  const [dialogOpen,setDialogOpen]=useState(false);
  const dialog=useRef(null);

  useEffect(()=>{
    // The site is statically prerendered with renderToString. Never render a
    // pending lazy WebGL Suspense boundary in SSR or its initial hydration tree:
    // that causes React #419, a forced client render of the boundary.
    const start=()=>setWorldMounted(true);
    if('requestIdleCallback' in window){
      const id=window.requestIdleCallback(start,{timeout:900});
      return ()=>window.cancelIdleCallback(id);
    }
    const id=window.setTimeout(start,130);
    return ()=>window.clearTimeout(id);
  },[]);
  useEffect(()=>{
    const onVisibility=()=>setHidden(document.hidden);
    document.addEventListener('visibilitychange',onVisibility);
    return()=>document.removeEventListener('visibilitychange',onVisibility);
  },[]);
  useEffect(()=>{
    const targets=chapters.map(c=>document.getElementById(c.id)).filter(Boolean);
    if(typeof IntersectionObserver==='undefined')return;
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){if(entry.isIntersecting){setChapter(entry.target.id);if(entry.target.id==='home')setHeroVisible(true);else setHeroVisible(false);}}
    },{rootMargin:'-20% 0px -60% 0px',threshold:0});
    targets.forEach(section=>observer.observe(section));
    return()=>observer.disconnect();
  },[]);
  useEffect(()=>{if(dialogOpen&&!dialog.current?.open)dialog.current?.showModal();},[dialogOpen]);
  const inspect=()=>{tour.dispatch({type:'PAUSE'});setDialogOpen(true);};
  const closeModal=()=>{if(dialog.current?.open)dialog.current.close();setDialogOpen(false);};
  const jump=(target)=>{setMenuOpen(false);tour.dispatch({type:'PAUSE'});document.getElementById(target)?.scrollIntoView({behavior:tour.reducedMotion?'instant':'smooth'});};
  const explore=()=>{tour.skip();document.getElementById('services')?.scrollIntoView({behavior:tour.reducedMotion?'instant':'smooth'});};
  const action=tour.active?tour.step.action:({home:'welcome',services:'present',projects:'point',process:'present',contact:'welcome'}[chapter]);
  return <div className={'cinema '+(tour.active?'cinema-tour-active':'')} data-chapter={chapter}>
    <a className="cinema-skip" href="#main">Skip to main content</a>
    <div className="cinema-noise" aria-hidden="true"/>
    {sceneEnabled&&(worldMounted?<SceneBoundary><Suspense fallback={<div className="cinema-loading-scene" aria-hidden="true"/>}><ImmersiveWorld chapter={tour.state.status==='playing'?tour.step.target:chapter} serviceIndex={serviceIndex} processIndex={processIndex} action={action} speaking={tour.speaking} reducedMotion={tour.reducedMotion} hidden={hidden}/></Suspense></SceneBoundary>:<div className="cinema-loading-scene" aria-hidden="true"/>)}
    {!sceneEnabled&&<div className="cinema-poster-background" aria-hidden="true"/>}
    <header className="cinema-header">
      <a href="#home" onClick={event=>{event.preventDefault();jump('home');}} className="cinema-logo" aria-label="Favas home"><span className="cinema-logo-sign" aria-hidden="true">///</span> favas<span>.</span></a>
      <nav className={'cinema-navigation '+(menuOpen?'is-open':'')} id="cinema-navigation" aria-label="Main navigation">{chapters.slice(1).map(c=><a key={c.id} href={'#'+c.id} onClick={event=>{event.preventDefault();jump(c.id)}}>{c.name}</a>)}</nav>
      <div className="cinema-header-actions"><a className="confidence-header-hire" href="/contact/">Start a project <span aria-hidden="true">↗</span></a><button className="cinema-tour-trigger" onClick={()=>tour.start(true)}>Guided tour <span aria-hidden="true">▶</span></button><button className="cinema-menu-toggle" aria-expanded={menuOpen} aria-controls="cinema-navigation" onClick={()=>setMenuOpen(value=>!value)}>{menuOpen?'Close':'Menu'}</button></div>
    </header>
    <nav className="cinema-waypoints" aria-label="Chapters">{chapters.map((item,index)=><a key={item.id} href={'#'+item.id} aria-current={chapter===item.id?'location':undefined} onClick={event=>{event.preventDefault();jump(item.id)}}><span>{String(index+1).padStart(2,'0')}</span><span>{item.name}</span></a>)}</nav>
    <main id="main">
      <section id="home" className="cinema-chapter cinema-arrival" aria-labelledby="cinema-hero-title">
        <div className="cinema-arrival-top"><span>FAVAS / THE DIGITAL ATELIER</span><span>FULL STACK DEVELOPER · KERALA / WORLDWIDE</span></div>
        <div className="cinema-arrival-center confidence-arrival-content"><span className="cinema-hello-tag"><span className="cinema-hello-glow"/>INDEPENDENT FULL-STACK DEVELOPER</span><h1 id="cinema-hero-title" tabIndex={-1}>I don't just build websites.<br/><em>I build experiences.</em></h1><p>I'm Favas. I create websites and e-commerce applications where the visual details and the working systems behind them matter equally.</p><div className="cinema-arrival-actions"><a className="cinema-cta" href="#projects">Explore my real work <Arrow/></a><a className="cinema-ghost-cta" href="/contact/">Let's build your project <Arrow/></a></div><button className="confidence-intro-tour" onClick={()=>tour.start(true)}>▶ Take the optional {tourDurationSeconds}-second narrated tour</button></div>
        <HeroProof/>
        <div className="cinema-arrival-footer"><span>01 / THE SPARK</span><span>REAL WORK. CLEAR THINKING. THOUGHTFUL EXECUTION.</span><a href="#services" onClick={event=>{event.preventDefault();jump('services')}}>SCROLL TO EXPLORE ↓</a></div>
      </section>

      <section id="about" className="cinema-about-intro" aria-label="Meet the developer"><span>THE PERSON BEHIND THE BUILD</span><p>I'm {profile.name}. I work on the interface customers use and the application logic behind it—with genuine project evidence you can inspect.</p><a href="/projects/gymdrobe/">See a real case study <Arrow/></a></section>
      <CapabilityProof/>

      <section id="services" className="cinema-chapter cinema-services" aria-labelledby="cinema-services-title">
        <div className="cinema-chapter-content">
          <ChapterMarker index={1} title="THE SHAPE"/>
          <div className="cinema-chapter-heading"><span className="cinema-eyebrow">STATE 02 / THE SHAPE</span><h2 id="cinema-services-title" tabIndex={-1}>What can we<br/><em>bring to life?</em></h2><p>Choose a service. Watch the studio respond, then discover what I can actually build for you.</p></div>
          <ServiceSelection selected={serviceIndex} onSelect={setServiceIndex}/>
          <a href="/services/" className="cinema-secondary-link">Discover all services <Arrow/></a>
        </div>
        <span className="cinema-section-serial" aria-hidden="true">IDEA / 02</span>
      </section>

      <section id="projects" className="cinema-chapter cinema-projects" aria-labelledby="cinema-projects-title">
        <div className="cinema-chapter-content">
          <ChapterMarker index={2} title="THE PROOF"/>
          <div className="cinema-chapter-heading"><span className="cinema-eyebrow">STATE 03 / THE PROOF</span><h2 id="cinema-projects-title" tabIndex={-1}>Proof is in<br/><em>the work.</em></h2><p>Not a concept render: a real storefront, source code, and the engineering decisions behind it.</p></div>
          <article className="cinema-project-case">
            <div className="cinema-project-screen" id="project-preview">
              <div className="cinema-browser-top"><span><i/><i/><i/></span><span>GYMDROBE / LIVE PROJECT</span><External href={project.website} aria-label="Open GymDrobe in a new tab">↗</External></div>
              <button type="button" onClick={inspect} aria-label="Inspect a full-size screenshot of the real GymDrobe website"><img src={project.screenshot} alt={project.screenshotAlt} loading="lazy" decoding="async" width="1348" height="926"/><span>EXPAND REAL SCREENSHOT ↗</span></button>
            </div>
            <div className="cinema-project-narrative"><span>01 — OWN PROJECT / FITNESS E-COMMERCE</span><h3>{project.name}</h3><p>{project.description}</p><p>{project.contribution}</p><ul>{project.stack.map(item=><li key={item}>{item}</li>)}</ul><div className="cinema-project-actions"><External href={project.website}>Visit website <Arrow/></External><a href="/projects/gymdrobe/">Read case study <Arrow/></a><External href={project.repository}>Explore the code <Arrow/></External></div><small>Real preview captured {project.screenshotCaptured}; no generated substitute.</small></div>
          </article>
          <EngineeringLab/>
        </div>
      </section>

      <section id="process" className="cinema-chapter cinema-process" aria-labelledby="cinema-process-title">
        <div className="cinema-chapter-content">
          <ChapterMarker index={3} title="THE MAKING"/>
          <div className="cinema-chapter-heading"><span className="cinema-eyebrow">STATE 04 / THE MAKE</span><h2 id="cinema-process-title" tabIndex={-1}>An idea becomes<br/><em>something real.</em></h2><p>Every stage has a purpose. Select a step to see the workshop advance.</p></div>
          <ProcessSelection selected={processIndex} onSelect={setProcessIndex}/>
          <div id="skills" className="cinema-skills"><span>THE TOOLS BEHIND THE WORK</span><ul>{skills.map(skill=><li key={skill.name}>{skill.name}</li>)}</ul></div>
        </div>
      </section>

      <section id="contact" className="cinema-chapter cinema-contact" aria-labelledby="cinema-contact-title">
        <div className="cinema-chapter-content">
          <ChapterMarker index={4} title="THE NEXT"/>
          <div className="cinema-chapter-heading"><span className="cinema-eyebrow">THE NEXT STORY COULD BE YOURS</span><h2 id="cinema-contact-title" tabIndex={-1}>Have a project<br/><em>worth building?</em></h2><p>Tell me what you're planning. We'll discuss the requirements, scope, and a practical way forward.</p></div>
          <div className="cinema-contact-actions" id="contact-options"><a className="cinema-cta" href="/contact/">Discuss your project <Arrow/></a><External href={whatsappHref()} data-contact="whatsapp">WhatsApp <Arrow/></External><a href={'mailto:'+profile.email} data-contact="email">{profile.email} <Arrow/></a><a href={PHONE_HREF} data-contact="call">{PHONE_DISPLAY} <Arrow/></a></div>
          <ClientBrief/>
          <div className="cinema-ending-note"><span>THANKS FOR VISITING THE STUDIO.</span><button onClick={()=>tour.start(true)}>Experience the tour again ↗</button></div>
        </div>
      </section>
    </main>
    <footer className="cinema-footer"><a href="#home" onClick={event=>{event.preventDefault();jump('home')}}>favas.</a><p>{profile.name}<span>{profile.location}</span></p><div><External href={profile.github}>GitHub</External><External href={profile.linkedin}>LinkedIn</External><a href="/privacy/">Privacy</a><AnalyticsPreference/></div><button onClick={()=>setSceneEnabled(value=>!value)} aria-pressed={!sceneEnabled}>{sceneEnabled?'Use static environment':'Enable animated environment'}</button><span>© {new Date().getFullYear()} FAVAS</span></footer>
    {!tour.active&&tour.state.status!=='completed'&&!heroVisible&&<button className="cinema-reopen" onClick={()=>tour.start(true)}>Guided tour <span aria-hidden="true">▶</span></button>}
    <TourPanel tour={tour} onInspect={inspect}/>
    {dialogOpen&&<dialog className="cinema-modal" ref={dialog} onClose={()=>setDialogOpen(false)} aria-label="Real GymDrobe storefront screenshot" onClick={event=>{if(event.target===dialog.current)closeModal()}}><div><span>GYMDROBE / ACTUAL WEBSITE PREVIEW</span><button onClick={closeModal} aria-label="Close screenshot">Close ×</button></div><img src={project.screenshot} alt={project.screenshotAlt} width="1348" height="926"/><p>Captured {project.screenshotCaptured}. <External href={project.website}>Open the live site ↗</External></p></dialog>}
    <div className="cinema-asset-note sr-only">{characterAsset.description} The animated procedural character is a prototype, not a finished photo-matched likeness.</div>
  </div>;
}
