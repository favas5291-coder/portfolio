import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { services,processSteps } from '../src/data/site.js';
import { project,profile } from '../src/data/portfolio.js';
import { tourSteps,characterAsset } from '../src/guide/tourConfig.js';

const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const world=readFileSync(new URL('../src/cinema/ImmersiveWorld.jsx',import.meta.url),'utf8');
const style=readFileSync(new URL('../src/cinema/ImmersiveChapters.css',import.meta.url),'utf8');

test('five original physical states share one lazy-loaded R3F world',()=>{
  assert.match(app,/lazy\(\(\) => import\('\.\/cinema\/ImmersiveWorld\.jsx'\)\)/);
  assert.match(app,/<ImmersiveWorld chapter=/);
  assert.match(world,/const THEMES=\[/);
  assert.match(world,/export const STOPS=\[0,14,28,42,56\]/);
  for(const id of ['home','services','projects','process','contact']){
    assert.ok(app.includes('id="'+id+'"'),'Missing HTML chapter '+id);
    assert.ok(tourSteps.some(step=>step.target===id),'Missing tour target '+id);
  }
  for(const component of ['Spark','Formation','ProjectDisplay','CircuitForge','Portal','Director']){
    assert.ok(world.includes('function '+component+'('),'Missing real 3D component '+component);
  }
});
test('semantic services and collaboration controls reflect real source data',()=>{
  assert.equal(services.length,4);
  assert.equal(processSteps.length,5);
  assert.match(app,/services\.map/);
  assert.match(app,/processSteps\.map/);
  assert.match(app,/aria-pressed=\{selected===index\}/);
  assert.match(app,/onSelect=\{setServiceIndex\}/);
  assert.match(app,/onSelect=\{setProcessIndex\}/);
  assert.match(world,/selected= \{?serviceIndex|selected=\{serviceIndex\}/);
  assert.match(world,/phase=\{processIndex\}/);
  assert.match(app,/NOT COMPLETED CLIENT PROJECTS/);
});
test('authentic project screenshot and direct contact actions are retained',()=>{
  assert.equal(project.name,'GymDrobe');
  assert.ok(profile.email.includes('@'));
  for(const route of ['/projects/gymdrobe/','/services/','/contact/'])assert.ok(app.includes(route));
  assert.match(app,/project\.screenshot/);
  assert.match(world,/useLoader\(TextureLoader,project\.screenshot\)/);
  assert.match(app,/project\.screenshotCaptured/);
  assert.match(app,/project\.repository/);
  assert.match(app,/whatsappHref\(\)/);
  assert.match(app,/PHONE_HREF/);
});
test('opt-in tour and reduced motion remain independent from visual exploration',()=>{
  assert.match(app,/Meet Favas — Start tour/);
  assert.match(app,/Explore on my own/);
  assert.match(app,/onClick=\{\(\)=>tour\.start\(true\)\}/);
  assert.match(app,/onClick=\{explore\}/);
  assert.match(app,/aria-label="Tour chapters"/);
  assert.match(app,/aria-live="polite"/);
  assert.equal(characterAsset.status,'temporary');
  assert.equal(characterAsset.model,null);
  assert.doesNotMatch(world,/Rig\s+action=/);
});
test('scroll position, mobile layout, WebGL loss and static fallback are supported',()=>{
  assert.match(world,/window\.addEventListener\('scroll'/);
  assert.match(world,/document\.hidden/);
  assert.match(world,/webglcontextlost/);
  assert.match(world,/dpr=\{\[1,1\.6\]\}/);
  assert.match(world,/MathUtils\.damp/);
  assert.match(style,/@media \(max-width:800px\)/);
  assert.match(style,/@media\(max-width:430px\)/);
  assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(app,/SceneBoundary/);
  assert.match(app,/setSceneEnabled/);
});
