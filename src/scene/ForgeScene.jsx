import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, useProgress, useTexture } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { cameraTimeline, project } from '../data/portfolio';

const ACCENT = '#ff5c26';
const smooth = (a,b,t) => THREE.MathUtils.smoothstep(t,a,b);
const mix = THREE.MathUtils.lerp;
const partNames = ['React','Node.js','Express','MongoDB','Tailwind CSS','Git'];
function brushedTexture() {
  const size=128, data=new Uint8Array(size*size*4);
  let seed=42;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    seed=(seed*1664525+1013904223)>>>0;
    const v=145 + (seed%27) + Math.round(Math.sin(y*1.8)*27);
    const i=(y*size+x)*4;data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
  }
  const texture=new THREE.DataTexture(data,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(2,4);texture.needsUpdate=true;return texture;
}
function Progress({ onProgress }) {
  const { loaded, total } = useProgress();
  useEffect(()=>onProgress({loaded,total}),[loaded,total,onProgress]);
  return null;
}
function EnvironmentMap() { return <Environment files="/environment/forge-studio.hdr" environmentIntensity={0.65} environmentRotation={[0,1.5,0]}/>; }
function Cable({ points, radius = 0.035, color = '#22221f' }) {
  const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[points]);
  return <mesh castShadow><tubeGeometry args={[curve,40,radius,6,false]}/><meshStandardMaterial color={color} metalness={0.2} roughness={0.75}/></mesh>;
}
function Bolts({ spread }) {
  const ref=useRef();const dummy=useMemo(()=>new THREE.Object3D(),[]);
  useFrame(()=>{
    if(!ref.current)return;
    for(let i=0;i<32;i++) {
      const side=i<16?-1:1;const a=(i%16)/16*Math.PI*2;
      dummy.position.set(side*(1.48+spread.current*0.8),Math.sin(a)*0.92,Math.cos(a)*0.92);
      dummy.rotation.set(0,0,Math.PI/2);dummy.updateMatrix();ref.current.setMatrixAt(i,dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate=true;
  });
  return <instancedMesh ref={ref} args={[null,null,32]} castShadow><cylinderGeometry args={[0.045,0.045,0.06,6]}/><meshStandardMaterial color="#9b9a8f" roughness={0.3} metalness={1}/></instancedMesh>;
}
function Part({ index, spread, device, selected, roughness, onSelect, stage }) {
  const group=useRef();const ring=useRef();const [hover,setHover]=useState(false);
  const name=partNames[index];
  const target=new THREE.Vector3();
  const velocity=useRef(new THREE.Vector3());
  const side=index%2===0?-1:1;
  const base=side*(0.85+Math.floor(index/2)*0.34);
  const radius=[1.04,1.04,0.9,0.9,0.73,0.73][index];
  useFrame((_,dt)=>{
    if(!group.current)return;
    const s=spread.current;
    const activated=selected.current===name||hover;
    const row=Math.floor(index/2);
    target.set(base + side*s*(0.35+row*0.35), (row-1)*s*0.87 + (activated&&stage.current>1.5&&stage.current<2.8?0.12:0), (index%2?0.2:-0.2)*s);
    // Damped response, with no physics engine or per-frame React state updates.
    const delta=Math.min(dt,0.04);const force=target.clone().sub(group.current.position).multiplyScalar(75);
    velocity.current.addScaledVector(force,delta).multiplyScalar(Math.exp(-13*delta));
    group.current.position.addScaledVector(velocity.current,delta);
    const scale=1-device.current*0.7;group.current.scale.setScalar(scale);
    group.current.rotation.y=mix(group.current.rotation.y, s*side*0.18 + (hover?0.13:0),1-Math.exp(-6*delta));
    if(ring.current)ring.current.material.emissiveIntensity=activated ? 0.5 : 0.05;
  });
  return <group ref={group} position={[base,0,0]} onPointerOver={e=>{e.stopPropagation();setHover(true);}} onPointerOut={()=>setHover(false)} onClick={e=>{e.stopPropagation();onSelect(name);}}>
    <group rotation={[0,0,Math.PI/2]}>
      <mesh castShadow receiveShadow><cylinderGeometry args={[radius,radius,0.2,48]}/><meshPhysicalMaterial color={index<2?'#55554f':'#282a25'} roughness={0.34} metalness={0.9} roughnessMap={roughness} clearcoat={0.1}/></mesh>
      <mesh position={[0,0.11,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius*0.82,0.035,8,48]}/><meshStandardMaterial color="#1b1c19" roughness={0.9}/></mesh>
      <mesh ref={ring} position={[0,-0.11,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius*0.9,0.018,6,48]}/><meshStandardMaterial color={index<2?ACCENT:'#77786d'} emissive={index<2?ACCENT:'#000000'} emissiveIntensity={0.1} toneMapped={false}/></mesh>
      <mesh position={[0,0.12,0]}><cylinderGeometry args={[0.2,0.2,0.06,32]}/><meshStandardMaterial color="#a5a497" metalness={1} roughness={0.25}/></mesh>
    </group>
  </group>;
}
function SkillLabels({ motion, onSelect }) {
  const { invalidate }=useThree();
  const [visible,setVisible]=useState(false);
  const last=useRef(false);
  useFrame(()=>{
    const next=motion.current.position>1.6 && motion.current.position<2.65;
    if(next!==last.current){last.current=next;setVisible(next);}
  });
  if(!visible)return null;
  return <group>{partNames.map((name,index)=><Html key={name} center position={[(index%2?1:-1)*(1.2+Math.floor(index/2)*0.45),(Math.floor(index/2)-1)*1.05,1.25]} zIndexRange={[8,1]}><button className="physical-label" onClick={()=>{onSelect(name);invalidate();}} data-cursor="Inspect" aria-label={`Inspect ${name}`}>{name}<span>↗</span></button></Html>)}</group>;
}
function Device({ device, motion, texture }) {
  const ref=useRef();
  useFrame((_,dt)=>{
    const v=device.current;ref.current.visible=v>0.01;
    ref.current.scale.setScalar(Math.max(0.001,v));
    ref.current.rotation.y=mix(ref.current.rotation.y,motion.current.pointer[0]*0.12,1-Math.exp(-4*dt));
    ref.current.rotation.x=mix(ref.current.rotation.x,motion.current.pointer[1]*0.06,1-Math.exp(-4*dt));
  });
  return <group ref={ref} position={[0,0,0.4]}>
    <mesh castShadow><boxGeometry args={[3.95,2.83,0.17]}/><meshStandardMaterial color="#262723" metalness={0.8} roughness={0.3}/></mesh>
    <mesh position={[0,0.06,0.091]}><planeGeometry args={[3.72,2.555]}/><meshBasicMaterial map={texture} toneMapped={false}/></mesh>
    <mesh position={[0,-1.36,0.105]}><boxGeometry args={[0.22,0.025,0.02]}/><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.3} toneMapped={false}/></mesh>
    <mesh position={[0,-1.72,-0.12]} castShadow><boxGeometry args={[0.25,0.7,0.25]}/><meshStandardMaterial color="#68675e" metalness={1} roughness={0.3}/></mesh>
    <mesh position={[0,-2.08,0]} castShadow><boxGeometry args={[1.75,0.09,0.85]}/><meshStandardMaterial color="#41433a" metalness={1} roughness={0.3}/></mesh>
  </group>;
}
function Assembly({ motion,onSelect,onReady }) {
  const { camera, invalidate, size, gl }=useThree();
  const rig=useRef();const core=useRef();const shaft=useRef();const stage=useRef(0);const spread=useRef(0);const device=useRef(0);const selected=useRef('React');
  const elapsed=useRef(0);const lastPosition=useRef(-1);const settle=useRef(180);
  const roughness=useMemo(brushedTexture,[]);
  const texture=useTexture(project.screenshot);
  texture.colorSpace=THREE.SRGBColorSpace;
  const cameraTarget=useMemo(()=>new THREE.Vector3(),[]);
  const desiredPosition=useMemo(()=>new THREE.Vector3(),[]);
  const cablePoints=useMemo(()=>[[-1.4,-0.4,0],[-1.6,-1.35,0.3],[0,-1.65,0.6],[1.8,-1.2,-0.2],[1.5,0.2,-0.3]],[]);
  useEffect(()=>{onReady();invalidate();return()=>roughness.dispose();},[onReady,invalidate,roughness]);
  useEffect(()=>{
    const wake=()=>{settle.current=90;if(!document.hidden)invalidate();};
    const lost=event=>{event.preventDefault();gl.domElement.dispatchEvent(new CustomEvent('forge-context-lost',{bubbles:true}));};
    addEventListener('forge-wake',wake);addEventListener('scroll',wake,{passive:true});addEventListener('pointermove',wake,{passive:true});addEventListener('pointerdown',wake,{passive:true});addEventListener('visibilitychange',wake);gl.domElement.addEventListener('webglcontextlost',lost);
    return()=>{removeEventListener('forge-wake',wake);removeEventListener('scroll',wake);removeEventListener('pointermove',wake);removeEventListener('pointerdown',wake);removeEventListener('visibilitychange',wake);gl.domElement.removeEventListener('webglcontextlost',lost);};
  },[invalidate,gl]);
  useFrame((_,dt)=>{
    if(document.hidden)return;
    const delta=Math.min(dt,0.05);elapsed.current+=delta;
    const raw=motion.current.position;stage.current=mix(stage.current,raw,1-Math.exp(-5*delta));
    const p=Math.min(4,stage.current), i=Math.min(3,Math.floor(p)), t=smooth(0,1,p-i);
    const a=cameraTimeline[i],b=cameraTimeline[i+1];
    const mobile=size.width<768;
    for(let axis=0;axis<3;axis++){desiredPosition.setComponent(axis,mix(a.camera[axis],b.camera[axis],t));cameraTarget.setComponent(axis,mix(a.target[axis],b.target[axis],t));}
    if(mobile){desiredPosition.x*=0.3;desiredPosition.z+=4;}
    camera.position.lerp(desiredPosition,1-Math.exp(-5*delta));camera.lookAt(cameraTarget);
    const intro=1-Math.pow(1-Math.min(1,elapsed.current/1.6),4);
    spread.current=mix(a.spread,b.spread,t)+(1-intro)*3.5;
    device.current=smooth(2.55,2.98,p)*(1-smooth(3.8,4,p));
    selected.current=motion.current.selected;
    rig.current.position.set(mobile?0:mix(a.object[0],b.object[0],t),mobile?-0.25:mix(a.object[1],b.object[1],t),0);
    rig.current.rotation.set(mix(a.rotation[0],b.rotation[0],t),mix(a.rotation[1],b.rotation[1],t),mix(a.rotation[2],b.rotation[2],t));
    rig.current.scale.setScalar(mobile?1.12:1.08);
    core.current.rotation.y=spread.current*0.42;
    core.current.scale.setScalar(Math.max(0.001,1-device.current));
    shaft.current.scale.y=1+spread.current*0.4;
    shaft.current.visible=device.current<0.9;
    if(Math.abs(raw-lastPosition.current)>0.0001){settle.current=90;lastPosition.current=raw;}
    if(elapsed.current<2.4||settle.current-->0)invalidate();
  });
  return <group ref={rig}>
    <group ref={shaft} rotation={[0,0,Math.PI/2]}><mesh castShadow><cylinderGeometry args={[0.11,0.11,4.2,24]}/><meshStandardMaterial color="#aaa99d" metalness={1} roughness={0.24} roughnessMap={roughness}/></mesh><mesh><cylinderGeometry args={[0.135,0.135,1.3,24]}/><meshStandardMaterial color="#191b16" roughness={0.9}/></mesh></group>
    {partNames.map((_,index)=><Part key={index} index={index} spread={spread} device={device} selected={selected} roughness={roughness} onSelect={onSelect} stage={stage}/>)}
    <Bolts spread={spread}/>
    <group ref={core}>
      <mesh castShadow><boxGeometry args={[1.05,1.05,1.05]}/><meshPhysicalMaterial color="#7d7c70" metalness={1} roughness={0.33} roughnessMap={roughness}/></mesh>
      <mesh position={[0,0,0.54]}><boxGeometry args={[0.85,0.85,0.025]}/><meshStandardMaterial color="#1b1c18" metalness={0.6} roughness={0.7}/></mesh>
      <group position={[0,0,0.58]}>{[-1,1].map(side=><group key={side} position={[side*0.25,0,0]}><mesh rotation={[0,0,side*0.65]} position={[0,0.09,0]}><boxGeometry args={[0.055,0.26,0.035]}/><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.35} toneMapped={false}/></mesh><mesh rotation={[0,0,-side*0.65]} position={[0,-0.09,0]}><boxGeometry args={[0.055,0.26,0.035]}/><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.35} toneMapped={false}/></mesh></group>)}</group>
      <Cable points={cablePoints}/>
    </group>
    <Device device={device} motion={motion} texture={texture}/>
    {size.width>=900 && <SkillLabels motion={motion} onSelect={onSelect}/>}
  </group>;
}
function SceneWorld(props) {
  const {size}=useThree();
  return <><ambientLight intensity={0.25}/><directionalLight position={[3,6,4]} intensity={2.2} castShadow={size.width>=768} shadow-mapSize={[1024,1024]} shadow-bias={-0.001}/><directionalLight position={[-4,1,-2]} intensity={1.4} color="#e2d7be"/><EnvironmentMap/><Assembly {...props}/><mesh position={[0,-2.55,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[40,40]}/><meshStandardMaterial color="#0e0f0d" roughness={0.95} metalness={0.1}/></mesh><gridHelper args={[30,30,'#272822','#171914']} position={[0,-2.54,0]}/>{size.width>=900 && <EffectComposer multisampling={0}><Bloom luminanceThreshold={1.15} luminanceSmoothing={0.2} intensity={0.18} mipmapBlur/></EffectComposer>}</>;
}
export default function ForgeScene({ motion,onReady,onError,onProgress,onSelect }) {
  const [visible,setVisible]=useState(!document.hidden);
  useEffect(()=>{const change=()=>setVisible(!document.hidden);const lost=()=>onError();document.addEventListener('visibilitychange',change);document.addEventListener('forge-context-lost',lost);return()=>{document.removeEventListener('visibilitychange',change);document.removeEventListener('forge-context-lost',lost);};},[onError]);
  return <div className="webgl-stage" role="region" aria-label="The Forge: an interactive mechanical sculpture that transforms as you scroll"><Canvas frameloop={visible?'demand':'never'} dpr={[1,1.5]} shadows camera={{position:[0,1,8],fov:42,near:0.1,far:60}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}} fallback={<span className="sr-only">3D unavailable. Portfolio content remains below.</span>} onCreated={({gl})=>{gl.setClearColor('#0b0b0c',0);}}><Progress onProgress={onProgress}/><Suspense fallback={null}><SceneWorld motion={motion} onReady={onReady} onSelect={onSelect}/></Suspense></Canvas></div>;
}
