import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

export const characterAsset = Object.freeze({
  status: 'temporary-procedural-rig',
  likeness: 'Reference-inspired prototype, not the final likeness model',
  lipSync: 'Speech activity animation only; a facial blendshape rig is still required for phoneme synchronization',
  joints: ['hips', 'spine', 'neck', 'head', 'shoulders', 'elbows', 'wrists'],
});

const SKIN = '#ad7259';
const SUIT = '#171923';
const HAIR = '#171310';
const noop = () => {};
const approach = (a, b, dt, speed = 7) => THREE.MathUtils.lerp(a, b, 1 - Math.exp(-speed * dt));

function Ellipsoid({ position = [0, 0, 0], scale = [1, 1, 1], color = SKIN, roughness = .68, ...props }) {
  return <mesh position={position} scale={scale} {...props}><sphereGeometry args={[1, 24, 20]}/><meshStandardMaterial color={color} roughness={roughness}/></mesh>;
}
function Stroke({ points, color = HAIR, radius = .012, opacity = 1 }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), [points]);
  return <mesh><tubeGeometry args={[curve, 16, radius, 5, false]}/><meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} roughness={.85}/></mesh>;
}
function TailoredPanel({ points, z, color, ...props }) {
  const shape = useMemo(() => { const result = new THREE.Shape(); points.forEach(([x, y], i) => i ? result.lineTo(x, y) : result.moveTo(x, y)); result.closePath(); return result; }, [points]);
  return <mesh position={[0, 0, z]} {...props}><shapeGeometry args={[shape]}/><meshStandardMaterial color={color} roughness={.88} side={THREE.DoubleSide}/></mesh>;
}
function Pinstripes() {
  return Array.from({ length: 11 }, (_, i) => {
    const x = (i - 5) * .062;
    const points = [0, .12, .35, .58, .76, .86].map(y => {
      const r = y < .12 ? .35 : y < .58 ? .35 + y * .11 : .43 + (y - .58) * .1;
      return [x, y, Math.sqrt(Math.max(.008, r * r - x * x)) * .56 + .008];
    });
    return <Stroke key={i} points={points} color="#63616a" radius={.0022} opacity={.55}/>;
  });
}
function Jacket() {
  const profile = useMemo(() => [[.34, 0], [.36, .1], [.365, .33], [.4, .62], [.47, .85], [.4, .96], [.16, 1.02]].map(([r, y]) => new THREE.Vector2(r, y)), []);
  return <group>
    <mesh scale={[1, 1, .56]}><latheGeometry args={[profile, 40]}/><meshStandardMaterial color={SUIT} roughness={.86}/></mesh>
    <Pinstripes/>
    <TailoredPanel z={.272} color="#ede9df" points={[[-.15, 1], [.15, 1], [.25, .83], [.07, .39], [-.07, .39], [-.25, .83]]}/>
    <TailoredPanel z={.282} color="#0c101a" points={[[-.14, 1], [-.38, .83], [-.25, .56], [-.12, .52], [-.04, .29], [-.11, .7]]}/>
    <TailoredPanel z={.287} color="#272932" points={[[.14, 1], [.38, .83], [.25, .56], [.12, .52], [.04, .29], [.11, .7]]}/>
    <TailoredPanel z={.299} color="#fffaf0" points={[[-.14, 1.035], [-.23, .87], [-.11, .78], [-.025, .98]]}/>
    <TailoredPanel z={.301} color="#f7f2e9" points={[[.14, 1.035], [.23, .87], [.11, .78], [.025, .98]]}/>
    <Stroke points={[[-.02, .38, .285], [-.025, .55, .29], [-.025, .75, .298]]} color="#b8b2a7" radius={.0025}/>
    <Stroke points={[[.16, .64, .274], [.3, .64, .23]]} color="#68646a" radius={.004}/>
    {[[-.12, .15], [.12, .15], [-.12, .3], [.12, .3]].map(([x, y], i) => <Ellipsoid key={i} position={[x, y, .205]} scale={[.018, .018, .009]} color="#090c11" roughness={.35}/>)}
  </group>;
}
function Hand({ pointing = false }) {
  return <group position={[0, -.055, 0]}>
    <Ellipsoid scale={[.07, .104, .039]}/>
    {[0, 1, 2, 3].map(i => <mesh key={i} position={[-.048 + i * .031, -.115 - (i === 1 ? .012 : 0), .002]} rotation={[pointing && i === 1 ? -.18 : .08, 0, 0]}><capsuleGeometry args={[.014, pointing && i === 1 ? .108 : .056 + (i === 1 ? .02 : 0), 5, 8]}/><meshStandardMaterial color={SKIN} roughness={.74}/></mesh>)}
    <Ellipsoid position={[.071, -.015, .009]} scale={[.026, .063, .026]} rotation={[0, 0, -.55]}/>
  </group>;
}
function Arm({ side, shoulderRef, elbowRef, wristRef, pointing }) {
  return <group ref={shoulderRef} position={[side * .43, 1.88, 0]} rotation={[0, 0, side * .1]}>
    <mesh position={[0, -.235, 0]}><capsuleGeometry args={[.118, .31, 8, 16]}/><meshStandardMaterial color={SUIT} roughness={.85}/></mesh>
    {[-.05, .025, .075].map((x, i) => <Stroke key={i} points={[[x, -.075, .105], [x, -.36, .104]]} radius={.002} color="#6c6872" opacity={.5}/>)}
    <group ref={elbowRef} position={[0, -.43, 0]}>
      <mesh position={[0, -.18, 0]}><capsuleGeometry args={[.09, .23, 7, 14]}/><meshStandardMaterial color={SUIT} roughness={.85}/></mesh>
      <mesh position={[0, -.345, 0]}><cylinderGeometry args={[.071, .074, .065, 16]}/><meshStandardMaterial color="#e9e6df" roughness={.8}/></mesh>
      <group ref={wristRef} position={[0, -.4, 0]}><Hand pointing={pointing}/></group>
    </group>
  </group>;
}
function Head({ headRef, mouthRef, eyesRef }) {
  const profile = useMemo(() => [[.035, -.31], [.12, -.29], [.22, -.22], [.274, -.11], [.297, .04], [.291, .2], [.26, .33], [.18, .41], [.015, .44]].map(([r, y]) => new THREE.Vector2(r, y)), []);
  const waves = useMemo(() => Array.from({ length: 22 }, (_, i) => {
    const angle = i * 2.39996;
    const ring = Math.sqrt((i + .7) / 22);
    const x = Math.cos(angle) * .28 * ring;
    const z = Math.sin(angle) * .23 * ring;
    const y = .34 + Math.sqrt(Math.max(0, 1 - ring * ring)) * .11;
    return { position: [x, y, z], rotation: [.1 + z, -.35, -.3], scale: [.11 + .025 * Math.sin(i), .08, .16] };
  }), []);
  return <group ref={headRef} position={[0, 2.41, .015]}>
    <mesh scale={[1, 1, .82]}><latheGeometry args={[profile, 48]}/><meshStandardMaterial color={SKIN} roughness={.69}/></mesh>
    <Ellipsoid position={[-.29, .015, .015]} scale={[.055, .1, .039]}/><Ellipsoid position={[.29, .015, .015]} scale={[.055, .1, .039]}/>
    <Ellipsoid position={[-.304, .017, .041]} scale={[.021, .056, .013]} color="#91593f"/><Ellipsoid position={[.304, .017, .041]} scale={[.021, .056, .013]} color="#91593f"/>
    <Ellipsoid position={[0, -.233, .132]} scale={[.185, .075, .1]} color="#342b27"/>
    <Ellipsoid position={[0, -.178, .215]} scale={[.16, .069, .033]} color="#815541"/>
    <Ellipsoid position={[-.222, -.116, .148]} scale={[.043, .13, .054]} color="#302724" rotation={[0, 0, -.23]}/>
    <Ellipsoid position={[.222, -.116, .148]} scale={[.043, .13, .054]} color="#302724" rotation={[0, 0, .23]}/>
    <group ref={eyesRef} position={[0, .105, 0]}>
      {[-1, 1].map(side => <group key={side} position={[side * .118, 0, .225]} rotation={[0, side * .05, side * -.045]}>
        <Ellipsoid position={[0, -.004, 0]} scale={[.076, .037, .026]} color="#e1d4c3"/>
        <Ellipsoid position={[-side * .008, -.002, .025]} scale={[.025, .027, .008]} color="#443021" roughness={.32}/>
        <Ellipsoid position={[-side * .008, -.002, .031]} scale={[.0125, .016, .004]} color="#100f0c" roughness={.25}/>
        <Ellipsoid position={[-.012, .008, .035]} scale={[.005, .005, .002]} color="#fff8e7" roughness={.2}/>
        <Stroke points={[[-.072, .014, .013], [0, .039, .025], [.072, .012, .013]]} color="#62402e" radius={.007}/>
      </group>)}
    </group>
    {[-1, 1].map(side => <Stroke key={side} points={[[side * .052, .188, .224], [side * .12, .207, .225], [side * .2, .187, .184]]} radius={.017}/>)}
    <Ellipsoid position={[0, .025, .252]} scale={[.038, .1, .04]} color="#b57c62"/>
    <Ellipsoid position={[0, -.04, .291]} scale={[.055, .041, .038]} color="#b37a5e"/>
    {[-1, 1].map(side => <Ellipsoid key={side} position={[side * .044, -.057, .269]} scale={[.026, .018, .021]} color="#986048"/>)}
    <group ref={mouthRef} position={[0, -.151, .25]}>
      <Ellipsoid scale={[.078, .014, .009]} color="#3b2220"/>
      <Ellipsoid position={[0, -.012, -.003]} scale={[.075, .012, .01]} color="#a06352"/>
    </group>
    <Stroke points={[[-.105, -.114, .235], [-.045, -.101, .263], [0, -.112, .269]]} radius={.017}/>
    <Stroke points={[[.105, -.114, .235], [.045, -.101, .263], [0, -.112, .269]]} radius={.017}/>
    <Ellipsoid position={[0, .325, -.05]} scale={[.31, .15, .25]} color={HAIR}/>
    {waves.map((wave, i) => <Ellipsoid key={i} {...wave} color={i % 4 === 0 ? '#292019' : HAIR} roughness={.75}/>)}
    {[-1, 1].map(side => <group key={side}>
      <Ellipsoid position={[side * .265, .22, -.025]} scale={[.065, .18, .16]} color={HAIR} rotation={[0, 0, side * -.1]}/>
      <Ellipsoid position={[side * .25, -.015, -.13]} scale={[.07, .16, .09]} color={HAIR}/>
    </group>)}
  </group>;
}

export function Rig({ action, speaking, reducedMotion, walking = false }) {
  const root = useRef(), spine = useRef(), head = useRef(), mouth = useRef(), eyes = useRef();
  const left = useRef(), leftElbow = useRef(), leftWrist = useRef();
  const right = useRef(), rightElbow = useRef(), rightWrist = useRef();
  const legs = useRef([]);
  const elapsed = useRef(0), actionAge = useRef(0), previousAction = useRef(action);
  useFrame((_, frameDelta) => {
    const dt = Math.min(frameDelta, .045); elapsed.current += dt;
    if (previousAction.current !== action) { previousAction.current = action; actionAge.current = 0; }
    actionAge.current += dt;
    const t = elapsed.current, age = actionAge.current;
    const wave = action === 'wave' || action === 'welcome';
    const isWalking = walking || action === 'walk';
    const stride = isWalking && !reducedMotion ? Math.sin(t * 7.5) * .33 : 0;
    for (let i = 0; i < 2; i++) if (legs.current[i]) legs.current[i].rotation.x = approach(legs.current[i].rotation.x, i === 0 ? stride : -stride, dt, 7);
    const point = action === 'point' || action === 'point-left' || action === 'point-right' || action === 'projects';
    const present = action === 'present' || action === 'services' || action === 'contact' || action === 'invite';
    const gesture = reducedMotion ? .35 : 1;
    const activeWave = wave && age < 3.5;
    root.current.rotation.y = approach(root.current.rotation.y, action === 'turn' ? -.24 : point ? -.13 : -.035, dt, 3);
    spine.current.position.y = 1.02 + (reducedMotion ? 0 : Math.sin(t * 1.7) * .008) + (isWalking && !reducedMotion ? Math.abs(Math.sin(t*7.5))*.017 : 0);
    head.current.rotation.z = Math.sin(t * .65) * (reducedMotion ? .003 : .018);
    head.current.rotation.y = approach(head.current.rotation.y, point ? -.09 : .035 + Math.sin(t * .4) * .025, dt, 3);
    head.current.rotation.x = speaking && !reducedMotion ? Math.sin(t * 4.1) * .018 : -.015;
    const blinkPhase = t % 5.4;
    const blink = blinkPhase > 4.85 && blinkPhase < 5.02 ? Math.max(.08, Math.abs(blinkPhase - 4.935) / .085) : 1;
    eyes.current.scale.y = blink;
    mouth.current.scale.y = speaking ? 1.15 + Math.abs(Math.sin(t * 11) * Math.sin(t * 6.3)) * 2.5 : 1;
    const waveOffset = activeWave ? Math.sin(age * 9) * .16 * gesture : 0;
    right.current.rotation.z = approach(right.current.rotation.z, activeWave ? .65 * gesture : point ? .6 * gesture : present ? .3 * gesture : -.12, dt);
    right.current.rotation.x = approach(right.current.rotation.x, activeWave ? -.25 : point ? -.22 : present ? -.3 : .03, dt);
    rightElbow.current.rotation.z = approach(rightElbow.current.rotation.z, activeWave ? 1.85 * gesture : point ? 1.85 * gesture : present ? .9 * gesture : -.07, dt);
    rightWrist.current.rotation.z = activeWave ? waveOffset : 0;
    left.current.rotation.z = approach(left.current.rotation.z, present ? -.22 * gesture : .12, dt);
    left.current.rotation.x = approach(left.current.rotation.x, -.04, dt);
    leftElbow.current.rotation.z = approach(leftElbow.current.rotation.z, present ? -.8 * gesture : .1, dt);
    leftWrist.current.rotation.x = 0;
  });
  return <group ref={root} position={[0, -1.38, 0]}>
    <group position={[0, .52, 0]}>
      {[-1, 1].map((side,index) => <group key={side} ref={node => { legs.current[index] = node; }} position={[side * .18, 0, 0]}>
        <mesh position={[0, 0, 0]}><capsuleGeometry args={[.145, .72, 8, 20]}/><meshStandardMaterial color="#191a23" roughness={.89}/></mesh>
        <Stroke points={[[.01, .34, .147], [.01, -.36, .147]]} color="#555360" radius={.002}/>
        <Ellipsoid position={[0, -.43, .075]} scale={[.149, .09, .27]} color="#171716" roughness={.34}/>
      </group>)}
    </group>
    <group ref={spine} position={[0, 1.02, 0]}><Jacket/></group>
    <mesh position={[0, 2.085, .015]}><cylinderGeometry args={[.113, .13, .32, 24]}/><meshStandardMaterial color={SKIN} roughness={.7}/></mesh>
    <Head headRef={head} mouthRef={mouth} eyesRef={eyes}/>
    <Arm side={-1} shoulderRef={left} elbowRef={leftElbow} wristRef={leftWrist}/>
    <Arm side={1} shoulderRef={right} elbowRef={rightElbow} wristRef={rightWrist} pointing={action.startsWith('point') || action === 'projects'}/>
  </group>;
}

const normalizeName = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const canonicalAction = action => /point|project/.test(action) ? 'point' : /present|service|contact|invite/.test(action) ? 'present' : /welcome/.test(action) ? 'welcome' : /wave/.test(action) ? 'wave' : /turn/.test(action) ? 'turn' : 'idle';

function ModelRig({ modelUrl, clipNames, action, speaking, paused, reducedMotion }) {
  // GLTFLoader supports self-contained, uncompressed GLB assets without an
  // external decoder service. Loader-cached source geometry is never disposed.
  const gltf = useLoader(GLTFLoader, modelUrl);
  const model = useMemo(() => {
    if (!gltf.scene) throw new Error('The character file does not contain a scene.');
    const scene = cloneSkeleton(gltf.scene);
    scene.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(scene);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if (!Number.isFinite(size.y) || size.y < .001) throw new Error('The character has invalid dimensions.');
    const scale = 2.88 / size.y;
    const morphs = [];
    scene.traverse(node => {
      if (!node.isMesh || !node.morphTargetDictionary || !node.morphTargetInfluences) return;
      for (const [name, index] of Object.entries(node.morphTargetDictionary)) {
        const key = normalizeName(name);
        if (/^(eyeblinkleft|eyeblinkright|blinkleft|blinkright|blinkl|blinkr|blink|eyesclosed)$/.test(key)) morphs.push({ mesh: node, index, kind: 'blink' });
        if (/^(jawopen|mouthopen)$/.test(key)) morphs.push({ mesh: node, index, kind: 'jaw' });
      }
    });
    return { scene, scale, position: [-center.x * scale, -bounds.min.y * scale - 1.38, -center.z * scale], morphs };
  }, [gltf]);
  const mixer = useMemo(() => new THREE.AnimationMixer(model.scene), [model.scene]);
  const current = useRef(null), elapsed = useRef(0);
  useEffect(() => {
    const requested = canonicalAction(action);
    const desired = reducedMotion ? 'idle' : requested;
    const configured = clipNames[desired] || clipNames[desired[0].toUpperCase() + desired.slice(1)] || desired;
    const clips = gltf.animations || [];
    const clip = clips.find(item => normalizeName(item.name) === normalizeName(configured))
      || clips.find(item => normalizeName(item.name).includes(desired))
      || (desired === 'welcome' && clips.find(item => normalizeName(item.name).includes('wave')))
      || clips.find(item => normalizeName(item.name).includes('idle'));
    if (!clip) { current.current?.fadeOut(.24); return; }
    const next = mixer.clipAction(clip);
    if (current.current === next) return;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1);
    const oneShot = desired === 'wave' || desired === 'welcome' || desired === 'turn';
    next.setLoop(oneShot ? THREE.LoopOnce : THREE.LoopRepeat, oneShot ? 1 : Infinity);
    next.clampWhenFinished = oneShot;
    next.play();
    if (current.current) next.crossFadeFrom(current.current, .28, false);
    else next.fadeIn(.28);
    current.current = next;
  }, [action, clipNames, gltf.animations, mixer, reducedMotion]);
  useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(model.scene); }, [mixer, model.scene]);
  useFrame((_, frameDelta) => {
    if (paused || document.hidden) return;
    const dt = Math.min(frameDelta, .045); elapsed.current += dt;
    mixer.update(dt);
    const t = elapsed.current, phase = t % 5.4;
    const blink = phase > 4.85 && phase < 5.02 ? 1 - Math.min(1, Math.abs(phase - 4.935) / .085) : 0;
    // These channels indicate speech activity, not phoneme/viseme lip sync.
    for (const morph of model.morphs) morph.mesh.morphTargetInfluences[morph.index] = morph.kind === 'blink' ? blink : speaking ? .08 + Math.abs(Math.sin(t * 11) * Math.sin(t * 6.3)) * .3 : 0;
  });
  return <group position={model.position} scale={model.scale} dispose={null}><primitive object={model.scene} dispose={null}/></group>;
}

class ModelBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { this.props.onWarning?.(error?.message || 'The final model could not load; using the temporary character.'); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function SceneLifecycle({ paused, onReady, onError }) {
  const { gl, camera, size, setFrameloop, invalidate } = useThree();
  const callbacks = useRef({ onReady, onError }); callbacks.current = { onReady, onError };
  useEffect(() => {
    camera.zoom = Math.min(size.width / 2.65, size.height / 3.32);
    camera.lookAt(0, .1, 0); camera.updateProjectionMatrix(); invalidate();
  }, [camera, size.width, size.height, invalidate]);
  useEffect(() => {
    const update = () => { setFrameloop(paused || document.hidden ? 'never' : 'always'); if (!paused && !document.hidden) invalidate(); };
    const lost = event => { event.preventDefault(); callbacks.current.onError('The character renderer lost its graphics context.'); };
    update(); document.addEventListener('visibilitychange', update); gl.domElement.addEventListener('webglcontextlost', lost);
    callbacks.current.onReady();
    return () => { document.removeEventListener('visibilitychange', update); gl.domElement.removeEventListener('webglcontextlost', lost); };
  }, [gl, paused, setFrameloop, invalidate]);
  return null;
}
class CharacterBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { this.props.onError(error?.message || 'The character renderer could not start.'); }
  render() { return this.state.failed ? null : this.props.children; }
}
export default function GuideCharacter({ action = 'idle', speaking = false, paused = false, reducedMotion = false, modelUrl = null, clipNames = {}, onReady = noop, onError = noop, onAssetWarning = noop }) {
  const [failed, setFailed] = useState(false);
  const handleError = message => { setFailed(true); onError(message); };
  if (failed) return null;
  return <CharacterBoundary onError={handleError}>
    <Canvas orthographic camera={{ position: [0, .1, 8], zoom: 120, near: .1, far: 30 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} style={{ width: '100%', height: '100%', background: 'transparent' }} fallback={null} onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; }}>
      <SceneLifecycle paused={paused} onReady={onReady} onError={handleError}/>
      <ambientLight intensity={1.05} color="#f7eadd"/>
      <hemisphereLight args={['#d9e8f6', '#3d3025', 1.3]}/>
      <directionalLight position={[-3, 4, 5]} intensity={3.1} color="#fff1df"/>
      <directionalLight position={[3, 2, 2]} intensity={1.4} color="#d5e4fc"/>
      <directionalLight position={[1, 3, -3]} intensity={2.2} color="#f2c995"/>
      {modelUrl ? <ModelBoundary key={modelUrl} onWarning={onAssetWarning} fallback={<Rig action={action} speaking={speaking && !paused} reducedMotion={reducedMotion}/>}><Suspense fallback={<Rig action={action} speaking={speaking && !paused} reducedMotion={reducedMotion}/>}><ModelRig modelUrl={modelUrl} clipNames={clipNames} action={action} speaking={speaking && !paused} paused={paused} reducedMotion={reducedMotion}/></Suspense></ModelBoundary> : <Rig action={action} speaking={speaking && !paused} reducedMotion={reducedMotion}/>}
    </Canvas>
  </CharacterBoundary>;
}
