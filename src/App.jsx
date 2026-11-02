import { useEffect, useRef, useState } from 'react';
import { profile, project, skills } from './data/portfolio.js';
import { services, processSteps, PHONE_HREF, PHONE_DISPLAY, whatsappHref } from './data/site.js';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';
import { tourSteps, tourDurationSeconds, characterAsset } from './guide/tourConfig.js';
import { useGuidedTour } from './guide/useGuidedTour.js';
import './cinema/CinematicPortfolio.css';
import './cinema/ImmersiveChapters.css';
import { ClientBrief } from './components/ClientConfidence.jsx';
import './components/ClientConfidence.css';
import { ServiceInteractionLab } from './components/ServiceInteractionLab.jsx';
import './components/ServiceInteractionLab.css';

import { Worktable, ColourStudy, deliverables, mobileCapture } from './components/Worktable.jsx';
import './cinema/Worktable.css';
const chapters = [{id:'home',name:'Home'},{id:'services',name:'Services'},{id:'projects',name:'Real work'},{id:'process',name:'Process'},{id:'contact',name:'Contact'}];
const External = ({href,children,...props})=><a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}<span className="sr-only"> (opens in a new tab)</span></a>;
const Arrow = ()=> <span aria-hidden="true">↗</span>;
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
    {state.blocked && <p className="cinema-tour-notice">Continuing with captions. <button onClick={()=>dispatch({type:'RETRY_SOUND'})}>Retry sound</button></p>}
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
function ServiceSelection({selected,onSelect,onDiscuss}) {
  const current=services[selected];
  return <div className="cinema-service-board" id="services-list">
    <div className="cinema-service-rail" role="group" aria-label="Select a service">
      {services.map((service,index)=><button type="button" key={service.slug} id={'service-choice-'+index} className={selected===index?'is-active':''} aria-pressed={selected===index} onClick={()=>onSelect(index)}>
        <span>0{index+1}</span><strong>{service.name}</strong><span aria-hidden="true">↗</span>
      </button>)}
    </div>
    <div className="cinema-service-details" role="status" aria-live="polite">
      <small>SELECTED SERVICE</small>
      <h3>{current.heading}</h3>
      <p>{current.short}</p>
      <a href={'/services/'+current.slug+'/'}>Explore this service <Arrow/></a>
      <button className="discuss-selection" onClick={onDiscuss}>Discuss this service ↗</button>
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
    <div className="cinema-process-explain"><small>STEP {String(selected+1).padStart(2,'0')} / {String(processSteps.length).padStart(2,'0')}</small><h3>{processSteps[selected][0]}</h3><p>{processSteps[selected][1]}</p><p className="deliverable"><strong>You receive</strong> {deliverables[selected]}</p><button onClick={()=>onSelect((selected+1)%processSteps.length)}>See {selected===processSteps.length-1?'the process again':'what comes next'} →</button></div>
  </div>;
}
export default function App() {
  const tour = useGuidedTour();
  const [chapter,setChapter] = useState('home');
  const [serviceIndex,setServiceIndex] = useState(0);
  const [processIndex,setProcessIndex] = useState(0);
  const [kind,setKind] = useState(services[0].name);
  const [device,setDevice] = useState('desktop');
  const [sceneEnabled,setSceneEnabled] = useState(true);
  const [menuOpen,setMenuOpen] = useState(false);
  const [dialogOpen,setDialogOpen] = useState(false);
  const dialog = useRef(null);
  const playing = tour.state.status==='playing';
  const activeChapter = playing ? tour.step.target : chapter;
  const pause=()=>tour.dispatch({type:'PAUSE'});

  useEffect(()=>{
    let frame=0;
    const sections=chapters.map(c=>document.getElementById(c.id));
    function measure(){
      frame=0;
      const y=window.innerHeight*.38;
      const current=sections.filter(s=>s.getBoundingClientRect().top<=y).at(-1);
      setChapter(current?.id || 'home');
    }
    const request=()=>{if(!frame) frame=requestAnimationFrame(measure);};
    measure();
    window.addEventListener('scroll',request,{passive:true});
    window.addEventListener('resize',request);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',request);window.removeEventListener('resize',request);};
  },[]);
  useEffect(()=>{
    if(!playing)return;
    const cue=tour.step.segments[tour.state.segment];
    if(cue.service!==undefined)setServiceIndex(cue.service);
    if(cue.stage!==undefined)setProcessIndex(cue.stage);
  },[tour.step,tour.state.segment,playing]);
  useEffect(()=>{if(dialogOpen&&!dialog.current?.open)dialog.current?.showModal();},[dialogOpen]);
  const inspect=()=>{pause();setDialogOpen(true);};
  const jump=(id)=>{
    pause();setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({behavior:tour.reducedMotion?'instant':'smooth',block:'start'});
  };
  const nav=(event,id)=>{if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();jump(id);};
  const screenAction=(id)=>{
    if(id==='home'||id==='projects'){if(id==='home')setDevice(matchMedia('(max-width:650px)').matches?'mobile':'desktop');inspect();}
    else jump({services:'service-demo',process:'process-list',contact:'project-enquiry'}[id]);
  };
  const discuss=()=>{setKind(services[serviceIndex].name);jump('project-enquiry');};
  const dismiss=()=>{tour.skip();jump('services');};
  const option=(value)=>{setDevice(value);pause();};
  const deviceButtons=<div className="device-pick" role="group" aria-label="GymDrobe screenshot device">{['desktop','mobile'].map(d=><button key={d} type="button" aria-pressed={device===d} onClick={()=>option(d)}>{d==='desktop'?'Desktop':'Mobile'}</button>)}</div>;
  const imageSrc=device==='mobile'?mobileCapture:project.screenshot;
  return <div className={'cinema worksite '+(tour.active?'cinema-tour-active':'')} data-chapter={activeChapter} data-tour-status={tour.state.status}>
    <a className="cinema-skip" href="#main">Skip to main content</a>
    <header className="cinema-header worksite-header">
      <a className="cinema-logo" href="#home" onClick={e=>nav(e,'home')} aria-label="Favas home"><span className="wt-logo-mark" aria-hidden="true">///</span> fazhere<span>.</span></a>
      <nav className={'cinema-navigation '+(menuOpen?'is-open':'')} id="cinema-navigation" aria-label="Main navigation">{chapters.slice(1).map(c=><a key={c.id} href={'#'+c.id} onClick={e=>nav(e,c.id)}>{c.name}</a>)}</nav>
      <div className="cinema-header-actions"><a className="header-contact-link" href="#contact" onClick={e=>nav(e,'contact')}>Contact ↗</a><button className="cinema-tour-trigger" onClick={()=>tour.start(true)}>Meet Favas <span aria-hidden="true">▶</span></button><button className="cinema-menu-toggle" aria-expanded={menuOpen} aria-controls="cinema-navigation" onClick={()=>setMenuOpen(v=>!v)}>{menuOpen?'Close':'Menu'}</button></div>
    </header>
    <main id="main">
      <section id="home" className="wt-arrival" aria-labelledby="cinema-hero-title">
        <div id="welcome-copy">
          <p className="wt-kicker"><i/> MUHAMMED FAVAS K <span>/ FULL-STACK DEVELOPER</span></p>
          <h1 id="cinema-hero-title" tabIndex={-1}>I build websites<br/>and apps that help<br/>businesses <em>grow.</em></h1>
          <p className="wt-intro">Welcome to my studio in Kozhikode. That’s GymDrobe on my desk. I built the store, and I’ll show you how it works.</p>
          <div className="wt-actions"><button className="wt-primary" onClick={()=>tour.start(true)}><span aria-hidden="true">▶</span> Start tour with sound</button><button className="wt-ghost" onClick={dismiss}>Explore myself ↓</button></div>
          <div className="wt-quick"><a href="#projects" onClick={e=>nav(e,'projects')}>View GymDrobe ↗</a><a href="#contact" onClick={e=>nav(e,'contact')}>Contact ↗</a><span>{tourDurationSeconds}s tour · Captions included</span></div>
        </div>
        <div className="world-seat hero-seat" id="seat-home">
          <Worktable chapter={activeChapter} selection={activeChapter==='process'?processIndex:serviceIndex} kind={kind} device={device} tour={tour} enabled={sceneEnabled} onScreen={screenAction} onPause={pause}/>
        </div>
        <div className="wt-hero-foot"><span>01 / 05 <b>WELCOME</b></span><span>KOZHIKODE, KERALA · WORKING REMOTELY</span><button aria-pressed={!sceneEnabled} onClick={()=>setSceneEnabled(v=>!v)}>{sceneEnabled?'Use still view':'Enable animation'}</button></div>
      </section>
      <section id="about" className="wt-about"><span className="wt-kicker">THE PERSON AT THE DESK</span><p>I’m {profile.name}. I design the interface your customers use and build the systems behind it.</p></section>
      <section id="services" className="wt-chapter wt-paper" aria-labelledby="cinema-services-title">
        <div className="wt-split"><div><ChapterMarker index={1} title="THE WORKSHOP"/><h2 id="cinema-services-title" tabIndex={-1}>Try the <em>controls.</em></h2><p className="wt-lead">Pick a service and try a small example of what it can do for your business.</p>
        <ServiceSelection selected={serviceIndex} onSelect={i=>{pause();setServiceIndex(i);}} onDiscuss={discuss}/></div><div className="world-seat" id="seat-services"/></div>
        <div id="service-demo" onClickCapture={pause} onChangeCapture={pause}><ServiceInteractionLab service={services[serviceIndex]}/></div><a className="wt-link" href="/services/">All services ↗</a>
      </section>
      <section id="projects" className="wt-chapter wt-dark" aria-labelledby="cinema-projects-title">
        <ChapterMarker index={2} title="THE SCREENING ROOM"/><div className="wt-project-title"><div><p className="wt-kicker">MY OWN BUILD / FITNESS E-COMMERCE</p><h2 id="cinema-projects-title" tabIndex={-1}>{project.name}<em>.</em></h2></div><p>{project.description}</p></div>
        <article id="project-preview" className="wt-project-sheet">
          <div className="wt-toolstrip"><span>01 / STOREFRONT</span>{deviceButtons}<button type="button" onClick={inspect}>Enlarge ↗</button></div>
          <div id="seat-projects" className="world-seat project-seat"><picture className="unmounted-proof"><img src={imageSrc} alt={project.screenshotAlt} width="1348" height="926" loading="lazy"/></picture></div>
          <small>Desktop captured {project.screenshotCaptured}. Mobile captured 2 November 2026.</small>
        </article>
        <div onClickCapture={pause}><ColourStudy/></div>
        <div className="wt-project-links"><External href={project.website}>Visit live website ↗</External><External href={project.repository}>View code ↗</External><a href="/projects/gymdrobe/">Read case study ↗</a><a href="#contact" onClick={e=>nav(e,'contact')}>Discuss a project ↗</a></div>
      </section>
      <section id="process" className="wt-chapter wt-paper" aria-labelledby="cinema-process-title"><div className="wt-split"><div><ChapterMarker index={3} title="THE DRAWING BOARD"/><h2 id="cinema-process-title" tabIndex={-1}>From a brief<br/>to <em>launch.</em></h2><p className="wt-lead">Choose a stage to see what you receive.</p></div><div className="world-seat" id="seat-process"/></div>
        <ProcessSelection selected={processIndex} onSelect={i=>{pause();setProcessIndex(i);}}/><div id="skills" className="cinema-skills"><span>TOOLS ON MY WORKTABLE</span><ul>{skills.map(s=><li key={s.name}>{s.name}</li>)}</ul></div>
      </section>
      <section id="contact" className="wt-chapter wt-contact" aria-labelledby="cinema-contact-title"><div className="wt-split"><div><ChapterMarker index={4} title="YOUR PROJECT"/><h2 id="cinema-contact-title" tabIndex={-1}>Your turn<br/>at the <em>desk.</em></h2><p className="wt-lead">Have a project in mind? Tell me what you’re planning, and let’s discuss how I can help.</p><div id="contact-options" className="wt-project-links"><a href="/contact/">Enquiry form ↗</a><External href={whatsappHref()} data-contact="whatsapp">WhatsApp ↗</External><a href={'mailto:'+profile.email} data-contact="email">{profile.email}</a><a href={PHONE_HREF} data-contact="call">{PHONE_DISPLAY}</a></div></div><div className="world-seat" id="seat-contact"/></div>
        <div id="project-enquiry" onClickCapture={pause} onChangeCapture={pause}><ClientBrief kind={kind} onKind={setKind}/></div></section>
    </main>
    <footer className="cinema-footer"><a href="#home">fazhere.</a><p>{profile.name}<span>{profile.location}</span></p><div><External href={profile.github}>GitHub</External><External href={profile.linkedin}>LinkedIn</External><a href="/privacy/">Privacy</a><AnalyticsPreference/></div><button onClick={()=>tour.start(true)}>Replay welcome</button></footer>
    <TourPanel tour={tour} onInspect={inspect}/>
    {dialogOpen&&<dialog className="cinema-modal worktable-modal" ref={dialog} onClose={()=>setDialogOpen(false)} aria-label="GymDrobe screenshot" onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}>
      <div><span>GYMDROBE / {device.toUpperCase()}</span>{deviceButtons}<button onClick={()=>dialog.current.close()} aria-label="Close screenshot">Close ×</button></div>
      <img src={imageSrc} alt={device==='mobile'?'Actual GymDrobe mobile homepage':project.screenshotAlt}/><p><External href={project.website}>Visit live website ↗</External></p></dialog>}
    <span className="sr-only">{characterAsset.description}</span>
  </div>;
}
