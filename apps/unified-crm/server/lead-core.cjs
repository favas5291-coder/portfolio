"use strict";
const STAGES = Object.freeze(["new", "qualified", "contacted", "replied", "discovery", "proposal", "negotiation", "won", "lost"]);
const SOURCES = Object.freeze(["manual", "website", "referral", "linkedin", "email", "other"]);
const LIMITS = Object.freeze({name:100, company:150, email:254, phone:32, country:100, service:120, sourceReference:255, budget:120, notes:4000});
const ALLOWED = new Set([...Object.keys(LIMITS), "stage", "source", "currency", "estimatedValueMinor", "nextFollowupAt"]);
function invalid(message) { const e = new Error(message); e.status=400; return e; }
function normalizeLead(payload, partial=false) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw invalid("A lead object is required.");
  const keys=Object.keys(payload);
  if (!keys.length || keys.some(k=>!ALLOWED.has(k))) throw invalid("Unsupported or empty lead fields.");
  const v={};
  for(const [key,value] of Object.entries(payload)) {
    if(Object.hasOwn(LIMITS,key)) {
      if(typeof value !== "string") throw invalid(key+" must be text.");
      const s=value.trim();
      if(s.length>LIMITS[key] || /[\u0000-\u001f\u007f]/.test(s)) throw invalid(key+" is invalid or too long.");
      v[key]=s;
    } else if(key==="stage") {
      if(!STAGES.includes(value)) throw invalid("Invalid stage."); v.stage=value;
    } else if(key==="source") {
      if(!SOURCES.includes(value)) throw invalid("Invalid source."); v.source=value;
    } else if(key==="currency") {
      if(typeof value!=="string" || !/^[a-z]{3}$/i.test(value)) throw invalid("Invalid ISO currency."); v.currency=value.toUpperCase();
    } else if(key==="estimatedValueMinor") {
      if(!Number.isSafeInteger(value) || value<0) throw invalid("Expected nonnegative integer minor units."); v.estimatedValueMinor=value;
    } else if(key==="nextFollowupAt") {
      if(value!==null && (typeof value!=="string" || !Number.isFinite(Date.parse(value)))) throw invalid("Invalid follow-up date.");
      v.nextFollowupAt=value===null ? null : new Date(value);
    }
  }
  if((!partial || v.name!==undefined) && (!v.name || v.name.length<2)) throw invalid("Name must have at least two characters.");
  if(!partial && !v.email && !v.phone) throw invalid("Email or phone is required.");
  if(v.email!==undefined) {
    if(v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) throw invalid("Invalid email.");
    v.emailNormalized=v.email.toLowerCase();
  }
  if(v.phone && (!/^[+()\d\s.-]+$/.test(v.phone) || v.phone.replace(/\D/g,"").length<7 || v.phone.replace(/\D/g,"").length>15)) throw invalid("Invalid international phone.");
  if(!partial) { v.stage??="new"; v.source??="manual"; v.currency??="INR"; v.estimatedValueMinor??=0; }
  return v;
}
function listQuery(query={}) {
  const number=(x,fallback,max)=>{if(x===undefined)return fallback;if(typeof x!=="string" || !/^[1-9]\d{0,5}$/.test(x) || Number(x)>max) throw invalid("Invalid pagination.");return Number(x);};
  const page=number(query.page,1,100000), limit=number(query.limit,20,50);
  const stage=query.stage||""; if(stage && !STAGES.includes(stage)) throw invalid("Invalid stage.");
  const search=typeof query.search==="string" ? query.search.trim() : "";
  if(search.length>100) throw invalid("Search is too long.");
  return {page,limit,stage,search};
}
function escapeRegex(v){return v.split("").map(c => "\\^$.*+?()[]{}|".includes(c) ? "\\"+c : c).join("");}
function publicLead(doc,withHistory=false) {
  const x=typeof doc.toObject==="function" ? doc.toObject() : doc;
  const value={id:String(x._id),name:x.name,company:x.company||"",email:x.email||"",phone:x.phone||"",country:x.country||"",
    service:x.service||"",budget:x.budget||"",source:x.source,sourceReference:x.sourceReference||"",stage:x.stage,
    notes:x.notes||"",currency:x.currency,estimatedValueMinor:x.estimatedValueMinor,
    nextFollowupAt:x.nextFollowupAt||null,revision:x.revision||0,createdAt:x.createdAt,updatedAt:x.updatedAt};
  if(withHistory)value.history=x.history||[];
  return value;
}
module.exports={STAGES,SOURCES,normalizeLead,listQuery,escapeRegex,publicLead};
