import * as T from 'three';
import { buildHarbour } from './models.js';
import { buildSea } from './sea.js';

const smooth=(a,b,t)=>T.MathUtils.smoothstep(t,a,b);
const ease=(a,b,speed,dt)=>T.MathUtils.damp(a,b,speed,dt);
const vec=(...args)=>new T.Vector3(...args);

export function mountHarbour(slots,read,screenshot) {
  const renderer=new T.WebGLRenderer({alpha:false,antialias:true,powerPreference:'low-power'});
  const canvas=renderer.domElement;
  canvas.setAttribute('aria-hidden','true');
  renderer.setClearColor(0x17383f);
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(36,1,.06,110);
  const texture=new T.TextureLoader().load(screenshot);
  texture.colorSpace=T.SRGBColorSpace;
  texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const model=buildHarbour(T,texture);
  scene.add(model.group);
  const sea=buildSea(T,scene);
  scene.add(new T.HemisphereLight(0xd7ece4,0x8c745e,1.65));
  const key=new T.DirectionalLight(0xffcf94,2.1);
  key.position.set(-8,10,7);scene.add(key);
  const rim=new T.DirectionalLight(0x82bfc8,1.35);
  rim.position.set(4,6,-7);scene.add(rim);
  const lampPos=vec(-4.8,4.8,1.6);
  const beamLength=11;
  const beamGeo=new T.ConeGeometry(1,beamLength,32,1,true);
  beamGeo.translate(0,-beamLength/2,0);
  const beam=new T.Mesh(beamGeo,new T.ShaderMaterial({
    uniforms:{colour:{value:new T.Color('#ffd08b')}},
    vertexShader:'varying float v; void main(){v=uv.y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'varying float v; uniform vec3 colour; void main(){gl_FragColor=vec4(colour,.14*pow(v,.65));\n#include <colorspace_fragment>\n}',
    transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
  }));
  beam.position.copy(lampPos);scene.add(beam);
  const shaft=new T.SpotLight(0xffb56c,80,15,.17,.65,1.6);
  shaft.position.copy(lampPos);scene.add(shaft,shaft.target);
  const aim=vec(), goalPos=vec(), goalAim=vec(), down=vec(0,-1,0), direction=vec();
  let slot=null,raf=0,time=0,last=0,sailing=0,quality=1,slow=0,disposed=false,locked=false,activeService=-1,liftStart=-5;
  let berth='', pictured=false;
  const setSize=()=>{
    if(!slot) return;
    const w=slot.clientWidth,h=slot.clientHeight;
    if(!w||!h)return;
    const dpr=Math.min(window.devicePixelRatio||1,1.5,Math.sqrt(780000/(w*h)))*quality;
    renderer.setPixelRatio(Math.min(1.6,Math.max(.45,dpr)));
    renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  };
  const resize=new ResizeObserver(setSize);
  function chooseSlot() {
    let best=null,score=0;
    for(const s of slots){
      const r=s.getBoundingClientRect();
      const visible=Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top));
      const fraction=visible/Math.min(innerHeight,r.height||1);
      if(fraction>score){best=s;score=fraction;}
    }
    if(best!==slot){
      if(slot){resize.unobserve(slot);slot.dataset.renderer='map';}
      slot=best;
      if(slot){
        berth=slot.dataset.sceneSlot;
        slot.appendChild(canvas);slot.dataset.intro=time>=4.3?'complete':'playing';
        resize.observe(slot);setSize();pictured=false;
      }
    }
    if(!slot||document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}
    else if(!disposed&&!raf){last=0;raf=requestAnimationFrame(draw);}
  }
  function draw(now){
    if(disposed||document.hidden||!slot){raf=0;return;}
    const elapsed=last?Math.max(0,(now-last)/1000):0;
    last=now;time+=Math.min(elapsed,.35);
    const dt=Math.min(elapsed,.2);
    const c=read();
    const hero=berth==='home';
    const intro=hero&&!c.touched&&!c.inspect&&!locked;
    if(!intro||time>=4.3)locked=true;
    const lift=smooth(.35,2.7,time);
    const narrow=innerWidth<761;
    if(berth==='services'){
      goalPos.set(-3.4,2.65,2.15);goalAim.set(-4.35,1.62,-3.35);
    }else if(berth==='contact'){
      goalPos.set(6.8,2.7,3.9);goalAim.set(5,1.7,-1.9);
    }else{
      const distance=narrow?11.5:10.4;
      goalPos.set(narrow?.3:1.3,4.4,distance);
      goalAim.set(narrow?-.45:-.28,2.05,-.35);
      if(intro){
        goalPos.lerpVectors(vec(-2.1,.54,5.8),goalPos,lift);
        goalAim.lerpVectors(vec(-4.0,.28,2.3),goalAim,lift);
      }
      if(c.inspect){goalPos.set(1,1.73,2.75);goalAim.set(1,1.67,-1.13);}
    }
    if(!pictured||intro){
      camera.position.copy(goalPos);aim.copy(goalAim);pictured=true;
    }else{
      const mix=1-Math.exp(-(c.inspect?9:7)*dt);
      camera.position.lerp(goalPos,mix);aim.lerp(goalAim,mix);
    }
    camera.lookAt(aim);
    let dial=c.dial;
    if(berth==='services')dial=15;
    if(berth==='contact')dial=74;
    const angle=T.MathUtils.degToRad(berth==='services'?5:berth==='contact'?70:c.angle)+(intro?(1-smooth(.4,2.4,time))*1.3:0);
    direction.set(Math.sin(angle),-.23,-Math.cos(angle)).normalize();
    beam.quaternion.setFromUnitVectors(down,direction);
    shaft.target.position.copy(lampPos).addScaledVector(direction,9);
    const opening=locked?5:time;
    model.shutters.forEach((shutter,i)=>{
      const t=opening-2.28-i*.18;
      const roll=.10*smooth(0,.16,t)+.89*smooth(.28,1.16,t);
      shutter.scale.y=1-roll;
    });
    model.sign.rotation.z=.04*Math.exp(-2*Math.max(0,opening-2.2))*Math.sin(Math.max(0,opening-2.2)*9);
    model.boat.position.x=-5.45+4.55*smooth(0,3.1,time);
    model.boat.position.y=.042+.04*Math.sin(time*1.4);
    model.boat.rotation.z=.018*Math.sin(time*1.2);
    model.buoy.rotation.z=.068*Math.sin(time*1.35);
    if(c.signal==='sailing')sailing+=dt;
    model.secretBoat.userData.lamp.visible=c.signal!=='quiet'&&(c.signal==='sailing'||Math.sin(time*8)>.05);
    model.secretBoat.position.x=5+Math.min(sailing,16)*1.05;
    model.secretBoat.position.z=2.2+Math.min(sailing,16)*.45;
    model.secretBoat.position.y=.05+.026*Math.sin(time*1.46+.4);
    if(c.serviceChanges!==activeService){
      activeService=c.serviceChanges;liftStart=time;
    }
    const raise=berth==='services'?.28+.13*c.stage+.22*smooth(0,.7,time-liftStart):0;
    model.cradle.position.y=ease(model.cradle.position.y,.86+raise,4,dt);
    model.windowLight.material.emissiveIntensity=ease(model.windowLight.material.emissiveIntensity,berth==='contact'||Math.abs(dial-74)<7?2.7:.35,5,dt);
    sea.update(time,angle,model.boat,model.secretBoat,sailing);
    renderer.render(scene,camera);
    slot.dataset.renderer='webgl';
    slot.dataset.intro=locked||time>=4.3?'complete':'playing';
    slot.dataset.signal=c.signal;
    if(elapsed>.039&&elapsed<.5)slow++;else slow=Math.max(0,slow-1);
    if(slow>=12&&quality>.55){quality=Math.max(.55,quality*.82);slow=0;setSize();}
    raf=requestAnimationFrame(draw);
  }
  function cleanup(){
    if(disposed)return;
    disposed=true;cancelAnimationFrame(raf);resize.disconnect();
    window.removeEventListener('scroll',chooseSlot);
    window.removeEventListener('resize',chooseSlot);
    document.removeEventListener('visibilitychange',chooseSlot);
    canvas.removeEventListener('webglcontextlost',lost);
    sea.dispose();const materials=new Set(),geometries=new Set(),textures=new Set([texture]);
    scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of [].concat(o.material)){materials.add(m);if(m.map)textures.add(m.map);}});
    for(const item of [...geometries,...materials,...textures])item.dispose();
    renderer.dispose();canvas.remove();
    slots.forEach(s=>{s.dataset.renderer='map';s.dataset.intro='complete';});
  }
  function lost(event){event.preventDefault();cleanup();}
  canvas.addEventListener('webglcontextlost',lost);
  window.addEventListener('scroll',chooseSlot,{passive:true});window.addEventListener('resize',chooseSlot);
  document.addEventListener('visibilitychange',chooseSlot);
  chooseSlot();
  return cleanup;
}
