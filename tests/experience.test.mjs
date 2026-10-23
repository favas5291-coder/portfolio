import assert from 'node:assert/strict';
import test from 'node:test';
import { readPreferences, savePreferences, gentleMotion, PREFERENCE_KEY } from '../src/experience/preferences.js';
import { initialQuality, createQualityMonitor, QUALITY } from '../src/experience/quality.js';
import { sampleScroll } from '../src/experience/scroll.js';
import { attachSceneLifecycle } from '../src/experience/lifecycle.js';

function storage(initial = {}) {
  const entries = new Map(Object.entries(initial));
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
}
test('fresh, unavailable and corrupt storage all start in 3D', () => {
  for (const source of [storage(), undefined, storage({[PREFERENCE_KEY]:'bad json'}), {getItem(){throw Error('blocked');}}]) {
    assert.equal(readPreferences(source).view, 'three');
  }
});
test('automatic/provenance-free v2 2D entries do not disable 3D', () => {
  for (const source of ['automatic', undefined]) {
    assert.equal(readPreferences(storage({[PREFERENCE_KEY]:JSON.stringify({version:2,source,view:'static'})})).view,'three');
  }
});
test('deliberate legacy 2D selection is preserved; choosing 3D overrides it', () => {
  const source=storage({'forge-view':'static'});
  assert.equal(readPreferences(source).view,'static');
  savePreferences(source,{view:'three',motion:'gentle'});
  assert.deepEqual(readPreferences(source),{view:'three',motion:'gentle'});
});
test('deliberate v2 2D and full-motion preferences survive refresh', () => {
  const source=storage(); savePreferences(source,{view:'static',motion:'full'});
  assert.deepEqual(readPreferences(source),{view:'static',motion:'full'});
});
test('reduced motion chooses gentler animation, with an explicit full-motion override', () => {
  assert.equal(gentleMotion(true,'system'),true);
  assert.equal(gentleMotion(true,'full'),false);
  assert.equal(gentleMotion(false,'gentle'),true);
  assert.equal(gentleMotion(false,'system'),false);
});
test('mobile/hardware/data-saver hints choose conservative render quality', () => {
  for(const hints of [{width:390},{width:1440,coarse:true},{width:1440,saveData:true},{width:1440,memory:2},{width:1440,cores:2}]) assert.equal(initialQuality(hints),0);
  assert.equal(initialQuality({width:1440,memory:16,cores:12}),2);
  assert.ok(QUALITY.every(q=>q.segments>=16&&q.textureSize>=512&&q.dpr>0));
});
function feed(monitor, fps, seconds) {
  const changes=[];
  for(let i=0;i<fps*seconds;i++){const tier=monitor.sample(1/fps);if(tier!==null)changes.push(tier);}
  return changes;
}
test('sustained slow rendering lowers quality without disabling the scene', () => {
  const monitor=createQualityMonitor(2);
  assert.deepEqual(feed(monitor,24,20),[1,0]);
});
test('short frame spikes and idle/resume intervals do not lower quality', () => {
  const monitor=createQualityMonitor(2);
  assert.equal(monitor.sample(8),null); assert.equal(monitor.sample(0),null);
  assert.deepEqual(feed(monitor,24,1),[]); monitor.reset();
  assert.deepEqual(feed(monitor,60,10),[]);
});
test('fast sustained frames increase mobile quality only to its cap', () => {
  const monitor=createQualityMonitor(0,1);
  assert.deepEqual(feed(monitor,60,35),[1]);
});
test('quality cooldown prevents repeated reconfiguration after recovery', () => {
  const monitor=createQualityMonitor(2); monitor.setTier(0);
  assert.deepEqual(feed(monitor,60,8),[]);
  assert.deepEqual(feed(monitor,60,12),[1]);
});
test('native scroll samples drive every chapter continuously, including rubber-banding', () => {
  const stops=[0,900,1900,3300,5000];
  assert.equal(sampleScroll(stops,-50,6000,800).position,0);
  assert.equal(sampleScroll(stops,1400,6000,800).position,1.5);
  assert.equal(sampleScroll(stops,3300,6000,800).index,3);
  assert.equal(sampleScroll(stops,9000,6000,800).progress,100);
  for(let y=0;y<=5200;y+=11){const p=sampleScroll(stops,y,6000,800);assert.ok(Number.isFinite(p.position));assert.ok(p.position>=0&&p.position<=4);}
});
test('recomputed viewport/section geometry retains the current chapter', () => {
  const before=sampleScroll([0,900,1900,3300,5000],1400,6000,844);
  const after=sampleScroll([0,950,2000,3400,5100],1400,6100,740);
  assert.equal(after.index,before.index);assert.ok(after.position>1&&after.position<2);
  assert.ok(Number.isFinite(sampleScroll([0,0,0,0,0],0,0,0).position));
});

function lifecycleFixture() {
  const canvas=new EventTarget(), page=new EventTarget(), wakeTarget=new EventTarget();page.hidden=false;
  const calls=[], pending=new Map();let id=0;
  const timers={setTimeout(fn){pending.set(++id,fn);return id;},clearTimeout(key){pending.delete(key);}};
  const dispose=attachSceneLifecycle({canvas,page,wakeTarget,timers,pause:value=>calls.push(['pause',value]),wake:()=>calls.push(['wake']),recovering:()=>calls.push(['recovering']),restored:()=>calls.push(['restored']),fail:()=>calls.push(['fail'])});
  return {canvas,page,wakeTarget,calls,pending,dispose};
}
test('context loss is prevented, pauses rendering, restores the same scene and clears timeout', () => {
  const f=lifecycleFixture(), event=new Event('webglcontextlost',{cancelable:true});
  f.canvas.dispatchEvent(event);assert.ok(event.defaultPrevented);assert.equal(f.pending.size,1);
  assert.deepEqual(f.calls.at(-2),['pause',true]);assert.deepEqual(f.calls.at(-1),['recovering']);
  f.canvas.dispatchEvent(new Event('webglcontextrestored'));
  assert.equal(f.pending.size,0);assert.ok(f.calls.some(c=>c[0]==='restored'));assert.deepEqual(f.calls.at(-1),['wake']);
  f.dispose();
});
test('hidden pages pause rendering and recovery timers, then resume', () => {
  const f=lifecycleFixture();f.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));
  f.page.hidden=true;f.page.dispatchEvent(new Event('visibilitychange'));assert.equal(f.pending.size,0);
  const before=f.calls.length;f.wakeTarget.dispatchEvent(new Event('forge-wake'));assert.equal(f.calls.length,before);
  f.page.hidden=false;f.page.dispatchEvent(new Event('visibilitychange'));assert.equal(f.pending.size,1);
  f.canvas.dispatchEvent(new Event('webglcontextrestored'));assert.equal(f.pending.size,0);f.dispose();
});
test('failed context recovery enters fallback; unmount cancels timers and listeners', () => {
  const f=lifecycleFixture();f.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));
  [...f.pending.values()][0]();assert.deepEqual(f.calls.at(-1),['fail']);
  f.dispose();assert.equal(f.pending.size,0);const before=f.calls.length;
  for(const [target,name] of [[f.canvas,'webglcontextrestored'],[f.page,'visibilitychange'],[f.wakeTarget,'forge-wake']]) target.dispatchEvent(new Event(name));
  assert.equal(f.calls.length,before);
});
