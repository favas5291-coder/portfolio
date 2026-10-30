import test from 'node:test';
import assert from 'node:assert/strict';
import { createNarration } from '../src/guide/narration.js';

function harness() {
  let now = 0, next = 0, ended = 0, blocked = 0;
  const timers = new Map();
  return {
    options: { clock: () => now, schedule: (fn, ms) => { timers.set(++next, { fn, at: now + ms }); return next; }, unschedule: id => timers.delete(id), onEnd: () => ended++, onBlocked: () => blocked++, onSpeaking: () => {} },
    advance(ms) { now += ms; for (const [id, task] of [...timers]) if (task.at <= now) { timers.delete(id); task.fn(); } },
    get ended() { return ended; }, get blocked() { return blocked; },
  };
}

test('captions do not autoplay and pausing preserves remaining reading time', () => {
  const h = harness();
  const driver = createNarration({ text: 'Welcome', durationMs: 1000 }, { ...h.options, sound: false });
  h.advance(2000); assert.equal(h.ended, 0);
  driver.play(); h.advance(400); driver.pause(); h.advance(5000);
  assert.equal(h.ended, 0);
  driver.play(); h.advance(599); assert.equal(h.ended, 0);
  h.advance(1); assert.equal(h.ended, 1);
  driver.play(); h.advance(5000); assert.equal(h.ended, 1);
  driver.dispose();
});

test('speech is activated by Play, pauses and resumes, and cancels on disposal', () => {
  const h = harness(); const calls = [];
  const speech = { speaking: true, paused: false, cancel() { calls.push('cancel'); }, resume() { calls.push('resume'); }, pause() { calls.push('pause'); }, speak(value) { calls.push('speak'); this.utterance = value; value.onstart(); } };
  const driver = createNarration({ text: 'Hello', durationMs: 1000 }, { ...h.options, sound: true, capability: 'speech', speech, utteranceFactory: text => ({ text }) });
  assert.deepEqual(calls, []);
  driver.play(); assert.equal(calls.filter(x => x === 'speak').length, 1);
  driver.pause(); assert.equal(calls.at(-1), 'pause');
  driver.play(); assert.equal(calls.at(-1), 'resume');
  assert.equal(calls.filter(x => x === 'speak').length, 1);
  const oldEnd = speech.utterance.onend;
  driver.dispose(); oldEnd(); assert.equal(h.ended, 0);
  assert.equal(calls.at(-1), 'cancel');
});

test('recorded audio retains playhead and blocked playback is recoverable', async () => {
  const h = harness(); let audio;
  const driver = createNarration({ text: 'Hello', durationMs: 1000, audio: '/audio/tour/welcome.mp3' }, { ...h.options, sound: true, audioFactory: src => (audio = { src, currentTime: 0, fail: true, play() { return this.fail ? Promise.reject(new Error('blocked')) : Promise.resolve(); }, pause() {}, load() {}, removeAttribute() {} }) });
  assert.equal(audio, undefined);
  driver.play(); await Promise.resolve(); assert.equal(h.blocked, 1);
  audio.fail = false; driver.play(); audio.currentTime = .6; driver.pause(); driver.play();
  assert.equal(audio.currentTime, .6);
  audio.onended(); assert.equal(h.ended, 1);
  driver.dispose();
});
