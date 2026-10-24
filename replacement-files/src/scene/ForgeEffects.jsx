import { Bloom, EffectComposer, FXAA } from '@react-three/postprocessing';
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

export default function ForgeEffects({ quality }) {
  const gl = useThree(state => state.gl);
  const samples = useMemo(() => {
    const context = gl.getContext();
    const supported = context.getInternalformatParameter(context.RENDERBUFFER, context.RGBA16F, context.SAMPLES);
    return Array.from(supported || []).filter(value => value > 0 && value <= 4).sort((a, b) => a - b)[0] || 0;
  }, [gl]);
  return <EffectComposer multisampling={samples}>
    <Bloom luminanceThreshold={1.15} luminanceSmoothing={0.2} intensity={0.18} mipmapBlur resolutionScale={quality.bloomScale}/>
    {samples===0&&<FXAA/>}
  </EffectComposer>;
}
