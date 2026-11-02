import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { project } from '../data/portfolio.js';
import { services, processSteps } from '../data/site.js';
import { characterAsset, tourSteps } from '../guide/tourConfig.js';

const Character = lazy(() => import('../guide/GuideCharacter.jsx'));
export const mobileCapture = '/images/projects/gymdrobe-mobile-20261102.webp';
export const deliverables = [
  'A written brief with the audience, problem and most important customer journey.',
  'An agreed page list, feature scope, responsibilities and quote.',
  'A working preview you can open and try on your phone.',
  'A reviewed build and a list of agreed changes before release.',
  'The approved site, agreed access and handover information.',
];
const titles = {home:'The worktable', services:'The workshop', projects:'The screening room', process:'The drawing board', contact:'Your project'};
const chapterOrder = Object.keys(titles);
class ActorBoundary extends Component {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function MonitorContent({chapter, selection, kind, device}) {
  if (chapter === 'home' || chapter === 'projects') {
    return <picture>
      {chapter === 'home' && <source media="(max-width: 650px)" srcSet={mobileCapture}/>}
      <img src={device === 'mobile' && chapter === 'projects' ? mobileCapture : project.screenshot}
        width="1348" height="926" alt={project.screenshotAlt} decoding="async"/>
    </picture>;
  }
  if (chapter === 'contact') return <div className="wt-screen-paper"><small>NEW PROJECT / ENQUIRY</small><b>Dear Favas,</b><p>Let’s talk about {kind.toLowerCase()}.</p><i>Start a brief ↗</i></div>;
  if (chapter === 'process') return <div className="wt-screen-paper"><small>PROJECT FILE / 0{selection + 1}</small><b>{processSteps[selection][0]}</b><p>{deliverables[selection]}</p></div>;
  return <div className={'wt-screen-demo wt-demo-'+selection}><small>INTERFACE STUDY / 0{selection+1}</small><b>{services[selection].name}</b><div className="wt-study-shape" aria-hidden="true">{['▤','◒','↗','◐'][selection]}</div><span>Try this service ↓</span></div>;
}
export function Worktable({chapter, selection, kind, device, tour, enabled, onScreen, onPause}) {
  const [host,setHost]=useState(null);
  const [load,setLoad]=useState(false);
  const [ready,setReady]=useState(false);
  const [failed,setFailed]=useState(false);
  const [visible,setVisible]=useState(true);
  const [revealed,setRevealed]=useState(false);
  const [waveDone,setWaveDone]=useState(false);
  const box=useRef(null);
  const onReady=useCallback(()=>setReady(true),[]);
  const onFail=useCallback(()=>{setReady(false);setFailed(true);},[]);
  useLayoutEffect(()=>{
    const node=document.createElement('div');
    node.className='wt-moving-set';
    setHost(node);
    return ()=>node.remove();
  },[]);
  useLayoutEffect(()=>{
    const seat=document.getElementById('seat-'+chapter);
    if(!seat || !host) return;
    seat.appendChild(host);
    if(!tour.reducedMotion && enabled) host.animate?.([{opacity:.55,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:360});
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting));
    observer.observe(host);
    return ()=>observer.disconnect();
  },[host,chapter,tour.reducedMotion,enabled]);
  useEffect(()=>{
    const enable=()=>setLoad(true);
    if(window.requestIdleCallback){const id=requestIdleCallback(enable,{timeout:1000});return ()=>cancelIdleCallback(id);}
    const id=setTimeout(enable,200);return ()=>clearTimeout(id);
  },[]);
  useEffect(()=>{
    if(chapter!=='home' || tour.reducedMotion || !enabled || (tour.dismissed && !tour.state.run)) {setRevealed(true);return;}
    setRevealed(false);
    const timer=setTimeout(()=>setRevealed(true),3000);
    return ()=>clearTimeout(timer);
  },[chapter,tour.state.run,tour.dismissed,tour.reducedMotion,enabled]);
  useEffect(()=>{
    if(chapter!=='home' || !ready)return;
    setWaveDone(false);
    const timer=setTimeout(()=>setWaveDone(true),2350);
    return ()=>clearTimeout(timer);
  },[chapter,ready,tour.state.run]);
  const step=tourSteps.find(item=>item.target===chapter);
  const cue=tour.active && tour.step.target===chapter ? step.segments[tour.state.segment] : null;
  const action=waveDone && chapter==='home' ? step.settledAction : (cue?.action || step.action);
  const use3D=load && enabled && !failed && !tour.reducedMotion;
  const freeze=tour.hidden || !visible || tour.state.status==='paused';
  const studio=<div ref={box} className={'wt-set wt-'+chapter} data-revealed={revealed} data-motion={enabled&&!tour.reducedMotion&&!tour.hidden}
      data-renderer={ready&&use3D?'3d':'portrait'} data-device={device} aria-label={titles[chapter]}>
    <div className="wt-arch" aria-hidden="true"><span/><span/><span/></div>
    <div className="wt-wall-print" aria-hidden="true"><i>f.</i><span>FAZHERE<br/>STUDIO</span></div>
    <div className="wt-room-label"><i/> STUDIO {String(chapterOrder.indexOf(chapter)+1).padStart(2,'0')} <span>/ {titles[chapter]}</span></div>
    <div className="wt-floor" aria-hidden="true"/>
    <div className="wt-desktop" aria-hidden="true"><i/><i/></div>
    <div className="wt-actor" aria-hidden="true">
      <img className="wt-portrait" alt="" src={characterAsset.portrait} width="800" height="1200"/>
      {use3D && <div className="wt-canvas"><ActorBoundary onFail={onFail}><Suspense fallback={null}>
        <Character action={action} speaking={tour.speaking} reducedMotion={tour.reducedMotion} paused={freeze}
          modelUrl={characterAsset.model} clipNames={characterAsset.animations} onReady={onReady} onError={onFail}/>
      </Suspense></ActorBoundary></div>}
    </div>
    <div className="wt-monitor">
      <div className="wt-monitor-neck" aria-hidden="true"/>
      <button type="button" className="wt-display" onClick={()=>{onPause();onScreen(chapter);}} aria-label={chapter==='home'||chapter==='projects'?'Inspect GymDrobe screen':'Open '+titles[chapter]+' controls'}>
        <span className="wt-chrome"><i/><i/><i/><span>{chapter==='home'||chapter==='projects'?'gymdrobe.com':'fazhere / '+chapter}</span></span>
        <span className="wt-view"><MonitorContent chapter={chapter} selection={selection} kind={kind} device={device}/>
          {chapter==='home'&&<span className="wt-wireframe" aria-hidden="true"><i className="wt-wire-product"><img src="/images/projects/gymdrobe-shirt-black.webp" alt=""/></i><i/><i/><i/><i/></span>}</span>
      </button>
    </div>
    <span className="wt-desk-stamp">FAVAS / WORKTABLE NO. 01</span>
  </div>;
  return host ? createPortal(studio,host) : studio;
}

export function ColourStudy() {
  const [colour,setColour]=useState('Black');
  return <section className="colour-study" aria-labelledby="colour-study-title">
    <div className="colour-photo"><img src={colour==='Red'?'/images/projects/gymdrobe-shirt-red.webp':'/images/projects/gymdrobe-shirt-black.webp'} width="240" height="320" loading="lazy" alt={colour+' COITONIC compression shirt shown on the GymDrobe product card'}/></div>
    <div><p className="wt-kicker">GYMDROBE / LOCAL INTERACTION</p><h3 id="colour-study-title">Choose a colour.<br/>See the actual shirt.</h3>
      <p>Shoppers can compare colours directly in the collection. Selecting a swatch changes the product photo before they open the item.</p>
      <div role="group" aria-label="Shirt colour" className="colour-controls">{['Black','Red'].map(c=><button type="button" key={c} aria-pressed={colour===c} onClick={()=>setColour(c)}><i style={{background:c== 'Red'?'#a32c31':'#222'}}/>{c}</button>)}</div>
      <small aria-live="polite">{colour} selected · Local demonstration using real store images.</small></div>
  </section>;
}
