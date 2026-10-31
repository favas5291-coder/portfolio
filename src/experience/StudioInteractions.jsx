import { useState } from 'react';

// These objects are interactive explanations of the services, not client projects.
// The actual portfolio screenshot remains the source of truth for finished work.
const DemoChrome = ({ children }) => <div className="demo-browser">
  <div className="demo-browser-top"><span className="demo-dots"><i/><i/><i/></span><span>INTERACTIVE CONCEPT / NOT A CLIENT PROJECT</span><span>↗</span></div>
  {children}
</div>;

function WebsiteScene() {
  const [opened, setOpened] = useState(false);
  return <DemoChrome>
    <div className="demo-business">
      <div className="demo-business-header"><strong>YOUR BUSINESS</strong><span>About&nbsp;&nbsp; Services&nbsp;&nbsp; Contact</span></div>
      <div className="demo-business-body"><div className="demo-brand-circle" aria-hidden="true"><span>✳</span></div><div><small>GOOD FIRST IMPRESSIONS</small><h4>Make it easy<br/>to find you.</h4><p>Clear information. A friendly next step.</p><button type="button" onClick={() => setOpened(value => !value)}>{opened ? 'Enquiry ready ✓' : 'Try the enquiry button ↗'}</button></div></div>
      {opened && <p className="demo-inline-result" role="status">Example interaction: a real site can link to your chosen contact channel.</p>}
    </div>
  </DemoChrome>;
}
function CommerceScene() {
  const [cart, setCart] = useState(0);
  return <DemoChrome>
    <div className="demo-commerce">
      <header><span>THE PRODUCT SHELF</span><span aria-live="polite">BAG {cart.toString().padStart(2, '0')}</span></header>
      <div className="demo-commerce-body"><div className="demo-shoe" aria-hidden="true"><div className="demo-shoe-sole"/><div className="demo-shoe-body"/><div className="demo-shoe-collar"/><div className="demo-shoe-lace"/></div><div className="demo-commerce-copy"><small>ECOMMERCE / DEMONSTRATION</small><h4>From product<br/>to purchase.</h4><p>Show variants, selection and a clear cart.</p><button type="button" onClick={() => setCart(value => value + 1)}>{cart ? 'Add another +': 'Add sample item +'} </button><span aria-live="polite">{cart ? `${cart} sample ${cart === 1 ? 'item' : 'items'} added to this demo` : 'Tap to try the cart interaction'}</span></div></div>
    </div>
  </DemoChrome>;
}
function LandingScene() {
  const [revealed, setRevealed] = useState(false);
  return <DemoChrome>
    <div className="demo-landing">
      <div className="demo-landing-side"><span>01</span><span>THE OFFER</span><span>02</span><span>THE ACTION</span></div>
      <div className="demo-landing-content"><small>ONE MESSAGE. ONE NEXT STEP.</small><h4>Make every<br/>click count.</h4><p>A focused landing page can lead visitors toward an enquiry.</p><button type="button" onClick={() => setRevealed(value => !value)}>{revealed ? 'Hide response −' : 'Try the call to action ↗'}</button>{revealed && <div className="demo-landing-message" role="status">Thank you! In a real project this connects to your configured enquiry destination.</div>}</div>
      <div className="demo-landing-disc" aria-hidden="true"/>
    </div>
  </DemoChrome>;
}
function RedesignScene() {
  const [modern, setModern] = useState(true);
  return <DemoChrome>
    <div className={`demo-redesign ${modern ? 'is-refined' : 'is-before'}`}>
      <div className="demo-redesign-toolbar"><span>THE SAME PAGE. A BETTER JOURNEY.</span><button type="button" onClick={() => setModern(value => !value)}>View {modern ? 'before' : 'improved'} ↔</button></div>
      <div className="demo-redesign-layout"><div className="demo-redesign-sidebar"><i/><i/><i/></div><div className="demo-redesign-content"><div className="demo-redesign-image"/><div><span/><span/><span/><b>CONTACT US ↗</b></div></div></div>
      <p role="status">{modern ? 'After: clearer hierarchy and a visible action.' : 'Before: competing boxes and a harder-to-find action.'}</p>
    </div>
  </DemoChrome>;
}
const illustrations = {
  'business-websites': WebsiteScene,
  'ecommerce-development': CommerceScene,
  'landing-pages': LandingScene,
  'website-redesign': RedesignScene,
};

export function StudioWorkbench({ services, onSelect }) {
  const [selected, setSelected] = useState(0);
  const current = services[selected] || services[0];
  const Illustration = illustrations[current.slug] || WebsiteScene;
  return <div className="workbench" id="services-list">
    <div className="workbench-menu" aria-label="Choose a service to preview">
      <div className="workbench-menu-heading"><span className="workbench-status-dot"/> THE IDEA LAB <span>CHOOSE AN OBJECT</span></div>
      {services.map((service, index) => <button key={service.slug} type="button" className={selected === index ? 'workbench-service is-current' : 'workbench-service'} onClick={() => { setSelected(index); onSelect?.(service); }} aria-pressed={selected === index}>
        <span className="workbench-service-number">0{index + 1}</span><span className="workbench-service-copy"><strong>{service.name}</strong><small>{service.short}</small></span><span className="workbench-service-arrow" aria-hidden="true">{selected === index ? '●' : '↗'}</span>
      </button>)}
    </div>
    <div className="workbench-right"><div className="workbench-spotlight" aria-live="off"><span className="spotlight-label">NOW SHOWING / {current.name.toUpperCase()}</span><div className="workbench-demonstration" key={current.slug}><Illustration/></div></div><div className="workbench-underbar"><p>Try the interaction. These are illustrative studio concepts, not claims of completed client work.</p><a href={`/services/${current.slug}/`}>Explore {current.name.toLowerCase()} <span aria-hidden="true">↗</span></a></div></div>
  </div>;
}

export function ProcessWorkshop({ steps, onSelect }) {
  const [selected, setSelected] = useState(0);
  const [played, setPlayed] = useState(0);
  const advance = index => { setSelected(index); setPlayed(value => value + 1); onSelect?.(index); };
  const step = steps[selected];
  return <div className="process-workshop">
    <div className="process-machine" aria-label={`Illustration of step ${selected + 1}: ${step[0]}`}>
      <div className="machine-caption"><span>FAVAS / THE BUILD MACHINE</span><span>STAGE 0{selected + 1} / 0{steps.length}</span></div>
      <div className={`machine-scene machine-phase-${selected}`} key={played}>
        <div className="machine-paper"><span/><span/><span/></div><div className="machine-wire"/><div className="machine-screen"><div className="machine-screen-nav"/><div className="machine-screen-block"/><div className="machine-screen-row"><i/><i/><i/></div></div><div className="machine-stamp"><span>{['?','✓','{ }','↗','★'][selected] || '✓'}</span></div><div className="machine-spark one"/><div className="machine-spark two"/>
      </div>
      <div className="machine-message"><small>THE CURRENT STEP</small><strong>{step[0]}</strong><p>{step[1]}</p></div>
      <button type="button" onClick={() => advance((selected + 1) % steps.length)}>See {selected === steps.length - 1 ? 'the process again' : 'what comes next'} <span aria-hidden="true">→</span></button>
    </div>
    <ol id="process-list" className="studio-process-list">
      {steps.map(([title, description], index) => <li key={title} className={selected === index ? 'is-current' : ''}><button type="button" onClick={() => advance(index)} aria-pressed={selected === index}><span>0{index + 1}</span><span><strong>{title}</strong><small>{description}</small></span><span aria-hidden="true">↗</span></button></li>)}
    </ol>
  </div>;
}

export function StudioSetDecoration() {
  return <div className="cartoon-studio-set" aria-hidden="true">
    <div className="set-light"/><div className="set-arch"/><div className="set-window"><span/><span/><span/></div>
    <div className="set-desk"><div className="set-desk-top"/><div className="set-desk-leg"/></div>
    <div className="set-screen"><div className="set-screen-light"/><i/><i/><i/></div><div className="set-orb"/><div className="set-star">✳</div>
  </div>;
}

/** An explorable explanation of three documented implementation decisions. */
export function ProjectDecisions({ project }) {
  const [selected, setSelected] = useState(0);
  const decisions = project.decisions || [];
  if (!decisions.length) return null;
  const current = decisions[selected];
  return <section className="project-decision-lab" aria-labelledby="decision-title">
    <div className="decision-heading"><div><span className="eyebrow">OPEN THE PROJECT BLUEPRINT</span><h4 id="decision-title">What happens<br/>behind the screen?</h4></div><p>Explore real implementation decisions from the source review. These are explanations of the work, not customer outcome claims.</p></div>
    <div className="decision-notebook">
      <div className="decision-tabs" role="tablist" aria-label="Project implementation decisions">{decisions.map((decision, index) => <button type="button" role="tab" id={`decision-tab-${index}`} key={decision.title} aria-selected={selected === index} aria-controls="decision-panel" tabIndex={selected === index ? 0 : -1} onKeyDown={event => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); const next = (index + 1) % decisions.length; setSelected(next); event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus(); }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); const next = (index + decisions.length - 1) % decisions.length; setSelected(next); event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus(); }
      }} onClick={() => setSelected(index)}><span>0{index + 1}</span><strong>{decision.title}</strong><span aria-hidden="true">{selected === index ? '●' : '↗'}</span></button>)}</div>
      <div role="tabpanel" id="decision-panel" aria-labelledby={`decision-tab-${selected}`} className="decision-panel" key={selected}>
        <div className="decision-sheet-top"><span>CASE NOTES / 0{selected + 1}</span><span>INSPECTED FRONTEND</span></div>
        <div className="decision-flow"><div><small>THE CHALLENGE</small><p>{current.challenge}</p></div><span aria-hidden="true">➜</span><div><small>MY IMPLEMENTATION</small><p>{current.decision}</p></div></div>
        <div className="decision-takeaway"><span aria-hidden="true">✳</span><div><small>THE TAKEAWAY</small><p>{current.takeaway}</p></div></div>
        <a href="/projects/gymdrobe/">Read the complete case study <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </section>;
}
