// Measure the exported triangles with the running camera path and hinge curves.
// Texture decoding is unnecessary for distance tests. Transparent glazing stays
// solid for clearance; only the material's alpha mode is used for sightlines.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {readGeometry} from './read-geometry.mjs';
import {MeshBVH,acceleratedRaycast} from 'three-mesh-bvh';
import {positionCamera,doorPose} from '../../src/appointment/visit.js';
import {focalTargets,studioAssets} from '../../src/appointment/scene.config.ts';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const out=process.argv[2] || resolve(root,'docs/appointment/gate-1/clearance.json');
const scene=new THREE.Scene(), meshes=[], records=[];
const point=new THREE.Vector3(), inverse=new THREE.Matrix4(), scale=new THREE.Vector3();
const hitInfo={point:new THREE.Vector3(),faceIndex:0,distance:0};
for(const asset of ['car','shell','tree']) {
  const file=await readFile(resolve(root,'public',studioAssets[asset].slice(1)));
  const model=await readGeometry(file);
  scene.add(model);
  let triangles=0;
  model.traverse(node=>{
    if(!node.isMesh) return;
    node.userData.gate1Asset=asset;
    node.geometry.boundsTree=new MeshBVH(node.geometry);
    node.geometry.computeBoundingBox();
    node.raycast=acceleratedRaycast;
    node.material.side=THREE.DoubleSide;
    triangles+=node.geometry.index.count/3;
    meshes.push(node);
  });
  records.push({asset,sha256:createHash('sha256').update(file).digest('hex'),triangles});
}
const passenger=scene.getObjectByName('PassengerHinge'), entrance=scene.getObjectByName('EntranceHinge');
const passengerClosed=passenger.rotation.y,entranceClosed=entrance.rotation.y;
// The optimized car merges surfaces by material. Isolate fixed triangles
// above the headliner datum to check the opening's header independently.
const roofPoints=[], v=new THREE.Vector3();
scene.updateMatrixWorld(true);
for(const node of meshes.filter(mesh=>mesh.userData.gate1Asset==='car')) {
  let moving=false;
  node.traverseAncestors(ancestor=>{if(ancestor===passenger)moving=true;});
  if(moving) continue;
  const geo=node.geometry;
  for(let i=0;i<geo.index.count;i+=3) {
    const corners=[];
    for(let j=0;j<3;j++) {
      v.fromBufferAttribute(geo.getAttribute('position'),geo.index.getX(i+j)).applyMatrix4(node.matrixWorld);
      if(v.y<1.36 || v.x<4.60 || v.x>7.60) break;
      corners.push(v.x,v.y,v.z);
    }
    if(corners.length===9) roofPoints.push(...corners);
  }
}
const roof=new THREE.BufferGeometry();
roof.setAttribute('position',new THREE.Float32BufferAttribute(roofPoints,3));
const roofBVH=new MeshBVH(roof);
const camera=new THREE.PerspectiveCamera(65,1,.025,140);
const minima={};
function pose(p,aspect=960/750,compact=false) {
  const doors=doorPose(p);passenger.rotation.y=passengerClosed+doors.passenger;entrance.rotation.y=entranceClosed+doors.entrance;
  scene.updateMatrixWorld(true);
  camera.aspect=aspect;camera.updateProjectionMatrix();positionCamera(camera,p,compact);
}
function minRecord(key,distance,p,node) {
  if(!minima[key] || distance<minima[key].distanceM) minima[key]={distanceM:distance, progress:p,mesh:node.name};
}
function categories(node,p) {
  const step=p<=.218?'exit':p<=.49?'entrance':'return';
  const tags=['fullPath',step];
  if(p<=.218 && node.userData.gate1Asset==='car') {
    tags.push(node.parent===passenger || node.name.includes('PassengerHinge') ? 'movingPassengerDoor':'fixedCar');
  }
  if(p<=.218 && node.userData.gate1Asset==='shell' && /^Site_/.test(node.name)) tags.push('pavementAndKerb');
  if(p>=.25 && p<=.49 && (node.parent===entrance || node.name.startsWith('Door_'))) tags.push('movingEntranceDoor');
  return tags;
}
function signature() {
  return [...camera.position.toArray(),...camera.quaternion.toArray(),camera.fov,
    passenger.rotation.y,entrance.rotation.y];
}
const forward=[];
let maxNearRadius=0;
for(let i=0;i<=2000;i++) {
  const p=i/2000;pose(p);
  // The farthest point of the entire perspective near rectangle is a corner.
  for(const [aspect,compact] of [[960/750,false],[390/386,true]]) {
    camera.aspect=aspect;camera.updateProjectionMatrix();positionCamera(camera,p,compact);
    maxNearRadius=Math.max(maxNearRadius,point.set(1,1,-1).unproject(camera).distanceTo(camera.position));
  }
  forward.push(signature());
  if(p<=.218){
    const roofHit=roofBVH.closestPointToPoint(camera.position,hitInfo);
    minRecord('fixedUpperCarTriangles',roofHit.distance,p,{name:'Fixed car at or above +1.36 m'});
  }
  for(const node of meshes) {
    inverse.copy(node.matrixWorld).invert();point.copy(camera.position).applyMatrix4(inverse);
    scale.setFromMatrixScale(node.matrixWorld);
    const lowerBound=node.geometry.boundingBox.distanceToPoint(point)*Math.min(scale.x,scale.y,scale.z);
    const tags=categories(node,p);
    if(tags.every(tag=>minima[tag] && lowerBound>=minima[tag].distanceM)) continue;
    const hit=node.geometry.boundsTree.closestPointToPoint(point,hitInfo);
    if(hit) {
      const d=point.copy(hit.point).applyMatrix4(node.matrixWorld).distanceTo(camera.position);
      for(const tag of tags) minRecord(tag,d,p,node);
    }
  }
}
let maxReverseDelta=0;
for(let i=2000;i>=0;i--) {
  pose(i/2000,390/386,true);
  signature().forEach((n,j)=>{maxReverseDelta=Math.max(maxReverseDelta,Math.abs(n-forward[i][j]));});
}
const caster=new THREE.Raycaster(),checks={};
caster.firstHitOnly=true;
function sightline(label,at,target) {
  pose(at);
  const [x,y,z]=target,end=new THREE.Vector3(x,z,-y);
  const v=end.clone().sub(camera.position);
  caster.near=0;caster.far=v.length() + (label.includes('Hub')||label.includes('Foot') ? .25 : .025);caster.set(camera.position,v.normalize());
  const hits=caster.intersectObjects(meshes,false).map(hit=>({mesh:hit.object.name,asset:hit.object.userData.gate1Asset,
    material:hit.object.material.name,passThrough:hit.object.material.transparent,distanceM:+hit.distance.toFixed(4)}));
  const projections={};
  for(const [layout,aspect,compact] of [['desktop',960/750,false],['phone',390/386,true]]) {
    pose(at,aspect,compact);
    const ndc=end.clone().project(camera);
    projections[layout]=[(ndc.x+1)/2,(1-ndc.y)/2].map(n=>+n.toFixed(4));
  }
  checks[label]={pointENU:target,projections,hits};
}
sightline('passengerToEntrance',0,focalTargets.entry);sightline('passengerToLitOffice',0,focalTargets.officeLight);
for(const [name,point] of [['west',focalTargets.westWheel],['east',focalTargets.eastWheel]]) {
  sightline(name+'Hub',1,point);
  sightline(name+'HubFace',1,[point[0]+.021,-5.79,.33]);
  sightline(name+'TyreFoot',1,[point[0],point[1],.03]);
  sightline(name+'LowerTyre',1,[point[0],-5.84,.038]);
}
const computed={models:records,samples:2001,progressStep:.0005,maxReversePoseDelta:maxReverseDelta,
  eyeSphereRadiusM:.12,minimumEyeCentreToMesh:minima,maxNearCornerRadiusM:maxNearRadius,
  conservativeNearPlaneClearanceM:minima.fullPath.distanceM-maxNearRadius,
  conservativeEyeVolumeClearanceM:minima.fullPath.distanceM-.12,sightlines:checks};
await mkdir(dirname(out),{recursive:true});
await writeFile(out,JSON.stringify(computed,null,2)+'\n');
console.log(JSON.stringify({minima,maxNearRadius,firstOpaque:Object.fromEntries(Object.entries(checks)
  .map(([key,val])=>[key,val.hits.find(hit=>!hit.passThrough)]))},null,2));

assert(minima.fullPath.distanceM>.12,'The sampled eye volume intersects an exported solid');
assert(minima.fullPath.distanceM>maxNearRadius,'A near-plane corner may intersect the set');
assert.equal(maxReverseDelta,0,'Reverse traversal changed the camera or a hinge pose');
for(const name of ['passengerToEntrance','passengerToLitOffice']) {
  assert(checks[name].hits.every(hit=>hit.passThrough),name+' is blocked');
}
for(const name of ['westHubFace','eastHubFace','westLowerTyre','eastLowerTyre']) {
  assert.equal(checks[name].hits.find(hit=>!hit.passThrough)?.asset,'car',name+' is blocked');
}
