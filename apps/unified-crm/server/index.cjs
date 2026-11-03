"use strict";
require("dotenv").config();
const express=require("express");
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const bcrypt=require("bcryptjs");
const path=require("node:path");
const Lead=require("./models/Lead.cjs");
const {STAGES,normalizeLead,listQuery,escapeRegex,publicLead}=require("./lead-core.cjs");

const app=express();
app.disable("x-powered-by");
const production=process.env.NODE_ENV==="production";
const SESSION="crm_session";
const sessionAgeMs=6*60*60*1000;
const attempts=new Map();

function validateConfig(){
 const required=["CRM_MONGODB_URI","CRM_ADMIN_EMAIL","CRM_ADMIN_PASSWORD_HASH","CRM_SESSION_SECRET","CRM_ORIGIN"];
 const missing=required.filter(k=>!process.env[k]?.trim());
 if(missing.length)throw Error("Missing CRM configuration: "+missing.join(", "));
 if(process.env.CRM_SESSION_SECRET.length<32)throw Error("Session secret is too short.");
 const url=new URL(process.env.CRM_ORIGIN);
 if(process.env.CRM_ORIGIN!==url.origin)throw Error("CRM_ORIGIN must be the origin without a trailing slash.");
 if(production && url.protocol!=="https:")throw Error("HTTPS is required in production.");
 if(!production && url.protocol==="http:" && !["localhost","127.0.0.1"].includes(url.hostname))throw Error("HTTP is only permitted on localhost.");
 if(!["https:","http:"].includes(url.protocol))throw Error("CRM_ORIGIN must use HTTPS.");
}
function cookieOptions(){
 return {httpOnly:true,secure:production,sameSite:"strict",path:"/",maxAge:sessionAgeMs};
}
function errorResponse(res,error){
 const status=error.code===11000?409:error.status||(error.name==="ValidationError"?400:500);
 if(status>=500)console.error("CRM API failure:",error.name||"Error");
 const message=status===409?"This contact already exists.":status>=500?
   "The CRM could not complete the request.":error.message;
 return res.status(status).json({success:false,message});
}
function parseId(value){
 if(!mongoose.isObjectIdOrHexString(value)){const e=new Error("Invalid lead ID.");e.status=400;throw e;}
 return value;
}
function cookieValue(req){
 const pair=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(SESSION+"="));
 return pair?pair.slice(SESSION.length+1):"";
}
function ownerOnly(req,res,next){
 try{
  const payload=jwt.verify(cookieValue(req),process.env.CRM_SESSION_SECRET,{
   algorithms:["HS256"],issuer:"unified-crm",audience:"crm-owner",
  });
  if(payload.sub!=="owner"||payload.role!=="owner")throw Error("bad identity");
  req.actor="owner";next();
 }catch{return res.status(401).json({success:false,message:"Sign in to manage the CRM."});}
}
app.use((req,res,next)=>{
 res.set({
  "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
  "X-Frame-Options":"DENY",
  "Content-Security-Policy":"default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'",
 });
 if(production)res.set("Strict-Transport-Security","max-age=31536000; includeSubDomains");
 next();
});
app.use("/api",(_req,res,next)=>{res.set("Cache-Control","no-store");next();});
app.use(express.json({limit:"24kb"}));
app.use("/api",(req,res,next)=>{
 if(["GET","HEAD","OPTIONS"].includes(req.method))return next();
 if(req.headers.origin!==process.env.CRM_ORIGIN||req.headers["x-crm-action"]!=="1"){
  return res.status(403).json({success:false,message:"The request origin could not be verified."});
 }
 next();
});
app.get("/api/health",(_req,res)=>res.json({
 success:true,service:"unified-crm",
 status:mongoose.connection.readyState===1?"ready":"unavailable",
}));
app.post("/api/auth/login",async(req,res)=>{
 try{
  const ip=req.ip||"unknown",now=Date.now();
  const latest=(attempts.get(ip)||[]).filter(t=>now-t<15*60*1000);
  if(latest.length>=8)return res.status(429).json({success:false,message:"Too many attempts. Try again later."});
  latest.push(now);attempts.set(ip,latest);
  if(attempts.size>2000){for(const [k,times] of attempts)if(times.every(t=>now-t>15*60*1000))attempts.delete(k);}
  const email=typeof req.body?.email==="string"?req.body.email.trim().toLowerCase():"";
  const password=typeof req.body?.password==="string"?req.body.password:"";
  const matches=password.length>0&&password.length<=256&&
    await bcrypt.compare(password,process.env.CRM_ADMIN_PASSWORD_HASH);
  if(email!==process.env.CRM_ADMIN_EMAIL.toLowerCase()||!matches){
   return res.status(401).json({success:false,message:"Email or password is incorrect."});
  }
  attempts.delete(ip);
  const token=jwt.sign({sub:"owner",role:"owner"},process.env.CRM_SESSION_SECRET,{
   algorithm:"HS256",issuer:"unified-crm",audience:"crm-owner",expiresIn:"6h",
  });
  res.cookie(SESSION,token,cookieOptions());
  return res.json({success:true,owner:{email:process.env.CRM_ADMIN_EMAIL}});
 }catch(error){return errorResponse(res,error);}
});
app.post("/api/auth/logout",(_req,res)=>{
 res.clearCookie(SESSION,{httpOnly:true,secure:production,sameSite:"strict",path:"/"});
 res.json({success:true});
});
app.get("/api/auth/me",ownerOnly,(_req,res)=>res.json({
 success:true,owner:{email:process.env.CRM_ADMIN_EMAIL},
}));
app.get("/api/overview",ownerOnly,async(_req,res)=>{
 try{
  const [total,stageCounts,overdue,values]=await Promise.all([
   Lead.countDocuments({workspace:"fazhere"}),
   Lead.aggregate([{$match:{workspace:"fazhere"}},{$group:{_id:"$stage",count:{$sum:1}}}]),
   Lead.countDocuments({workspace:"fazhere",stage:{$nin:["won","lost"]},nextFollowupAt:{$ne:null,$lte:new Date()}}),
   Lead.aggregate([{$match:{workspace:"fazhere",stage:{$nin:["won","lost"]}}},
    {$group:{_id:"$currency",valueMinor:{$sum:"$estimatedValueMinor"}}}]),
  ]);
  res.json({success:true,workspaces:{
   fazhere:{leadCount:total,overdueFollowups:overdue,
    pipeline:Object.fromEntries(STAGES.map(s=>[s,stageCounts.find(x=>x._id===s)?.count||0])),
    pipelineValueByCurrency:Object.fromEntries(values.map(v=>[v._id,v.valueMinor])),
    paidRevenue:null,outstandingInvoices:null},
   gymdrobe:{connection:"not_connected",orders:null,customers:null,paidRevenue:null},
  },automations:{state:"disabled",pendingApprovals:0}});
 }catch(error){errorResponse(res,error);}
});
app.get("/api/leads",ownerOnly,async(req,res)=>{
 try{
  const {page,limit,stage,search}=listQuery(req.query);
  const where={workspace:"fazhere"};
  if(stage)where.stage=stage;
  if(search){const pattern=new RegExp(escapeRegex(search),"i");
   where.$or=[{name:pattern},{company:pattern},{email:pattern}];
  }
  const [rows,total]=await Promise.all([
   Lead.find(where).sort({updatedAt:-1,_id:-1}).skip((page-1)*limit).limit(limit).lean(),
   Lead.countDocuments(where),
  ]);
  res.json({success:true,leads:rows.map(r=>publicLead(r)),page,limit,total});
 }catch(error){errorResponse(res,error);}
});
app.get("/api/leads/:id",ownerOnly,async(req,res)=>{
 try{
  const lead=await Lead.findOne({_id:parseId(req.params.id),workspace:"fazhere"}).lean();
  if(!lead)return res.status(404).json({success:false,message:"Lead not found."});
  res.json({success:true,lead:publicLead(lead,true)});
 }catch(error){errorResponse(res,error);}
});
app.post("/api/leads",ownerOnly,async(req,res)=>{
 try{
  const data=normalizeLead(req.body);
  const lead=await Lead.create({...data,workspace:"fazhere",
   history:[{kind:"created",actor:req.actor,fields:["created"],at:new Date()}]});
  res.status(201).json({success:true,lead:publicLead(lead)});
 }catch(error){errorResponse(res,error);}
});
app.patch("/api/leads/:id",ownerOnly,async(req,res)=>{
 try{
  if(!Number.isSafeInteger(req.body?.expectedRevision)||req.body.expectedRevision<0){
   return res.status(400).json({success:false,message:"Expected revision is required."});
  }
  const {expectedRevision,...input}=req.body;
  const changes=normalizeLead(input,true);
  const id=parseId(req.params.id);
  // Optimistic revision check prevents silent overwrites from simultaneous edits.
  const current=await Lead.findOne({_id:id,workspace:"fazhere",revision:expectedRevision}).lean();
  if(!current){
   const found=await Lead.exists({_id:id,workspace:"fazhere"});
   return res.status(found?409:404).json({success:false,message:found?
    "This lead was updated elsewhere. Refresh before saving.":"Lead not found."});
  }
  const email=changes.email===undefined?current.email:changes.email;
  const phone=changes.phone===undefined?current.phone:changes.phone;
  if(!email&&!phone)return res.status(400).json({success:false,message:"Keep at least one contact method."});
  const updated=await Lead.findOneAndUpdate({_id:id,workspace:"fazhere",revision:expectedRevision},
   {$set:changes,$inc:{revision:1},$push:{history:{kind:"updated",actor:req.actor,fields:Object.keys(input),at:new Date()}}},
   {new:true,runValidators:true});
  if(!updated)return res.status(409).json({success:false,message:"This lead was changed elsewhere. Refresh before saving."});
  res.json({success:true,lead:publicLead(updated)});
 }catch(error){errorResponse(res,error);}
});
app.use("/api",(_req,res)=>res.status(404).json({success:false,message:"API route not found."}));
const dist=path.join(__dirname,"..","dist");
app.use(express.static(dist,{index:false}));
app.get("/{*path}",(_req,res)=>res.sendFile(path.join(dist,"index.html")));
app.use((error,_req,res,_next)=>errorResponse(res,error));

async function start(){
 validateConfig();
 const port=Number(process.env.PORT||4100);
 if(!Number.isSafeInteger(port)||port<1||port>65535)throw Error("Invalid PORT.");
 await mongoose.connect(process.env.CRM_MONGODB_URI,{serverSelectionTimeoutMS:10000,autoIndex:true});
 await Lead.createIndexes();
 const httpServer=app.listen(port,()=>console.log("Unified CRM listening on port "+port));
 const stop=()=>{httpServer.close(async()=>{await mongoose.disconnect();process.exit(0);});};
 process.once("SIGINT",stop);process.once("SIGTERM",stop);
}
if(require.main===module)start().catch(e=>{console.error("CRM startup failed:",e.name||"Error");process.exitCode=1;});
module.exports={app,validateConfig};
