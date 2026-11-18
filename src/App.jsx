import { useCallback, useEffect, useRef, useState } from 'react';
import { Footer } from './fit/Layout.jsx';
import { profile } from './data/portfolio.js';
import { whatsappHref } from './data/site.js';
import { BrowsePortfolio, Destination, destinations } from './drive/Destinations.jsx';
import DriveMap from './drive/Map.jsx';
import { ControlsHelp, Icon, Joystick } from './drive/Controls.jsx';
import './drive/drive.css';

const isPanel = id => id === 'map' || id === 'controls' || Object.hasOwn(destinations, id);
const currentPanel = () => {
  const id = location.hash.slice('#drive-'.length);
  return location.hash.startsWith('#drive-') && isPanel(id) ? id : null;
};

export default function App() {
  const host = useRef(null), engine = useRef(null), dialog = useRef(null), opener = useRef(null);
  const livePanel = useRef(null), stick = useRef([0, 0]);
  const [panel, setPanel] = useState(null), [ready, setReady] = useState(false), [nearby, setNearby] = useState(null);
  const [muted, setMuted] = useState(true), [moved, setMoved] = useState(false), [discovered, setDiscovered] = useState(false);

  const applyPanel = useCallback(id => {
    livePanel.current = id;
    engine.current?.setPaused(Boolean(id), Object.hasOwn(destinations, id) ? id : null);
    setPanel(id);
  }, []);

  const open = useCallback((id, event) => {
    if (!isPanel(id) || (event && (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0))) return;
    event?.preventDefault();
    if (livePanel.current === id) return;
    if (!livePanel.current) opener.current = document.activeElement;
    const state = {...history.state, driveOverlay: true};
    if (livePanel.current) history.replaceState(state, '', '#drive-' + id);
    else history.pushState(state, '', '#drive-' + id);
    applyPanel(id);
  }, [applyPanel]);

  const close = useCallback(() => {
    if (history.state?.driveOverlay) history.back();
    else {
      history.replaceState(history.state, '', location.pathname + location.search);
      applyPanel(null);
    }
  }, [applyPanel]);

  useEffect(() => {
    const changed = () => applyPanel(currentPanel());
    changed();
    window.addEventListener('popstate', changed);
    window.addEventListener('hashchange', changed);
    return () => {window.removeEventListener('popstate', changed); window.removeEventListener('hashchange', changed);};
  }, [applyPanel]);

  useEffect(() => {
    const el = dialog.current;
    if (panel) {
      if (!el.open) el.showModal();
      el.scrollTop = 0;
      el.querySelector('[data-close-drive]')?.focus({preventScroll:true});
    } else if (el.open) {
      el.close();
      const target = opener.current;
      if (target && target !== document.body && target.isConnected) target.focus({preventScroll:true});
      else host.current?.focus({preventScroll:true});
      opener.current = null;
    }
  }, [panel]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let serial = 0, idleTimer;
    function stop() {
      ++serial;
      clearTimeout(idleTimer);
      engine.current?.dispose();
      engine.current = null;
      setReady(false); setNearby(null); setMuted(true);
    }
    function start() {
      stop();
      if (media.matches) return;
      const ticket = serial;
      import('./drive/engine.js').then(({createDrive}) => {
        if (ticket !== serial || !host.current) return;
        const game = createDrive(host.current, {
          onNearby:setNearby, onInteract:open, onMap:() => open('map'), onMuteChange:setMuted,
          onFirstDrive:() => setMoved(true), onDiscovery:() => setDiscovered(true),
          onFallback:stop, onReady:() => {
            if (ticket !== serial) return;
            setReady(true);
            idleTimer = window.setTimeout(() => engine.current?.setExpanded()?.catch(() => {}), 90);
          },
        });
        engine.current = game;
        game.restorePose?.(history.state?.drivePose);
        const id = livePanel.current;
        if (id) game.setPaused(true, Object.hasOwn(destinations, id) ? id : null);
        else game.setStick(...stick.current);
      }).catch(() => { if (ticket === serial) stop(); });
    }
    function remember() {
      const pose = engine.current?.getPose?.();
      if (pose) history.replaceState({...history.state, drivePose:pose}, '');
    }
    start();
    media.addEventListener('change', start);
    window.addEventListener('pagehide', remember);
    return () => {
      media.removeEventListener('change', start);
      window.removeEventListener('pagehide', remember);
      stop();
    };
  }, [open]);

  function setStick(x,y) { stick.current = [x,y]; engine.current?.setStick(x,y); }
  const gym = destinations.gymdrobe;
  return <div className="drive-site">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="drive-header">
      <a href="#home" aria-label="Fazhere home" className="drive-brand"><i aria-hidden="true"/>Fazhere.<span>Drive</span></a>
      <nav aria-label="Portfolio navigation"><a href="#projects">Browse projects</a><a href="/contact/">Contact <Icon name="out"/></a></nav>
    </header>
    <main id="main" tabIndex={-1}>
      <section id="home" aria-label="Fazhere Drive">
        <div className="drive-intro">
          <div><p>{profile.name} · Full-stack developer</p><h1>I build websites and apps that help businesses <em>grow.</em></h1></div>
          <div className="drive-links"><a className="drive-ink-button" href={gym.href} onClick={e=>open('gymdrobe',e)}>View GymDrobe <Icon name="arrow"/></a><a className="drive-whatsapp" href={whatsappHref()} data-contact="whatsapp" target="_blank" rel="noopener noreferrer"><Icon name="wa"/> Chat on WhatsApp</a></div>
        </div>
        <div className={'drive-stage' + (ready?' is-live':'')} aria-label="Explore the Kozhikode neighbourhood">
          <div className="drive-chart" hidden={ready}><DriveMap onOpen={open}/></div>
          <div className="drive-host" ref={host} data-drive-host="" tabIndex={ready?0:-1} aria-label="Drive the pickup. Use arrow keys or WASD, B to brake and Enter to explore a nearby stop."/>
          {ready && <>
            <div className="drive-location"><Icon name="pin"/><span>Kozhikode</span></div>
            <div className="drive-toolbox">
              <button onClick={()=>open('map')} aria-label="Map"><Icon name="map"/><span>Map</span></button>
              <button aria-label="Sound" aria-pressed={!muted} title={muted?'Turn sound on':'Turn sound off'} onClick={()=>engine.current?.toggleMute()}><Icon name={muted?'mute':'sound'}/></button>
              <button aria-label="Controls" title="Driving controls" onClick={()=>open('controls')}><Icon name="controls"/></button>
              <button aria-label="Respawn" title="Recover the pickup" onClick={()=>engine.current?.respawn()}><Icon name="reset"/></button>
            </div>
            <div className="drive-stick-wrap"><Joystick onStick={setStick}/></div>
            <div className="drive-pedals"><button onClick={()=>engine.current?.jump()}>Jump</button><button data-brake="" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId); engine.current?.setBrake(true);}} onPointerUp={()=>engine.current?.setBrake(false)} onPointerCancel={()=>engine.current?.setBrake(false)} onLostPointerCapture={()=>engine.current?.setBrake(false)} onKeyDown={e=>{if(e.key===' '||e.key==='Enter') engine.current?.setBrake(true);}} onKeyUp={()=>engine.current?.setBrake(false)} onBlur={()=>engine.current?.setBrake(false)}>Brake</button></div>
            <div className="drive-prompt" aria-live="polite">
              {nearby && destinations[nearby] ? <button data-interact="" onClick={()=>engine.current?.interact()}>Explore {destinations[nearby].name} <Icon name="arrow"/></button> : discovered ? <span>Delivery bay unlocked</span> : !moved ? <span>Drive to explore.</span> : null}
            </div>
          </>}
        </div>
        <div className="drive-caption"><span>{ready?'Kozhikode, Kerala':'Kozhikode, Kerala · Neighbourhood map'}</span><a href="#projects">Browse portfolio <Icon name="arrow"/></a></div>
      </section>
      <BrowsePortfolio onOpen={open}/>
    </main>
    <Footer/>
    <dialog className="drive-dialog" ref={dialog} aria-label={destinations[panel]?.name || (panel==='controls'?'Driving controls':'Neighbourhood map')} onCancel={e=>{e.preventDefault(); close();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect(); if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}}}>
      {panel && <><header className="drive-dialog-nav"><button data-close-drive="" onClick={close}><Icon name="back"/> Back to drive</button><a href="/contact/">Contact <Icon name="out"/></a></header>
      {panel==='map' ? <DriveMap onOpen={open}/> : panel==='controls' ? <ControlsHelp/> : <Destination id={panel}/>}</>}
    </dialog>
  </div>;
}
