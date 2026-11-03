// The harbour is modelled in metres with Y up. Rigid parts sharing a finish
// are baked into a single draw per material within each moving assembly.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildHarbour(T, previewTexture) {
  const group = new T.Group();
  const fixed = new T.Group();
  group.add(fixed);
  const vector = (x, y, z) => new T.Vector3(x, y, z);
  const finish = (color, roughness = 0.8, metalness = 0) =>
    new T.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
  const glow = color => new T.MeshBasicMaterial({ color });
  const stone = finish('#63706b'), darkStone = finish('#374d4b'), wall = finish('#c1bc9d');
  const white = finish('#eadcbd'), red = finish('#bc563c'), teal = finish('#357471');
  const deep = finish('#263f42'), wood = finish('#986b47'), aged = finish('#65503d');
  const iron = finish('#485958', 0.48, 0.5), brass = finish('#b58a59', 0.42, 0.44);
  const tile = finish('#96533f'), ridge = finish('#b86c50');
  const palmGreen = finish('#426763'), palmShade = finish('#294c50');
  const orange = glow('#ffa64d'), litGlass = glow('#ffe0a2');
  const unitBox = new T.BoxGeometry(1, 1, 1);
  const unitRod = new T.CylinderGeometry(1, 1, 1, 6);
  const unitBall = new T.SphereGeometry(1, 12, 8);
  const add = (parent, geometry, material, x, y, z) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const box = (parent, material, x, y, z, w, h, d) => {
    const m = add(parent, unitBox, material, x, y, z);
    m.scale.set(w, h, d);
    return m;
  };
  const cylinder = (parent, material, x, y, z, top, bottom, height, sides = 16) =>
    add(parent, new T.CylinderGeometry(top, bottom, height, sides), material, x, y, z);
  const rod = (parent, material, a, b, radius) => {
    const direction = vector(...b).sub(vector(...a));
    const m = add(parent, unitRod, material, (a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2);
    m.scale.set(radius, direction.length(), radius);
    m.quaternion.setFromUnitVectors(vector(0, 1, 0), direction.normalize());
    return m;
  };
  const ball = (parent, material, x, y, z, a, b = a, c = a) => {
    const m = add(parent, unitBall, material, x, y, z);
    m.scale.set(a, b, c);
    return m;
  };
  const assembly = (x, y, z) => {
    const part = new T.Group();
    part.position.set(x, y, z);
    group.add(part);
    return part;
  };
  const gFromFaces = (positions, indices) => {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  };

  // Shallow printed enamel plates retain crisp lettering at the quay stop.
  function plaque(parent, x, y, z, w, h, name, ink = '#f5e5c4', background = '#244b4c') {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = Math.max(90, Math.round(768 * h / w));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.min(canvas.height * 0.60, 660 / (name.length * 0.67)) + 'px Georgia, serif';
    ctx.fillStyle = ink;
    ctx.fillText(name, canvas.width / 2, canvas.height * 0.53);
    for (const sx of [21, canvas.width - 21]) {
      ctx.beginPath(); ctx.arc(sx, canvas.height / 2, 2.5, 0, 2 * Math.PI); ctx.fill();
    }
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    const m = new T.MeshBasicMaterial({map, color: '#f4f0e4'});
    return add(parent, new T.PlaneGeometry(w, h), m, x, y, z);
  }

  // Cut banks and layered hills. Their irregular skyline is visible in the
  // gaps between the structures and keeps the scene grounded at water level.
  function hillside(z, base, span, height, phase, colour) {
    const pos = [], idx = [];
    for (let i = 0; i <= 60; i++) {
      const x = (i/60 - 0.5)*span;
      const y = base + height * (0.5 + 0.24*Math.sin(x*.51+phase) + 0.16*Math.sin(x*1.57+phase) + 0.1*Math.cos(x*.27));
      pos.push(x, -1, z, x, y, z);
      if (i) { const k = 2*i; idx.push(k-2,k,k-1,k,k+1,k-1); }
    }
    add(fixed, gFromFaces(pos,idx), glow(colour),0,0,0);
  }
  hillside(-18, 1.5, 58, 3.8, 0.2, '#355559');
  hillside(-12, 0.6, 42, 2.9, 1.6, '#2b4b4e');

  function palm(x, z, h, lean, phase) {
    const top = [x + lean, h, z + .16];
    rod(fixed, aged, [x, 0.1, z], [x + lean*.3, h*.58, z], h*.035);
    rod(fixed, wood, [x + lean*.3, h*.58, z], top, h*.026);
    for (let k = 0; k < 9; k++) {
      const angle = phase + k*2.40;
      const len = h*(.36+.07*Math.sin(k*3+phase));
      const side = [-Math.sin(angle), Math.cos(angle)];
      const coords = [], faces = [];
      for (let i=0; i<=12; i++) {
        const t = i/12;
        const d = len*t;
        const midX = top[0]+Math.cos(angle)*d, midZ = top[2]+Math.sin(angle)*d;
        const midY = h + len*(.38*Math.sin(Math.PI*t) - .42*t*t + .1*Math.cos(k)*t);
        const edge = len*.105*Math.sin(Math.PI*t)*(i%2 ? .78 : 1);
        coords.push(midX+side[0]*edge, midY-edge*.68, midZ+side[1]*edge,
                    midX, midY, midZ, midX-side[0]*edge, midY-edge*.49, midZ-side[1]*edge);
        if(i) { const v=i*3; faces.push(v-3,v,v-2,v-2,v,v+1, v-2,v+1,v-1,v-1,v+1,v+2); }
      }
      palmGreen.side = palmShade.side = T.DoubleSide;
      add(fixed,gFromFaces(coords,faces),k%3?palmGreen:palmShade,0,0,0);
    }
  }
  [[-8,-5,3.7,.32,.2],[-7.5,-5.8,4.8,-.45,1.4],[-1.7,-5.8,3.9,.34,1],[-.8,-6.1,3.1,-.15,0],[3.52,-5.5,4.2,.5,2],[7.2,-4.7,3.7,-.4,3],[7.9,-5,4.6,.54,1]].forEach(p=>palm(...p));

  // The granite seawall has individually jointed stones and a wet cap.
  box(fixed,darkStone,.2,.12,-3.7,16,.6,5.2);
  for(let row=0;row<2;row++) {
    for(let i=0;i<26;i++) {
      const x = -7.9 + .63*i + .18*row;
      box(fixed, (i+row)%4===0?stone:darkStone,x,.035+row*.20,-1.075,.60,.18,.18);
    }
  }
  box(fixed,stone,.15,.37,-1.09,16.3,.09,.34);
  for (const x of [-6.8,-2.8,3.2,6.85]) {
    cylinder(fixed,iron,x,.54,-.99,.09,.115,.26);
    cylinder(fixed,iron,x,.68,-.99,.13,.13,.05);
  }
  function deck(x,z,w,d) {
    box(fixed,aged,x,.34,z,w,.16,d);
    const count=Math.ceil(w/.34);
    for(let i=0;i<count;i++) box(fixed,i%5===0?wood:aged,x-w/2+(i+.5)*w/count,.45,z,w/count-.019,.07,d);
    for(const px of [x-w*.44,x+w*.44]) {
      for(const pz of [z-d*.4,z+d*.4]) cylinder(fixed,wood,px,.01,pz,.09,.12,1.02,8);
    }
  }
  deck(-4.8,1.6,2.6,2.35);
  deck(-4.8,-.1,1.0,1.75);
  deck(1,-.82,4.65,.87);
  deck(5.4,-.25,1.3,1.9);

  // Whitewashed stone and a banded lantern gallery form the silhouette.
  const lx=-4.8, lz=1.6;
  cylinder(fixed,stone,lx,.53,lz,.81,.89,.29,14);
  const levels=[[.66,1.12,.67,.63,white],[1.12,1.83,.63,.565,red],[1.83,2.79,.565,.477,white],[2.79,3.46,.477,.422,red],[3.46,4.04,.422,.375,white]];
  for(const [a,b,rb,rt,m] of levels) cylinder(fixed,m,lx,(a+b)/2,lz,rt,rb,b-a,18);
  box(fixed,deep,lx,.93,lz+.646,.31,.51,.04);
  box(fixed,wood,lx,.93,lz+.676,.24,.46,.026);
  for(const [y,r] of [[2.13,.56],[2.94,.49],[3.67,.43]]) {
    box(fixed,deep,lx,y,lz+r*.95,.17,.27,.04);
    box(fixed,litGlass,lx,y,lz+r*.95+.023,.105,.2,.023);
  }
  cylinder(fixed,iron,lx,4.06,lz,.68,.42,.22);
  cylinder(fixed,white,lx,4.19,lz,.70,.67,.08);
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6, b=a+Math.PI/6;
    const ax=lx+.65*Math.cos(a),az=lz+.65*Math.sin(a),bx=lx+.65*Math.cos(b),bz=lz+.65*Math.sin(b);
    rod(fixed,iron,[ax,4.2,az],[ax,4.5,az],.017);
    rod(fixed,brass,[ax,4.5,az],[bx,4.5,bz],.022);
    rod(fixed,iron,[ax,4.35,az],[bx,4.35,bz],.013);
  }
  cylinder(fixed,brass,lx,4.45,lz,.40,.43,.40,12);
  const lamp=add(group,unitBall,litGlass,lx,4.8,lz);
  lamp.scale.set(.22,.33,.22);
  for(let i=0;i<8;i++) {
    const a=i*Math.PI/4;
    rod(fixed,brass,[lx+.37*Math.cos(a),4.57,lz+.37*Math.sin(a)],[lx+.37*Math.cos(a),5.09,lz+.37*Math.sin(a)],.025);
  }
  cylinder(fixed,iron,lx,5.09,lz,.49,.49,.07,12);
  cylinder(fixed,red,lx,5.3,lz,.055,.51,.39,12);
  rod(fixed,brass,[lx,5.48,lz],[lx,5.79,lz],.025);
  ball(fixed,brass,lx,5.72,lz,.06);

  function roof(x,z,base,w,d,height) {
    const depth=Math.hypot(d/2,height), slope=Math.atan2(height,d/2);
    for(const side of [-1,1]) {
      const panel=box(fixed,tile,x,base+height*.5,z+side*d*.25,w,.12,depth);
      panel.rotation.x=side*slope;
      const tiles=Math.ceil(w/.24);
      for(let i=0;i<=tiles;i++) {
        const px=x-w/2+i*w/tiles;
        rod(fixed,i%4?tile:ridge,[px,base+height+.065,z],[px,base+.065,z+side*d*.5],.024);
      }
    }
    rod(fixed,ridge,[x-w*.51,base+height+.04,z],[x+w*.51,base+height+.04,z],.085);
  }

  // The screenshot is always the caller's manifest-backed texture.
  const mx=1,mz=-2, screenZ=-1.15, sw=3.32, sh=sw*926/1348, screenY=.53+sh/2;
  box(fixed,teal,mx,1.77,mz,3.81,2.73,1.62);
  box(fixed,deep,mx,screenY,screenZ-.043,sw+.18,sh+.18,.10);
  const previewMat = new T.MeshBasicMaterial({ map: previewTexture || null, color: previewTexture?'#ffffff':'#bbc6b3', toneMapped:false });
  const screen = add(fixed,new T.PlaneGeometry(sw,sh),previewMat,mx,screenY,screenZ+.02);
  screen.name='GymDrobe storefront';
  for(const xx of [mx-1.88,mx+1.88]) {
    box(fixed,white,xx,1.77,screenZ-.04,.15,2.76,.22);
    box(fixed,brass,xx,.63,screenZ+.04,.18,.27,.2);
  }
  roof(mx,mz,3.35,4.23,2.18,.69);
  const sign=assembly(mx,3.34,screenZ+.12);
  box(sign,wood,0,-.265,-.05,3.20,.5,.09);
  plaque(sign,0,-.265,.002,3.16,.47,'GymDrobe','#f8e9cb','#214d4b');
  rod(fixed,iron,[mx-1.36,3.55,screenZ+.12],[mx-1.36,3.33,screenZ+.12],.025);
  rod(fixed,iron,[mx+1.36,3.55,screenZ+.12],[mx+1.36,3.33,screenZ+.12],.025);
  const shutters=[];
  for(let i=0;i<3;i++) {
    const width=sw/3;
    const s=assembly(mx+(i-1)*width,.53+sh,screenZ+.07);
    box(s,i===1?teal:iron,0,-sh/2,0,width-.017,sh,.045);
    for(let j=0;j<16;j++) box(s,j%4?deep:iron,0,-sh*(j+.5)/16,.036,width-.021,.023,.024);
    box(s,brass,0,-sh+.1,.052,.21,.035,.027);
    shutters.push(s);
  }

  // The hull pinches to a high curved stem; rings run across the keel
  // rather than submerging a scaled sphere to approximate a boat.
  function hull(parent, length, width, height, material, x=0,y=0,z=0, open=false) {
    const verts=[], faces=[], left=[], right=[];
    const segments=12;
    for(let i=0;i<=segments;i++) {
      const t=i/segments, u=t*2-1, half=Math.max(.015,Math.sin(t*Math.PI)**.70)*width/2;
      const px=x+u*length/2, gunwale=y+height*(.70+.39*u*u);
      verts.push(px,gunwale,z-half,px,y+height*.12,z-half*.75,px,y-.10+height*.19*u*u,z,px,y+height*.12,z+half*.75,px,gunwale,z+half);
      left.push([px,gunwale,z-half]); right.push([px,gunwale,z+half]);
      if(i) {
        const a=i*5-5;
        for(let k=0;k<4;k++) {const j=a+k; faces.push(j,j+1,j+5,j+1,j+6,j+5);}
        if(!open) faces.push(a,a+5,a+4,a+4,a+5,a+9);
      }
    }
    material.side=T.DoubleSide;
    add(parent,gFromFaces(verts,faces),material,0,0,0);
    for(let i=1;i<=segments;i++){
      rod(parent,white,left[i-1],left[i],.025);
      rod(parent,white,right[i-1],right[i],.025);
    }
  }
  function fishingBoat(x,z,scale=1,colour=teal) {
    const b=assembly(x,.03,z);
    hull(b,2.48,.76,.41,colour);
    box(b,wood,0,.31,0,1.47,.09,.46);
    box(b,wall,-.30,.50,0,.62,.36,.49);
    box(b,deep,-.30,.57,.253,.48,.15,.02);
    box(b,white,-.3,.57,.268,.026,.18,.027);
    box(b,red,-.30,.74,0,.78,.095,.63);
    rod(b,aged,[.33,.27,0],[.33,1.49,0],.038);
    rod(b,brass,[.33,1.35,0],[-.78,.36,0],.014);
    rod(b,iron,[.33,1.35,0],[1.13,.36,0],.012);
    rod(b,wood,[.31,1.08,0],[-.45,1.02,0],.022);
    box(b,red,.45,1.40,0,.22,.115,.016);
    for(const a of [-.72,.53,.76]) box(b,wood,a,.37,0,.12,.045,.47);
    b.scale.setScalar(scale);
    return b;
  }
  const boat=fishingBoat(-1,2.6,1.02,red);
  boat.rotation.y=-.17;
  const secretBoat=fishingBoat(5,2.2,.78,teal);
  secretBoat.rotation.y=.17;
  const boatLamp=ball(secretBoat,litGlass,-.14,.82,.2,.068);
  secretBoat.userData.lamp=boatLamp;
  const buoy=assembly(3.8,.02,2.9);
  cylinder(buoy,red,0,.15,0,.075,.19,.31,12);
  cylinder(buoy,white,0,.04,0,.18,.19,.09,12);
  rod(buoy,iron,[0,.25,0],[0,.57,0],.021);
  ball(buoy,orange,0,.56,0,.050);

  // Open boat shed. The dark frames stay on the keel blocks as the hull
  // rises, so its timber construction can be seen through the opening.
  const bx=-4.4,bz=-3.4;
  for(const xx of [bx-1.54,bx+1.54]) for(const zz of [bz-.80,bz+.80]) {
    box(fixed,wood,xx,1.48,zz,.13,2.15,.13);
    rod(fixed,wood,[xx,2.06,zz],[xx+(xx<bx?.38:-.38),2.46,zz],.052);
  }
  roof(bx,bz,2.53,3.62,2.1,.58);
  box(fixed,aged,bx,2.49,bz+.80,3.26,.16,.16);
  plaque(fixed,bx,2.48,bz+.90,1.63,.25,'BOATYARD');
  const cradle=assembly(bx,.86,bz);
  hull(cradle,2.75,1.04,.46,wood,0,.24,0,true);
  for(let i=-3;i<=3;i++) {
    const xx=bx+i*.31, zz=.43*Math.cos(i*.28);
    rod(fixed,wood,[xx,.62,bz],[xx,1.06,bz-zz],.046);
    rod(fixed,wood,[xx,.62,bz],[xx,1.06,bz+zz],.046);
    box(fixed,aged,xx,.55,bz,.12,.19,.91);
  }
  for(const dx of [-.75,.75]) for(const dz of [-.37,.37]) {
    rod(fixed,iron,[bx+dx,1.65,bz+dz],[bx+dx,2.56,bz+dz],.014);
  }

  // Signal house, its operating window, and an independently lit pane.
  const hx=5,hz=-2;
  box(fixed,wall,hx,1.44,hz,2.40,2.05,1.52);
  for(let i=0;i<9;i++) box(fixed,teal,hx-1.13+i*.28,.68,hz+.78,.25,.43,.048);
  roof(hx,hz,2.48,2.84,2.05,.69);
  box(fixed,deep,hx+.23,1.58,hz+.79,.98,.80,.075);
  const windowLight=add(group,unitBox,finish('#c28e4b',.42),hx+.23,1.58,hz+.84);
  windowLight.scale.set(.84,.65,.035);
  windowLight.material.emissive.set('#ff9f4a');
  windowLight.material.emissiveIntensity=.55;
  for(const dx of [-.21,0,.21]) box(fixed,wood,hx+.23+dx,1.58,hz+.87,.043,.69,.043);
  box(fixed,wood,hx+.23,1.58,hz+.87,.87,.038,.05);
  box(fixed,aged,hx-.79,1.17,hz+.78,.42,1.40,.10);
  plaque(fixed,hx+.14,2.22,hz+.79,1.71,.27,'SIGNAL HOUSE','#f6e4bd','#634739');
  const mastX=hx+1.40;
  rod(fixed,aged,[mastX,.42,hz],[mastX,3.81,hz],.041);
  rod(fixed,white,[mastX-.58,3.1,hz],[mastX+.58,3.1,hz],.034);
  for(let i=0;i<3;i++) box(fixed,[red,white,teal][i],mastX+.40,2.94-i*.23,hz,.24,.18,.018);
  for(let i=0;i<4;i++) {
    const x=3.6+i*.89;
    rod(fixed,wood,[x,.4,-1.25],[x,1.00,-1.25],.035);
    if(i<3) rod(fixed,iron,[x,.92,-1.25],[x+.89,.92,-1.25],.015);
  }

  // Mooring lines, enamel hull stripes and brass dock lamps give the quay scale.
  for(const x of [-2.7,2.98,6.7]) {
    cylinder(fixed,iron,x,.73,-.84,.055,.069,.66,8);
    cylinder(fixed,brass,x,1.11,-.84,.092,.078,.14,8);
    ball(fixed,litGlass,x,1.21,-.84,.073,.09,.073);
    cylinder(fixed,deep,x,1.31,-.84,.035,.11,.075,8);
  }
  for(const [a,b] of [[-6.25,-5.5],[-2.7,-1.8],[2.99,3.6]]) {
    for(let i=0;i<6;i++){
      const p=i/6,q=(i+1)/6;
      rod(fixed,aged,[a+(b-a)*p,.62-Math.sin(p*Math.PI)*.12,-.91],
        [a+(b-a)*q,.62-Math.sin(q*Math.PI)*.12,-.91],.014);
    }
  }
  for(const craft of [boat,secretBoat]){
    for(const side of [-1,1]){
      rod(craft,white,[-.76,.28,side*.35],[.52,.28,side*.349],.018);
      rod(craft,brass,[-.74,.49,side*.31],[-.74,.67,side*.31],.018);
    }
    for(let i=0;i<3;i++)cylinder(craft,aged,.12+i*.14,.38,0,.064,.07,.10,8);
  }
  // Merge rigid parts in each object's own coordinate space. Keep textures
  // on separate materials and preserve the secret boat's switchable lamp.
  const geometrySources=new Set();
  function batch(parent, keep=[]) {
    const byFinish=new Map();
    const parts=parent.children.filter(m=>m.isMesh && !keep.includes(m));
    for(const m of parts) {
      m.updateMatrix();
      const source=m.geometry;
      geometrySources.add(source);
      const geom=source.index?source.toNonIndexed():source.clone();
      for (const attr of Object.keys(geom.attributes)) {
        if (attr!=='normal' && attr!=='position' && !(attr==='uv' && m.material.map)) geom.deleteAttribute(attr);
      }
      geom.applyMatrix4(m.matrix);
      if(!byFinish.has(m.material)) byFinish.set(m.material,[]);
      byFinish.get(m.material).push(geom);
      parent.remove(m);
    }
    for(const [material,geoms] of byFinish) {
      const merged=mergeGeometries(geoms);
      const m=new T.Mesh(merged,material);
      parent.add(m);
      geoms.forEach(g=>g.dispose());
    }
  }
  for(const part of [fixed,sign,...shutters,cradle,boat,buoy]) batch(part);
  batch(secretBoat,[boatLamp]);
  const dynamicGeometries=new Set([lamp.geometry,windowLight.geometry,boatLamp.geometry]);
  for(const geometry of geometrySources) if(!dynamicGeometries.has(geometry)) geometry.dispose();
  for(const part of [sign,...shutters,cradle,lamp,windowLight,boat,secretBoat,buoy]) {
    part.userData.basePosition=part.position.clone();
    part.userData.baseRotation=part.rotation.clone();
    part.userData.baseScale=part.scale.clone();
  }
  return { group, shutters, sign, cradle, windowLight, lamp, boat, secretBoat, buoy };
}
