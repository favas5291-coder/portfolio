import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { services, processSteps } from '../src/data/site.js';
import { tourSteps } from '../src/guide/tourConfig.js';
import { project, profile } from '../src/data/portfolio.js';

let server, html, caseStudy;
before(async () => {
  server = await createServer({server:{middlewareMode:true,hmr:false},appType:'custom',logLevel:'error'});
  const { render } = await server.ssrLoadModule('/src/entry-server.jsx');
  html = render('/');
  caseStudy = render('/projects/gymdrobe/');
});
after(async () => { await server?.close(); });
test('the first HTML gives a name, offering, real work, contacts and both visitor choices', () => {
  for(const text of [profile.name,'I build websites','Start tour with sound','Explore myself','View GymDrobe','Meet Favas',project.screenshot]) assert.ok(html.includes(text),text);
  assert.ok(html.includes('data-tour-status="idle"'));
  assert.ok(!html.includes('<canvas'));
});
test('every narration highlight has an actual HTML target and the five stations exist', () => {
  for(const step of tourSteps){
    for(const id of [step.target,step.highlight,'seat-'+step.target,...step.segments.map(s=>s.highlight).filter(Boolean)]) assert.ok(html.includes('id="'+id+'"'),id);
  }
  assert.deepEqual(tourSteps[1].segments.map(s=>s.service),services.map((_,i)=>i));
  assert.deepEqual(tourSteps[3].segments.map(s=>s.stage),processSteps.map((_,i)=>i));
});
test('the storefront proof is inspectable without a rendered character', () => {
  for(const text of ['2 November 2026','GymDrobe screenshot device','Shirt colour','Local demonstration','Visit live website','View code','Read case study']) assert.ok(html.includes(text),text);
  assert.ok(caseStudy.includes('935e09add8383cfa104379f83e002ed3b0834b8f/src/components/ProductCard.jsx'));
  assert.ok(caseStudy.includes('displayed the red shirt'));
});
test('all service choices, written collaboration stages, contact destinations and an editable brief are present', () => {
  for(const name of [...services.map(s=>s.name),...processSteps.map(s=>s[0]),'Discuss this service',profile.email,'tel:+918156805806','https://wa.me/918156805806','id="brief-kind"']) assert.ok(html.includes(name),name);
  assert.ok(html.includes('Nothing is submitted automatically'));
});
