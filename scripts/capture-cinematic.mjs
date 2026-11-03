// Run against the two local production builds. CI installs Playwright only on the runner.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:4173/';
const baseline = process.env.BASELINE_URL;
const out = 'visual-checks';
const standalone = pathToFileURL(resolve(out, 'Fazhere-Afterlight-Preview.html')).href;
const sizes = [[360,800],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[1920,1080]];
const delay = ms => new Promise(done => setTimeout(done, ms));
await mkdir(out, {recursive:true});
for (const url of [base, baseline].filter(Boolean)) {
  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) {
    try { ready = (await fetch(url)).ok; } catch { /* Wait for the preview server. */ }
    if (!ready) await delay(500);
  }
  assert.ok(ready, 'Preview server unavailable: ' + url);
}

const browser = await chromium.launch({args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const report = {head:process.env.HEAD_SHA, base:process.env.BASE_SHA, chromium:browser.version(), viewportChecks:[], fallbacks:[], performance:{}};
const desktop = {width:1440,height:900};
const phone = {width:390,height:844};
const contextFor = (viewport, extra = {}) => browser.newContext({
  viewport, deviceScaleFactor:1, hasTouch:viewport.width < 700, isMobile:viewport.width < 700,
  ...extra,
});
const shot = (page, name) => page.screenshot({path:out + '/' + name + '.png', timeout:45000});
const one = locator => locator.first();
const dial = page => one(page.getByRole('slider',{name:'Turn the light'}));
const visibleWorld = page => page.locator('[data-renderer="webgl"]:visible').first();

async function ready(page) {
  await visibleWorld(page).waitFor({timeout:60000});
  await page.locator('[data-renderer="webgl"][data-intro="complete"]:visible').first().waitFor({timeout:45000});
  await page.evaluate(() => document.fonts.ready);
}
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}
async function noOverflow(page, width) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),'Horizontal overflow at ' + width);
}
async function changeDial(page) {
  const slider = dial(page);
  await slider.focus();
  const start = await slider.inputValue();
  await slider.press('ArrowRight');
  assert.notEqual(await slider.inputValue(), start, 'Arrow keys must steer the beam');
}
async function inspectWork(page) {
  const mobile=page.getByRole('button',{name:'Mobile',exact:true});
  const hasMobile=await mobile.count();
  if(hasMobile) await mobile.click();
  await page.getByRole('button',{name:'Enlarge screenshot',exact:true}).click();
  const dialog = page.getByRole('dialog',{name:'GymDrobe screenshot'});
  await dialog.waitFor();
  const image = dialog.locator('img');
  await image.evaluate(img => img.decode());
  if (hasMobile) assert.ok(await image.evaluate(img => img.naturalHeight > img.naturalWidth),'Expected a genuine portrait capture');
  await page.keyboard.press('Escape');
  await dialog.waitFor({state:'hidden'});
  await page.getByRole('button',{name:'Red',exact:true}).click();
  assert.match(await page.locator('.quay-demo [role="status"]').innerText(),/Red shirt selected/i);
  if(hasMobile) await page.getByRole('button',{name:'Desktop',exact:true}).click();
}
async function servicePrefill(page) {
  await page.locator('a[href="#services"]').first().click();
  await page.getByRole('button',{name:/I want to sell online/i}).click();
  await page.getByRole('link',{name:/Discuss this service/i}).click();
  const select = page.locator('#enquiry-service');
  await select.waitFor();
  await page.waitForFunction(() => document.querySelector('#enquiry-service')?.selectedOptions[0]?.textContent.includes('E-commerce'));
  assert.match(await select.inputValue(),/e-commerce|ecommerce/i,'Selected service reached the existing enquiry');
}
async function inspectView(width, height) {
  const ctx = await contextFor({width,height});
  try {
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await page.goto(base);
    await ready(page);
    const world = visibleWorld(page);
    assert.ok(await world.evaluate(el => !!(el.matches('canvas') ? el : el.querySelector('canvas'))?.getContext('webgl2')),'Usable WebGL2 context');
    await noOverflow(page,width);
    await shot(page,'opening-' + width);
    await changeDial(page);
    if (width === 390 || width === 1440) {
      const lamp = dial(page);
      await lamp.press('End');
      await page.waitForFunction(()=>document.querySelector('[data-renderer="webgl"]')?.dataset.signal==='answered');
      for(let i=0;i<12;i++) await lamp.press('ArrowLeft');
      await page.waitForFunction(()=>document.querySelector('[data-renderer="webgl"]')?.dataset.signal==='sailing');
      const work = page.getByRole('link',{name:/^View GymDrobe\b/}).first();
      if (width < 500) await work.tap(); else await work.click();
      await page.waitForURL(url => url.hash === '#projects');
      await inspectWork(page);
      await page.locator('#projects').evaluate(el => el.scrollIntoView({behavior:'instant'}));
      await shot(page, 'quay-' + width);
      await page.goBack();
      await page.waitForURL(url => !url.hash || url.hash === '#home');
      await servicePrefill(page);
    }
    assert.deepEqual(errors,[],'Uncaught exceptions at ' + width);
    report.viewportChecks.push({width,height,webgl:true,keyboardDial:true,overflow:false,inspected:width===390 || width===1440});
  } finally { await ctx.close(); }
}

async function inspectFallback(mode) {
  const ctx = await contextFor(phone,{reducedMotion:mode==='reduced-motion'?'reduce':'no-preference',javaScriptEnabled:mode!=='no-javascript'});
  try {
    const page = await ctx.newPage();
    if (mode === 'no-webgl') await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type,...args) {
        return /webgl/.test(type) ? null : getContext.call(this,type,...args);
      };
    });
    const errors = watchErrors(page);
    await page.goto(base);
    const name = page.getByText(/Muhammed Favas K · Full-stack developer/i).first();
    await name.waitFor();
    if (mode !== 'no-javascript') await page.locator('[data-renderer="map"]:visible').first().waitFor({timeout:20000});
    await page.getByRole('link',{name:/^View GymDrobe\b/}).first().click();
    await page.waitForURL(url => url.hash === '#projects');
    assert.ok(await page.getByRole('link',{name:/Visit live website/i}).count());
    assert.ok(await page.locator('a[href^="mailto:"]').count());
    assert.deepEqual(errors,[], 'Uncaught errors in ' + mode);
    report.fallbacks.push(mode);
  } finally { await ctx.close(); }
}

async function recordOpening() {
  const ctx = await contextFor(desktop,{recordVideo:{dir:out+'/.recording',size:{width:1152,height:720}}});
  const page = await ctx.newPage();
  const video = page.video();
  try {
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await ready(page);
    const slider = dial(page);
    const bounds = await slider.boundingBox();
    assert.ok(bounds,'Dial missing from recording');
    const y = bounds.y + bounds.height/2;
    await page.mouse.move(bounds.x + bounds.width/2,y);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width*0.86,y,{steps:18});
    await page.mouse.up();
    // Keyboard input is also visible for a dial that uses polar drag coordinates.
    await slider.focus();
    for (let i=0;i<18;i++) { await slider.press('ArrowLeft'); await delay(40); }
    await page.waitForTimeout(550);
  } finally { await ctx.close(); }
  const input = await video.path();
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',input,'-an','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',out+'/Afterlight-Opening-and-Dial.mp4']);
  await rm(out+'/.recording',{recursive:true,force:true});
}

async function compare(url, name, run) {
  const ctx = await contextFor(phone);
  try {
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      const state = window.reviewPerf = {lcp:null,cls:0,drew:false,record:false};
      new PerformanceObserver(list => { for (const item of list.getEntries()) state.lcp=item.startTime; }).observe({type:'largest-contentful-paint',buffered:true});
      new PerformanceObserver(list => { for (const item of list.getEntries()) if (!item.hadRecentInput) state.cls+=item.value; }).observe({type:'layout-shift',buffered:true});
      for (const kind of [window.WebGLRenderingContext,window.WebGL2RenderingContext].filter(Boolean)) {
        for (const op of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']) {
          const original = kind.prototype[op];
          if (!original) continue;
          kind.prototype[op] = function(...args) {
            if (state.record) state.drew = true;
            return original.apply(this,args);
          };
        }
      }
    });
    await page.goto(url,{waitUntil:'load'});
    await page.waitForTimeout(5500);
    const results = await page.evaluate(async () => {
      const state=window.reviewPerf;
      const start = performance.now();
      const frames=[];
      state.record=true;
      await new Promise(done => {
        function tick(now) {
          if (state.drew) {frames.push(now); state.drew=false;}
          if (now-start<3000) requestAnimationFrame(tick); else done();
        }
        requestAnimationFrame(tick);
      });
      state.record=false;
      const elapsed = performance.now()-start;
      const intervals = frames.slice(1).map((f,i) => f-frames[i]).sort((a,b) => a-b);
      const nav=performance.getEntriesByType('navigation')[0];
      const precision = value => value == null ? null : Math.round(value*10)/10;
      return {
        domReadyMs:Math.round(nav.domContentLoadedEventEnd), loadMs:Math.round(nav.loadEventEnd),
        fcpMs:precision(performance.getEntriesByName('first-contentful-paint')[0]?.startTime),
        lcpMs:precision(state.lcp), cls:Number(state.cls.toFixed(3)), renderFps:precision(frames.length*1000/elapsed),
        medianFrameMs:precision(intervals[Math.floor(intervals.length/2)]),
        p95FrameMs:precision(intervals[Math.floor(intervals.length*0.95)]),
      };
    });
    if (run === 0) await shot(page,name+'-assessment-390');
    return results;
  } finally { await ctx.close(); }
}

async function testPortable() {
  const ctx = await contextFor(phone);
  try {
    await ctx.setOffline(true);
    const page = await ctx.newPage();
    const errors = watchErrors(page);
    await page.goto(standalone);
    await ready(page);
    await changeDial(page);
    await servicePrefill(page);
    assert.deepEqual(errors,[], 'Portable review errors');
    report.portableOffline = true;
  } finally { await ctx.close(); }
}

try {
  for (const [width,height] of sizes) await inspectView(width,height);
  for (const mode of ['reduced-motion','no-webgl','no-javascript']) await inspectFallback(mode);
  await recordOpening();
  await testPortable();
  if (baseline) {
    const samples = {before:[],after:[]};
    for (let run=0;run<3;run++) {
      samples.before.push(await compare(baseline,'before',run));
      samples.after.push(await compare(base,'after',run));
    }
    const median = rows => Object.fromEntries(Object.keys(rows[0]).map(key => {
      const values=rows.map(row=>row[key]).filter(x=>x!=null).sort((a,b)=>a-b);
      return [key,values.length?values[Math.floor(values.length/2)]:null];
    }));
    report.performance={conditions:'GitHub-hosted Ubuntu, headless Chromium with SwiftShader (software GPU), local production builds, fresh 390×844 touch contexts, DPR 1, no network/CPU throttling. Median of 3 alternating cold navigations per revision. WebGL draw submissions sampled across RAF ticks for 3 seconds beginning 5.5 seconds after load. Synthetic, not a device frame-rate estimate.',
      before:median(samples.before),after:median(samples.after),samples};
  }
  console.log(JSON.stringify(report,null,2));
} catch (error) {
  report.failure = String(error);
  throw error;
} finally {
  await writeFile(out+'/review.json',JSON.stringify(report,null,2));
  await browser.close();
}
