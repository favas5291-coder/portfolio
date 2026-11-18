import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader } from 'three';
import { projectPreviews } from '../data/project-previews.js';
import { BUILDINGS, KERBS } from './layout.js';
import { craft, plane, release, sign } from './craft.js';
import { makeGround } from './ground.js';

function kerb(builder, index) {
  const base=KERBS[index];
  builder.part('soft','#d4c6a6',base.x,0.04,base.z,base.width,base.height+.07,base.depth);
  // Regular cuts read as cast concrete kerbstones as the camera approaches.
  const edge=base.z+base.depth/2;
  for(let x=base.x-base.width/2+.48;x<base.x+base.width/2-.15;x+=1.0) {
    builder.part('block','#c0af8f',x,.125,edge-.09,.028,.012,.17);
  }
}

// The live screenshots are texture-mapped using their native proportions.
// A CSS-pixel phone can use a portrait capture only when its desktop pairing is current.
export function shopPrint(root,id,x,y,z,maxWidth,maxHeight,alive) {
  const project=projectPreviews[id];
  if (!project) return;
  const phone=typeof matchMedia==='function' && matchMedia('(max-width: 600px)').matches;
  const shot=phone && project.mobile?.matchesDesktop===project.screenshot ? project.mobile : project;
  const scale=Math.min(maxWidth/shot.width,maxHeight/shot.height);
  const mat=new MeshBasicMaterial({color:0xf4eddc,toneMapped:false});
  const image=new Mesh(new PlaneGeometry(shot.width*scale,shot.height*scale),mat);
  image.position.set(x,y,z);
  root.add(image);
  new TextureLoader().load(shot.screenshot, texture=>{
    if(!alive()){texture.dispose();return;}
    texture.colorSpace=SRGBColorSpace;
    texture.anisotropy=2;
    mat.color.set(0xffffff);mat.map=texture;mat.needsUpdate=true;
  },undefined,()=>{ image.visible=false; });
}

function flagship(root, builder, alive) {
  const site=BUILDINGS[0],z=site.z+site.depth/2;
  const dark='#29453a', wall='#bcc3a0', concrete='#dfd5b6', timber='#a88d66';
  kerb(builder,0);
  // A parapet, layered weather lips and corner band give the flagship a
  // substantial silhouette from the driver's elevated viewpoint.
  builder.part('soft',wall,0,1.72,site.z,site.width,3.14,site.depth);
  builder.part('block',dark,0,1.74,z+.036,11.77,3.16,.12);
  builder.part('block','#b1a98d',0,3.44,site.z,12.35,.27,9.29);
  builder.part('block',concrete,0,3.56,z+.08,12.35,.20,.52);
  builder.part('block',concrete,-5.99,3.68,site.z,.25,.32,9.36);
  builder.part('block',concrete,5.99,3.68,site.z,.25,.32,9.36);
  builder.part('block',concrete,0,3.69,site.z-4.47,12.18,.32,.25);
  builder.part('block','#8b9c83',0,3.59,site.z,11.65,.06,8.66);
  // A glazed sawtooth roof lantern breaks the roof plane.
  for(const row of [-1.2,1.0]){
    builder.part('block','#677e74',-1.7,3.80,site.z+row,4.0,.46,.86,-.12);
    builder.part('block','#a3b7a5',-1.7,4.054,site.z+row,4.10,.09,.93,-.12);
    for(const x of [-3.59,-2.36,-1.02,.19]) builder.part('block',concrete,x,3.81,site.z+row+.43,.07,.5,.07);
  }
  // Laterite masonry at the side, alternating courses with deep reveal lines.
  builder.part('block','#ad6f4e',5.99,1.17,site.z,.12,2.02,9);
  for(let i=0;i<5;i++) {
    builder.part('block','#8c654a',6.07,.33+i*.38,site.z,.016,.028,8.93);
    for(let j=0;j<6;j++)builder.part('block','#9c6d50',6.073,.5+i*.38,site.z-4+(j*1.49)+(i%2?.55:0),.015,.30,.029);
  }
  for(const x of [-5.8,-2.22,2.18,5.78]) builder.part('block',concrete,x,1.39,z+.19,.20,2.47,.36);
  // The shop window and slatted display shutters use separate depths.
  for(const x of [-4.01,4.06]){
    builder.part('block','#42675d',x,1.35,z+.14,3.18,2.10,.13);
    builder.part('block','#698b78',x,1.67,z+.225,2.95,1.22,.015);
    builder.part('block',dark,x,1.4,z+.25,.095,2.04,.08);
    builder.part('block',timber,x,.36,z+.23,3.22,.12,.19);
  }
  builder.part('block','#e5d9b7',0,1.46,z+.24,4.03,2.42,.11);
  shopPrint(root,'gymdrobe',0,1.47,z+.31,3.80,2.22,alive);
  const door=craft(root);
  // Slats telescope behind the sign; compressing the group keeps the opened
  // shutter inside its housing, without clipping through the roof.
  door.group.position.set(0,2.76,z+.40);
  for(let i=0;i<15;i++){
    door.part('block',i%2?'#799481':'#819c87',0,-.085-i*.165,0,4.01,.155,.065);
    door.part('block','#637e6b',0,-.153-i*.165,.046,4.01,.014,.045);
  }
  door.part('block','#364e41',0,-2.47,.02,4.06,.09,.10);
  door.finish();
  const canopy=craft(root);
  canopy.group.position.set(0,2.85,z+.38);
  canopy.part('block','#376450',0,.01,.47,11.9,.16,1.35,.08);
  canopy.part('block','#f2e3c7',0,-.11,1.13,11.94,.18,.09);
  for(let i=0;i<33;i++)canopy.part('block','#d8d7ae',-5.82+i*.36,-.19,1.11,.18,.13,.08);
  canopy.finish();
  // Long shop name stays readable from spawn, even against the angled roof.
  builder.part('block','#213e34',0,3.43,z+.44,12.01,1.07,.31);
  sign(root,'GymDrobe',0,3.43,z+.608,10.27,.90,{paper:'#23493e',ink:'#fff4d7'});
  builder.part('block','#e8ddbc',0,3.99,z+.39,12.1,.08,.4);
  // Side fascia points the driver to the main door.
  builder.part('block',dark,6.075,2.76,site.z+1.48,.13,.66,5.13);
  sign(root,'GYMDROBE',6.149,2.77,site.z+1.48,4.5,.54,{yaw:Math.PI/2,paper:'#284d40'});
  return {door:door.group,canopy:canopy.group};
}

export function createWorld(scene) {
  const root = new Group();
  root.name='Kozhikode neighbourhood';
  scene.add(root);
  let disposed = false, opened = 0, backOpen = 0;
  let districts = null;
  let loading;
  const alive=()=>!disposed;
  makeGround(root);
  const builder=craft(root);
  const gym=flagship(root,builder,alive);
  builder.finish();
  return {
    update(dt, state={}) {
      if(disposed) return;
      const goal = state.opened === 'gymdrobe' ? 1 : state.nearby === 'gymdrobe' ? .37 : 0;
      opened+=(goal-opened)*(1-Math.exp(-5.5*dt));
      gym.door.scale.y=1-opened*.965;
      gym.canopy.rotation.x = Math.sin((state.time || 0) * 1.38) * .0075;
      if (districts) {
        backOpen += ((state.discovered ? 1 : 0) - backOpen) * (1 - Math.exp(-4.2 * dt));
        districts.rear.scale.y = 1 - backOpen * .97;
        const phase = ((state.time || 0) % 10) / 10;
        districts.leaf.visible = phase < .79;
        districts.leaf.position.set(-4.9 + phase * 7.3, .08 + 3.65 * Math.pow(1 - phase, 2),
          2.7 + phase * 2.1 + Math.sin(phase * 14) * .34);
        districts.leaf.rotation.set(phase * 8, phase * 21, Math.sin(phase * 19) * .51);
      }
    },
    loadDistricts() {
      if (!loading && !disposed) {
        loading = import('./districts.js').then(({ addDistricts }) => {
          if (!disposed) districts = addDistricts(root, { kerb, shopPrint, alive });
        });
      }
      return loading;
    },
    dispose(){disposed=true;release(root);},
  };
}
