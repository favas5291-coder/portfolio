import { useEffect, useRef, useState } from 'react';

// Wind and dial clicks are generated locally and start only after an explicit press.
export default function HarbourSound({dial}) {
  const audio=useRef(null);
  const [enabled,setEnabled]=useState(false);
  const [unavailable,setUnavailable]=useState(false);
  useEffect(()=>{
    const hidden=()=>{if(document.hidden && audio.current){audio.current.suspend().catch(()=>{});setEnabled(false);}};
    document.addEventListener('visibilitychange',hidden);
    return ()=>{document.removeEventListener('visibilitychange',hidden);audio.current?.close().catch(()=>{});audio.current=null;};
  },[]);
  useEffect(()=>{
    const ctx=audio.current;
    if(!enabled || !ctx || ctx.state!=='running')return;
    const click=ctx.createOscillator(),volume=ctx.createGain();
    click.type='triangle';click.frequency.setValueAtTime(520,ctx.currentTime);
    click.frequency.exponentialRampToValueAtTime(145,ctx.currentTime+.023);
    volume.gain.setValueAtTime(.032,ctx.currentTime);volume.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.04);
    click.connect(volume);volume.connect(ctx.destination);
    click.start();click.stop(ctx.currentTime+.05);
  },[dial,enabled]);
  async function toggle(){
    try {
      if(!audio.current){
        const Context=window.AudioContext||window.webkitAudioContext;
        const ctx=new Context();
        audio.current=ctx;
        const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);
        const samples=buffer.getChannelData(0);
        let low=0;
        for(let i=0;i<samples.length;i++){
          low=low*.98+(Math.random()-.5)*.02;
          samples[i]=low*(.25+.13*Math.cos(i/samples.length*Math.PI*2));
        }
        const waves=ctx.createBufferSource();waves.buffer=buffer;waves.loop=true;waves.connect(ctx.destination);waves.start();
      }
      if(enabled)await audio.current.suspend();else await audio.current.resume();
      setEnabled(audio.current.state==='running');
    }catch{setUnavailable(true);setEnabled(false);}
  }
  return <button className="al-sound" type="button" aria-pressed={enabled} onClick={toggle} disabled={unavailable} aria-label={enabled?'Mute harbour sound':'Enable harbour sound'}><svg viewBox="0 0 22 22" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M3 8h4l5-4v14l-5-4H3z"/>{enabled?<path d="M15 7q4 4 0 8m2-11q7 7 0 14"/>:<path d="m15 9 5 5m0-5-5 5"/>}</svg><span>{unavailable?'Unavailable':enabled?'Sound on':'Sound off'}</span></button>;
}
