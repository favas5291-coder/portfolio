import { buildPeople } from '../studio/officePeople.js';
import { officeFurniture } from '../studio/officeFurniture.js';
import { officePlants } from '../studio/officePlants.js';
import { projectPreviews } from '../data/project-previews.js';

// Downstairs workshop and founder fit-out share the building coordinate system.
// Batches are separate from hinged or held objects so a review gesture costs
// four compact transforms rather than rebuilding a desk full of geometry.
export function furnishRooms(T,root,m,g,{batch,anchor,screenMaterial,project,previewUrl}) {
  const f=officeFurniture(T,m,g), plants=officePlants(T,m,g);
  const projectRoom=g.group(root), studio=g.group(root),upper=g.group(root,0,3.35,0);
  const b=g.box,p=g.panel;
  function monitor(parent,x,y,z,width,height,yaw,url) {
    const rig=g.group(parent,x,y,z,yaw);
    b(rig,m.charcoal,0,0,0,width+.026,height+.028,.041);
    b(rig,m.bronze,0,-height*.50-.046,-.012,.049,.14,.031);
    b(rig,m.frame,0,-height*.50-.112,.011,width*.34,.015,.126);
    return p(rig,screenMaterial(url),0,0,.022,width,height);
  }
  // A quiet reception console and built-in reading bench face the courtyard.
  b(projectRoom,m.walnut,-.93,.40,-3.76,.60,.80,2.26);
  b(projectRoom,m.stone,-.93,.824,-3.76,.68,.049,2.31);
  f.paperStack(projectRoom,-.9,.849,-3.26);
  plants.broad(projectRoom,-.90,-4.39,.49,true);
  f.keyboard(projectRoom,1.64,.842,-2.31,.43);
  f.paperStack(projectRoom,1.04,.845,-2.42,.25,.26);
  b(projectRoom,m.walnut,-.70,.19,-5.0,1.34,.35,.62);
  b(projectRoom,m.linen,-.70,.395,-5,1.37,.073,.63);
  b(projectRoom,m.linen,-.70,.53,-5.24,1.37,.23,.09);
  plants.palm(projectRoom,-.97,-1.81,1.50);
  f.art(projectRoom,-1.03,1.17,-5.659,.38,.49,0,['#d7b38a','#827658','#b65a34']);
  g.shadow(projectRoom,-.68,-4.99,1.94,.81);
  // The internal window is a long, framed opening above a plaster sill.
  b(studio,m.plaster,4.51,.31,-3.92,.15,.62,5.10);
  b(studio,m.walnut,4.48,.645,-3.92,.21,.055,5.12);
  for(const z of [-6.43,-4.95,-2.31,-1.38])b(studio,m.frame,4.48,1.78,z,.054,2.27,.055);
  p(studio,m.glass,4.48,1.76,-3.91,4.97,2.16,-Math.PI/2);
  b(studio,m.frame,4.48,2.88,-3.92,.092,.06,5.12);
  // A valid desktop/phone capture pair belongs to the same published example.
  // A missing pair leaves its phone in sketch mode rather than inventing a capture.
  const paired=Object.values(projectPreviews).find(preview=>preview.mobile?.matchesDesktop===preview.screenshot);
  f.table(studio,5.78,-3.68,1.46,2.45,.745);
  const desktop=paired||{screenshot:previewUrl,width:1348,height:926};
  const studioScreen=monitor(studio,5.96,1.105,-3.94,.68,.68*desktop.height/desktop.width,-Math.PI/2,desktop.screenshot);
  anchor('studio',studioScreen);
  f.keyboard(studio,5.59,.748,-3.94,.40,-Math.PI/2);
  f.paperStack(studio,5.91,.748,-2.82);

  plants.palm(studio,6.83,-5.72,1.69);
  const rearShelf=g.group(studio,7.09,0,-3.59,-Math.PI/2);
  f.bookcase(rearShelf,0,0,2.13,1.72);
  // The same hand rig and licensed seated figures as the original studio:
  // the supported phone rotates with its owner while a colleague follows it.
  const cast=buildPeople(T,root,{placements:[
    {role:'developer',position:[5.58,-2.40],yaw:-2.85},
    {role:'designer',position:[6.48,-3.00],yaw:-1.32},
  ]});
  const presenter=cast.figure('developer'), colleague=cast.figure('designer');
  presenter.root.visible=colleague.root.visible=true;
  f.chair(studio,5.58,-2.40,-2.85,m.jade);
  f.chair(studio,6.48,-3.00,-1.32,m.linen);
  const handset=presenter.arms[0].getObjectByName('Handset screen');
  if(paired) {
    const face=p(handset,screenMaterial(paired.mobile.screenshot),0,0,.008,.063,.132);
    face.material.side=T.DoubleSide;
    anchor('phone',face);
  }
  cast.figure('designer').head.rotation.y=-.23;
  // Upper floor fit-out is set back to preserve the lower-left car sightline.
  const desk=g.group(upper,1.99,0,1.21);
  b(desk,m.wood,0,.757,0,1.78,.062,.81);
  b(desk,m.bronze,0,.714,0,1.72,.016,.76);
  for(const x of [-.70,.70])b(desk,m.walnut,x,.345,0,.076,.69,.63);
  g.shadow(upper,1.99,1.21,2.24,1.42);
  const officeScreen=monitor(upper,1.84,1.14,1.40,.68,.68*926/1348,Math.PI-.11,project);
  anchor('office',officeScreen);
  f.keyboard(upper,1.84,.789,1.17,.37,Math.PI-.11);
  f.taskLamp(upper,2.66,.786,1.40);
  f.paperStack(upper,2.45,.789,1.01,.215,.29);
  f.chair(upper,2.32,1.96,-.48,m.jade);
  f.chair(upper,1.50,.18,Math.PI+.24,m.linen);
  plants.broad(upper,3.96,1.79,1.22);
  const plate=g.group(upper,1.19,.796,1.06,Math.PI-.09);
  const sign=b(plate,m.bronze,0,.065,0,.56,.122,.026);sign.rotation.x=-.14;
  g.lettering(plate,0,.070,.019,.52,.10,[['Muhammed Favas K',.48,.51,'Georgia']],{ink:'#fff3d2',resolution:512});
  const bookCorner=g.group(upper,-1.12,0,-3.31,Math.PI/2);
  f.bookcase(bookCorner,0,0,1.36,1.15);
  plants.broad(upper,-1.05,-2.23,1.00);
  for(const group of [projectRoom,studio,upper]) batch(group);
  return {
    officeScreen,
    dispose(){cast.dispose();},
    update(progress) {
      const turn=T.MathUtils.smoothstep(progress,.537,.597);
      presenter.head.rotation.y=-.28*turn;presenter.head.rotation.x=.075;
      presenter.arms[0].rotation.y=-.48*turn;presenter.arms[0].rotation.x=-.13*turn;
      colleague.head.rotation.y=-.22-.14*turn;colleague.head.rotation.x=.10;
    },
  };
}
