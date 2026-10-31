import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { services, processSteps } from '../src/data/site.js';
import { project, profile } from '../src/data/portfolio.js';
import { tourSteps } from '../src/guide/tourConfig.js';

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const experience = readFileSync(new URL('../src/experience/StudioInteractions.jsx', import.meta.url), 'utf8');
const style = readFileSync(new URL('../src/experience/studioInteractions.css', import.meta.url), 'utf8');

test('the interactive demos correspond exactly to the real advertised services', () => {
  assert.equal(services.length, 4);
  for (const service of services) {
    assert.match(experience, new RegExp(`'${service.slug}':\\s*\\w+Scene`));
    assert.ok(app.includes('services={services}'));
  }
  assert.match(experience, /not client projects/i);
  assert.match(experience, /not claims of completed client work/i);
});

test('the process lab uses all actual stages without inventing a process', () => {
  assert.equal(processSteps.length, 5);
  assert.match(app, /<ProcessWorkshop steps=\{processSteps\}/);
  assert.match(experience, /steps\.map/);
  assert.match(experience, /aria-pressed=\{selected === index\}/);
});

test('portfolio still exposes real project and contact routes', () => {
  assert.ok(project.website.startsWith('https://'));
  assert.ok(profile.email.includes('@'));
  for (const route of ['/projects/gymdrobe/', '/services/', '/contact/']) assert.ok(app.includes(route));
  assert.match(app, /project\.screenshot/);
  assert.match(app, /project\.repository/);
  assert.match(app, /whatsappHref\(\)/);
});

test('tour and free exploration remain independently usable', () => {
  for (const step of tourSteps) assert.ok(app.includes(`'${step.target}'`) || app.includes(`id="${step.target}"`));
  assert.match(app, /Start tour with sound/);
  assert.match(app, /Explore myself/);
  assert.match(app, /aria-label=\{`Go to \$\{item\.title\}`\}/);
  assert.match(app, /data-chapter=\{chapter\}/);
});

test('motion safety and mobile composition are explicitly provided', () => {
  assert.match(style, /prefers-reduced-motion:reduce/);
  assert.match(style, /max-width:767px/);
  assert.match(style, /max-width:1100px/);
  assert.match(style, /\.character-stage\.explore-guide/);
});
