import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Rig } from '../guide/GuideCharacter.jsx';

/*
 * A single continuous WebGL studio. Chapters are camera locations along one
 * physical room, rather than five disconnected canvases or CSS backdrops.
 * The rig here is the existing TEMPORARY procedural likeness.
 */
export const CHAPTERS = ['home', 'services', 'projects', 'process', 'contact'];
const STOPS = [0, 8.5, 17, 25.5, 34];
const CREAM = '#e7ddc9';
const ORANGE = '#d98755';
const INK = '#252b28';
const SAGE = '#7e9786';
const clamp = THREE.MathUtils.clamp;
const damp = (a, b, delta, k=2.5) => THREE.MathUtils.damp(a, b, k, delta);

function Box({ position, scale, color, metalness=0, roughness=.75, ...rest }) {
  return <mesh position={position} scale={scale} castShadow receiveShadow {...rest}>
    <boxGeometry args={[1,1,1]}/>
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness}/>
  </mesh>;
}
function Ball({position,scale,color,emissive,emissiveIntensity=0,...rest}) {
  return <mesh position={position} scale={scale} castShadow {...rest}>
    <sphereGeometry args={[1,24,16]}/>
    <meshStandardMaterial color={color} emissive={emissive || '#000000'} emissiveIntensity={emissiveIntensity} roughness={.6}/>
  </mesh>;
}
function Tube({position,rotation=[0,0,0],args=[.1,.1,1,16],color=INK,...rest}) {
  return <mesh position={position} rotation={rotation} castShadow {...rest}><cylinderGeometry args={args}/><meshStandardMaterial color={color} metalness={.2} roughness={.55}/></mesh>;
}
function RoundedFrame({x=0,y=1.2,z=0,w=1.2,h=1.3,color=INK}) {
  return <group position={[x,y,z]}>
    <Box position={[0,h/2,0]} scale={[w,.09,.12]} color={color}/>
    <Box position={[0,-h/2,0]} scale={[w,.09,.12]} color={color}/>
    <Box position={[-w/2,0,0]} scale={[.09,h,.12]} color={color}/>
    <Box position={[w/2,0,0]} scale={[.09,h,.12]} color={color}/>
  </group>;
}
function StudioArchitecture() {
  return <group>
    <Box position={[17,-.22,-.5]} scale={[48,.45,18]} color="#716e61" roughness={.92}/>
    <Box position={[17,5.4,-4.8]} scale={[48,11,.24]} color="#3e4a45"/>
    <Box position={[17,7.1,0]} scale={[48,.28,11]} color="#303936"/>
    {Array.from({length:12},(_,i)=><group key={i} position={[-5+i*4.1,0,0]}>
      <Box position={[0,3.2,-4.55]} scale={[.38,6.2,.32]} color="#515d54"/>
      <Box position={[0,5.7,-4.15]} scale={[.65,.2,1.2]} color="#c6b193" metalness={.2}/>
      <mesh position={[0,3.3,-4.36]}>
        <boxGeometry args={[2.8,3.8,.03]}/>
        <meshStandardMaterial color="#739188" emissive="#91a898" emissiveIntensity={.08} roughness={.22}/>
      </mesh>
      <Box position={[0,3.3,-4.22]} scale={[.045,3.8,.09]} color="#bdbea9"/>
      <Box position={[0,3.25,-4.2]} scale={[2.85,.045,.09]} color="#bdbea9"/>
      <mesh position={[0,.017,-1.6]} rotation={[-Math.PI/2,0,0]}>
        <circleGeometry args={[1.1,32]}/>
        <meshStandardMaterial color="#2f3935" roughness={1}/>
      </mesh>
    </group>)}
    {Array.from({length:14},(_,i)=><Box key={'floor'+i} position={[-9+i*3.5,.012,0]} scale={[.018,.01,12]} color="#9c9080"/>)}
    {Array.from({length:10},(_,i)=><Box key={'beam'+i} position={[-4+i*4.1,6.9,-1]} scale={[.18,.15,10]} color="#b3a48b"/>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[17,.014,0]} receiveShadow>
      <planeGeometry args={[48,15]}/>
      <shadowMaterial opacity={.26}/>
    </mesh>
  </group>;
}
function LightFixture({x,z}) {
  return <group position={[x,5,z]}>
    <Tube position={[0,.6,0]} args={[.035,.035,1.2,10]} color="#9a9a86"/>
    <mesh position={[0,-.09,0]}><coneGeometry args={[.6,.45,24,1,true]}/><meshStandardMaterial color="#e8c2a1" metalness={.35} side={THREE.DoubleSide}/></mesh>
    <pointLight position={[0,-.5,0]} intensity={9} distance={5.8} decay={2} color="#ffc898"/>
  </group>;
}
function Monitor({position=[0,1,0],size=[2.2,1.25],rotation=[0,0,0],children,accent=ORANGE}) {
  const [w,h]=size;
  return <group position={position} rotation={rotation}>
    <Box position={[0,0,-.12]} scale={[w+.18,h+.18,.2]} color="#171f1d" metalness={.3}/>
    <Box position={[0,0,.008]} scale={[w,h,.02]} color="#d7dacb" roughness={.45}/>
    <Box position={[0,h*.36,.03]} scale={[w*.88,.05,.025]} color={accent}/>
    <Box position={[-w*.22,h*.12,.04]} scale={[w*.4,.1,.025]} color="#779486"/>
    <Box position={[-w*.22,-h*.06,.04]} scale={[w*.4,.06,.025]} color="#aab2a4"/>
    <Box position={[-w*.22,-h*.18,.04]} scale={[w*.36,.06,.025]} color="#aab2a4"/>
    <Box position={[w*.28,-h*.06,.04]} scale={[w*.27,h*.4,.03]} color="#c58a60"/>
    {children}
  </group>;
}
function WelcomeStation({active,reduce}) {
  const group=useRef();
  useFrame(({clock},dt)=>{if(!group.current)return;group.current.rotation.y=damp(group.current.rotation.y, active?-.05:.18,dt,2)});
  return <group position={[0,0,-.3]}>
    <Box position={[-1.7,.82,-.7]} scale={[2.8,.16,1.25]} color="#b17c59"/>
    <Box position={[-2.75,.38,-.7]} scale={[.16,.75,1.15]} color="#4e5147"/>
    <Box position={[-.7,.38,-.7]} scale={[.16,.75,1.15]} color="#4e5147"/>
    <group ref={group}><Monitor position={[-1.7,2.05,-.8]} size={[2.2,1.25]} rotation={[0,.16,0]}/></group>
    <Box position={[-2.2,1.02,.08]} scale={[.75,.06,.45]} color="#3d4843"/>
    <Ball position={[-2.85,1.03,-.6]} scale={[.21,.21,.21]} color="#dfb783"/>
    <Tube position={[-2.85,1.4,-.6]} args={[.025,.025,.67,8]} color="#e1b587"/>
    <Ball position={[2.75,2.5,-2.8]} scale={[.95,.95,.2]} color="#e1b27a" emissive="#d59b62" emissiveIntensity={.1}/>
    <RoundedFrame x={2.75} y={2.5} z={-2.48} w={2.5} h={3.3} color="#918e79"/>
    <LightFixture x={-1.8} z={-.35}/>
    <group position={[3,0,-.7]}>
      <Tube position={[0,.5,0]} args={[.27,.39,1.05,12]} color="#bb9e7c"/>
      <Ball position={[0,1.2,0]} scale={[.55,.35,.55]} color="#66826d"/>
      <Ball position={[-.35,1.05,.13]} scale={[.34,.23,.31]} color="#7b967d"/>
      <Ball position={[.31,1.13,-.11]} scale={[.31,.3,.31]} color="#627c65"/>
    </group>
  </group>;
}
function Store({position,selected,onClick}) {
  return <group position={position} onClick={onClick}>
    <Box position={[0,.7,0]} scale={[1.95,1.4,1.05]} color={selected?'#e5c19b':'#c3b5a3'}/>
    <Box position={[0,1.48,.02]} scale={[2.25,.18,1.3]} color="#474d42"/>
    <Box position={[0,1.1,.55]} scale={[2.12,.22,.08]} color="#e7a478"/>
    {[-.75,-.25,.25,.75].map((x,i)=><Box key={i} position={[x,1,.6]} scale={[.43,.37,.1]} color={i%2?'#ede3c9':'#cc925d'}/>)}
    <Box position={[.56,.45,.59]} scale={[.53,.75,.04]} color="#719488"/>
    <Box position={[-.35,.35,.59]} scale={[.9,.5,.04]} color="#334f44"/>
  </group>;
}
function Shopping({position,selected,onClick}) {
  return <group position={position} onClick={onClick}>
    <Box position={[0,.55,0]} scale={[1.32,1,.75]} color={selected?'#d99760':'#bb805e'}/>
    <Tube position={[0,1.18,0]} args={[.48,.48,.11,18]} rotation={[Math.PI/2,0,0]} color="#a9a591"/>
    <Box position={[0,1.23,0]} scale={[.64,.07,.78]} color="#718b78"/>
    <Box position={[-.32,.55,.385]} scale={[.13,.4,.025]} color="#f0e6d2"/>
    <Box position={[.1,.55,.385]} scale={[.56,.12,.025]} color="#f0e6d2"/>
    <Ball position={[.7,.22,.3]} scale={[.2,.2,.2]} color="#9bb39d"/>
  </group>;
}
function Landing({position,selected,onClick}) {
  return <group position={position} onClick={onClick}>
    <Monitor position={[0,.86,0]} size={[1.9,1.36]} rotation={[0,-.12,0]} accent={selected?'#ffb781':'#cb946d'}/>
    <Box position={[0,.11,-.15]} scale={[.13,.4,.17]} color="#6c766c"/>
    <Box position={[0,-.1,-.15]} scale={[.9,.06,.48]} color="#8c8878"/>
  </group>;
}
function Refresh({position,selected,onClick}) {
  return <group position={position} onClick={onClick}>
    <Box position={[-.24,.83,-.08]} scale={[1.03,1.38,.09]} color="#7b796c" rotation={[0,0,-.07]}/>
    <Box position={[.22,.83,.09]} scale={[1.03,1.38,.09]} color={selected?'#d5dfc7':'#b0bfb3'} rotation={[0,0,.06]}/>
    <Box position={[.23,1.18,.15]} scale={[.78,.13,.04]} color="#d58a59"/>
    <Box position={[.23,.82,.15]} scale={[.74,.35,.04]} color="#849e8f"/>
    <Box position={[.23,.55,.15]} scale={[.74,.08,.04]} color="#4f6960"/>
  </group>;
}
function ServiceStation({selected,onSelect}) {
  const pedestal=useRef();
  useFrame(({clock},dt)=>{
    if(pedestal.current)pedestal.current.rotation.y=damp(pedestal.current.rotation.y,selected*.09,dt,2);
  });
  const objects=[Store,Shopping,Landing,Refresh];
  return <group position={[8.5,0,0]}>
    <LightFixture x={0} z={-.1}/>
    <Box position={[0,.27,-.85]} scale={[6.4,.54,3.2]} color="#656e60" roughness={.65}/>
    <Box position={[0,.55,-.85]} scale={[5.95,.07,2.85]} color="#c5b69a"/>
    {objects.map((Comp,i)=><group key={i} position={[-2.12+i*1.43,.5,-.85]}>
      <Box position={[0,.09,0]} scale={[1.28,.18,1.25]} color={selected===i?'#e9ad78':'#9a9c89'}/>
      <Comp position={[0,.22,0]} selected={selected===i} onClick={(event)=>{event.stopPropagation();onSelect?.(i)}}/>
      {selected===i&&<pointLight position={[0,1.7,.4]} intensity={12} distance={3} color="#ffc996"/>}
    </group>)}
    <group ref={pedestal}>
      <Tube position={[0,3.5,-2.8]} args={[1.3,1.3,.09,32]} color="#cfbba2" rotation={[Math.PI/2,0,0]}/>
      <Ball position={[0,3.5,-2.76]} scale={[.98,.98,.045]} color="#45574e"/>
    </group>
  </group>;
}
function ProjectStation() {
  return <group position={[17,0,-.55]}>
    <LightFixture x={.8} z={-.2}/>
    <Box position={[0,1.6,-2.15]} scale={[5.9,3.3,.28]} color="#212b28" metalness={.35}/>
    <Box position={[0,1.6,-1.94]} scale={[5.5,2.93,.09]} color="#dce3d3"/>
    <Box position={[0,2.86,-1.88]} scale={[5.24,.16,.025]} color="#d88a54"/>
    <Box position={[-1.35,1.58,-1.83]} scale={[2.14,1.78,.03]} color="#a2baa7"/>
    <Box position={[-1.35,.9,-1.78]} scale={[1.6,.19,.02]} color="#d6935d"/>
    <Box position={[1.35,2.3,-1.82]} scale={[1.85,.32,.03]} color="#384e43"/>
    {[0,1,2].map(i=><Box key={i} position={[1.35,1.83-i*.3,-1.82]} scale={[1.78,.12,.025]} color={i===2?'#dca577':'#b2c0b0'}/>)}
    <Box position={[0,.63,-1.4]} scale={[5,.16,.8]} color="#9b7d64"/>
    <Box position={[0,.22,-1.42]} scale={[.18,.75,.4]} color="#5d665e"/>
    <Ball position={[2.7,.9,-.9]} scale={[.25,.25,.25]} color="#dfae75" emissive="#d88f52" emissiveIntensity={.3}/>
  </group>;
}
function WorkflowStation({phase}) {
  const arm=useRef(), paper=useRef(), stamp=useRef();
  useFrame(({clock},dt)=>{
    const t=clock.getElapsedTime();
    if(arm.current)arm.current.rotation.z=damp(arm.current.rotation.z,(phase-2)*.19+Math.sin(t*1.6)*.08,dt,2.6);
    if(paper.current)paper.current.rotation.y=damp(paper.current.rotation.y,(phase*.1)-.15,dt,3.8);
    if(stamp.current)stamp.current.position.y=damp(stamp.current.position.y,1.9+((phase===4)?-.6:0),dt,2.8);
  });
  return <group position={[25.5,0,-.6]}>
    <LightFixture x={0} z={-.1}/>
    <Box position={[0,.82,-1]} scale={[5.5,.15,2.15]} color="#b58b68"/>
    <Box position={[-2,.36,-1]} scale={[.22,.74,1.9]} color="#576359"/>
    <Box position={[2,.36,-1]} scale={[.22,.74,1.9]} color="#576359"/>
    <group ref={paper} position={[-.8,1.1,-.6]}>
      <Box position={[0,0,0]} scale={[1.85,.035,1.25]} color="#f0ecdc"/>
      {[-.3,0,.3].map((x,i)=><Box key={i} position={[x,.04,.1]} scale={[.08,.025,.82]} color={i===phase%3?'#d88755':'#b7c2af'}/>)}
    </group>
    <group ref={arm} position={[1.2,2.9,-1]}>
      <Tube position={[0,-.55,0]} args={[.13,.13,1.2,12]} color="#d1bd9d" rotation={[0,0,.27]}/>
      <Tube position={[.3,-1.2,0]} args={[.085,.085,.73,12]} color="#e1a16d" rotation={[0,0,-.45]}/>
      <Ball position={[.44,-1.53,.04]} scale={[.25,.25,.25]} color="#404f43"/>
    </group>
    <group ref={stamp} position={[1.2,1.9,.2]}>
      <Tube position={[0,0,0]} args={[.39,.39,.13,24]} color={phase===4?'#d5af66':'#d88956'}/>
      <Ball position={[0,.13,0]} scale={[.33,.16,.33]} color="#f0d7a7"/>
    </group>
    {[0,1,2,3,4].map(i=><Ball key={i} position={[-2+i*.64,.93,1.65]} scale={[.09,.09,.09]} color={i===phase?'#ffa865':'#819588'} emissive={i===phase?'#db8953':'#1b2320'} emissiveIntensity={i===phase?1.5:0}/>)}
  </group>;
}
function ContactStation({active}) {
  const door=useRef();
  useFrame(({clock},dt)=>{if(door.current)door.current.rotation.y=damp(door.current.rotation.y,active?-.32:.03,dt,1.35)});
  return <group position={[34,0,-1]}>
    <LightFixture x={-1.8} z={0}/>
    <RoundedFrame x={1.4} y={2.1} z={-2} w={3} h={4.2} color="#dab38e"/>
    <mesh position={[1.4,2.1,-2.14]}><planeGeometry args={[2.77,4]}/><meshStandardMaterial color="#edb57f" emissive="#d89863" emissiveIntensity={.7}/></mesh>
    <group ref={door} position={[-.05,0,-1.99]}>
      <Box position={[1.28,2.13,0]} scale={[2.65,4.14,.11]} color="#4e6054" metalness={.18}/>
      <Box position={[.49,2.13,.09]} scale={[.07,3.7,.07]} color="#d3ab85"/>
      <Box position={[1.2,2.13,.09]} scale={[.07,3.7,.07]} color="#d3ab85"/>
      <Ball position={[2.33,2.1,.2]} scale={[.09,.09,.09]} color="#f0bf81" emissive="#e8a26c" emissiveIntensity={.3}/>
    </group>
    <Box position={[-2.3,.78,-1.6]} scale={[2,.12,.7]} color="#b58c6e"/>
    <Box position={[-2.3,.39,-1.6]} scale={[.15,.79,.7]} color="#546255"/>
    <Ball position={[-2.3,1.15,-1.6]} scale={[.65,.21,.35]} color="#dfae7f"/>
  </group>;
}
function Actor({chapter,action,speaking,reducedMotion}) {
  const wrapper=useRef();
  const [walking,setWalking]=useState(false);
  const [arrivalBeat,setArrivalBeat]=useState('idle');
  useEffect(()=>{
    if(chapter!=='home'||reducedMotion){setArrivalBeat('idle');return;}
    setArrivalBeat('idle');
    const turn=setTimeout(()=>setArrivalBeat('turn'),900);
    const wave=setTimeout(()=>setArrivalBeat('wave'),1700);
    const settle=setTimeout(()=>setArrivalBeat('idle'),4900);
    return ()=>{clearTimeout(turn);clearTimeout(wave);clearTimeout(settle);};
  },[chapter,reducedMotion]);
  useEffect(()=>{
    if(reducedMotion){setWalking(false);return;}
    // The arrival has its own look / turn / wave choreography.
    if(chapter==='home'){setWalking(false);return;}
    setWalking(true);
    const id=setTimeout(()=>setWalking(false),2200);
    return ()=>clearTimeout(id);
  },[chapter,reducedMotion]);
  useFrame((_,delta)=>{
    if(!wrapper.current)return;
    const desired=(STOPS[clamp(CHAPTERS.indexOf(chapter),0,4)]||0)+1.45;
    wrapper.current.position.x=damp(wrapper.current.position.x,desired,delta,1.3);
    wrapper.current.rotation.y=damp(wrapper.current.rotation.y,walking?-.25:(chapter==='projects'?-.3:0),delta,2.4);
  });
  return <group ref={wrapper} position={[1.45,1.17,1.7]} scale={.85}>
    <Rig action={walking?'walk':(chapter==='home'&&!speaking?arrivalBeat:action)} speaking={speaking} walking={walking} reducedMotion={reducedMotion}/>
  </group>;
}
function Director({chapter,serviceIndex,processIndex,action,speaking,reducedMotion,hidden,onSelectService}) {
  const {camera,size,gl,setFrameloop,invalidate}=useThree();
  const current=useRef(0), ready=useRef(false);
  const active=clamp(CHAPTERS.indexOf(chapter),0,4);
  useEffect(()=>{
    const change=()=>{const stop=hidden||document.hidden;setFrameloop(stop?'never':'always');if(!stop)invalidate();};
    change();document.addEventListener('visibilitychange',change);
    return ()=>document.removeEventListener('visibilitychange',change);
  },[hidden,setFrameloop,invalidate]);
  useFrame(({clock},dt)=>{
    const idx=active;
    current.current=damp(current.current,idx,dt,reducedMotion?14:1.55);
    const x=THREE.MathUtils.lerp(STOPS[Math.floor(current.current)]||0,STOPS[Math.min(4,Math.floor(current.current)+1)]||34,current.current-Math.floor(current.current));
    const mobile=size.width<720;
    camera.position.x=damp(camera.position.x,x+(mobile?3.6:4.3),dt,reducedMotion?14:1.7);
    camera.position.y=damp(camera.position.y,mobile?3.1:3.0,dt,2);
    camera.position.z=damp(camera.position.z,mobile?11:9.7,dt,2);
    const aim=new THREE.Vector3(x+(mobile?.2:-.5),mobile?1.7:1.65,-.5);
    const look=camera.userData.look || new THREE.Vector3();
    look.lerp(aim,1-Math.exp(-2*dt));camera.userData.look=look;camera.lookAt(look);
    camera.fov=damp(camera.fov,mobile?50:44,dt,2);camera.updateProjectionMatrix();
  });
  return <>
    <color attach="background" args={["#242e2c"]}/>
    <fog attach="fog" args={["#283331",10,35]}/>
    <StudioArchitecture/>
    <ambientLight intensity={.66} color="#e1e6d8"/>
    <hemisphereLight intensity={1.2} args={['#bfd0c4','#49392e',1]}/>
    <directionalLight position={[5,10,6]} intensity={3.5} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={15} shadow-camera-bottom={-15} color="#ffdfb4"/>
    <directionalLight position={[-4,6,-7]} intensity={1.8} color="#a1c7ba"/>
    <WelcomeStation active={active===0} reduce={reducedMotion}/>
    <ServiceStation selected={serviceIndex} onSelect={onSelectService}/>
    <ProjectStation/>
    <WorkflowStation phase={processIndex}/>
    <ContactStation active={active===4}/>
    <Actor chapter={chapter} action={action} speaking={speaking} reducedMotion={reducedMotion}/>
  </>;
}
export default function StudioWorld({chapter='home',serviceIndex=0,processIndex=0,action='idle',speaking=false,reducedMotion=false,hidden=false,onSelectService}) {
  const [lost,setLost]=useState(false);
  if(lost) return <div className="cinema-world cinema-world-fallback" aria-hidden="true"/>;
  return <div className="cinema-world" aria-hidden="true">
    <Suspense fallback={<div className="cinema-world-fallback"/>}>
      <Canvas camera={{position:[6.3,4.1,12],fov:44,near:.1,far:65}} dpr={[1,1.65]} shadows gl={{alpha:true,antialias:true,powerPreference:'high-performance'}} fallback={<div className="cinema-world-fallback"/>} onCreated={({gl})=>{
        gl.outputColorSpace=THREE.SRGBColorSpace;
        gl.toneMapping=THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure=1.12;
        // A lost GPU context must not leave a dark, unusable overlay.
        // The real content and contact destinations are ordinary HTML.
        gl.domElement.addEventListener('webglcontextlost',event=>{
          event.preventDefault();
          setLost(true);
        },{once:true});
      }}>
        <Director chapter={chapter} serviceIndex={serviceIndex} processIndex={processIndex} action={action} speaking={speaking} reducedMotion={reducedMotion} hidden={hidden} onSelectService={onSelectService}/>
      </Canvas>
    </Suspense>
  </div>;
}
