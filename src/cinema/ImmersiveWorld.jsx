import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { TextureLoader, SRGBColorSpace, ACESFilmicToneMapping, AdditiveBlending, DoubleSide, MathUtils, Color, Vector3, BufferGeometry, BufferAttribute, CatmullRomCurve3, TubeGeometry, Object3D } from 'three';
import { project } from '../data/portfolio.js';

/**
 * ORIGINAL ART DIRECTION: "Five states of an idea".
 * A single real-time 3D journey: Spark / Shape / Proof / Make / Next.
 * No purchased artwork, copied scenes, fake portfolio screenshots, or staged
 * character fidelity. This substitutes an intentionally abstract protagonist
 * until a real photo-matched GLB with licensed animation can be integrated.
 */
export const CHAPTERS=['home','services','projects','process','contact'];
export const STOPS=[0,14,28,42,56];
const THEMES=['#070d16','#062a30','#151330','#23130d','#200d20'];
const CREAM='#fff0d8';
const clamp=MathUtils.clamp;
const ease=(v)=>v*v*(3-2*v);
const lerp=MathUtils.lerp;

function useStoryProgress(){
  const progress=useRef(0);
  useEffect(()=>{
    let frame=0;
    const update=()=>{
      cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        const middle=Math.max(0,window.scrollY);
        const centers=CHAPTERS.map(id=>{
          const el=document.getElementById(id);
          return el ? el.offsetTop : 0;
        });
        let result=0;
        for(let i=0;i<centers.length-1;i++){
          if(middle>=centers[i]){
            const span=Math.max(1,centers[i+1]-centers[i]);
            result=i+clamp((middle-centers[i])/span,0,1);
          }
        }
        progress.current=clamp(result,0,4);
      });
    };
    update();
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
  },[]);
  return progress;
}

function RibbonGeometry({radius=2,phase=0,width=.21,turbulence=.3,depth=0,segments=260}){
  const geometry=useMemo(()=>{
    const positions=[],indices=[],uvs=[];
    for(let i=0;i<=segments;i++){
      const t=(i/segments)*Math.PI*2;
      const r=radius+Math.sin(t*3+phase)*turbulence;
      const x=Math.cos(t)*r;
      const y=Math.sin(t)*r*.71+Math.cos(t*2+phase)*.12;
      const z=Math.sin(t*2+phase)*.66+depth;
      const nx=Math.cos(t+Math.PI/2)*width,ny=Math.sin(t+Math.PI/2)*width;
      positions.push(x-nx,y-ny,z-Math.sin(t*4+phase)*width*.5,x+nx,y+ny,z+Math.sin(t*4+phase)*width*.5);
      uvs.push(i/segments,0,i/segments,1);
      if(i<segments){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
    }
    const g=new BufferGeometry();
    g.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));
    g.setAttribute('uv',new BufferAttribute(new Float32Array(uvs),2));
    g.setIndex(indices);g.computeVertexNormals();return g;
  },[radius,phase,width,turbulence,depth,segments]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <primitive object={geometry} attach="geometry"/>;
}
function Spark({reducedMotion, active}){
  const root=useRef();
  useFrame(({clock},delta)=>{
    if(!root.current||reducedMotion)return;
    const t=clock.getElapsedTime();
    root.current.rotation.y+=delta*.11;
    root.current.rotation.z=Math.sin(t*.23)*.16;
    root.current.position.y=Math.sin(t*.73)*.11;
  });
  return <group position={[2,1.55,0]}>
    <group ref={root}>
      <mesh>
        <icosahedronGeometry args={[1.35,6]}/>
        <meshPhysicalMaterial color="#e9d7be" metalness={.38} roughness={.16} clearcoat={1} clearcoatRoughness={.06} iridescence={.8} iridescenceIOR={1.4}/>
      </mesh>
      <mesh scale={1.07}>
        <icosahedronGeometry args={[1.35,2]}/>
        <meshBasicMaterial color="#f6c090" transparent opacity={.07} wireframe/>
      </mesh>
      {[0,1,2,3,4].map((i)=><mesh key={i} rotation={[i*.43,i*.64,i*.3]}>
        <RibbonGeometry radius={1.83+i*.14} phase={i*.8} depth={(i-2)*.08} width={i===2?.28:.13}/>
        <meshPhysicalMaterial color={['#ff9a71','#b7c8f5','#ffdeb0','#fd896e','#d9dddc'][i]} side={DoubleSide} metalness={.74} roughness={.18} clearcoat={1} clearcoatRoughness={.06}/>
      </mesh>)}
    </group>
    <pointLight color="#ff9d70" intensity={80} distance={9} decay={2} position={[-1,1,3]}/>
    <pointLight color="#7aa6ff" intensity={52} distance={8} decay={2} position={[2,-1,2]}/>
  </group>;
}

const particles=Array.from({length:180},(_,i)=>{
  const a=i*2.399963229728653;
  const r=3.1+Math.sqrt((i+1)/180)*3.1;
  return [Math.cos(a)*r,Math.sin(a)*r*.65,(i%11-5)*.31];
});
function SignalDust({color='#c9a98b',speed=.02,reducedMotion=false}){
  const root=useRef(),mesh=useRef();
  useEffect(()=>{
    if(!mesh.current)return;
    const o=new Object3D();
    particles.forEach(([x,y,z],i)=>{
      o.position.set(x,y,z);
      const s=i%7===0?.037:.014;
      o.scale.setScalar(s);o.updateMatrix();
      mesh.current.setMatrixAt(i,o.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate=true;
  },[]);
  useFrame((_,delta)=>{if(root.current&&!reducedMotion)root.current.rotation.z+=delta*speed;});
  return <group ref={root}>
    <instancedMesh ref={mesh} args={[undefined,undefined,180]} frustumCulled={false}>
      <sphereGeometry args={[1,5,5]}/>
      <meshBasicMaterial color={color} transparent opacity={.72}/>
    </instancedMesh>
  </group>;
}

function Block({position,scale,color,metalness=.15,roughness=.35,rotation=[0,0,0]}){
  return <mesh position={position} rotation={rotation} castShadow>
    <boxGeometry args={scale}/>
    <meshPhysicalMaterial color={color} metalness={metalness} roughness={roughness} clearcoat={.4}/>
  </mesh>;
}
function Formation({selected=0,reducedMotion}){
  const root=useRef(), objects=useRef([]);
  const visuals=useMemo(()=>Array.from({length:42},(_,i)=>{
    const col=i%7,row=Math.floor(i/7);
    return {x:(col-3)*.64,y:(row-2.5)*.65,z:(i%3-1)*.27,
      delay:i*.12, scale:[.28,.45,.25],a:i*.23};
  }),[]);
  useFrame(({clock},dt)=>{
    if(!root.current)return;
    if(!reducedMotion)root.current.rotation.y=Math.sin(clock.getElapsedTime()*.23)*.16;
    for(let i=0;i<objects.current.length;i++){
      const m=objects.current[i];
      if(!m)continue;
      const v=visuals[i];
      const t=clock.getElapsedTime();
      const variant=selected%4;
      const explode=variant===0?.8:variant===1?1.28:variant===2?1.02:1.6;
      const wobble=reducedMotion?0:Math.sin(t*.8+v.delay)*.12;
      const desiredX=v.x*explode+Math.sin(i*.8)*wobble;
      const desiredY=v.y*(variant===2?.65:explode)+Math.cos(i*.4)*wobble;
      const desiredZ=v.z+(variant===3?Math.sin(i)*.8:0);
      m.position.x=MathUtils.damp(m.position.x,desiredX,2.6,dt);
      m.position.y=MathUtils.damp(m.position.y,desiredY,2.6,dt);
      m.position.z=MathUtils.damp(m.position.z,desiredZ,2.6,dt);
      m.rotation.z=MathUtils.damp(m.rotation.z,(variant===3?Math.sin(i*.7)*.6:0),2.5,dt);
    }
  });
  return <group position={[2,1.6,-.25]}>
    <group ref={root}>
      {visuals.map((v,i)=><mesh key={i} ref={n=>{objects.current[i]=n;}} position={[v.x,v.y,v.z]}>
        <boxGeometry args={v.scale}/>
        <meshPhysicalMaterial color={['#f5e1bb','#59cbbd','#b1f0d0','#b3e4e7','#ecbdb2'][i%5]} roughness={.2} metalness={i%3===0?.5:.15} clearcoat={1} transparent opacity={i%8===0?.45:1}/>
      </mesh>)}
      <mesh rotation={[0,.2,.24]}>
        <torusGeometry args={[2.7,.017,5,120]}/>
        <meshBasicMaterial color="#76e3d7" transparent opacity={.48}/>
      </mesh>
    </group>
    <pointLight color="#4ae4df" intensity={88} distance={10} position={[1.3,1.3,3]}/>
  </group>;
}

function ProjectDisplay({reducedMotion=false}){
  const texture=useLoader(TextureLoader,project.screenshot);
  useEffect(()=>{texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;},[texture]);
  const root=useRef();
  useFrame(({clock},dt)=>{
    if(!root.current)return;
    root.current.rotation.y=MathUtils.damp(root.current.rotation.y,-.11+(reducedMotion?0:Math.sin(clock.getElapsedTime()*.24)*.028),2,dt);
  });
  const aspect=1348/926;
  return <group position={[2,1.4,0]}>
    <group ref={root}>
      <mesh position={[0,0,-.13]} castShadow>
        <boxGeometry args={[5.33,3.73,.26]}/>
        <meshPhysicalMaterial color="#191d39" metalness={.8} roughness={.18} clearcoat={.9}/>
      </mesh>
      <mesh position={[0,0,.022]}>
        <planeGeometry args={[5.02,5.02/aspect]}/>
        <meshBasicMaterial map={texture} toneMapped={false}/>
      </mesh>
      <mesh position={[0,-2.1,-.3]}>
        <boxGeometry args={[.18,.67,.3]}/>
        <meshStandardMaterial color="#a4b0c8" metalness={.9} roughness={.18}/>
      </mesh>
      <mesh position={[0,-2.48,-.3]}>
        <boxGeometry args={[1.7,.1,.85]}/>
        <meshStandardMaterial color="#b7bcd1" metalness={.8} roughness={.19}/>
      </mesh>
    </group>
    {[0,1,2].map(i=><mesh key={i} rotation={[.04+i*.19,0,i*.13]} position={[-2.9+i*2.9,-.5+i*.3,-.9-i*.14]}>
      <torusGeometry args={[2.4+i*.19,.02,8,125]}/>
      <meshBasicMaterial color={['#b1c1ff','#e2a4ff','#ecddff'][i]} transparent opacity={.45}/>
    </mesh>)}
    <pointLight intensity={55} color="#797cff" distance={9} position={[-3,1,2]}/>
  </group>;
}

function CircuitForge({phase=0,reducedMotion}){
  const root=useRef(),bars=useRef([]);
  const parts=useMemo(()=>Array.from({length:54},(_,i)=>{
    const row=Math.floor(i/9),col=i%9;
    const edge=(row===0||row===5||col===0||col===8);
    return {x:(col-4)*.43,y:(row-2.5)*.47,z:Math.sin(i*.7)*.29,edge};
  }),[]);
  useFrame(({clock},dt)=>{
    if(!root.current)return;
    const time=clock.getElapsedTime();
    root.current.rotation.y=reducedMotion?0:Math.sin(time*.25)*.23;
    for(let i=0;i<bars.current.length;i++){
      const m=bars.current[i];if(!m)continue;
      const p=parts[i];
      const f=phase/4;
      const scatter=(1-f)*(i%4)*.13;
      m.position.x=MathUtils.damp(m.position.x,p.x*(1+scatter),3,dt);
      m.position.y=MathUtils.damp(m.position.y,p.y*(1+scatter),3,dt);
      m.position.z=MathUtils.damp(m.position.z,p.z+scatter,3,dt);
      m.rotation.z=MathUtils.damp(m.rotation.z,phase===2?Math.sin(i*.64)*.2:0,3,dt);
      m.scale.z=MathUtils.damp(m.scale.z,phase===4?1.5:1,2,dt);
    }
  });
  return <group position={[2,1.55,-.2]}>
    <group ref={root}>
      {parts.map((p,i)=><mesh key={i} ref={el=>bars.current[i]=el} position={[p.x,p.y,p.z]}>
        <boxGeometry args={[.39,.42,.17]}/>
        <meshPhysicalMaterial color={p.edge?'#f9cb96':'#bb8563'} metalness={p.edge?.83:.4} roughness={.2} clearcoat={1} />
      </mesh>)}
      <mesh rotation={[0,0,.35]}>
        <torusGeometry args={[2.98,.06,12,112,Math.PI*1.82]}/>
        <meshStandardMaterial color="#f7b888" metalness={.9} roughness={.23}/>
      </mesh>
      <mesh rotation={[1.12,.12,-.4]}>
        <torusGeometry args={[2.65,.024,8,136,Math.PI*1.63]}/>
        <meshBasicMaterial color="#ffcf9f" transparent opacity={.68}/>
      </mesh>
    </group>
    <pointLight color="#f4a35d" intensity={92} distance={10} position={[2,-.5,3]}/>
  </group>;
}

function Portal({reducedMotion}){
  const root=useRef();
  useFrame(({clock},dt)=>{
    if(!root.current||reducedMotion)return;
    root.current.rotation.y+=dt*.075;
    root.current.rotation.z=Math.sin(clock.getElapsedTime()*.3)*.06;
  });
  return <group position={[2,1.53,-.7]}>
    <group ref={root}>
      {[0,1,2,3,4].map(i=><mesh key={i} rotation={[i*.19,i*.31,i*.26]}>
        <torusGeometry args={[1.9+i*.2,.1-i*.011,14,128]}/>
        <meshPhysicalMaterial color={['#ffd6b7','#f3a6a5','#ffd4de','#dd97ce','#ffeadb'][i]} metalness={.68} roughness={.14} clearcoat={1} iridescence={.65}/>
      </mesh>)}
      <mesh>
        <sphereGeometry args={[1.63,48,32]}/>
        <meshPhysicalMaterial color="#ffb4b9" transmission={.77} thickness={.55} roughness={.08} metalness={.05} ior={1.24} transparent opacity={.95}/>
      </mesh>
      <mesh scale={1.08}>
        <sphereGeometry args={[1.65,32,24]}/>
        <meshBasicMaterial color="#ffc7da" transparent opacity={.075} blending={AdditiveBlending} depthWrite={false}/>
      </mesh>
    </group>
    <pointLight color="#ff91ba" intensity={100} distance={10} position={[2,1,2]}/>
    <pointLight color="#ffdb9c" intensity={38} distance={7} position={[-3,-1,2]}/>
  </group>;
}

function Stage({index,serviceIndex,processIndex,reducedMotion}){
  return <group position={[STOPS[index],0,0]}>
    {index===0&&<><Spark reducedMotion={reducedMotion}/><group position={[2,1.8,-1]}><SignalDust color="#e5b79e" reducedMotion={reducedMotion}/></group></>}
    {index===1&&<><Formation selected={serviceIndex} reducedMotion={reducedMotion}/><group position={[2,1.5,-1]}><SignalDust color="#80e7da" speed={-.014} reducedMotion={reducedMotion}/></group></>}
    {index===2&&<><ProjectDisplay reducedMotion={reducedMotion}/><group position={[2,1.5,-1]}><SignalDust color="#adadff" speed={.008} reducedMotion={reducedMotion}/></group></>}
    {index===3&&<><CircuitForge phase={processIndex} reducedMotion={reducedMotion}/><group position={[2,1.5,-1]}><SignalDust color="#f2ae87" speed={.018} reducedMotion={reducedMotion}/></group></>}
    {index===4&&<><Portal reducedMotion={reducedMotion}/><group position={[2,1.5,-1]}><SignalDust color="#ffc9df" reducedMotion={reducedMotion}/></group></>}
  </group>;
}

function Director({chapter,serviceIndex,processIndex,reducedMotion,hidden}){
  const {camera,scene,size,setFrameloop,invalidate}=useThree();
  const scrollProgress=useStoryProgress();
  const smoothProgress=useRef(0);
  useEffect(()=>{
    const visibility=()=>{
      const asleep=hidden||document.hidden;
      setFrameloop(asleep?'never':'always');
      if(!asleep)invalidate();
    };
    visibility();document.addEventListener('visibilitychange',visibility);
    return()=>document.removeEventListener('visibilitychange',visibility);
  },[hidden,setFrameloop,invalidate]);
  const palettes=useMemo(()=>THEMES.map(hex=>new Color(hex)),[]);
  useEffect(()=>{scene.background=new Color(THEMES[0]);},[scene]);
  const targetLook=useRef(new Vector3(2,1.5,0));
  useFrame(({clock},dt)=>{
    const target=scrollProgress.current;
    const p=MathUtils.damp(smoothProgress.current,target,reducedMotion?16:2.8,dt);
    smoothProgress.current=clamp(p,0,4);
    const idx=Math.min(3,Math.floor(p)),fraction=clamp(p-idx,0,1);
    const x=lerp(STOPS[idx],STOPS[idx+1],ease(fraction));
    const mobile=size.width<720;
    const camX=x+(mobile?2:0.55);
    const camY=mobile?1.75:1.95;
    const camZ=mobile?10:10.6;
    camera.position.x=MathUtils.damp(camera.position.x,camX,reducedMotion?16:3.2,dt);
    camera.position.y=MathUtils.damp(camera.position.y,camY,reducedMotion?16:2.5,dt);
    camera.position.z=MathUtils.damp(camera.position.z,camZ,reducedMotion?16:2.5,dt);
    const to=new Vector3(x+(mobile?2:.6),mobile?.72:1.53,-.4);
    targetLook.current.lerp(to,1-Math.exp(-3*dt));camera.lookAt(targetLook.current);
    const c1=palettes[idx],c2=palettes[Math.min(4,idx+1)];
    scene.background.copy(c1).lerp(c2,ease(fraction));
  });
  return <>
    <ambientLight intensity={.43}/>
    <hemisphereLight args={['#b4dce2','#231d21',2.1]}/>
    <directionalLight position={[4,8,7]} intensity={3.6} color="#ffe2c7"/>
    <directionalLight position={[-4,2,-3]} intensity={2.9} color="#85a2ff"/>
    {CHAPTERS.map((_,i)=><Stage key={i} index={i} serviceIndex={serviceIndex} processIndex={processIndex} reducedMotion={reducedMotion}/>)}
  </>;
}
export default function ImmersiveWorld({chapter='home',serviceIndex=0,processIndex=0,reducedMotion=false,hidden=false}){
  const [lost,setLost]=useState(false);
  if(lost)return <div className="cinema-world cinema-world-fallback" aria-hidden="true"/>;
  return <div className="cinema-world" aria-hidden="true">
    <Suspense fallback={null}>
      <Canvas camera={{position:[.7,2.2,10.6],fov:46,near:.1,far:140}} dpr={[1,1.6]} gl={{antialias:true,alpha:false,powerPreference:'high-performance'}} onCreated={({gl})=>{
        gl.toneMapping=ACESFilmicToneMapping;
        gl.toneMappingExposure=1.12;
        gl.outputColorSpace=SRGBColorSpace;
        gl.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();setLost(true);},{once:true});
      }} fallback={<div className="cinema-world-fallback" aria-hidden="true"/>}>
        <Director chapter={chapter} serviceIndex={serviceIndex} processIndex={processIndex} reducedMotion={reducedMotion} hidden={hidden}/>
      </Canvas>
    </Suspense>
  </div>;
}
