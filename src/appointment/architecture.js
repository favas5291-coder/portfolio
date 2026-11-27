import { officeGeometry } from '../studio/officeGeometry.js';
import { officeMaterials } from '../studio/officeMaterials.js';
import { officePlants } from '../studio/officePlants.js';
import { rainTree } from './rainTree.js';
import { architecturalFinishes } from './finishes.js';

// South-facing street elevation is z=+2.4. The court, stair and both window
// sightlines share one coordinate system; all dimensions are in metres.
export function buildArchitecture(T,scene,options={}) {
  const {previewUrl,onInvalidate,blankScreens=false}=options;
  const root=new T.Group(); root.name='Rain tree courtyard studio'; scene.add(root);
  const m=officeMaterials(T),g=officeGeometry(T,m);
  architecturalFinishes(T,m,options);
  const b=g.box, p=g.panel;
  const street=g.group(root), shell=g.group(root),court=g.group(root),interior=g.group(root);
  const door=g.group(root,-.98,0,2.4);
  const plants=officePlants(T,m,g);
  // Wet street / dry stone transition at the canopy's drip line.
  b(street,m.asphalt,0,-.22,24,82,.18,26);
  b(street,m.wet,0,-.10,6.78,26,.16,8.47);
  for(let i=-11;i<=11;i++) b(street,m.stone,i*1.32,-.057,10.97,1.313,.16,.21);
  b(street,m.stone,-.10,-.037,3.22,8.65,.092,2.49);
  for(const side of [-1,1]){
    b(street,m.soil,side*6.67,-.015,5.8,4.1,.10,5.6);
    b(street,m.concrete,side*4.6,.025,5.8,.11,.17,5.82);
    b(street,m.concrete,side*6.67,.025,8.65,4.26,.17,.11);
    for(let j=0;j<7;j++)plants.broad(street,side*(5.1+(j%2)*1.5),3.65+j*.64,.52+.26*m.random(),false);
  }
  // Kerb drain and expansion seams add a near, legible scale cue as the door swings.
  for(const x of [-4.5,3.8]) {
    b(street,m.charcoal,x,-.115,11.30,.66,.018,.33);
    for(let i=0;i<13;i++) b(street,m.bronze,x-.30+i*.049,-.102,11.30,.023,.013,.31);
  }
  b(street,m.concrete,0,-.139,19.5,73,.01,.08);
  for(let j=-6;j<7;j++)b(street,m.stone,j*4.6,-.122,17.9,2.24,.012,.08);
  // The shallow floor plates wrap an open rectangle around the living tree.
  b(shell,m.stone,3.02,-.13,-2.30,9.18,.25,9.63);
  b(shell,m.stone,-6.72,-.13,-2.3,1.82,.25,9.63);
  b(shell,m.stone,-3.68,-.13,-5.91,4.26,.25,2.43);
  b(shell,m.stone,-3.68,-.13,1.91,4.26,.25,1.20);
  b(court,m.soil,-3.68,-.04,-1.70,4.25,.08,6.0);
  for(const x of [-5.80,-1.55]) b(court,m.concrete,x,.10,-1.69,.155,.20,6.10);
  for(const z of [-4.69,1.29]) b(court,m.concrete,-3.68,.10,z,4.26,.20,.15);
  for(let i=0;i<12;i++){
    const a=i*2.4, r=1.17+.64*m.random();
    plants.broad(court,-3.65+Math.cos(a)*r,-1.76+Math.sin(a)*r,.32+.39*m.random(),false);
  }
  const tree=rainTree(T,m,g,root);
  // Left service wing is the heavy anchor. The occupied wing reads as an
  // offset, lightweight pavilion; a timber-lined reveal separates the bands.
  b(shell,m.laterite,-7.45,3.06,-2.30,.34,6.22,9.65);
  b(shell,m.laterite,-6.62,2.93,2.32,1.95,5.88,.32);
  b(shell,m.plaster,7.49,3.09,-2.3,.25,6.27,9.57);
  b(shell,m.plaster,.02,3.1,-7.04,15.22,6.28,.22);
  b(shell,m.laterite,-3.25,1.46,2.30,3.42,2.93,.26);
  b(shell,m.laterite,-5.71,1.39,-1.70,.24,2.78,5.86);
  b(shell,m.reveal,3.00,3.04,2.32,9.14,.13,.38);
  const floorY=3.26;
  // The project table sits in a double-height opening, visible from the landing.
  b(shell,m.concrete,.45,floorY,.61,3.96,.18,3.78);
  b(shell,m.concrete,.45,floorY,-5.96,3.96,.18,2.20);
  b(shell,m.concrete,-1.06,floorY,-3.06,.96,.18,3.58);
  b(shell,m.concrete,5.66,floorY,-2.28,3.92,.18,9.56);
  b(shell,m.concrete,3.06,floorY,1.28,1.27,.18,2.44);
  b(shell,m.concrete,3.06,floorY,-6.29,1.27,.18,1.51);
  b(shell,m.concrete,-6.58,floorY,-2.3,2.16,.18,9.58);
  b(shell,m.concrete,-3.53,floorY,-6.05,3.94,.18,2.07);
  function roofStrip(x,z,w,d) {
    b(shell,m.wood,x,6.17,z,w,.065,d);
    b(shell,m.reveal,x,6.25,z,w+.04,.10,d+.04);
    b(shell,m.concrete,x,6.40,z,w+.08,.20,d+.08);
    b(shell,m.frame,x,6.515,z,w+.13,.032,d+.13);
  }
  roofStrip(3.22,-2.00,10.39,12.00);
  roofStrip(-7.03,-2.04,2.9,11.94);
  roofStrip(-3.78,-6.82,3.62,2.4);
  // A clear skylight above the central entrance lets the guest see the arrival
  // car through the upstairs window. The deep opaque eaves remain on either side.
  function eave(x,width){
    b(shell,m.wood,x,3.018,3.35,width,.078,2.41);
    b(shell,m.concrete,x,3.16,3.35,width+.03,.21,2.50);
    b(shell,m.bronze,x,3.282,3.35,width+.04,.041,2.56);
    for(let i=.10;i<width;i+=.30)b(shell,m.reveal,x-width/2+i,2.977,3.35,.014,.009,2.34);
  }
  eave(-3.60,3.76); eave(3.67,3.23);
  const roofGlass=p(shell,m.glass,.165,3.13,3.19,3.76,2.10);
  roofGlass.rotation.x=-Math.PI/2;
  b(shell,m.bronze,.165,3.12,4.23,3.76,.040,.047);
  b(shell,m.bronze,.165,3.12,2.54,3.76,.032,.035);
  for(const x of [-5.08,4.72]){
    b(shell,m.frame,x,1.50,4.14,.095,2.98,.095);
    b(shell,m.bronze,x,.047,4.14,.18,.085,.18);
  }
  for(const x of [-4.2,3.65]) {
    g.cyl(shell,m.charcoal,x,2.964,3.69,.083,.022);
    g.cyl(shell,m.light,x,2.952,3.69,.054,.012);
  }
  // Thin thermally-broken bronze window frames. The front founder pane has
  // a deliberately low sill; a visitor sees the same car through it upstairs.
  function glazing(parent,x0,x1,low,high,z,bays,lowRail=true) {
    const width=x1-x0, height=high-low;
    for(let i=0;i<bays;i++){
      p(parent,m.glass,x0+width*(i+.5)/bays,(high+low)/2,z,width/bays-.036,height-.061);
    }
    for(let i=0;i<=bays;i++)b(parent,m.frame,x0+width*i/bays,(high+low)/2,z,.043,height,.09);
    if(lowRail)b(parent,m.bronze,(x0+x1)/2,low,z,width,.055,.10);
    b(parent,m.frame,(x0+x1)/2,high,z,width,.062,.10);
  }
  glazing(shell,-1.53,-.98,.035,2.89,2.40,1);
  glazing(shell,1.07,7.43,.035,2.89,2.40,4);
  glazing(shell,-1.23,4.70,3.54,6.12,2.40,3);
  b(shell,m.plaster,1.73,3.43,2.37,5.98,.18,.20);
  glazing(shell,4.70,7.42,3.58,6.12,2.40,2);
  // Screens protect the east end; leave an open picture window over the entry.
  for(let i=0;i<17;i++){
    const blade=b(shell,m.wood,4.43+i*.193,4.84,2.72,.057,2.48,.24);
    blade.rotation.y=-.44;
  }
  for(const y of [3.58,6.11])b(shell,m.walnut,5.95,y,2.71,3.20,.065,.26);
  b(shell,m.laterite,-1.50,4.70,1.52,.27,2.78,2.04);
  b(shell,m.plaster,4.53,4.73,-2.32,.19,2.77,9.33);
  // The actual entrance leaf and its pull rotate together about the left jamb.
  b(door,m.frame,.98,.065,0,1.96,.075,.074);
  b(door,m.frame,.98,2.83,0,1.96,.075,.074);
  for (const x of [.03,1.93])b(door,m.frame,x,1.45,0,.057,2.82,.074);
  p(door,m.glass,.98,1.43,0,1.86,2.69);
  for (const z of [-.085,.085]) {
    g.cyl(door,m.bronze,1.77,1.07,z,.017,.49);
    for(const y of [.87,1.27])b(door,m.bronze,1.77,y,z/2,.028,.026,.08);
  }
  b(door,m.bronze,.38,2.72,-.065,.41,.076,.069);
  g.lettering(shell,-3.28,1.85,2.437,2.74,.72,[['Fazhere Studio',.55,.52,'Georgia']],{ink:'#fff1d2',resolution:768});
  // Rose-coloured lower lip catches grazing sunlight below the flush sign.
  b(shell,m.orange,-4.48,1.29,2.451,.20,.024,.031);
  // Lateral glazing frames the courtyard at both standing and landing eye levels.
  for(let i=0;i<5;i++){
    b(shell,m.frame,-1.55,1.54,.85-i*1.31,.067,3.08,.055);
    p(shell,m.glass,-1.56,1.53,.195-i*1.31,1.245,2.98,Math.PI/2);
  }
  // Stair: eighteen 186 mm risers. Each tread has a bright nosing with a
  // recessed stringer below to articulate the smooth incline of the camera.
  const rise=3.35/18, run=5/18;
  for(let i=0;i<18;i++){
    const z=-5+(i+.5)*run, top=(i+1)*rise;
    b(shell,m.stone,3.05,top-.048,z,1.12,.096,run+.026);
    b(shell,m.reveal,3.05,top-rise/2,z-run/2+.040,1.05,rise,.078);
    b(shell,m.bronze,3.05,top-.016,z-run/2-.008,1.10,.018,.02);
  }
  for(const x of [2.49,3.61]){
    g.rod(shell,m.frame,[x,.018,-5.0],[x,3.25,.01],.047);
    g.rod(shell,m.wood,[x,.99,-5.0],[x,4.36,.04],.037);
    for(let i=0;i<8;i++){
      const t=i/7;
      b(shell,m.frame,x,.53+3.35*t,-4.945+t*4.95,.024,.97,.024);
    }
  }
  for(const z of [-5.44,-4.56,-3.68,-2.80,-1.92,-1.04])b(shell,m.frame,2.42,3.84,z,.028,.98,.028);
  b(shell,m.wood,2.42,4.345,-3.06,.058,.074,5.03);
  // Guard the edge of the double-height project room, leaving a clear view down.
  for(const x of [-.59,.05,.69,1.33,1.96,2.42]){
    b(shell,m.frame,x,3.84,-1.285,.022,.98,.022);
  }
  b(shell,m.wood,.92,4.345,-1.285,3.06,.061,.067);
  p(shell,m.glass,.92,3.81,-1.285,2.98,.85);
  b(shell,m.wood,-.585,4.345,-3.08,.064,.06,3.58);
  for(const z of [-1.31,-2.19,-3.08,-3.96,-4.83])b(shell,m.frame,-.585,3.84,z,.022,.98,.022);
  // The ceiling above the founder's room and its back wall carry warm, bounced
  // light, visible through the tree even before the deferred furnishings load.
  const lightWall=m.surface({color:'#e9c694',roughness:.96,emissive:'#cf9853',emissiveIntensity:.58});
  b(shell,lightWall,1.12,4.75,-5.18,2.92,2.77,.14);
  b(shell,m.wood,.12,5.86,-5.08,1.12,.092,.20);
  b(shell,m.light,.12,5.805,-5.07,.98,.022,.10);
  // Fixed perforated timber on the rear office wall gives the opening depth.
  for(let i=0;i<18;i++)b(shell,m.wood,-1.29+i*.14,4.68,-5.07,.050,2.54,.08);
  b(interior,m.plaster,-.29,1.49,-5.75,2.34,3.0,.14);
  g.lettering(interior,-.22,1.83,-5.669,1.98,.60,[['Project room',.48,.50,'Georgia']],{ink:'#4a4032'});
  // A pendulum lamp is part of the building silhouette even while the
  // rest of the founder's fit-out has yet to load.
  g.rod(shell,m.bronze,[2.53,6.16,.49],[2.53,5.39,.49],.012);
  g.ball(shell,m.amber,2.53,5.20,.49,.21,.205,.21);
  g.cyl(shell,m.brass,2.53,5.404,.49,.052,.032);
  const focusPlane = p(interior,m.ink({color:'#322d28'}),1.6,1.42,-2.6,1.18,.81);
  const projectCache=new Map();
  const loader=new T.TextureLoader();
  let alive=true;
  function image(url) {
    if (!url) return null;
    if(!projectCache.has(url)){
      const texture=loader.load(url,()=>{if(alive)onInvalidate?.();});
      texture.colorSpace=T.SRGBColorSpace; texture.anisotropy=4;
      projectCache.set(url,texture);m.maps.add(texture);
    }
    return projectCache.get(url);
  }
  function screenMaterial(url){
    return m.ink({map:blankScreens?null:image(url),toneMapped:false,color:blankScreens?'#222825':'#ffffff'});
  }
  focusPlane.material=screenMaterial(previewUrl);
  b(interior,m.charcoal,1.60,1.42,-2.64,1.208,.838,.070);
  b(interior,m.bronze,1.60,1.02,-2.65,.10,.29,.063);
  b(interior,m.bronze,1.60,.854,-2.60,.44,.035,.27);
  b(interior,m.wood,1.60,.80,-2.57,1.73,.079,1.0);
  for(const x of [.87,2.32])b(interior,m.laterite,x,.38,-2.57,.17,.76,.69);
  g.shadow(interior,1.6,-2.57,2.13,1.44,.007);
  const warmed=m.ink({color:'#edcb9c',transparent:true,opacity:.19,depthWrite:false});
  b(interior,warmed,1.6,.82,-2.065,.86,.013,.008);
  let upperScreen=null, requestedUrl=previewUrl, decorate=null, decorations=null;
  const anchors={};
  function anchor(name,mesh){
    const a=new T.Object3D();
    a.position.copy(mesh.position);a.quaternion.copy(mesh.quaternion);a.scale.copy(mesh.scale);
    mesh.parent.add(a);anchors[name]=a;
  }
  anchor('reception',focusPlane);
  function getScreenCorners(name){
    const a=anchors[name];
    if(!a)return null;
    a.updateWorldMatrix(true,false);
    return [[-.5,.5],[.5,.5],[.5,-.5],[-.5,-.5]].map(([x,y])=>new T.Vector3(x,y,0).applyMatrix4(a.matrixWorld));
  }
  function setProject(url) {
    requestedUrl=url||previewUrl;
    if(upperScreen&&!blankScreens){upperScreen.material.map=image(requestedUrl);upperScreen.material.needsUpdate=true;}
  }
  function batch(group) {
    for(const mesh of g.batch(group)){
      const surface=mesh.material;
      mesh.castShadow=!surface.transparent && !surface.isMeshBasicMaterial;
      mesh.receiveShadow=!surface.isMeshBasicMaterial;
    }
  }
  [street,shell,court,interior,door].forEach(batch);
  // Keep the immutable structure ready for both bookend views. Furnishing work
  // is split from the shell and instantiated only in the relevant part of the visit.
  function update(progress,t=0) {
    const smooth=T.MathUtils.smoothstep;
    door.rotation.y=(smooth(progress,.24,.347)-smooth(progress,.405,.48))*1.49;
    tree.update(t);
    if(progress>.34 && !decorate){
      decorate=import('./furnishings.js').then(({furnishRooms})=>{
        if(!alive)return;
        decorations=furnishRooms(T,root,m,g,{batch,anchor,screenMaterial,project:requestedUrl,previewUrl});
        upperScreen=decorations.officeScreen;
        setProject(requestedUrl);
        decorations.update(progress);
        onInvalidate?.();
      }).catch(err=>console.warn('Studio furniture could not load',err));
    }
    decorations?.update(progress);
  }
  return {update,setProject,getScreenCorners,dispose(){
    alive=false;
    decorations?.dispose();
    root.traverse(item=>{if(item.isInstancedMesh)item.dispose();});
    root.removeFromParent();g.dispose();m.dispose();
  }};
}
