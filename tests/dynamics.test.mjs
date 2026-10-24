import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceSpring, animationDelta } from '../src/scene/dynamics.js';

const vector=(x=0,y=0,z=0)=>({x,y,z});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
test('60 Hz springs retain the approved laptop integration exactly',()=>{
  const actual=vector(2,-1,0.2),speed=vector(0.2,-0.3,0.5),target=vector(-1,1,0.5);
  const expected={...actual},expectedSpeed={...speed},delta=1/60;
  for(let frame=0;frame<180;frame++) {
    for(const axis of ['x','y','z']) {
      expectedSpeed[axis]=(expectedSpeed[axis]+(target[axis]-expected[axis])*75*delta)*Math.exp(-13*delta);
      expected[axis]+=expectedSpeed[axis]*delta;
    }
    advanceSpring(actual,speed,target,delta);
    assert.ok(distance(actual,expected)<1e-12);
  }
});
test('spring timing is equivalent at 20, 30, 60, 90 and 120 fps',()=>{
  const results=[];
  for(const fps of [20,30,60,90,120]) {
    const position=vector(1,-2,3),velocity=vector(),target=vector(-2,0.8,1);
    for(let i=0;i<fps/2;i++)advanceSpring(position,velocity,target,1/fps);
    results.push(position);
  }
  for(const result of results)assert.ok(distance(result,results[0])<1e-11);
});
test('idle/resume gaps do not fast-forward the opening; active slow frames retain elapsed time',()=>{
  assert.equal(animationDelta(5),1/60);
  assert.equal(animationDelta(0),1/60);
  assert.equal(animationDelta(1/20),1/20);
  assert.equal(animationDelta(1/10),1/10);
});
