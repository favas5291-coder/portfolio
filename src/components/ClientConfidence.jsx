import { useState } from 'react';
import { profile, project } from '../data/portfolio.js';
import { services, whatsappHref } from '../data/site.js';

// An actual project and its recorded source-review notes, not testimonial copy.
export function HeroProof() {
  return <aside className="confidence-hero-proof" aria-label="Featured real project">
    <a className="confidence-proof-image" href="#projects" aria-label="Explore the real GymDrobe project">
      <img src={project.screenshot} alt={project.screenshotAlt} width="1348" height="926" decoding="async" loading="eager"/>
      <span className="confidence-proof-image-arrow" aria-hidden="true">↗</span>
    </a>
    <div className="confidence-proof-info">
      <span className="confidence-proof-kicker"><i aria-hidden="true"/> BUILT &amp; OPEN TO INSPECT</span>
      <h2>{project.name} <span>/ 01</span></h2>
      <p>A real fitness e-commerce project, from product selection through checkout.</p>
      <div className="confidence-proof-links">
        <a href="#projects">Examine the build <span aria-hidden="true">↗</span></a>
        <a href={project.website} target="_blank" rel="noopener noreferrer">Live site <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
      </div>
    </div>
  </aside>;
}

export function CapabilityProof() {
  return <div className="confidence-methods" aria-label="What the work demonstrates">
    <div><span className="confidence-method-number">01</span><strong>Real projects, not mock credentials</strong><p>Explore the live work, public source, and documented development decisions.</p></div>
    <div><span className="confidence-method-number">02</span><strong>Interface and application logic</strong><p>The same build connects product browsing, account state, shopping, and checkout.</p></div>
    <div><span className="confidence-method-number">03</span><strong>A clear way of working</strong><p>Understand the scope, deliverables, reviews, and handover before we start.</p></div>
  </div>;
}

export function EngineeringLab() {
  const [selected, setSelected] = useState(0);
  const entries = project.decisions || [];
  if (!entries.length) return null;
  const active = entries[selected];
  const source = active.file ? `${project.repository}/blob/${project.commit}/${active.file}` : project.repository;
  return <section className="confidence-lab" aria-labelledby="confidence-lab-title" id="engineering-lab">
    <div className="confidence-lab-head">
      <div><p className="confidence-eyebrow">A CLOSER LOOK / ENGINEERING NOTES</p><h3 id="confidence-lab-title">What happens <em>behind the screen?</em></h3></div>
      <p>Good interfaces are only part of the job. These are documented decisions from a source review of my own project—not invented client results.</p>
    </div>
    <div className="confidence-lab-body">
      <div className="confidence-lab-selector" role="group" aria-label="Choose an engineering decision">
        {entries.map((entry, i)=><button key={entry.title} className={selected===i?'is-selected':''} onClick={()=>setSelected(i)} type="button" aria-pressed={selected===i}>
          <span>0{i+1}</span><strong>{entry.title}</strong><span aria-hidden="true">{selected===i?'●':'↗'}</span>
        </button>)}
      </div>
      <div className="confidence-lab-paper" aria-live="polite" aria-atomic="true">
        <div className="confidence-lab-top"><span>BUILD LOG / 0{selected+1}</span><span>GYMDROBE · SOURCE INSPECTED</span></div>
        <div className="confidence-lab-problem"><span>THE PROBLEM</span><p>{active.challenge}</p></div>
        <div className="confidence-lab-resolution"><span>MY APPROACH</span><p>{active.decision}</p></div>
        <div className="confidence-lab-bottom"><span>THE PRINCIPLE</span><p>{active.takeaway}</p></div>
        <a href={source} target="_blank" rel="noopener noreferrer">Inspect relevant source <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
      </div>
    </div>
    <p className="confidence-lab-footnote">{project.evidence} <a href="/projects/gymdrobe/">Read the full case study ↗</a></p>
  </section>;
}

// Builds an enquiry draft locally; never claims an instant quote or sends data.
export function ClientBrief() {
  const [kind, setKind] = useState(services[0]?.name || 'Business website');
  const [goal, setGoal] = useState('Get my business online');
  const [stage, setStage] = useState('Planning an idea');
  const [details, setDetails] = useState('');
  const [business, setBusiness] = useState('');
  const message = [
    'Hi Favas, I would like to discuss a website project.',
    `Project type: ${kind}`,
    `Main goal: ${goal}`,
    `Current stage: ${stage}`,
    business.trim() ? `Business/project: ${business.trim()}` : '',
    details.trim() ? `More details: ${details.trim()}` : '',
    'Could we discuss the requirements and a quote?'
  ].filter(Boolean).join('\n');
  const mailHref = `mailto:${profile.email}?subject=${encodeURIComponent(`Website project enquiry — ${kind}`)}&body=${encodeURIComponent(message)}`;
  return <section className="confidence-brief" aria-labelledby="confidence-brief-title">
    <div className="confidence-brief-lead"><p className="confidence-eyebrow">START WITH A SIMPLE BRIEF</p><h3 id="confidence-brief-title">Tell me what you <em>have in mind.</em></h3><p>Choose the basics, add any details, and open your own WhatsApp or email app with a ready-to-send message. Nothing is submitted automatically.</p></div>
    <div className="confidence-brief-form">
      <div className="confidence-brief-field"><label htmlFor="brief-kind">What are you looking to build?</label><select id="brief-kind" value={kind} onChange={event=>setKind(event.target.value)}>{services.map(item=><option key={item.slug} value={item.name}>{item.name}</option>)}</select></div>
      <fieldset className="confidence-brief-field"><legend>What is your main goal?</legend><div className="confidence-brief-choices">{['Get my business online','Sell products online','Improve an existing website'].map(option=><button type="button" key={option} aria-pressed={goal===option} className={goal===option?'is-selected':''} onClick={()=>setGoal(option)}>{option}</button>)}</div></fieldset>
      <div className="confidence-brief-field"><label htmlFor="brief-stage">Where are you starting?</label><select id="brief-stage" value={stage} onChange={event=>setStage(event.target.value)}><option>Planning an idea</option><option>Have an existing website</option><option>Ready to discuss requirements</option></select></div>
      <div className="confidence-brief-field"><label htmlFor="brief-business">Business or project name <span>(optional)</span></label><input id="brief-business" value={business} maxLength={100} placeholder="Your business or project" onChange={event=>setBusiness(event.target.value)}/></div>
      <div className="confidence-brief-field"><label htmlFor="brief-details">Anything else I should know? <span>(optional)</span></label><textarea id="brief-details" value={details} maxLength={1000} rows={3} placeholder="Pages, features, existing website, or timeline…" onChange={event=>setDetails(event.target.value)}/></div>
      <div className="confidence-brief-actions"><a href={whatsappHref(message)} target="_blank" rel="noopener noreferrer" className="confidence-brief-main">Continue on WhatsApp <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a><a href={mailHref}>Use email instead <span aria-hidden="true">↗</span></a></div>
      <small>No instant quote is generated. Scope and pricing are discussed together before development.</small>
    </div>
  </section>;
}
