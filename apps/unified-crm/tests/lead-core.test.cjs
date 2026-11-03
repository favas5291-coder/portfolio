"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {normalizeLead,listQuery,escapeRegex,publicLead,STAGES}=require("../server/lead-core.cjs");
test("normalizes a valid international lead",()=>{
 const v=normalizeLead({name:"Example Client",email:" SALES@Example.com ",source:"website"});
 assert.equal(v.emailNormalized,"sales@example.com");assert.equal(v.stage,"new");assert.equal(v.currency,"INR");
});
test("rejects missing contact, unauthorized fields and invalid money",()=>{
 assert.throws(()=>normalizeLead({name:"Example Client"}),/Email or phone/);
 assert.throws(()=>normalizeLead({name:"Example",email:"bad"}),/Invalid email/);
 assert.throws(()=>normalizeLead({name:"Example",email:"a@b.com",workspace:"gymdrobe"}),/Unsupported/);
 assert.throws(()=>normalizeLead(JSON.parse('{"name":"Example","email":"a@b.com","__proto__":{"role":"admin"}}')),/Unsupported/);
 assert.throws(()=>normalizeLead({name:"Example",email:"a@b.com",estimatedValueMinor:1.1}),/integer/);
});
test("accepts expected pipeline stages and bounds pagination",()=>{
 assert.equal(STAGES.length,9);
 assert.throws(()=>normalizeLead({stage:"admin"},true),/Invalid stage/);
 assert.throws(()=>listQuery({limit:"1000"}),/pagination/);
 assert.deepEqual(listQuery({search:" ABC ",stage:"won"}),{page:1,limit:20,stage:"won",search:"ABC"});
});
test("search literal escaping and private field removal",()=>{
 const re=new RegExp(escapeRegex("a.*[b]"));
 assert.equal(re.test("a.*[b]"),true);assert.equal(re.test("aXXXb"),false);
 const p=publicLead({_id:"id",name:"Client",emailNormalized:"private",workspace:"fazhere",history:[{}]});
 assert.equal(p.emailNormalized,undefined);assert.equal(p.history,undefined);
});
