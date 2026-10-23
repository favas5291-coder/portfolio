import { Bloom, EffectComposer } from '@react-three/postprocessing';
export default function ForgeEffects() { return <EffectComposer multisampling={0}><Bloom luminanceThreshold={1.15} luminanceSmoothing={0.2} intensity={0.18} mipmapBlur/></EffectComposer>; }
