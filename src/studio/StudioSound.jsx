import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

// Generate a quiet air-conditioning bed. Audio is created only after a gesture.
export function StudioSound() {
  const audio = useRef(null);
  const alive = useRef(true);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(false);
  function stop() {
    const context = audio.current;
    audio.current = null;
    if (context && context.state !== 'closed') context.close().catch(() => {});
    if (alive.current) setPlaying(false);
  }
  useEffect(() => {
    alive.current = true;
    setAvailable(Boolean(window.AudioContext || window.webkitAudioContext));
    function hide() {
      if (document.hidden) stop();
    }
    document.addEventListener('visibilitychange', hide);
    return () => {
      alive.current = false;
      document.removeEventListener('visibilitychange', hide);
      stop();
    };
  }, []);
  async function toggle() {
    if (audio.current) {
      stop();
      return;
    }
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      const context = new Context();
      audio.current = context;
      await context.resume();
      if (audio.current !== context || !alive.current) return;
      const noise = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const values = noise.getChannelData(0);
      for (let i = 0; i < values.length; i++) values[i] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      filter.type = 'lowpass';
      filter.frequency.value = 425;
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.045, context.currentTime + 0.35);
      source.buffer = noise;
      source.loop = true;
      source.connect(filter).connect(gain).connect(context.destination);
      source.start();
      setPlaying(true);
    } catch {
      stop();
    }
  }
  if (!available) return null;
  const Icon = playing ? Volume2 : VolumeX;
  return (
    <button
      className="studio-sound"
      type="button"
      aria-pressed={playing}
      aria-label="Ambient sound"
      title={playing ? 'Mute ambient sound' : 'Enable ambient sound'}
      onClick={toggle}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
