import { useState } from 'react';

/*
 * Interactive concepts built with native React state and semantic controls.
 * These examples are not customer work, payment forms or screenshots.
 * The verified GymDrobe case study remains the real production evidence.
 */
const toneNames=['Stone','Terracotta','Forest'];
const tones=['stone','clay','forest'];
const sizes=['S','M','L','XL'];

function Tab({chosen,name,onClick}) {
  return <button type="button" aria-pressed={chosen===name} className={chosen===name?'is-active':''} onClick={onClick}>{name}</button>;
}

function CommerceDemo() {
  const [tone,setTone]=useState('stone');
  const [size,setSize]=useState('M');
  const [count,setCount]=useState(0);
  return <div className="demo-site demo-commerce" aria-label="Interactive e-commerce example">
    <div className="demo-topbar"><strong>FORM / ACTIVE</strong><span>CONCEPT STOREFRONT</span><span aria-label={count+' items in sample bag'}>BAG ({count})</span></div>
    <div className="demo-commerce-layout">
      <div className={'demo-product-art tone-'+tone} aria-label={'Illustrated training top in '+tone+' colour'} role="img">
        <div className="demo-product-halo"/><div className="demo-jersey"><span className="demo-jersey-label">F/A</span></div>
        <span className="demo-product-caption">FIG. 001 / TRAINING TOP</span>
      </div>
      <div className="demo-product-detail">
        <span className="demo-overline">EVERYDAY TRAINING / CONCEPT</span><h4>Move with<br/>intention.</h4>
        <p>Choose a colour and size to see how product state responds.</p>
        <fieldset className="demo-choice"><legend>COLOUR — {toneNames[tones.indexOf(tone)]}</legend><div className="demo-choice-row">{tones.map((item,i)=><button type="button" key={item} className={'demo-swatch tone-'+item} aria-label={toneNames[i]} title={toneNames[i]} aria-pressed={tone===item} onClick={()=>setTone(item)} />)}</div></fieldset>
        <fieldset className="demo-choice"><legend>SIZE</legend><div className="demo-choice-row">{sizes.map(item=><Tab key={item} name={item} chosen={size} onClick={()=>setSize(item)}/>)}</div></fieldset>
        <button type="button" className="demo-action" onClick={()=>setCount(value=>value+1)}>Add to demo bag <span aria-hidden="true">↗</span></button>
        <p className="demo-feedback" aria-live="polite">{count?count+' sample item'+(count===1?'':'s')+' added. No purchase will be made.':'A working product selector, not a live store.'}</p>
      </div>
    </div>
  </div>;
}

function BusinessDemo() {
  const [page,setPage]=useState('Home');
  const [open,setOpen]=useState(false);
  return <div className="demo-site demo-business" aria-label="Interactive business website example">
    <div className="demo-business-head"><strong>NORTH / STUDIO<span>.</span></strong><nav aria-label="Sample business pages"><Tab name="Home" chosen={page} onClick={()=>{setPage('Home');setOpen(false);}}/><Tab name="Services" chosen={page} onClick={()=>{setPage('Services');setOpen(false);}}/></nav><button type="button" onClick={()=>setOpen(!open)}>{open?'Close enquiry':'Contact ↗'}</button></div>
    <div className="demo-business-main">
      <div className="demo-business-text"><small>INDEPENDENT CREATIVE SPACE</small><h4>{page==='Home'?'Spaces that tell a story.':'A clear place for every service.'}</h4><p>{page==='Home'?'A concept website where the story is clear and visitors know what to do next.':'Creative direction, thoughtful design and a direct route to get in touch.'}</p><button type="button" className="demo-action" onClick={()=>setOpen(!open)}>{open?'Close enquiry':'Make an enquiry'} <span aria-hidden="true">↗</span></button></div>
      <div className="demo-business-art" aria-hidden="true"><div className="demo-business-arch"/><div className="demo-business-disc"/></div>
    </div>
    {open&&<div className="demo-inline-enquiry" role="status"><strong>Enquiry journey opened.</strong> A real project would connect this interface to an agreed contact flow. <button type="button" onClick={()=>setOpen(false)}>Close</button></div>}
  </div>;
}

function LandingDemo(){
  const [variant,setVariant]=useState('Focused');
  const [open,setOpen]=useState(false);
  const [typed,setTyped]=useState('');
  const [submitted,setSubmitted]=useState(false);
  return <div className="demo-site demo-landing" aria-label="Interactive landing-page example">
    <div className="demo-topbar"><strong>FOCUS / CAMPAIGN</strong><span>CONCEPT LANDING PAGE</span><div className="demo-layout-switch"><Tab chosen={variant} name="Focused" onClick={()=>{setVariant('Focused');setOpen(false);}}/><Tab chosen={variant} name="Editorial" onClick={()=>{setVariant('Editorial');setOpen(false);}}/></div></div>
    <div className={'demo-landing-main '+(variant==='Editorial'?'is-editorial':'')}>
      <div className="demo-landing-copy"><small>YOUR FIRST STEP</small><h4>{variant==='Focused'?'A little more focus. A lot more clarity.':'Make room for what matters.'}</h4><p>One simple message. One deliberate next step. A responsive concept with working state.</p><button type="button" className="demo-action" onClick={()=>{setOpen(!open);setSubmitted(false);}}>Get in touch <span aria-hidden="true">↗</span></button></div>
      <div className="demo-landing-sculpture" aria-hidden="true"><span/><span/><span/></div>
    </div>
    {open&&<form className="demo-landing-form" onSubmit={event=>{event.preventDefault();setSubmitted(true);}}><label htmlFor="demo-name">Try the sample form (not sent)</label><div><input id="demo-name" required value={typed} onChange={event=>setTyped(event.target.value)} placeholder="Your first name" maxLength={70}/><button type="submit">Preview response →</button></div>{submitted&&<p role="status">Thanks, {typed.trim()}! This is a local demonstration; no information was sent.</p>}</form>}
  </div>;
}

function RedesignDemo(){
  const [after,setAfter]=useState(true);
  return <div className="demo-site demo-redesign" aria-label="Interactive redesign example">
    <div className="demo-topbar"><strong>RE:DESIGN / LAB</strong><span>ILLUSTRATIVE BEFORE / AFTER</span><div className="demo-layout-switch"><Tab chosen={after?'After':'Before'} name="Before" onClick={()=>setAfter(false)}/><Tab chosen={after?'After':'Before'} name="After" onClick={()=>setAfter(true)}/></div></div>
    <div className={'demo-redesign-page '+(after?'is-after':'is-before')}>
      <div className="demo-redesign-navigation"><strong>BRIGHT / SPACE</strong><span>{after?'A CLEARER EXPERIENCE':'HOME | SERVICES | MORE | CONTACT | LINKS'}</span></div>
      <div className="demo-redesign-hero"><div><span>BUILT FOR PEOPLE</span><h4>{after?'Clarity makes room for action.':'WELCOME TO OUR WEBSITE'}</h4><p>{after?'Clear hierarchy, useful content, and an unmistakable next step.':'We do lots of things. Read all our information on this homepage to understand everything.'}</p><button type="button" className="demo-action" onClick={()=>setAfter(!after)}>{after?'See the before':'See the improvement'} <span aria-hidden="true">↔</span></button></div><div className="demo-redesign-shape" aria-hidden="true"/></div>
    </div>
    <p className="demo-redesign-note" aria-live="polite">{after?'After: simpler navigation, stronger hierarchy and a clear contact action.':'Before: crowded navigation and competing messages. This is a fictional example.'}</p>
  </div>;
}

export function ServiceInteractionLab({ service }) {
  const [show,setShow]=useState(true);
  const demos={
    'business-websites':BusinessDemo,
    'ecommerce-development':CommerceDemo,
    'landing-pages':LandingDemo,
    'website-redesign':RedesignDemo
  };
  const Demo=demos[service?.slug]||BusinessDemo;
  return <section className="demo-lab" aria-labelledby="demo-lab-heading">
    <div className="demo-lab-intro">
      <div><p className="demo-lab-eyebrow">INTERACT / DON'T JUST OBSERVE</p><h3 id="demo-lab-heading">Try a little <em>of the craft.</em></h3></div>
      <p>Choose a service above, then interact with a working React interface. These are original, illustrative examples—not screenshots or claims of completed client projects.</p>
    </div>
    <div className="demo-lab-controls"><span>LIVE INTERFACE CONCEPT <i aria-hidden="true"/> {service?.name?.toUpperCase()}</span><button type="button" aria-expanded={show} aria-controls="demo-lab-stage" onClick={()=>setShow(value=>!value)}>{show?'Hide demonstration':'Show demonstration'} <span aria-hidden="true">{show?'−':'+'}</span></button></div>
    {show&&<div className="demo-lab-stage" id="demo-lab-stage"><Demo key={service.slug}/></div>}
    <div className="demo-lab-foot"><span>REAL INTERACTION · LOCAL STATE · NO BACKEND TRANSACTIONS</span><a href={'/services/'+service.slug+'/'}>See what I could build for your business <span aria-hidden="true">↗</span></a></div>
  </section>;
}
