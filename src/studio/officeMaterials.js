// Small, seeded finish maps keep the entire building self-contained. All colours
// are authored in sRGB; the renderer handles lighting in linear space.
export function officeMaterials(T) {
  let seed = 17553;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const maps = new Set(),
    materials = new Set();
  function surface(parameters) {
    const material = new T.MeshStandardMaterial(parameters);
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
  const woodMap = canvasMap(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b68d65';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 430; i++) {
      const y = random() * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(w * 0.3, y + (random() - 0.5) * 11, w * 0.69, y + (random() - 0.5) * 7, w, y);
      ctx.strokeStyle = random() > 0.35 ? 'rgba(69,39,25,.12)' : 'rgba(255,230,185,.21)';
      ctx.lineWidth = 0.3 + random() * 1.5;
      ctx.stroke();
    }
  });
  function granular(color, grain, veins = false) {
    return canvasMap(256, 256, (ctx, w, h) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 11000; i++) {
        const size = random() * grain;
        ctx.fillStyle = random() > 0.45 ? 'rgba(71,59,44,.12)' : 'rgba(255,251,222,.18)';
        ctx.fillRect(random() * w, random() * h, size * (veins ? 2.7 : 1), size);
      }
      if (veins)
        for (let i = 0; i < 63; i++) {
          const x = random() * w,
            y = random() * h;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.bezierCurveTo(x + 18, y + 4, x + 25, y - 3, x + 54, y + 2);
          ctx.strokeStyle = 'rgba(118,99,78,.1)';
          ctx.lineWidth = random() + 0.3;
          ctx.stroke();
        }
    });
  }
  const stoneMap = granular('#cabcaa', 2, true);
  const plasterMap = granular('#dfd6bf', 1.5);
  const brickMap = granular('#a2684a', 3);
  const wood = surface({ map: woodMap, roughness: 0.7 });
  const walnut = surface({ color: '#937357', map: woodMap, roughness: 0.62 });
  const stone = surface({ map: stoneMap, roughness: 0.82 });
  const plaster = surface({ map: plasterMap, roughness: 0.91 });
  const laterite = surface({ map: brickMap, roughness: 0.95 });
  const bronze = surface({ color: '#665544', roughness: 0.5, metalness: 0.28 });
  const frame = surface({ color: '#303b36', roughness: 0.55, metalness: 0.12 });
  const charcoal = surface({ color: '#26332f', roughness: 0.78 });
  const brass = surface({ color: '#bd9862', roughness: 0.43, metalness: 0.36 });
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
        vec2 uv=vec2(atan(r.z,r.x)/6.2831853+.842,asin(clamp(r.y,-1.,1.))/3.14159265+.5);
        vec3 sky=texture2D(panorama,vec2(fract(uv.x),uv.y)).rgb;
        gl_FragColor=vec4(mix(vec3(.43,.58,.54),sky,.72),.052+.27*angle);
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
