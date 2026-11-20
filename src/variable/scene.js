import * as T from 'three';
import { buildInstrument } from './instrument.js';

const clamp = T.MathUtils.clamp;
const smooth = T.MathUtils.smoothstep;
const mix = T.MathUtils.lerp;

// All four views inhabit the same room, expressed in metres. The off-centre
// frontal Work view leaves a margin for the task and keeps DOM text square.
function shots(aspect) {
  const phone = aspect < .84;
  const workField = phone ? 3.95 : 8.52;
  const fieldHeight = workField/aspect;
  const workZ = fieldHeight/(2*Math.tan(50*Math.PI/360));
  const workX = phone ? 0 : -.166*workField;
  const workY = 2.32 + (phone ? .165 : -.024)*fieldHeight;
  const intro = phone
    ? {at:0,eye:[3.95,1.68,3.55],aim:[.55,2.00,1.45],fov:68}
    : {at:0,eye:[2.60,1.62,3.10],aim:[-.98,1.94,1.32],fov:68};
  const pass = phone
    ? {at:.22,eye:[1.96,1.61,2.44],aim:[.12,2.01,-.34],fov:65}
    : {at:.22,eye:[2.08,1.49,1.90],aim:[.13,1.85,-.45],fov:60};
  return [intro, pass,
    {at:.54,eye:[.48,1.51,3.31],aim:[-.59,2.05,-.70],fov:55},
    {at:1, eye:[workX,workY,workZ],aim:[workX,workY,0],fov:50},
    {at:1.50,eye:[-1.32,1.75,4.32],aim:[1.93,2.10,-.39],fov:51},
    phone
      ? {at:2,eye:[.26,1.96,3.73],aim:[5.16,2.40,.52],fov:64}
      : {at:2,eye:[-.42,1.64,3.4],aim:[4.64,2.12,-.37],fov:48},
    {at:2.45,eye:[-.85,2.10,5.57],aim:[1.31,2.33,-.78],fov:52},
    phone
      ? {at:3,eye:[-.93,2.40,12.0],aim:[.03,2.38,-.2],fov:60}
      : {at:3,eye:[-2.92,2.37,8.40],aim:[-1.38,2.45,-.22],fov:47},
  ];
}

function cameraAt(camera, path, value) {
  let i=0;
  while(i<path.length-2 && value>path[i+1].at) i++;
  const a=path[i],b=path[i+1];
  const t=clamp((value-a.at)/(b.at-a.at),0,1);
  const dt=b.at-a.at;
  // Cubic Hermite with zero speed at each editorial stop and a continuous
  // tangent through the near-fin pass, pivot points and the return dolly.
  function derivative(index,key,j) {
    if(Number.isInteger(path[index].at)) return 0;
    return (path[index+1][key][j]-path[index-1][key][j])/(path[index+1].at-path[index-1].at);
  }
  function vector(key) {
    return a[key].map((n,j)=>mix(n,b[key][j],t*t*(3-2*t))+
      dt*(t*(1-t)*(1-t)*derivative(i,key,j)-t*t*(1-t)*derivative(i+1,key,j)));
  }
  camera.position.set(...vector('eye'));camera.lookAt(...vector('aim'));
  const fov=mix(a.fov,b.fov,t*t*(3-2*t));
  if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
  camera.updateMatrixWorld();
}

export function mountScene(host,{readState,onReady=()=>{},onFailure=()=>{},onSlow=()=>{}}) {
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='display:block;width:100%;height:100%;';
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power',preserveDrawingBuffer:false});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.97;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(52,1,.055,52);
  const parent=host.parentElement || host;
  let active=true,ready=false,loaded=false,frame=0,resizePending=true;
  let w=1,h=1,dpr=Math.min(devicePixelRatio||1,1.5), route=[], model;
  let lastProgress=-10,lastWidth=-10,lastY=-10,lastStamp=0,dirty=true;
  let slowSamples=0,samples=0,lowestRuns=0,offered=false,lastSignature='';
  const manager = new T.LoadingManager();
  manager.onLoad=()=>{loaded=true;dirty=true;};
  const projection=new T.Vector3();
  let observer;
  function resize() {
    w=host.clientWidth||innerWidth;h=host.clientHeight||innerHeight;
    camera.aspect=w/h;camera.updateProjectionMatrix();route=shots(w/h);
    renderer.setPixelRatio(Math.min(dpr,Math.sqrt(1500000/(w*h))));renderer.setSize(w,h,false);
    dirty=true;resizePending=false;
  }
  function screenPoint(x,y) {
    projection.set(x,y,.024).project(camera);
    return [(projection.x+1)*w/2,(1-projection.y)*h/2];
  }
  function render(state=readState()) {
    if(!active)return;
    if(resizePending)resize();
    const progress=clamp(state.progress||0,0,3),width=clamp(state.width??1,0,1);
    const phone=w/h<.84;
    cameraAt(camera,route,progress);
    const engage=smooth(progress,.10,.91), farewell=smooth(progress,2.21,2.94);
    const workGap=phone?mix(3.08,3.67,width):mix(1.90,4.65,width);
    let gap=mix(mix(phone ? .97 : 1.40,workGap,engage),3.24,farewell);
    let cx=0,cy=2.32,height=mix(phone ? 3.52 : 2.25,2.18,farewell);
    const hold=1-smooth(Math.abs(progress-1),.008,.14);
    if(hold>.0001){
      const panel=document.querySelector('.vw-projection');
      const rect=panel?.getBoundingClientRect();
      if(rect && rect.width>80 && rect.height>36 && rect.top<h && rect.bottom>0){
        // Intersect the HTML rectangle with the actual projector plane. Registration
        // works with changing copy length, zoom, wide/compact and restored details.
        const bounds=host.getBoundingClientRect();
        const rest=route.find(shot=>shot.at===1).eye;
        const unit = 2*rest[2]*Math.tan(50*Math.PI/360)/h;
        gap=mix(gap,rect.width*unit,hold);
        cx=mix(cx,rest[0]+(rect.left-bounds.left+rect.width/2-w/2)*unit,hold);
        cy=mix(cy,rest[1]-(rect.top-bounds.top+rect.height/2-h/2)*unit,hold);
        height=mix(height,rect.height*unit,hold);
      }
    }
    model.update({gap,cx,cy,height,progress,width:mix(1,width,engage),deskX:mix(phone?.84:.15,0,engage),deskZ:mix(phone?2.14:1.80,1.87,engage)});
    const tl=screenPoint(cx-gap/2,cy+height/2), br=screenPoint(cx+gap/2,cy-height/2);
    const entries=[tl[0],tl[1],br[0]-tl[0],br[1]-tl[1]].map(n=>n.toFixed(2));
    const signature=entries.join(' ');
    if(signature!==lastSignature){
      ['x','y','width','height'].forEach((key,i)=>parent.style.setProperty('--projection-'+key,entries[i]+'px'));
      lastSignature=signature;
    }
    host.dataset.sceneProgress=progress.toFixed(3);host.dataset.aperture=gap.toFixed(3);
    renderer.render(scene,camera);
    if(loaded && !ready){ready=true;onReady();}
  }
  function tick(stamp) {
    if(!active || document.hidden) return;
    frame=requestAnimationFrame(tick);
    const state=readState(), y=window.scrollY;
    const moved = Math.abs((state.progress||0)-lastProgress)>.00014 || Math.abs((state.width??1)-lastWidth)>.00014;
    const needsFrame=dirty || moved || y!==lastY;
    if(!needsFrame){lastStamp=0;return;}
    const interval=lastStamp ? stamp-lastStamp : 0;
    // A still frame consumes no GPU time while the visitor is reading.
    if(interval && interval<14) return;
    try{render(state);}catch{onFailure();return;}
    lastProgress=state.progress||0;lastWidth=state.width??1;lastY=y;lastStamp=stamp;dirty=false;
    if(!ready || !interval || interval>2000)return;
    samples++;if(interval>66)slowSamples++;
    if(samples<8)return;
    if(slowSamples>=5){
      if(dpr>.66){dpr=Math.max(.66,dpr*.68);resizePending=true;dirty=true;}
      else if(++lowestRuns>=2 && !offered){offered=true;onSlow();}
    }else lowestRuns=0;
    samples=0;slowSamples=0;
  }
  function visibility(){cancelAnimationFrame(frame);lastStamp=0;if(!document.hidden && active){dirty=true;frame=requestAnimationFrame(tick);}}
  function lost(e){e.preventDefault();if(active)onFailure();}
  function dispose(){
    if(!active)return;active=false;cancelAnimationFrame(frame);observer?.disconnect();
    document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',lost);
    model?.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();
  }
  try{
    model=buildInstrument(scene,manager);host.append(canvas);resize();
    observer=new ResizeObserver(()=>{resizePending=true;dirty=true;});observer.observe(host);
    const sheet=document.querySelector('.vw-projection');if(sheet)observer.observe(sheet);
    document.addEventListener('visibilitychange',visibility);canvas.addEventListener('webglcontextlost',lost);
    frame=requestAnimationFrame(tick);return {render,dispose};
  }catch(err){dispose();throw err;}
}
