import test from 'node:test';
import assert from 'node:assert/strict';
import { initialTour, tourReducer, tourSteps, tourDurationSeconds, characterAsset } from '../src/guide/tourConfig.js';
import { services } from '../src/data/site.js';
import { project } from '../src/data/portfolio.js';

test('tour journeys from opt-in through each section to completion and can restart', () => {
  let state = { ...initialTour };
  assert.equal(state.status, 'idle');
  state = tourReducer(state, { type: 'START' });
  assert.equal(state.status, 'playing');
  for (let index = 0; index < tourSteps.length; index++) {
    assert.equal(state.index, index);
    for (const segment of tourSteps[index].segments) state = tourReducer(state, { type: 'SEGMENT_END' });
  }
  assert.equal(state.status, 'completed');
  state = tourReducer(state, { type: 'START', sound: false });
  assert.equal(state.index, 0); assert.equal(state.sound, false); assert.equal(state.status, 'playing');
});

test('pause, sound, blocked playback, skip, previous and next retain visitor control', () => {
  let state = tourReducer(initialTour, { type: 'START' });
  state = tourReducer(state, { type: 'BLOCKED' });
  assert.equal(state.status, 'paused'); assert.equal(state.blocked, true);
  state = tourReducer(state, { type: 'SOUND' });
  assert.equal(state.sound, false); assert.equal(state.blocked, false);
  state = tourReducer(state, { type: 'PLAY' });
  state = tourReducer(state, { type: 'PAUSE' });
  state = tourReducer(state, { type: 'NEXT' });
  assert.equal(state.status, 'paused'); assert.equal(state.index, 1);
  state = tourReducer(state, { type: 'PREVIOUS' });
  state = tourReducer(state, { type: 'PREVIOUS' });
  assert.equal(state.index, 0);
  state = tourReducer(state, { type: 'SELECT', index: 100 });
  assert.equal(state.index, tourSteps.length - 1);
  state = tourReducer(state, { type: 'SKIP' });
  assert.equal(state.status, 'idle');
});

test('narration is concise, factual and configured independently of audio and the final likeness', () => {
  assert.ok(tourDurationSeconds >= 45 && tourDurationSeconds <= 75);
  const servicesScript = tourSteps.find(s => s.id === 'services').segments.map(s => s.text).join(' ');
  for (const service of services) assert.ok(servicesScript.includes(service.name.toLowerCase()));
  assert.equal(tourSteps.find(s => s.id === 'projects').inspect.href, project.website);
  assert.equal(tourSteps.find(s => s.id === 'projects').segments[0].text, project.tourNarration);
  assert.equal(characterAsset.status, 'temporary'); assert.equal(characterAsset.model, null);
  assert.equal(new Set(tourSteps.map(s => s.id)).size, tourSteps.length);
  for (const step of tourSteps) for (const segment of step.segments) {
    assert.ok(segment.text.trim() && segment.durationMs > 0);
    assert.ok(segment.audio === null || segment.audio.startsWith('/audio/'));
  }
});
