import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base='http://127.0.0.1:4173/';
async function waitForServer(){
  for(let i=0;i<45;i++){
    try{const r=await fetch(base);if(r.ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,700));
  }
  throw new Error('Local Vite preview did not start.');
}

await mkdir('visual-checks',{recursive:true});
await waitForServer();
const browser=await chromium.launch({
  headless:true,
  args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']
});
const shots=[
  {name:'desktop',width:1440,height:900},
  {name:'mobile',width:390,height:844},
  {name:'tablet',width:768,height:1024}
];
try{
  for(const size of shots){
    const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
    const exceptions=[];
    page.on('pageerror',error=>exceptions.push(error.message));
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('#cinema-hero-title').waitFor();
    await page.waitForTimeout(2600);
    await page.screenshot({path:'visual-checks/'+size.name+'-arrival.png',fullPage:false,animations:'disabled'});
    await page.locator('.confidence-hero-proof img').waitFor();
    assert.ok(await page.locator('.confidence-hero-proof img').evaluate(img=>img.complete&&img.naturalWidth>0),'Real featured GymDrobe proof failed to load.');
    assert.ok(await page.locator('.confidence-hero-proof a[href="#projects"]').count(),'Hero should link straight to real work.');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);
    assert.equal(overflow,false,size.name+' has horizontal overflow.');
    for(const section of ['services','projects','process','contact']){
      await page.locator('#'+section).evaluate(node => node.scrollIntoView({block:'start',behavior:'instant'}));
      await page.waitForTimeout(1500);
      await page.screenshot({path:'visual-checks/'+size.name+'-'+section+'.png',fullPage:false,animations:'disabled'});
    }
    await page.locator('#services').evaluate(node => node.scrollIntoView({block:'start',behavior:'instant'}));
    await page.locator('.cinema-service-rail button').nth(1).click();
    await page.locator('.demo-lab-stage .demo-commerce').waitFor();
    await page.locator('.demo-swatch.tone-forest').click();
    assert.equal(await page.locator('.demo-swatch.tone-forest').getAttribute('aria-pressed'),'true','Colour selection should respond.');
    await page.locator('.demo-commerce .demo-action').click();
    assert.match(await page.locator('.demo-feedback').innerText(),/1 sample item added/,'Cart interaction did not update.');
    await page.screenshot({path:'visual-checks/'+size.name+'-interactive-demo.png',fullPage:false,animations:'disabled'});
    await page.locator('.cinema-service-rail button').nth(3).click();
    await page.locator('.demo-redesign .demo-layout-switch button').first().click();
    assert.match(await page.locator('.demo-redesign-note').innerText(),/Before:/);
    await page.locator('.cinema-service-rail button').nth(0).click();
    await page.locator('.demo-business-head nav button').nth(1).click();
    assert.match(await page.locator('.demo-business-text h4').innerText(),/service/);
    await page.locator('.cinema-service-rail button').nth(2).click();
    await page.locator('.demo-landing .demo-action').click();
    await page.locator('#demo-name').fill('Guest');
    await page.locator('.demo-landing-form button').click();
    assert.match(await page.locator('.demo-landing-form p').innerText(),/no information was sent/);
    const webgl=await page.locator('.cinema-world canvas').count();
    assert.ok(webgl===1,'Expected one deferred WebGL canvas on '+size.name);
    await page.locator('#engineering-lab').evaluate(node=>node.scrollIntoView({block:'start',behavior:'instant'}));
    await page.locator('.confidence-lab-selector button').nth(1).click();
    assert.equal(await page.locator('.confidence-lab-selector button').nth(1).getAttribute('aria-pressed'),'true');
    assert.ok((await page.locator('.confidence-lab-paper').innerText()).includes('MY APPROACH'));
    await page.screenshot({path:'visual-checks/'+size.name+'-engineering.png',fullPage:false,animations:'disabled'});
    await page.locator('#brief-kind').selectOption({label:'E-commerce development'});
    await page.locator('.confidence-brief-choices button').nth(1).click();
    const messageLink=await page.locator('.confidence-brief-main').getAttribute('href');
    assert.ok(messageLink.includes('Project%20type%3A%20E-commerce')||decodeURIComponent(messageLink).includes('Project type: E-commerce'),'The prefilled WhatsApp link must reflect the selected service.');
    assert.ok(await page.locator('.confidence-brief-form small').count());
    const screenshot=page.locator('#project-preview img');
    assert.ok(await screenshot.count(),'The genuine project screenshot is missing.');
    const imageReady=await screenshot.evaluate(image=>image.complete&&image.naturalWidth>0);
    assert.ok(imageReady,'The genuine project screenshot failed to load.');
    assert.deepEqual(exceptions,[],'Unexpected runtime errors on '+size.name);
    console.log(size.name+': arrival + 4 chapter screenshots; no horizontal overflow or uncaught browser error.');
    await page.close();
  }
}finally{
  await browser.close();
}
