import test from 'node:test';
import assert from 'node:assert/strict';
import { berths,bearing,litBerth,nextSignal } from '../src/afterlight/bearings.js';

test('each named stop corresponds to its lighthouse bearing and a forgiving capture range',()=>{
  for(const b of berths){assert.equal(litBerth(b.dial+5),b);assert.equal(litBerth(b.dial-5),b);}
  assert.equal(litBerth(90),undefined);
  assert.equal(bearing(50),58);
  assert.equal(bearing(74),70);
  for(let i=1;i<=100;i++)assert.ok(bearing(i)>bearing(i-1));
});
test('the lamp answers the buoy before the bow crossing sets the fishing boat in motion',()=>{
  assert.equal(nextSignal('quiet',50,90),'quiet');
  assert.equal(nextSignal('quiet',90,98),'answered');
  assert.equal(nextSignal('answered',98,80),'sailing');
  assert.equal(nextSignal('sailing',80,99),'sailing');
});
