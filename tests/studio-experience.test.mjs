import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { services, processSteps } from '../src/data/site.js';
import { project, profile } from '../src/data/portfolio.js';
import { tourSteps, characterAsset } from '../src/guide/tourConfig.js';

const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
const world=readFileSync(new URL('../src/cinema/StudioWorld.jsx',import.meta.url),'utf8');
const style=readFileSync(new URL('../src/cinema/CinematicPortfolio.css',import.meta.url),'utf8');

test('cinematic rebuild uses one persistent 3D studio across five real chapters',()=>{
  assert.match(app, /<StudioWorld chapter=/);
  assert.match(world,/const STOPS = \[0, 8\.5, 17, 25\.5, 34\]/);
  for(const chapter of ['home','services','projects','process','contact']){
    assert.ok(app.includes('id="'+chapter+'"'),'Missing semantic chapter: '+chapter);
    assert.ok(tourSteps.some(step=>step.target===chapter),'Missing tour target: '+chapter);
  }
  assert.match(world,/function StudioArchitecture/);
  assert.match(world,/function WelcomeStation/);
  assert.match(world,/function ServiceStation/);
  assert.match(world,/function ProjectStation/);
  assert.match(world,/function WorkflowStation/);
  assert.match(world,/function ContactStation/);
});

test('only actual site services and process steps populate interaction controls',()=>{
  assert.equal(services.length,4);
  assert.equal(processSteps.length,5);
  assert.match(app,/services\.map/);
  assert.match(app,/processSteps\.map/);
  assert.match(app,/aria-pressed=\{selected===index\}/);
  assert.match(app,/onSelect=\{setServiceIndex\}/);
  assert.match(app,/onSelect=\{setProcessIndex\}/);
  assert.match(world,/onSelect\?\.\(i\)/);
});

test('authentic project and contact destinations survive the rebuild',()=>{
  assert.equal(project.name,'GymDrobe');
  assert.ok(profile.email.includes('@'));
  for(const link of ['/projects/gymdrobe/','/services/','/contact/'])assert.ok(app.includes(link),'Missing '+link);
  assert.match(app,/project\.screenshot/);
  assert.match(app,/project\.screenshotCaptured/);
  assert.match(app,/project\.repository/);
  assert.match(app,/whatsappHref\(\)/);
  assert.match(app,/PHONE_HREF/);
});

test('tour and self-exploration remain separate and audio requires action',()=>{
  assert.match(app,/Meet Favas — Start tour/);
  assert.match(app,/Explore on my own/);
  assert.match(app,/onClick=\{\(\)=>tour\.start\(true\)\}/);
  assert.match(app,/onClick=\{explore\}/);
  assert.match(app,/aria-label="Tour chapters"/);
  assert.match(app,/aria-live="polite"/);
  assert.equal(characterAsset.status,'temporary');
  assert.equal(characterAsset.model,null);
});

test('mobile, reduced-motion, fallback and static environment options exist',()=>{
  assert.match(style,/@media\(max-width:800px\)/);
  assert.match(style,/@media\(max-width:430px\)/);
  assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(app,/SceneBoundary/);
  assert.match(app,/setSceneEnabled/);
  assert.match(world,/document\.hidden/);
  assert.match(world,/dpr=\{\[1,1\.65\]\}/);
});
