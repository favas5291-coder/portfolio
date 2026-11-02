import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'visual-checks';
const base = 'http://127.0.0.1:4173/';
const baseline = process.env.BASELINE_URL;
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const sizes = [[360,800],[390,844],[430,932],[768,1024],[1024,768],[1440,900],[1920,1080]];
const results = [];
async function metrics(url, viewport, name) {
  const context = await browser.newContext({viewport,deviceScaleFactor:1});
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.reviewPaint = {lcp:null,cls:0};
    if(typeof PerformanceObserver === 'undefined')return;
    new PerformanceObserver(list=>{for(const item of list.getEntries()) window.reviewPaint.lcp=item.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>{for(const item of list.getEntries()) if(!item.hadRecentInput) window.reviewPaint.cls+=item.value;}).observe({type:'layout-shift',buffered:true});
  });
  await page.goto(url,{waitUntil:'load'});
  await page.waitForTimeout(5500);
  const measures=await page.evaluate(()=>({domReady:Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd),fcp:Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime||0),lcp:Math.round(window.reviewPaint.lcp||0),cls:Number(window.reviewPaint.cls.toFixed(3))}));
  await page.screenshot({path:output+'/'+name+'-'+viewport.width+'.png'});
  await context.close();
  return measures;
}
try {
  for(const [width,height] of sizes){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,...(width===1440?{recordVideo:{dir:output,size:{width:1080,height:676}}}:{})});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Start tour with sound'}).waitFor();
    await page.locator('.wt-set[data-revealed=true][data-renderer="3d"]').waitFor({timeout:45000});
    assert.equal(await page.locator('canvas').count(),1);
    assert.equal(await page.locator('.worksite').getAttribute('data-tour-status'),'idle');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Overflow at '+width);
    await page.screenshot({path:output+'/opening-'+width+'.png'});
    await page.getByRole('link',{name:'View GymDrobe'}).click();
    await page.locator('#seat-projects .wt-set').waitFor();
    await page.getByRole('group',{name:'Shirt colour'}).getByRole('button',{name:'Red'}).click();
    assert.match(await page.locator('.colour-photo img').getAttribute('src'),/red.webp$/);
    await page.getByRole('group',{name:'GymDrobe screenshot device'}).getByRole('button',{name:'Mobile'}).click();
    await page.getByRole('button',{name:'Enlarge'}).click();
    assert.match(await page.getByRole('dialog').locator('img').getAttribute('src'),/mobile/);
    await page.keyboard.press('Escape');
    if(width===1440 || width===390){
      await page.screenshot({path:output+'/inspection-'+width+'.png'});
      await page.getByRole('button',{name:'Meet Favas'}).click();
      await page.getByRole('button',{name:'Go to Services'}).click();
      await page.getByRole('group',{name:'Select a service'}).getByRole('button',{name:/E-commerce/}).click();
      assert.equal(await page.locator('.worksite').getAttribute('data-tour-status'),'paused');
      await page.getByRole('button',{name:'Forest',exact:true}).click();
      await page.getByRole('button',{name:'Add to demo bag'}).click();
      assert.match(await page.locator('.demo-feedback').innerText(),/1 sample item/);
      await page.getByRole('button',{name:'Skip',exact:false}).click();
      await page.getByRole('button',{name:'Discuss this service'}).click();
      assert.equal(await page.locator('#brief-kind').inputValue(),'E-commerce development');
      assert.match(decodeURIComponent(await page.locator('.confidence-brief-main').getAttribute('href')),/Project type: E-commerce development/);
      await page.getByRole('button',{name:'Meet Favas'}).click();
      await page.getByRole('button',{name:'Next →'}).click();
      await page.getByRole('button',{name:'Previous chapter'}).click();
      await page.getByRole('button',{name:'Go to Contact'}).click();
      await page.getByRole('button',{name:'Finish'}).click();
      await page.getByRole('button',{name:'Replay the tour'}).click();
      await page.getByRole('button',{name:'Skip',exact:false}).click();
    }
    assert.deepEqual(errors,[],'Uncaught errors at '+width);
    await context.close();
    results.push({width,height,webgl:true,overflow:false});
  }
  for(const mode of ['reduced','no-webgl']){
    const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
    const page=await ctx.newPage();
    if(mode==='no-webgl')await page.addInitScript(()=>{const current=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:current.call(this,type,...args);};});
    await page.goto(base);
    await page.getByRole('button',{name:'Inspect GymDrobe screen'}).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.wt-set').getAttribute('data-renderer'),'portrait');
    await ctx.close();
  }
  const perf={conditions:'Chromium, fresh browser context, local production build, 1x DPR, no throttling; median of three cold navigations, milliseconds. Synthetic results only.'};
  if(baseline){
    for(const [name,url] of [['before',baseline],['after',base]]){
      const rows=[];
      for(let i=0;i<3;i++) rows.push(await metrics(url,{width:390,height:844},name));
      perf[name]=Object.fromEntries(Object.keys(rows[0]).map(key=>[key,rows.map(r=>r[key]).sort((a,b)=>a-b)[1]]));
    }
  }
  await writeFile(output+'/review.json',JSON.stringify({results,perf},null,2));
  console.log(JSON.stringify({results,perf}));
} finally { await browser.close(); }
