// Browser-only media is created on Play, never during page load or rendering.
export function createNarration(segment, { sound, capability, voice, onEnd, onSpeaking, onBlocked, audioFactory = src => new Audio(src), speech = globalThis.speechSynthesis, utteranceFactory = text => new SpeechSynthesisUtterance(text), clock = () => performance.now(), schedule = setTimeout, unschedule = clearTimeout }) {
  let disposed = false, running = false, finished = false, started = false;
  let timer, watchdog, startedAt = 0, remaining = segment.durationMs, audio, utterance;
  const end = () => { if (disposed || finished || !running) return; finished = true; running = false; onSpeaking(false); onEnd(); };
  const blocked = () => { if (disposed) return; started = false; running = false; onSpeaking(false); onBlocked(); };
  const timerMode = !sound || (!segment.audio && capability !== 'speech');
  return {
    play() {
      if (disposed || finished || running) return;
      running = true;
      if (timerMode) { startedAt = clock(); timer = schedule(end, remaining); return; }
      if (segment.audio) {
        if (!audio) {
          audio = audioFactory(segment.audio); audio.preload = 'auto';
          audio.onplaying = () => { if (!disposed && running) onSpeaking(true); };
          audio.onended = end; audio.onerror = blocked;
        }
        audio.play().catch(blocked); return;
      }
      if (started) { speech.resume(); onSpeaking(true); return; }
      utterance = utteranceFactory(segment.text);
      if (voice) { utterance.voice = voice; utterance.lang = voice.lang; } else utterance.lang = 'en-IN';
      utterance.rate = 1.03; utterance.pitch = 1; utterance.volume = 1;
      utterance.onstart = () => { unschedule(watchdog); if (!disposed && running) onSpeaking(true); };
      utterance.onend = end;
      utterance.onerror = event => { if (!disposed && !['interrupted', 'canceled'].includes(event.error)) blocked(); };
      speech.cancel(); speech.resume(); started = true; speech.speak(utterance);
      watchdog = schedule(() => { if (!disposed && running && !speech.speaking && !speech.paused) blocked(); }, 4500);
    },
    pause() {
      if (disposed || !running) return;
      running = false; onSpeaking(false);
      if (timerMode) { unschedule(timer); remaining = Math.max(0, remaining - (clock() - startedAt)); }
      else if (audio) audio.pause();
      else if (started) { unschedule(watchdog); speech.pause(); }
    },
    dispose() {
      disposed = true; running = false; unschedule(timer); unschedule(watchdog);
      if (audio) { audio.onplaying = audio.onended = audio.onerror = null; audio.pause(); audio.removeAttribute('src'); audio.load(); }
      if (utterance) { utterance.onstart = utterance.onend = utterance.onerror = null; speech.cancel(); }
      onSpeaking(false);
    },
  };
}
