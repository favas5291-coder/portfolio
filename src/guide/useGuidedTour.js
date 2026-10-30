import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { initialTour, tourReducer, tourSteps } from './tourConfig.js';
import { createNarration } from './narration.js';

const SESSION_KEY = 'favas:introduction-dismissed:v1';
export function chooseEnglishVoice(voices) {
  const english = voices.filter(voice => /^en([_-]|$)/i.test(voice.lang));
  return english.find(v => /natural|neural|google uk english male|microsoft.*(guy|ryan|prabhat)/i.test(v.name)) || english.find(v => /^en[-_]IN/i.test(v.lang)) || english.find(v => v.localService) || english[0] || null;
}

export function useGuidedTour() {
  const [state, dispatch] = useReducer(tourReducer, initialTour);
  const [speaking, setSpeaking] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [capability, setCapability] = useState('detecting');
  const voices = useRef([]);
  const playback = useRef(null);
  const step = tourSteps[state.index];
  const active = state.status === 'playing' || state.status === 'paused';

  const remember = useCallback(() => { setDismissed(true); try { sessionStorage.setItem(SESSION_KEY, '1'); } catch {} }, []);
  const start = useCallback((sound = true) => { remember(); dispatch({ type: 'START', sound }); }, [remember]);
  const skip = useCallback(() => { remember(); dispatch({ type: 'SKIP' }); }, [remember]);

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(SESSION_KEY) === '1'); } catch {}
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReducedMotion(media.matches); motion(); media.addEventListener('change', motion);
    const visibility = () => { setHidden(document.hidden); if (document.hidden) { playback.current?.pause(); dispatch({ type: 'PAUSE' }); } };
    document.addEventListener('visibilitychange', visibility);
    const leaving = () => { playback.current?.pause(); dispatch({ type: 'PAUSE' }); };
    window.addEventListener('pagehide', leaving);
    const speech = window.speechSynthesis;
    const refreshVoices = () => { voices.current = speech?.getVoices() || []; setCapability(speech && typeof SpeechSynthesisUtterance !== 'undefined' ? 'speech' : 'captions'); };
    refreshVoices(); speech?.addEventListener?.('voiceschanged', refreshVoices);
    return () => { media.removeEventListener('change', motion); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', leaving); speech?.removeEventListener?.('voiceschanged', refreshVoices); };
  }, []);

  // Each caption stays with its own clip. Pausing keeps the media playhead.
  useEffect(() => {
    if (!active) return;
    const driver = createNarration(step.segments[state.segment], {
      sound: state.sound, capability, voice: chooseEnglishVoice(voices.current),
      onEnd: () => dispatch({ type: 'SEGMENT_END' }), onSpeaking: setSpeaking,
      onBlocked: () => dispatch({ type: 'BLOCKED' }),
    });
    playback.current = driver;
    return () => { driver.dispose(); playback.current = null; };
  }, [active, state.index, state.segment, state.sound, state.run, capability, step]);

  useEffect(() => {
    if (state.status === 'playing' && !hidden) playback.current?.play();
    else playback.current?.pause();
  }, [state.status, state.index, state.segment, state.sound, state.run, capability, hidden, active]);

  useEffect(() => {
    if (!active) return;
    const section = document.getElementById(step.target);
    const highlighted = document.getElementById(step.highlight);
    highlighted?.classList.add('tour-highlight');
    section?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    const heading = section?.querySelector('h1, h2');
    heading?.focus({ preventScroll: true });
    return () => highlighted?.classList.remove('tour-highlight');
  }, [active, state.index, state.run, step, reducedMotion]);

  useEffect(() => {
    if (!active) return;
    const manuallyBrowse = event => {
      if (event.type === 'keydown' && !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Escape'].includes(event.key)) return;
      dispatch({ type: 'PAUSE' });
    };
    window.addEventListener('wheel', manuallyBrowse, { passive: true });
    window.addEventListener('touchmove', manuallyBrowse, { passive: true });
    window.addEventListener('keydown', manuallyBrowse);
    const click = event => { const link = event.target.closest?.('a'); if (link && !link.closest('.tour-console')) dispatch({ type: 'PAUSE' }); };
    document.addEventListener('click', click);
    return () => { window.removeEventListener('wheel', manuallyBrowse); window.removeEventListener('touchmove', manuallyBrowse); window.removeEventListener('keydown', manuallyBrowse); document.removeEventListener('click', click); };
  }, [active]);

  return { state, step, active, speaking, reducedMotion, hidden, dismissed, capability, start, skip, dispatch, remember };
}
