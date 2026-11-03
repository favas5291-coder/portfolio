import { useEffect, useRef } from 'react';

export default function SceneDirector({controls,screenshot}) {
  const current=useRef(controls);
  current.current=controls;
  useEffect(()=>{
    const preference=matchMedia('(prefers-reduced-motion: reduce)');
    const slots=[...document.querySelectorAll('[data-scene-slot]')];
    const setMap=()=>slots.forEach(s=>{s.dataset.renderer='map';s.dataset.intro='complete';});
    let stop=null, cancelled=false, generation=0;
    async function setup() {
      const request=++generation;
      stop?.(); stop=null;
      setMap();
      if(preference.matches) return;
      try {
        const {mountHarbour}=await import('./harbour.js');
        if(cancelled || request!==generation) return;
        stop=mountHarbour(slots,()=>current.current,screenshot);
      } catch { setMap(); }
    }
    const timer=window.setTimeout(setup,60);
    preference.addEventListener('change',setup);
    return ()=>{cancelled=true;window.clearTimeout(timer);preference.removeEventListener('change',setup);stop?.();};
  },[screenshot]);
  return null;
}
