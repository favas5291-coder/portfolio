// Lighting is drawn in the harbour's world coordinates so it stays attached to
// the lighthouse when the camera changes berth. All colours below are linear.
const skyVertex = `
  varying vec3 vRay;
  void main() {
    vRay = position;
    // Ignore camera translation. This puts the painted sky behind the scene
    // even when the project viewer uses a short far plane.
    vec3 viewRay = mat3(viewMatrix) * position;
    vec4 clip = projectionMatrix * vec4(viewRay, 1.0);
    gl_Position = vec4(clip.xy, clip.w * 0.99999, clip.w);
  }
`;

const skyFragment = `
  varying vec3 vRay;

  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  float grain(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0 - 2.0*f);
    return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
               mix(hash(i + vec2(0,1)), hash(i + 1.0), f.x), f.y);
  }
  void main() {
    vec3 ray = normalize(vRay);
    vec2 p = vec2(atan(ray.x, -ray.z), asin(clamp(ray.y, -1.0, 1.0)));
    float h = clamp(ray.y, 0.0, 1.0);
    vec3 colour = mix(vec3(0.046, 0.085, 0.101), vec3(0.010,0.031,0.060),
                      smoothstep(-0.03, 0.45, h));
    colour = mix(colour,vec3(0.007,0.022,0.040),smoothstep(0.24,0.90,h));
    // A residual strip of monsoon light at the horizon.
    float west = exp(-abs(p.x + 0.48)*1.6);
    colour += vec3(.086,.038,.019)*west*exp(-13.0*h);
    float cloud = grain(p*vec2(2.8,23.0))*.65 + grain(p*vec2(7.0,51.0))*.35;
    float veil = smoothstep(.36,.83,cloud)*smoothstep(.02,.18,h)*(1.-smoothstep(.4,.75,h));
    colour = mix(colour, vec3(.070,.109,.118), veil*.32);

    // Stars are fixed to the sphere rather than resampled every frame.
    vec2 cell = p*83.0;
    vec2 seed = floor(cell);
    vec2 offset = vec2(hash(seed+.7),hash(seed+4.1))*.52+.24;
    float star = 1.0-smoothstep(.018,.115,length(fract(cell)-offset));
    star *= step(.965,hash(seed+11.0))*smoothstep(.13,.6,h)*(1.0-veil*.90);
    colour += vec3(.55,.60,.52)*star;

    float moon = length(ray-normalize(vec3(.12,.13,-1.0)));
    float edge = max(.0007, fwidth(moon));
    colour += vec3(.17,.148,.092)*exp(-moon*37.0);
    colour = mix(colour,vec3(.98,.85,.61),1.0-smoothstep(.012-edge,.012+edge,moon));
    gl_FragColor = vec4(colour,1.);
    #include <colorspace_fragment>
  }
`;

const waterVertex = `
  uniform float uTime;
  varying vec3 vPoint;
  void main() {
    vec3 surface = (modelMatrix * vec4(position,1.)).xyz;
    surface.y += .022*sin(surface.z*1.9 + surface.x*.18 - uTime*.85)
               + .014*sin(surface.x*1.4 - surface.z*.53 + uTime*.63);
    vPoint = surface;
    gl_Position = projectionMatrix * viewMatrix * vec4(surface,1.);
  }
`;

const waterFragment = `
  uniform float uTime;
  uniform vec2 uBeam;
  uniform vec2 uBoat;
  uniform vec2 uSecretBoat;
  uniform vec2 uHeading;
  uniform float uSailing;
  varying vec3 vPoint;

  float hullShadow(vec2 point, vec2 boat, vec2 radius) {
    vec2 p=(point-boat)/radius;
    return exp(-dot(p,p)*1.6);
  }
  void main() {
    vec2 p = vPoint.xz;
    float t = uTime;
    float ripplePhase = p.y*12.0 + sin(p.x*2.5+p.y*.62+t*.46)*1.55 - t*1.40;
    float facet = sin(ripplePhase) + .36*sin(p.y*20.1-p.x*1.8+t*.94);
    // Suppress fine strokes once they are smaller than a pixel.
    float detail=1.0-smoothstep(.6,2.9,fwidth(ripplePhase));
    float crest=smoothstep(.23,1.23,facet)*detail;
    float swell=sin(p.y*2.18-p.x*.27-t*.70);
    vec3 eye=normalize(cameraPosition-vPoint);
    float grazing=pow(1.-clamp(eye.y,0.,1.),3.);
    vec3 water=mix(vec3(.009,.055,.059),vec3(.073,.138,.145),grazing);
    water += vec3(.007,.022,.020)*swell + vec3(.007,.020,.022)*crest;
    float farWater=smoothstep(6.,26.,length(p-vec2(0.,1.)));
    water=mix(water,vec3(.087,.149,.149),farWater*.53);

    vec2 lamp=vec2(-4.8,1.6);
    vec2 rel=p-lamp;
    vec2 eyeRay=normalize(cameraPosition.xz-lamp+vec2(.0001));
    float range=dot(rel,eyeRay);
    vec2 tangent=vec2(-eyeRay.y,eyeRay.x);
    float meander=.10*sin(p.y*2.8+t*.65)+.06*sin(p.x*4.8+t*.81);
    float width=.30+.12*max(0.,range);
    float lane=abs(dot(rel,tangent)+meander);
    float orange=exp(-lane*lane/(width*width))
               *smoothstep(-1.0,.06,range)*exp(-.12*max(0.,range));
    float along=dot(rel,uBeam);
    float crossBeam=dot(rel,vec2(-uBeam.y,uBeam.x));
    float spread=.24+.075*max(along,0.);
    float lateral=(crossBeam+meander)/spread;
    float sweep=exp(-lateral*lateral)
               *smoothstep(0.,1.,along)*(1.0-smoothstep(7.5,17.,along));
    // The hull and its surrounding displaced water interrupt the lamp streak.
    float shadow=max(hullShadow(p,uBoat+vec2(0.,.12),vec2(1.34,.57)),
                     hullShadow(p,uSecretBoat+vec2(0.,.10),vec2(1.02,.44)));
    water*=1.0-shadow*.63;
    float gleam=.095+.82*crest+.18*smoothstep(.65,1.,swell)*detail;
    water+=vec3(1.35,.42,.065)*(orange*.86+sweep*.54)*gleam*(1.-shadow*.96);

    // Scattered light below the shop and signal-house windows.
    vec2 shore=p-vec2(1.,-.92);
    float shoreLight=exp(-abs(shore.x)*1.5-max(0.,shore.y)*1.35);
    float signal=exp(-abs(p.x-5.2)*2.0-max(0.,p.y+1.)*.92);
    water+=vec3(.29,.19,.094)*(shoreLight+.72*signal)*(.07+.70*crest);

    // A ring at the quay arrives after the secret boat has been moving.
    // The white tip of the V breaks into short lines behind its stern.
    vec2 drift=p-uSecretBoat;
    float trail=-dot(drift,uHeading);
    float side=abs(dot(drift,vec2(-uHeading.y,uHeading.x)));
    float moving=smoothstep(0.,.8,uSailing);
    float tip=abs(side-(.21+.21*max(trail,0.)));
    float wake=exp(-tip*tip/.025)*smoothstep(0.,.38,trail)
              *(1.-smoothstep(.6,5.6,trail))
              *(1.-smoothstep(max(0.,uSailing)*1.8,max(0.,uSailing)*1.8+.5,trail));
    float arrival=max(0.,uSailing-2.35);
    float ring=abs(length(p-vec2(3.4,-.92))-arrival*.81);
    float wash=exp(-ring*ring/.034)*smoothstep(2.35,2.65,uSailing)*exp(-arrival*.6);
    water+=vec3(.13,.27,.23)*(wake*moving+.45*wash)*(.4+.65*crest);
    gl_FragColor=vec4(max(water,vec3(0.)),1.);
    #include <colorspace_fragment>
  }
`;

/** Mount the painted night horizon and wave surface; all dimensions are in metres. */
export function buildSea(T, scene) {
  const sky = new T.Mesh(new T.SphereGeometry(20, 32, 16),
    new T.ShaderMaterial({vertexShader:skyVertex,fragmentShader:skyFragment,side:T.BackSide,depthTest:false,depthWrite:false}));
  sky.frustumCulled=false;
  sky.renderOrder=-100;
  const uniforms={
    uTime:{value:0}, uBeam:{value:new T.Vector2(0,-1)},
    uBoat:{value:new T.Vector2(-1,2.6)}, uSecretBoat:{value:new T.Vector2(5,2.2)},
    uHeading:{value:new T.Vector2(1,0)}, uSailing:{value:0},
  };
  const geometry = new T.PlaneGeometry(100,100,76,76);
  geometry.rotateX(-Math.PI/2);
  const water = new T.Mesh(geometry,new T.ShaderMaterial({uniforms,vertexShader:waterVertex,fragmentShader:waterFragment}));
  scene.add(sky,water);
  const current=new T.Vector2(), movement=new T.Vector2();
  return {
    update(time,bearingRadians,boat,secretBoat,sailingSeconds=0) {
      uniforms.uTime.value=time;
      uniforms.uBeam.value.set(Math.sin(bearingRadians),-Math.cos(bearingRadians));
      uniforms.uBoat.value.set(boat.position.x,boat.position.z);
      current.set(secretBoat.position.x,secretBoat.position.z);
      movement.subVectors(current,uniforms.uSecretBoat.value);
      if(sailingSeconds>0 && movement.lengthSq()>0.000001) uniforms.uHeading.value.copy(movement.normalize());
      uniforms.uSecretBoat.value.copy(current);
      uniforms.uSailing.value=Math.max(0,sailingSeconds);
    },
    dispose() {
      scene.remove(sky,water);
      sky.geometry.dispose(); sky.material.dispose();
      water.geometry.dispose(); water.material.dispose();
    },
  };
}
