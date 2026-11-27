// Exercise the built portfolio (npm run preview). Browser engines are the only test dependency.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { WHATSAPP_NUMBER, services } from '../src/data/site.js';
import { projectPreviews } from '../src/data/project-previews.js';

const url = process.env.PREVIEW_URL || 'http://127.0.0.1:4173/';
const out = process.env.REVIEW_OUTPUT || 'visual-checks';
const widths = [360,390,430,768,1024,1440,1920];
const note = 'I would like to discuss a small online store for my business.';
const checks = {commit:process.env.HEAD_SHA || null,sessions:[]};
await mkdir(out,{recursive:true});

async function pageFor(browser, width, height, opts={}) {
  const phone = width < 768;
  const context = await browser.newContext({viewport:{width,height},hasTouch:phone,isMobile:phone,deviceScaleFactor:1,...opts});
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  return {context,page};
}
async function chapter(page,id){
  // Browser history can restore a previous scroll offset on the frame after a modal closes.
  // Begin the next scroll only after the host has applied focus and cleared its overlay.
  await page.evaluate(async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);});
  await page.locator('#'+id).evaluate(el => el.scrollIntoView({behavior:'instant',block:'start'}));
  await page.waitForFunction(want=>document.querySelector('.ap-visit')?.dataset.chapter===want,id);
}
async function screen(page,name){await page.screenshot({path:join(out,name+'.jpg'),type:'jpeg',quality:86});}
async function entrance(page,width){
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('.ap-poster').first().evaluate(img=>img.decode());
  await page.evaluate(()=>document.fonts.ready);
  // This toolbar control is inserted only after the client has mounted and attached navigation listeners.
  await page.getByRole('button',{name:'Ambient sound'}).waitFor({state:'attached'});
  const state = await page.evaluate(()=>{
    const inView=sel=>{
      const b=document.querySelector(sel).getBoundingClientRect();
      return b.left>=-1 && b.top>=-1 && b.right<=innerWidth+1 && b.bottom<=innerHeight+1;
    };
    return {overflow:document.documentElement.scrollWidth-innerWidth,
      identity:inView('.ap-byline'),offer:inView('.ap-offer'),project:inView('.ap-opening-links a'),chat:inView('.ap-header-chat'),
      poster:document.querySelector('.ap-poster').currentSrc
    };
  });
  assert(state.overflow<=1 && state.identity && state.offer && state.project && state.chat,'Opening is clipped '+width+' '+JSON.stringify(state));
  return state;
}
async function inspect(page) {
  const work=page.locator('#reception [data-inspect="gymdrobe"]');
  await chapter(page,'reception');
  await work.focus();await page.keyboard.press('Enter');
  const dialog=page.getByRole('dialog',{name:'GymDrobe',exact:true});
  await dialog.waitFor();
  const kept=await page.evaluate(()=>scrollY);
  const red=dialog.getByRole('button',{name:'Red',exact:true});
  await red.click();assert.equal(await red.getAttribute('aria-pressed'),'true');
  const photo=dialog.locator('.ap-photo img');
  assert.match(await photo.getAttribute('alt'),/red/i);
  const productLink=dialog.getByRole('link',{name:'Open red at GymDrobe'});
  assert.equal(new URL(await productLink.getAttribute('href')).searchParams.get('colour'),'RED');
  const enlarge=dialog.getByRole('button',{name:'Enlarge GymDrobe screenshot'});
  await enlarge.click();
  const enlarged=page.getByRole('dialog',{name:'GymDrobe enlarged screenshot'});
  await enlarged.waitFor();
  await enlarged.locator('img').evaluate(img=>img.decode());
  assert.equal(await enlarged.locator('img').getAttribute('src'), projectPreviews.gymdrobe.screenshot);
  await page.keyboard.press('Escape');
  await enlarged.waitFor({state:'hidden'});
  assert(await enlarge.evaluate(el=>el===document.activeElement));
  await page.goBack();
  await dialog.waitFor({state:'hidden'});
  await page.waitForFunction(y=>Math.abs(scrollY-y)<3 && document.activeElement?.dataset.inspect==='gymdrobe',kept);
  const more=page.locator('#reception details');
  if (!await more.evaluate(el=>el.open)) await more.locator('summary').click();
  for(const id of ['fabea','luxvibe']){
    await page.locator('#reception [data-inspect="'+id+'"]').click();
    const sheet=page.locator('.ap-sheet[open]');await sheet.waitFor();
    assert.match(await sheet.innerText(),/concept/i);
    const saved=projectPreviews[id]; const isPaired=saved.mobile?.matchesDesktop===saved.screenshot;
    if(isPaired){
      await sheet.getByRole('button',{name:'Mobile',exact:true}).click();
      assert.equal(await sheet.locator('.ap-image-button img').getAttribute('src'),saved.mobile.screenshot);
    }
    await page.keyboard.press('Escape');await sheet.waitFor({state:'hidden'});
    await page.waitForFunction(slug=>document.activeElement?.dataset.inspect===slug,id);
  }
}
async function desk(page) {
  await chapter(page,'studio');await page.locator('#ap-need').selectOption('ecommerce-development');
  await chapter(page,'office');await page.locator('#ap-note').fill(note);
  const office=page.locator('#office');
  const href = new URL(await office.getByRole('link',{name:'Chat on WhatsApp',exact:true}).getAttribute('href'));
  assert.equal(href.hostname,'wa.me');assert.equal(href.pathname,'/'+WHATSAPP_NUMBER);assert(href.searchParams.get('text').includes(note));
  await office.getByRole('link',{name:'Open enquiry form'}).click();
  await page.waitForFunction(expected=>document.querySelector('#enquiry-message')?.value===expected,note);
  assert.equal(await page.locator('#enquiry-service').inputValue(),services.find(s=>s.slug==='ecommerce-development').name);
  await page.goBack();
  await page.waitForFunction(expected=>document.querySelector('#ap-note')?.value===expected,note);
  await page.reload();
  await page.waitForFunction(expected=>document.querySelector('#ap-note')?.value===expected,note);
}
async function testEngine(name, type) {
  const browser=await type.launch(name==='chromium'?{executablePath:process.env.CHROME_PATH||undefined,
    args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']}:{executablePath:process.env.WEBKIT_PATH||undefined});
  try {
    const session={engine:name,version:browser.version(),physicalDevice:false,widths:[]};checks.sessions.push(session);
    for(const width of widths){
      const {page,context}=await pageFor(browser,width,width<=430?844:900,{reducedMotion:'reduce'});
      const info=await entrance(page,width);
      assert.equal(await page.locator('.ap-visit').getAttribute('data-render'),'still');
      if(width===390 || width===1440) await screen(page,name+'-'+width+'-opening-still');
      if(width===390){await inspect(page);await desk(page);await page.setViewportSize({width:844,height:390});await chapter(page,'reception');await page.setViewportSize({width:390,height:844});}
      // Switch back to the regular visit and exercise the same layout with a live or fallback renderer.
      await page.emulateMedia({reducedMotion:'no-preference'});
      await chapter(page,'arrival');
      await page.keyboard.press('ArrowDown');
      if(name==='chromium') await page.locator('.ap-visit[data-render="live"]').waitFor({timeout:60000});
      if(width===1440){
        await screen(page,name+'-1440-opening');
        await chapter(page,'reception');await screen(page,name+'-1440-project-room');
        await chapter(page,'office');await screen(page,name+'-1440-office');
      }
      session.widths.push({width,...info,regularMode:await page.locator('.ap-visit').getAttribute('data-render')});await context.close();
    }
    const {page,context}=await pageFor(browser,390,844);
    await entrance(page,390);
    await page.keyboard.press('ArrowDown');
    if(name==='chromium') await page.locator('.ap-visit[data-render="live"]').waitFor({timeout:60000});
    await screen(page,name+'-390-opening');
    // Reverse the same native scroll offset inside the passenger-door swing.
    const previous = await page.evaluate(async () => {
      const at = async y => {scrollTo({top:y,behavior:'instant'});await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);return Number(document.querySelector('.ap-stage').dataset.progress);};
      return [await at(110),await at(205),await at(110)];
    });
    assert(previous[0]>0 && previous[1]>previous[0] && previous[0]===previous[2]);
    session.reverseDoor=previous;
    if(name==='chromium'){
      const cdp=await context.newCDPSession(page);
      await cdp.send('Page.setWebLifecycleState',{state:'frozen'});
      await cdp.send('Page.setWebLifecycleState',{state:'active'});
      await page.bringToFront();
      session.emulatedFreezeResume=true;
    }
    await chapter(page,'pavement');await screen(page,name+'-390-pavement');
    await chapter(page,'reception');
    await screen(page,name+'-390-project-room');
    await chapter(page,'office');await screen(page,name+'-390-office');
    session.renderMode=await page.locator('.ap-visit').getAttribute('data-render');
    await context.close();
    const blocked=await pageFor(browser,430,844);
    await blocked.page.addInitScript(()=>{const old=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(k,...args){if(k.includes('webgl')){window.__appointmentGLAttempt=true;return null;}return old.call(this,k,...args)}});
    await entrance(blocked.page,430);await blocked.page.keyboard.press('PageDown');
    await blocked.page.waitForFunction(()=>window.__appointmentGLAttempt);
    await chapter(blocked.page,'reception');await inspect(blocked.page);
    assert.equal(await blocked.page.locator('.ap-visit').getAttribute('data-render'),'still');
    await blocked.context.close();session.unavailableWebGL='passed';
  } finally {
    await browser.close();
    await writeFile(join(out,'appointment-browser.json'),JSON.stringify(checks,null,2)+'\n');
  }
}
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
  if(!process.env.REVIEW_ENGINE||process.env.REVIEW_ENGINE===name) await testEngine(name,engine);
}
