"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {spawn}=require("node:child_process");
const bcrypt=require("bcryptjs");
const mongoose=require("mongoose");

const mongoUri=process.env.CRM_TEST_MONGODB_URI;
test("real Mongo-backed CRM API: owner login, create, duplicate, revision, privacy",{
 skip:!mongoUri?"CRM_TEST_MONGODB_URI is not configured":false,
 timeout:60000,
},async()=>{
 const port=43517,base="http://127.0.0.1:"+port,origin="http://localhost:5175";
 const password="test-only-strong-password";
 const passwordHash=await bcrypt.hash(password,10);
 const env={...process.env,
  NODE_ENV:"development",PORT:String(port),CRM_MONGODB_URI:mongoUri,
  CRM_ADMIN_EMAIL:"owner@example.test",CRM_ADMIN_PASSWORD_HASH:passwordHash,
  CRM_SESSION_SECRET:"a".repeat(64),CRM_ORIGIN:origin,
 };
 const child=spawn(process.execPath,["server/index.cjs"],{cwd:process.cwd(),env,stdio:"ignore"});
 const call=async(route,method="GET",body,token,requestOrigin=origin)=>{
  const response=await fetch(base+"/api"+route,{
   method,headers:{"Accept":"application/json",...(method!=="GET"?{
    "Origin":requestOrigin,"X-CRM-Action":"1","Content-Type":"application/json",
   }:{}),...(token?{"Cookie":token}:{})},
   ...(body!==undefined?{body:JSON.stringify(body)}:{}),
  });
  return {status:response.status,body:await response.json(),cookie:response.headers.get("set-cookie")};
 };
 try{
  let ready=false;
  for(let i=0;i<100;i++){
   if(child.exitCode!==null)throw Error("CRM process ended before startup.");
   try{const check=await call("/health");if(check.body.status==="ready"){ready=true;break;}}catch{}
   await new Promise(r=>setTimeout(r,150));
  }
  assert.equal(ready,true,"CRM server should start against local MongoDB");
  assert.equal((await call("/overview")).status,401,"overview must be owner-only");
  assert.equal((await call("/auth/login","POST",{email:"owner@example.test",password},null,"https://evil.example")).status,403);
  const login=await call("/auth/login","POST",{email:"owner@example.test",password});
  assert.equal(login.status,200);
  assert.ok(login.cookie&&login.cookie.includes("HttpOnly")&&login.cookie.includes("SameSite=Strict"));
  const cookie=login.cookie.split(";")[0];
  const first=await call("/leads","POST",{name:"Integration Test Client",email:" Test@Example.com ",source:"website"},cookie);
  assert.equal(first.status,201);
  assert.equal(first.body.lead.stage,"new");
  assert.equal(first.body.lead.revision,0);
  const second=await call("/leads","POST",{name:"Another Client",email:"test@example.com"},cookie);
  assert.equal(second.status,409,"normalized email deduplicates real records");
  const overview=await call("/overview","GET",undefined,cookie);
  assert.equal(overview.body.workspaces.fazhere.leadCount,1);
  assert.equal(overview.body.workspaces.gymdrobe.connection,"not_connected");
  assert.equal(overview.body.workspaces.gymdrobe.paidRevenue,null);
  const id=first.body.lead.id;
  const patch=await call("/leads/"+id,"PATCH",{stage:"qualified",expectedRevision:0},cookie);
  assert.equal(patch.status,200);
  assert.equal(patch.body.lead.revision,1);
  const stale=await call("/leads/"+id,"PATCH",{stage:"contacted",expectedRevision:0},cookie);
  assert.equal(stale.status,409,"stale writes cannot overwrite the lead");
  const lookup=await call("/leads/"+id,"GET",undefined,cookie);
  assert.equal(lookup.body.lead.history.length,2);
  assert.equal(lookup.body.lead.emailNormalized,undefined);
  assert.equal((await call("/leads","POST",{name:"Blocked Contact",email:"x@y.com"},cookie,"https://evil.example")).status,403);
 }finally{
  child.kill("SIGTERM");
  await new Promise(r=>{if(child.exitCode!==null)return r();child.once("exit",r);setTimeout(r,5000).unref();});
  await mongoose.connect(mongoUri,{serverSelectionTimeoutMS:6000});
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
 }
});
