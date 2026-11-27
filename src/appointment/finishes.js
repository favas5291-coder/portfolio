// Project finishes in metres so masonry courses stay aligned across wall segments
// and a long wall never stretches a single block or board to its full length.
export function architecturalFinishes(T, m, { onInvalidate, horizonMap }) {
  const loader = new T.TextureLoader();
  const directory = '/appointment/finishes/';
  function finish(file, metres, parameters = {}) {
    const map = loader.load(directory + file + '.webp', () => onInvalidate?.());
    map.colorSpace = T.SRGBColorSpace;
    map.wrapS = map.wrapT = T.RepeatWrapping;
    map.anisotropy = 4;
    m.maps.add(map);
    const mat = m.surface({ roughness: 0.88, map, ...parameters });
    mat.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec2 finishUv;')
        .replace('#include <uv_vertex>', `#include <uv_vertex>
          vec4 finishPoint = vec4(position,1.0);
          vec3 finishNormal = normal;
          #ifdef USE_INSTANCING
            finishPoint = instanceMatrix * finishPoint;
            finishNormal = mat3(instanceMatrix) * finishNormal;
          #endif
          finishPoint = modelMatrix * finishPoint;
          finishNormal = abs(normalize(mat3(modelMatrix) * finishNormal));
          finishUv = finishNormal.y > 0.65 ? finishPoint.xz : (finishNormal.x > finishNormal.z ? finishPoint.zy : finishPoint.xy);
          finishUv /= ${metres.toFixed(3)};
        `);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec2 finishUv;')
        .replace('#include <map_fragment>', '#ifdef USE_MAP\n diffuseColor *= texture2D(map, finishUv);\n #endif');
    };
    mat.customProgramCacheKey = () => 'studio-finish-' + metres;
    return mat;
  }
  const timber = loader.load(directory + 'timber.webp', () => onInvalidate?.());
  timber.colorSpace = T.SRGBColorSpace;
  m.maps.add(timber);
  m.wood = m.surface({map: timber, roughness: 0.65});
  m.walnut = m.surface({map: timber, color: '#bc997b', roughness: 0.58});
  m.laterite = finish('masonry', 2.92, {color:'#efddd0', roughness: 0.94});
  m.plaster = finish('limewash', 2.3);
  m.stone = finish('honed-stone', 2.4, {color:'#f1e8d7', roughness: 0.67});
  m.wet = finish('wet-basalt', 2.1, {color:'#829093', roughness: 0.23, metalness: 0.22});
  m.asphalt = finish('asphalt', 2.4, {roughness: 0.54});
  m.concrete = finish('honed-stone', 2.6, {color:'#e1d8c5', roughness:.92});
  m.reveal = m.surface({color:'#574b3c', roughness:.9});
  m.soil = m.surface({color:'#645039', roughness:1});
  m.orange = m.surface({color:'#dd5d2d', roughness:.54});
  if (horizonMap) m.glass.uniforms.panorama.value = horizonMap;
  else {
    const map = loader.load('/studio/garden-horizon.webp', () => onInvalidate?.());
    map.colorSpace = T.SRGBColorSpace;
    m.maps.add(map);
    m.glass.uniforms.panorama.value = map;
  }
}
