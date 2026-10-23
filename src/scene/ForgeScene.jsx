import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, useProgress, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { project } from '../data/portfolio';
import { createCameraFraming, sampleCameraPose } from './framing.js';
import { QUALITY, createQualityMonitor, initialQuality } from '../experience/quality.js';
import { attachSceneLifecycle } from '../experience/lifecycle.js';
const ForgeEffects = lazy(() => import('./ForgeEffects.jsx'));

class AssetBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback || null : this.props.children; }
}
function StudioLights({ resolution = 64 }) {
  return <Environment resolution={resolution}><Lightformer intensity={3} position={[0,4,2]} scale={[8,4,1]} rotation={[Math.PI/2,0,0]}/><Lightformer intensity={2} position={[-4,1,2]} scale={[3,6,1]} rotation={[0,Math.PI/2,0]}/><Lightformer intensity={1.5} position={[4,0,-2]} scale={[3,5,1]} rotation={[0,-Math.PI/2,0]}/></Environment>;
}
function QualityController({ initialTier, maxTier, onQuality, onReady, onRecovering, onError, onPause, wakeRef }) {
  const { gl, invalidate, setDpr, setFrameloop } = useThree();
  const monitor = useMemo(() => createQualityMonitor(initialTier, maxTier), [initialTier, maxTier]);
  const wasPaused = useRef(false);
  useEffect(() => attachSceneLifecycle({
    canvas: gl.domElement, page: document, wakeTarget: window,
    pause: value => { wasPaused.current = value; setFrameloop(value ? 'never' : 'demand'); onPause(value); monitor.reset(); },
    wake: () => { wakeRef.current?.(); invalidate(); },
    recovering: () => { monitor.setTier(0); onQuality(0); onRecovering(); },
    restored: onReady, fail: onError,
  }), [gl, invalidate, setFrameloop, monitor, onQuality, onReady, onRecovering, onError, onPause, wakeRef]);
  useFrame((_, delta) => {
    if (wasPaused.current) return;
    const next = monitor.sample(delta);
    if (next !== null) { setDpr(Math.min(window.devicePixelRatio || 1, QUALITY[next].dpr)); onQuality(next); }
  });
  return null;
}
function TextureScreen({ quality }) {
  const source = useTexture(project.screenshot);
  const texture = useMemo(() => {
    const image = source.image;
    const ratio = Math.min(1, quality.textureSize / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * ratio)); canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) return source;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const result = new THREE.CanvasTexture(canvas); result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, [source, quality.textureSize]);
  useEffect(() => () => { if (texture !== source) texture.dispose(); }, [texture, source]);
  return <meshBasicMaterial map={texture} toneMapped={false}/>;
}

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
function Cable({ points, quality, radius = 0.035, color = '#22221f' }) {
  const curve=useMemo(()=>new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),[points]);
  return <mesh castShadow><tubeGeometry args={[curve,quality.cableSegments,radius,quality.segments > 16 ? 6 : 4,false]}/><meshStandardMaterial color={color} metalness={0.2} roughness={0.75}/></mesh>;
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
function Part({ index, spread, device, selected, roughness, onSelect, stage, quality }) {
  const group=useRef();const ring=useRef();const [hover,setHover]=useState(false);
  const name=partNames[index];
  const target=useMemo(()=>new THREE.Vector3(),[]);
  const force=useMemo(()=>new THREE.Vector3(),[]);
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
    const delta=Math.min(dt,0.04);force.copy(target).sub(group.current.position).multiplyScalar(75);
    velocity.current.addScaledVector(force,delta).multiplyScalar(Math.exp(-13*delta));
    group.current.position.addScaledVector(velocity.current,delta);
    const scale=1-device.current*0.7;group.current.scale.setScalar(scale);
    group.current.rotation.y=mix(group.current.rotation.y, s*side*0.18 + (hover?0.13:0),1-Math.exp(-6*delta));
    if(ring.current)ring.current.material.emissiveIntensity=activated ? 0.5 : 0.05;
  });
  return <group ref={group} position={[base,0,0]} onPointerOver={e=>{e.stopPropagation();setHover(true);}} onPointerOut={()=>setHover(false)} onClick={e=>{e.stopPropagation();onSelect(name);}}>
    <group rotation={[0,0,Math.PI/2]}>
      <mesh castShadow receiveShadow><cylinderGeometry args={[radius,radius,0.2,quality.segments]}/><meshPhysicalMaterial color={index<2?'#55554f':'#282a25'} roughness={0.34} metalness={0.9} roughnessMap={roughness} clearcoat={0.1}/></mesh>
      <mesh position={[0,0.11,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius*0.82,0.035,quality.segments > 16 ? 8 : 4,quality.segments]}/><meshStandardMaterial color="#1b1c19" roughness={0.9}/></mesh>
      <mesh ref={ring} position={[0,-0.11,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[radius*0.9,0.018,6,quality.segments]}/><meshStandardMaterial color={index<2?ACCENT:'#77786d'} emissive={index<2?ACCENT:'#000000'} emissiveIntensity={0.1} toneMapped={false}/></mesh>
      <mesh position={[0,0.12,0]}><cylinderGeometry args={[0.2,0.2,0.06,Math.min(32,quality.segments)]}/><meshStandardMaterial color="#a5a497" metalness={1} roughness={0.25}/></mesh>
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
function Device({ device, motion, quality }) {
  const ref=useRef();
  useFrame((_,dt)=>{
    const v=device.current;ref.current.visible=v>0.01;
    ref.current.scale.setScalar(Math.max(0.001,v));
    ref.current.rotation.y=mix(ref.current.rotation.y,(motion.current.gentle ? 0 : motion.current.pointer[0]*0.12),1-Math.exp(-4*dt));
    ref.current.rotation.x=mix(ref.current.rotation.x,(motion.current.gentle ? 0 : motion.current.pointer[1]*0.06),1-Math.exp(-4*dt));
  });
  return <group ref={ref} position={[0,0,0.4]}>
    <mesh castShadow><boxGeometry args={[3.95,2.83,0.17]}/><meshStandardMaterial color="#262723" metalness={0.8} roughness={0.3}/></mesh>
    <mesh position={[0,0.06,0.091]}><planeGeometry args={[3.72,2.555]}/><AssetBoundary fallback={<meshBasicMaterial color="#292c26"/>}><Suspense fallback={<meshBasicMaterial color="#292c26"/>}><TextureScreen quality={quality}/></Suspense></AssetBoundary></mesh>
    <mesh position={[0,-1.36,0.105]}><boxGeometry args={[0.22,0.025,0.02]}/><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.3} toneMapped={false}/></mesh>
    <mesh position={[0,-1.72,-0.12]} castShadow><boxGeometry args={[0.25,0.7,0.25]}/><meshStandardMaterial color="#68675e" metalness={1} roughness={0.3}/></mesh>
    <mesh position={[0,-2.08,0]} castShadow><boxGeometry args={[1.75,0.09,0.85]}/><meshStandardMaterial color="#41433a" metalness={1} roughness={0.3}/></mesh>
  </group>;
}
function Assembly({ motion,onSelect,onReady,quality,wakeRef }) {
  const { camera, invalidate, size }=useThree();
  const rig=useRef();const core=useRef();const shaft=useRef();const stage=useRef(motion.current.position);const spread=useRef(0);const device=useRef(0);const selected=useRef('React');
  const elapsed=useRef(0), lastPosition=useRef(-1), settle=useRef(2.4), announced=useRef(false), cameraInitialized=useRef(false), lastViewport=useRef('');
  const roughness=useMemo(brushedTexture,[]);
  const cameraTarget=useMemo(()=>new THREE.Vector3(),[]);
  const frameCamera=useMemo(createCameraFraming,[]);
  const cablePoints=useMemo(()=>[[-1.4,-0.4,0],[-1.6,-1.35,0.3],[0,-1.65,0.6],[1.8,-1.2,-0.2],[1.5,0.2,-0.3]],[]);
  useEffect(()=>{roughness.needsUpdate=true;return()=>roughness.dispose();},[roughness]);
  useEffect(()=>{
    const wake=()=>{settle.current=motion.current.gentle?0.35:2.4;};
    wakeRef.current=wake; wake(); invalidate();
    const pointer=event=>{
      if(event.pointerType==='touch'||motion.current.gentle)return;
      motion.current.pointer=[(event.clientX/innerWidth-0.5)*2,(event.clientY/innerHeight-0.5)*2];
      wake(); if(!document.hidden)invalidate();
    };
    window.addEventListener('pointermove',pointer,{passive:true});
    return()=>{wakeRef.current=null;window.removeEventListener('pointermove',pointer);};
  },[motion,invalidate,wakeRef]);
  useFrame((_,dt)=>{
    if(document.hidden)return;
    const gentle=motion.current.gentle;
    const delta=Math.min(dt,0.05);elapsed.current+=delta;
    const raw=gentle?0:motion.current.position;
    stage.current=gentle?0:mix(stage.current,raw,1-Math.exp(-5*delta));
    const p=THREE.MathUtils.clamp(stage.current,0,4);
    const pose=sampleCameraPose(p);
    const mobile=size.width<768;
    const intro=gentle||motion.current.position>0.15?1:1-Math.pow(1-Math.min(1,elapsed.current/1.6),4);
    spread.current=pose.spread+(1-intro)*3.5;
    const frame=frameCamera({...pose,spread:spread.current},size.width,size.height);
    const smoothing=!cameraInitialized.current||gentle?1:1-Math.exp(-5*delta);
    camera.position.lerp(frame.position,smoothing);
    if(size.width>=1100||size.width>=768&&size.width>=size.height)cameraTarget.copy(frame.target);
    else cameraTarget.lerp(frame.target,smoothing);
    camera.lookAt(cameraTarget);
    const viewportKey=`${size.width}:${size.height}:${frame.offsetX}:${frame.offsetY}`;
    if(viewportKey!==lastViewport.current){camera.setViewOffset(size.width,size.height,frame.offsetX,frame.offsetY,size.width,size.height);lastViewport.current=viewportKey;}
    cameraInitialized.current=true;
    device.current=gentle?0:smooth(2.55,2.98,p)*(1-smooth(3.8,4,p));
    selected.current=motion.current.selected;
    rig.current.position.set(mobile?0:pose.object[0],mobile?-0.25:pose.object[1],0);
    rig.current.rotation.set(...pose.rotation);rig.current.scale.setScalar(mobile?1.12:1.08);
    core.current.rotation.y=spread.current*0.42;core.current.scale.setScalar(Math.max(0.001,1-device.current));
    shaft.current.scale.y=1+spread.current*0.4;shaft.current.visible=device.current<0.9;
    if(Math.abs(raw-lastPosition.current)>0.0001){settle.current=gentle?0.35:2.4;lastPosition.current=raw;}
    settle.current-=delta;
    if((!gentle&&elapsed.current<2.4)||settle.current>0)invalidate();
    if(!announced.current){announced.current=true;onReady();}
  },-1);
  return <group ref={rig}>
    <group ref={shaft} rotation={[0,0,Math.PI/2]}><mesh castShadow><cylinderGeometry args={[0.11,0.11,4.2,24]}/><meshStandardMaterial color="#aaa99d" metalness={1} roughness={0.24} roughnessMap={roughness}/></mesh><mesh><cylinderGeometry args={[0.135,0.135,1.3,24]}/><meshStandardMaterial color="#191b16" roughness={0.9}/></mesh></group>
    {partNames.map((_,index)=><Part key={index} index={index} spread={spread} device={device} selected={selected} roughness={roughness} onSelect={onSelect} stage={stage} quality={quality}/>)}
    <Bolts spread={spread}/>
    <group ref={core}>
      <mesh castShadow><boxGeometry args={[1.05,1.05,1.05]}/><meshPhysicalMaterial color="#7d7c70" metalness={1} roughness={0.33} roughnessMap={roughness}/></mesh>
      <mesh position={[0,0,0.54]}><boxGeometry args={[0.85,0.85,0.025]}/><meshStandardMaterial color="#1b1c18" metalness={0.6} roughness={0.7}/></mesh>
      <group position={[0,0,0.58]}>{[-1,1].map(side=><group key={side} position={[side*0.25,0,0]}><mesh rotation={[0,0,side*0.65]} position={[0,0.09,0]}><boxGeometry args={[0.055,0.26,0.035]}/><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.35} toneMapped={false}/></mesh><mesh rotation={[0,0,-side*0.65]} position={[0,-0.09,0]}><boxGeometry args={[0.055,0.26,0.035]}/><meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.35} toneMapped={false}/></mesh></group>)}</group>
      <Cable points={cablePoints} quality={quality}/>
    </group>
    <Device device={device} motion={motion} quality={quality}/>
    {size.width>=900 && <SkillLabels motion={motion} onSelect={onSelect}/>}
  </group>;
}
function SceneWorld({ quality, ...props }) {
  const {size}=useThree();
  const studio=<StudioLights resolution={quality.name==='low'?64:128}/>;
  return <>
    <ambientLight intensity={0.25}/>
    <directionalLight key={quality.shadowSize} position={[3,6,4]} intensity={2.2} castShadow={quality.shadowSize>0} shadow-mapSize={[quality.shadowSize||256,quality.shadowSize||256]} shadow-bias={-0.001}/>
    <directionalLight position={[-4,1,-2]} intensity={1.4} color="#e2d7be"/>
    {quality.effects ? <AssetBoundary fallback={studio}><Suspense fallback={studio}><EnvironmentMap/></Suspense></AssetBoundary> : studio}
    <Assembly {...props} quality={quality}/>
    <mesh position={[0,-2.55,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[40,40]}/><meshStandardMaterial color="#0e0f0d" roughness={0.95} metalness={0.1}/></mesh>
    <gridHelper args={[30,30,'#272822','#171914']} position={[0,-2.54,0]}/>
    {quality.effects&&size.width>=900&&<AssetBoundary><Suspense fallback={null}><ForgeEffects/></Suspense></AssetBoundary>}
  </>;
}
export default function ForgeScene({ motion,onReady,onError,onProgress,onSelect,onRecovering }) {
  const [initial] = useState(()=>initialQuality({width:innerWidth,coarse:matchMedia('(pointer: coarse)').matches,saveData:navigator.connection?.saveData,memory:navigator.deviceMemory,cores:navigator.hardwareConcurrency}));
  const [tier,setTier]=useState(initial);
  const [paused,setPaused]=useState(document.hidden);
  const [maximum]=useState(()=>matchMedia('(pointer: coarse)').matches||innerWidth<900?1:2);
  const quality=QUALITY[tier];
  const wakeRef=useRef(null);
  const [contextOptions]=useState(()=>({antialias:initial===2,alpha:true,powerPreference:'high-performance'}));
  const dpr=Math.min(window.devicePixelRatio||1,quality.dpr);
  return <div className="webgl-stage" data-quality={quality.name} role="region" aria-label="The Forge: an interactive mechanical sculpture that transforms as you scroll">
    <Canvas frameloop={paused?'never':'demand'} dpr={dpr} shadows={quality.shadowSize>0} camera={{position:[0,1,8],fov:42,near:0.1,far:150}} gl={contextOptions} resize={{scroll:false,debounce:{scroll:0,resize:80}}} fallback={<span>3D requires a WebGL 2 browser. Portfolio content remains available.</span>} onCreated={({gl})=>gl.setClearColor('#0b0b0c',0)}>
      <QualityController initialTier={initial} maxTier={maximum} onQuality={setTier} onReady={onReady} onRecovering={onRecovering} onError={onError} onPause={setPaused} wakeRef={wakeRef}/>
      <Progress onProgress={onProgress}/>
      <SceneWorld motion={motion} onReady={onReady} onSelect={onSelect} quality={quality} wakeRef={wakeRef}/>
    </Canvas>
  </div>;
}
