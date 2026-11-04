import test from 'node:test';
import assert from 'node:assert/strict';
import { serveLuxvibe } from '../scripts/serve-demo.mjs';

async function request(url, method='GET') {
  const headers={};let body;let next=false;
  const res={statusCode:200,setHeader:(k,v)=>headers[k]=v,end:value=>body=value};
  await serveLuxvibe('public')({url,method},res,()=>next=true);
  return {status:res.statusCode,headers,body:body?.toString(),next};
}
test('nested demo serves its own HTML and ES modules without portfolio fallback',async()=>{
 const html=await request('/demos/luxvibe/');assert.equal(html.status,200);assert.match(html.body,/<title>Luxvibe/);assert.equal(html.headers['X-Robots-Tag'],'noindex, nofollow');assert.equal(html.next,false);
 const js=await request('/demos/luxvibe/app.js');assert.match(js.headers['Content-Type'],/javascript/);assert.match(js.body,/const ASSETS=/);
});
test('demo assets, HEAD and trailing-slash redirect remain correct',async()=>{
 const asset=await request('/demos/luxvibe/assets/hero-640.webp','HEAD');assert.equal(asset.status,200);assert.equal(asset.body,undefined);assert.equal(asset.headers['Content-Type'],'image/webp');
 const redirect=await request('/demos/luxvibe?preview=1');assert.equal(redirect.status,301);assert.equal(redirect.headers.Location,'/demos/luxvibe/?preview=1');
});
test('unknown files, traversal, malformed paths and mutations are rejected',async()=>{
 for(const path of ['missing.js','%2e%2e%2f%2e%2e%2fpackage.json'])assert.equal((await request('/demos/luxvibe/'+path)).status,404);
 assert.equal((await request('/demos/luxvibe/%ZZ')).status,400);assert.equal((await request('/demos/luxvibe/','POST')).status,405);
 assert.equal((await request('/projects/gymdrobe/')).next,true);
});
