// Small, seeded finish maps keep the entire building self-contained. All colours
// are authored in sRGB; the renderer handles lighting in linear space.
export function officeMaterials(T, loadingManager) {
  let seed = 17553;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const maps = new Set(),
    materials = new Set();
  function surface(parameters) {
    const material = new T.MeshStandardMaterial(parameters);
    // A room-wide skylight approximation supplements the direct solar shadow.
    // Near each window the hemisphere is visible; the deep canopy and gallery
    // receive less indirect light. This only attenuates diffuse bounce, leaving
    // the directional sunlight, screen images and glass reflections independent.
    material.onBeforeCompile = shader => {
      shader.vertexShader = 'varying vec3 studioPosition;\n' + shader.vertexShader.replace(
        '#include <project_vertex>', `#include <project_vertex>
          vec4 studioLocal = vec4(transformed, 1.0);
          #ifdef USE_INSTANCING
            studioLocal = instanceMatrix * studioLocal;
          #endif
          studioPosition = (modelMatrix * studioLocal).xyz;`);
      shader.fragmentShader = 'varying vec3 studioPosition;\n' + shader.fragmentShader.replace(
        '#include <lights_fragment_end>', `#include <lights_fragment_end>
          vec3 pRoom = studioPosition;
          float underRoof = (1.0-smoothstep(0.1, 1.8, pRoom.z)) *
            (1.0-smoothstep(6.9, 7.2, abs(pRoom.x)));
          float daylight = smoothstep(1.1, 6.9, abs(pRoom.x));
          float floorJoint = (1.0-smoothstep(0.0, 0.32, pRoom.y)) *
            smoothstep(6.4, 7.05, abs(pRoom.x));
          float ceilingJoint = smoothstep(3.10, 3.55, pRoom.y) *
            smoothstep(5.95, 7.05, abs(pRoom.x));
          float skyAccess = mix(0.74, 1.08, daylight) - 0.18*(floorJoint+ceilingJoint);
          reflectedLight.indirectDiffuse *= mix(1.0, skyAccess, underRoof);`);
    };
    materials.add(material);
    return material;
  }
  function ink(parameters) {
    const material = new T.MeshBasicMaterial(parameters);
    materials.add(material);
    return material;
  }
  function canvasMap(width, height, paint) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    paint(canvas.getContext('2d'), width, height);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 2;
    maps.add(map);
    return map;
  }
  const loader = new T.TextureLoader(loadingManager);
  function imageMap(url) {
    const map = loader.load(url);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    maps.add(map);
    return map;
  }
  const woodMap = imageMap('/studio/finishes/timber.webp');
  const stoneMap = imageMap('/studio/finishes/honed-stone.webp');
  const wood = surface({ map: woodMap, roughness: 0.61 });
  const walnut = surface({ color: '#ac8d70', map: woodMap, roughness: 0.52 });
  const stone = surface({ map: stoneMap, roughness: 0.66 });
  const plaster = surface({ color: '#eee7d9', roughness: 0.91 });
  const laterite = surface({ map: imageMap('/studio/finishes/masonry.webp'), roughness: 0.93 });
  const bronze = surface({ color: '#665544', roughness: 0.5, metalness: 0.28 });
  const frame = surface({ color: '#55605b', roughness: 0.55, metalness: 0.12 });
  const charcoal = surface({ color: '#26332f', roughness: 0.78 });
  const brass = surface({ color: '#c29b60', roughness: 0.43, metalness: 0.36 });
  const leather = surface({ color: '#645846', roughness: 0.82 });
  const linen = surface({ color: '#d4c6a8', roughness: 0.95 });
  const jade = surface({ color: '#466557', roughness: 0.88 });
  const paper = surface({ color: '#eee7d3', roughness: 0.93 });
  const green = surface({ color: '#56794c', roughness: 0.85, side: T.DoubleSide });
  const leafLight = surface({ color: '#789156', roughness: 0.87, side: T.DoubleSide });
  const leafDark = surface({ color: '#355f48', roughness: 0.86, side: T.DoubleSide });
  const bark = surface({ color: '#83765c', roughness: 0.96 });
  // Thin architectural glazing borrows the same garden panorama as the
  // outside view. Fresnel reflectance keeps straight-on views transparent.
  const glass = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: T.FrontSide,
    uniforms: { panorama: { value: null } },
    vertexShader: `
      #include <common>
      varying vec3 viewNormal;
      varying vec3 toEye;
      void main() {
        #include <beginnormal_vertex>
        #include <defaultnormal_vertex>
        viewNormal=transformedNormal;
        #include <begin_vertex>
        #include <project_vertex>
        toEye=-mvPosition.xyz;
      }
    `,
    fragmentShader: `
      #include <common>
      uniform sampler2D panorama;
      varying vec3 viewNormal;
      varying vec3 toEye;
      void main() {
        vec3 v=normalize(toEye), n=normalize(viewNormal);
        vec3 r=inverseTransformDirection(reflect(-v,n),viewMatrix);
        float angle=pow(1.0-abs(dot(n,v)),3.0);
        vec3 q=normalize(vec3(r.x,r.y/.7,r.z));
        vec2 uv=vec2(.5-(atan(q.z,q.x)+.8)/6.2831853, .5+asin(clamp(q.y,-1.,1.))/3.14159265);
        vec3 sky=texture2D(panorama,vec2(fract(uv.x),uv.y)).rgb;
        gl_FragColor=vec4(mix(vec3(.42,.57,.54),sky,.79),.13+.33*angle);
        #include <colorspace_fragment>
      }
    `,
  });
  materials.add(glass);
  const sheen = ink({
    color: '#e2ede1',
    transparent: true,
    opacity: 0.09,
    side: T.DoubleSide,
    depthWrite: false,
  });
  const amber = ink({ color: '#ffce76', toneMapped: false });
  const light = ink({ color: '#fff1ce', toneMapped: false });
  const outsideGreen = surface({ color: '#7f8f62', roughness: 0.97 });
  const dispose = () => {
    for (const map of maps) map.dispose();
    for (const m of materials) m.dispose();
  };
  return {
    surface,
    ink,
    canvasMap,
    imageMap,
    random,
    maps,
    dispose,
    wood,
    walnut,
    stone,
    plaster,
    laterite,
    bronze,
    frame,
    charcoal,
    brass,
    leather,
    linen,
    jade,
    paper,
    green,
    leafLight,
    leafDark,
    bark,
    glass,
    sheen,
    amber,
    light,
    outsideGreen,
  };
}
