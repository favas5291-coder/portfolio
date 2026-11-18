import { Mesh, MeshLambertMaterial, PlaneGeometry } from 'three';
import { canvasTexture, seeded } from './craft.js';
import { BUILDINGS, STOPS, TREE_SITES } from './layout.js';

const minX=-30, minZ=-31, width=60, depth=55;

export function makeGround(root) {
  const texture=canvasTexture(1536,1408,(ctx,w,h)=>{
    const rand=seeded(5291);
    ctx.scale(w/width,h/depth);
    ctx.translate(-minX,-minZ);
    ctx.fillStyle='#a3ae80';
    ctx.fillRect(minX,minZ,width,depth);
    // Irregular ochre gravel pads under each set of storefronts.
    for (const [x,z,r,colour] of [[0,-14,11,'#cabd9a'],[-15,-14,8,'#c7b893'],[16,-13,8,'#cabc9d'],[-15,2,7,'#d3bf92'],[16,4,7,'#cabea0']]) {
      ctx.fillStyle=colour;ctx.beginPath();
      for(let i=0;i<28;i++){const angle=i*Math.PI/14, rr=r*(.92+rand()*.11); const xx=x+Math.cos(angle)*rr,zz=z+Math.sin(angle)*rr*.73;i?ctx.lineTo(xx,zz):ctx.moveTo(xx,zz);}
      ctx.closePath();ctx.fill();
    }
    const roads=[
      p=>{p.moveTo(-22,-6.5);p.bezierCurveTo(-11,-6.6,-6,-5.9,.6,-6.6);p.bezierCurveTo(7,-7.3,13,-8.2,19,-7.3);p.bezierCurveTo(25,-6.2,24,1.6,23,6.6);p.bezierCurveTo(21,16,8,15,1,14.4);p.bezierCurveTo(-7,14,-18,16,-22,11);p.bezierCurveTo(-26,6,-26,-4,-22,-6.5);},
      p=>{p.moveTo(1,14.7);p.bezierCurveTo(.2,9.6,-1.6,6.4,-.35,2.9);p.bezierCurveTo(.4,.2,.2,-3.3,.1,-6.4);},
      p=>{p.moveTo(-23,8.7);p.bezierCurveTo(-15.1,9.4,-8,8.8,0,10.1);p.bezierCurveTo(8.4,11.2,15,8.6,22.8,8.9);},
      p=>{p.moveTo(8.5,-7.5);p.bezierCurveTo(9,-12,9.6,-18.5,8.7,-22);p.bezierCurveTo(8.5,-26,-3,-24.8,-7,-23);p.bezierCurveTo(-9.8,-21,-9.5,-12,-8.5,-6.9);},
    ].map(draw=>{const path=new Path2D();draw(path);return path;});
    ctx.lineCap='round';ctx.lineJoin='round';
    const widths=[5,5.65,4.1,3.65];
    // Lay all verges first so intersecting roads share clean junctions.
    for(const [extra,colour] of [[1.0,'#b99f7b'],[.52,'#e0ccae'],[0,'#88877c']]) {
      roads.forEach((road,i)=>{ctx.strokeStyle=colour;ctx.lineWidth=widths[i]+extra;ctx.stroke(road);});
    }
    ctx.strokeStyle='#d9c594'; ctx.lineWidth=.09;
    ctx.setLineDash([.87,1.12]); ctx.stroke(roads[0]); ctx.setLineDash([]);
    // A faded line at the spawn corner and crossing beside the gym.
    ctx.strokeStyle='#ede3c8';ctx.lineWidth=.23; ctx.lineCap='butt';
    for(let i=0;i<7;i++){ctx.beginPath();ctx.moveTo(4.1+i*.39,-4.5);ctx.lineTo(4.45+i*.39,-8.9);ctx.stroke();}
    STOPS.forEach(({x,z})=>{
      ctx.lineWidth=.07;ctx.strokeStyle='#eee1bf';
      for(const side of [-1,1]){const lx=x+side*1.25;ctx.beginPath();ctx.moveTo(lx,z-1.7);ctx.lineTo(lx,z+1.7);ctx.lineTo(lx-side*.45,z+1.7);ctx.stroke();}
    });
    // Fine, persistent contact shading where concrete or plants meet earth.
    // It keeps the scene grounded even on drivers using a single shadow pass.
    function patch(x, z, rx, rz, strength) {
      ctx.save();
      ctx.translate(x, z); ctx.scale(rx, rz);
      const shade = ctx.createRadialGradient(0, 0, .15, 0, 0, 1);
      shade.addColorStop(0, 'rgba(47,47,34,' + strength + ')');
      shade.addColorStop(.72, 'rgba(47,47,34,' + strength * .7 + ')');
      shade.addColorStop(1, 'rgba(47,47,34,0)');
      ctx.fillStyle = shade; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
    }
    for (const site of BUILDINGS) {
      patch(site.x + .12, site.z + .4, site.width * .76, site.depth * .89, .32);
    }
    for (const tree of TREE_SITES) patch(tree.x, tree.z, 1.20 * tree.size, 1.09 * tree.size, .32);
    // Programme the road surface as paint and cast iron, keeping the lane
    // markings, drain inlets and fading wear in the same inexpensive ground map.
    const grate = (x, z, turn) => {
      ctx.save(); ctx.translate(x,z); ctx.rotate(turn);
      ctx.fillStyle='#585e55'; ctx.fillRect(-.44,-.16,.88,.32);
      ctx.strokeStyle='#a49f8b'; ctx.lineWidth=.023; ctx.strokeRect(-.44,-.16,.88,.32);
      ctx.fillStyle='#8d8e7e';
      for(let i=0;i<9;i++) ctx.fillRect(-.38+i*.092,-.11,.035,.22);
      ctx.restore();
    };
    grate(-2.5, 4.6, -.16); grate(3.0, 3.1, 1.48); grate(5.9,-9.42,-.11);
    grate(-13.5,-10.01,0); grate(14.4,11.05,-.04);
    for(const [x,z] of [[1.33,6.0],[-11,-6.3],[6.0,10.3],[8.7,-12.8]]) {
      ctx.save();ctx.translate(x,z);ctx.rotate(.47);
      ctx.fillStyle='#75796e'; ctx.strokeStyle='#a7a291'; ctx.lineWidth=.025;
      ctx.beginPath();ctx.arc(0,0,.31,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.arc(0,0,.23,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#595f56';for(let i=0;i<4;i++) ctx.fillRect(-.11+i*.068,-.10,.024,.2);
      ctx.restore();
    }
    ctx.save();ctx.translate(-.60,-1.25);ctx.rotate(.04);
    ctx.fillStyle='rgba(231,218,181,.72)';
    ctx.fillRect(-.082,-.4,.164,1.14);
    ctx.beginPath();ctx.moveTo(-.50,-.35);ctx.lineTo(0,-1.01);ctx.lineTo(.50,-.35);ctx.lineTo(.29,-.30);
    ctx.lineTo(0,-.63);ctx.lineTo(-.30,-.30);ctx.closePath();ctx.fill();ctx.restore();
    // Road grit and leaf litter drawn into a single, deterministic diffuse map.
    for(let i=0;i<9000;i++){
      const x=minX+rand()*width,z=minZ+rand()*depth;
      ctx.fillStyle=i%3===0?'rgba(255,239,194,.14)':'rgba(71,65,46,.12)';
      ctx.fillRect(x,z,.014+rand()*.065,.014+rand()*.04);
    }
  });
  texture.anisotropy=2;
  const mesh = new Mesh(new PlaneGeometry(width,depth),new MeshLambertMaterial({map:texture,color:0xe9e7df}));
  mesh.rotation.x=-Math.PI/2;mesh.position.set(minX+width/2,-.014,minZ+depth/2);
  mesh.receiveShadow=true;root.add(mesh);
}
