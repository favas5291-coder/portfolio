import assert from 'node:assert/strict';
import test from 'node:test';
import { advanceSpring, animationDelta, motionResponse } from '../src/scene/dynamics.js';

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
    advanceSpring(actual,speed,target,delta,motionResponse(true).spring);
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

test('native scroll catches up sooner without overshooting or changing the wheel response',()=>{
  const samples=[];
  for(const smoothed of [false,true]) {
    const response=motionResponse(smoothed),blend=1-Math.exp(-response.follow/60);
    let stage=0,camera=0;
    for(let frame=0;frame<36;frame++) {
      stage+=(1-stage)*blend;camera+=(stage-camera)*blend;
      assert.ok(stage>=0&&stage<=1&&camera>=0&&camera<=stage);
    }
    samples.push(camera);
  }
  assert.ok(samples[0]>0.95,'native view should be over 95% caught up within 600ms');
  assert.ok(samples[0]-samples[1]>0.1,'native input should not retain the old double-filter delay');
  assert.equal(motionResponse(true).follow,5);
  assert.equal(motionResponse(true).spring,1);
});

test('quicker native springs stay frame-rate independent at 20–120 fps',()=>{
  const results=[];
  for(const fps of [20,30,60,90,120]) {
    const position=vector(1,-2,3),velocity=vector(),target=vector(-2,0.8,1);
    for(let frame=0;frame<fps/2;frame++)advanceSpring(position,velocity,target,1/fps,motionResponse(false).spring);
    results.push(position);
  }
  for(const result of results)assert.ok(distance(result,results[0])<1e-11);
  const settling=[];
  for(const smoothed of [false,true]) {
    const position=vector(1,-2,3),velocity=vector(),target=vector(-2,0.8,1);
    const tolerance=distance(position,target)*0.02;let lastOutside=0;
    for(let frame=0;frame<120;frame++) {
      advanceSpring(position,velocity,target,1/60,motionResponse(smoothed).spring);
      if(distance(position,target)>tolerance)lastOutside=(frame+1)/60;
    }
    settling.push(lastOutside);
  }
  assert.ok(settling[0]<settling[1]*0.9,'native spring should settle sooner, including its overshoot');
});
