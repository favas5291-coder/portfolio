import { useEffect, useRef, useState } from 'react';
import { profile, skills } from './data/portfolio.js';
import { services, processSteps, PHONE_DISPLAY, PHONE_HREF, whatsappHref } from './data/site.js';
import { projectPreviews } from './data/project-previews.js';
import AnalyticsPreference from './components/AnalyticsPreference.jsx';
import Chart from './afterlight/Chart.jsx';
import SceneDirector from './afterlight/SceneDirector.jsx';
import ProjectViewer from './afterlight/ProjectViewer.jsx';
import { bearing, berths, litBerth, nextSignal } from './afterlight/bearings.js';
import './afterlight/afterlight.css';

const needLabels = {
  'business-websites': 'I need a business website',
  'ecommerce-development': 'I want to sell online',
  'landing-pages': 'I want more enquiries',
  'website-redesign': 'I want to improve my site',
};
function LighthouseMark() {
  return <svg width="33" height="35" viewBox="0 0 36 40" fill="none" aria-hidden="true"><path d="M4 34h26M8 31h17M10 30l3-16h7l3 16M11 13h12M13 11V7h7v4M10 7l7-5 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="m12 21 9-3m-10 7 11-4M24 10l10-3m-10 6 10 1" stroke="currentColor" strokeWidth="1.4"/></svg>;
}
function Slot({id,children}) {
  return <div className={'al-slot al-slot-'+id} data-scene-slot={id} data-renderer="map">
    <Chart place={id}/>{children}
  </div>;
}
function Dial({value,onChange,onEnter}) {
  const drag=useRef(null);
  const down=event=>{
    if(event.button!==0) return;
    event.preventDefault();
    event.currentTarget.focus({preventScroll:true});
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current={x:event.clientX,y:event.clientY,value};
  };
  const move=event=>{
    if(!drag.current) return;
    const d=drag.current;
    onChange(Math.round(Math.min(100,Math.max(0,d.value+(event.clientX-d.x)*.63+(d.y-event.clientY)*.32))));
  };
  return <div className="al-dial">
    <div className="al-knob">
      <i style={{transform:'rotate('+(-135+2.7*value)+'deg)'}} aria-hidden="true"/>
      <input type="range" min="0" max="100" value={value} aria-label="Turn the light" aria-valuetext={Math.round(bearing(value))+' degrees, '+(litBerth(value)?.name || 'open water')}
        onPointerDown={down} onPointerMove={move} onLostPointerCapture={()=>{drag.current=null;}}
        onChange={event=>onChange(Number(event.target.value))} onKeyDown={event=>{if(event.key==='Enter')onEnter();}}/>
    </div>
    <div><strong>Turn the light</strong><small>Drag the dial · ← → keys</small></div>
    <output aria-hidden="true">{String((Math.round(bearing(value))+360)%360).padStart(3,'0')}°</output>
  </div>;
}
function Plate({number,title,sub}) {
  return <div className="al-plate"><span>Plate {number}</span><i/><span>{sub} / {title}</span></div>;
}
export default function App() {
  const [dial,setDial]=useState(50),[signal,setSignal]=useState('quiet'),[service,setService]=useState(services[0]),[stage,setStage]=useState(0);
  const [touched,setTouched]=useState(false),[inspect,setInspect]=useState(false),[serviceChanges,setServiceChanges]=useState(0);
  const opening=useRef(null), timer=useRef(0), previous=useRef(50);
  const lit=litBerth(dial);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const changeDial=value=>{
    const from=previous.current;previous.current=value;
    setTouched(true);setSignal(old=>nextSignal(old,from,value));setDial(value);
  };
  const jump=(event,id)=>{
    if(event&&(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey))return;
    if(id!=='projects'||!opening.current?.getBoundingClientRect||!opening.current.querySelector('[data-renderer="webgl"]')||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    event?.preventDefault();clearTimeout(timer.current);setInspect(true);
    timer.current=setTimeout(()=>{location.hash=id;setInspect(false);document.getElementById(id)?.focus({preventScroll:true});},520);
  };
  const openLit=()=>{if(lit)location.hash=lit.id;};
  return <div className="afterlight">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="al-header">
      <a className="al-brand" href="#home" aria-label="Fazhere Afterlight home"><LighthouseMark/><span>Fazhere<em>.</em></span></a>
      <span className="al-edition">Independent developer<br/>Kozhikode, India</span>
      <nav aria-label="Harbour navigation"><a href="#projects">Work</a><a href="#services">Services</a><a className="al-contact-nav" href="#contact">Contact <span>↗</span></a></nav>
    </header>
    <main id="main" tabIndex={-1}>
      <section id="home" className="al-home" ref={opening} aria-labelledby="al-title">
        <div className="al-hero-copy">
          <div className="al-over"><span className="al-dot"/> An interactive portfolio</div>
          <h1 id="al-title">After<em>light</em><b>.</b></h1>
          <p className="al-identity">{profile.name} · Full-stack developer</p>
          <p className="al-promise">I build websites and apps that help businesses grow.</p>
          <div className="al-hero-actions"><a className="al-primary" href="#projects" onClick={e=>jump(e,'projects')}>View GymDrobe <span>↗</span></a><a className="al-textlink" href="#contact">Contact Favas <span>↗</span></a></div>
          <div className="al-hero-note"><i/> A playable harbour on the Kerala coast.</div>
        </div>
        <div className="al-instrument">
          <div className="al-map-title"><span><b>Fig. 01</b> / Kozhikode harbour</span><span>11°15′ N &nbsp; 75°47′ E</span></div>
          <Slot id="home"><div className="al-corners" aria-hidden="true"/><div className="al-slot-index">Malabar coast <i/> Night watch</div>
            {lit&&<a key={lit.id} className="al-enamel" href={'#'+lit.id} onClick={e=>jump(e,lit.id)}>{lit.number} · {lit.name} <span>↗</span></a>}
          </Slot>
          <div className="al-console"><Dial value={dial} onChange={changeDial} onEnter={openLit}/><span className="al-console-state"><i/> {lit?'Signal acquired':'Searching the inlet'}</span></div>
        </div>
      </section>
      <nav className="al-berths" aria-label="Choose a destination">
        <div className="al-index-label">Harbour<br/><em>index</em></div>
        {berths.map(b=><a href={'#'+b.id} key={b.id} onClick={e=>jump(e,b.id)}><small>Berth / {b.number}</small><strong>{b.name} <i>↗</i></strong><span>{b.detail}</span></a>)}
      </nav>
      <section id="projects" tabIndex={-1} className="al-market al-section">
        <Plate number="01" title="Selected work" sub="East wharf"/>
        <h2>Market <em>quay.</em></h2>
        <ProjectViewer/>
      </section>
      <section id="services" className="al-yard al-section">
        <Plate number="02" title="Services &amp; process" sub="West wharf"/>
        <div className="al-yard-top"><div><h2>The <em>boatyard.</em></h2><p>Choose what your business needs.</p></div><a className="al-textlink" href="/services/">All services ↗</a></div>
        <div className="al-yard-layout"><div>
          <div className="al-needs" role="group" aria-label="Choose a business need">{services.map((s,i)=><button key={s.slug} type="button" aria-pressed={service===s} onClick={()=>{setService(s);setServiceChanges(n=>n+1);}}><small>0{i+1}</small>{needLabels[s.slug]||s.name}<span>{service===s?'●':'○'}</span></button>)}</div>
          <div className="al-deliver" aria-live="polite"><strong>{service.heading}</strong><p>{service.deliverables[0]}. {service.deliverables[1]}.</p><p>{service.evidence}</p><a className="al-primary" href={'/contact/?service='+service.slug}>Discuss this service <span>↗</span></a><a className="al-textlink" href={'/services/'+service.slug+'/'}>Service details ↗</a></div>
        </div><div className="al-yard-plate"><Slot id="services"/><div className="al-map-title"><span>Fig. 02 / Hull on cradle</span><span>Boatyard</span></div></div></div>
        <div id="process" className="al-process"><h3>From first conversation to launch.</h3><div role="group" aria-label="Collaboration stages">{processSteps.map(([name,desc],i)=><button type="button" key={name} aria-pressed={stage===i} onClick={()=>setStage(i)}><small>0{i+1}</small><strong>{name}</strong><span>{desc}</span></button>)}</div></div>
      </section>
      <section id="contact" className="al-signal al-section">
        <Plate number="03" title="Contact" sub="Signal house"/>
        <div className="al-signal-layout"><div><h2>What are you<br/><em>planning to build?</em></h2><div className="al-hero-actions"><a className="al-primary" href="/contact/">Start an enquiry <span>↗</span></a><a className="al-textlink" data-contact="whatsapp" href={whatsappHref()}>WhatsApp ↗</a></div><div className="al-address"><a data-contact="email" href={'mailto:'+profile.email}>{profile.email}</a><a data-contact="call" href={PHONE_HREF}>{PHONE_DISPLAY}</a></div></div><Slot id="contact"/></div>
      </section>
      <aside id="about" className="al-colophon"><div><small>About the maker</small><p>{profile.about}</p></div><div id="skills"><small>Tools I work with</small><p>{skills.map(s=>s.name).join(' · ')}</p></div></aside>
    </main>
    <footer className="al-footer"><a className="al-brand" href="#home"><LighthouseMark/>Fazhere.</a><div><a href={profile.github}>GitHub ↗</a><a href={profile.linkedin}>LinkedIn ↗</a><a href="/privacy/">Privacy</a></div><AnalyticsPreference/></footer>
    <SceneDirector controls={{dial,angle:bearing(dial),signal,serviceChanges,stage,touched,inspect}} screenshot={projectPreviews.gymdrobe.screenshot}/>
  </div>;
}
