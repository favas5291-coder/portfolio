"use strict";
const mongoose=require("mongoose");
const {STAGES,SOURCES}=require("../lead-core.cjs");
const historySchema=new mongoose.Schema({
  kind:{type:String,enum:["created","updated"],required:true},
  actor:{type:String,required:true},
  fields:{type:[String],default:[]},
  at:{type:Date,default:Date.now},
},{_id:false});
const schema=new mongoose.Schema({
  workspace:{type:String,enum:["fazhere"],required:true,immutable:true},
  name:{type:String,required:true,minlength:2,maxlength:100},
  company:{type:String,default:"",maxlength:150},
  email:{type:String,default:"",maxlength:254},
  emailNormalized:{type:String,default:"",select:false,maxlength:254},
  phone:{type:String,default:"",maxlength:32},
  country:{type:String,default:"",maxlength:100},
  service:{type:String,default:"",maxlength:120},
  budget:{type:String,default:"",maxlength:120},
  source:{type:String,enum:SOURCES,default:"manual"},
  sourceReference:{type:String,default:"",maxlength:255},
  stage:{type:String,enum:STAGES,default:"new"},
  notes:{type:String,default:"",maxlength:4000},
  currency:{type:String,default:"INR",match:/^[A-Z]{3}$/},
  estimatedValueMinor:{type:Number,default:0,min:0},
  nextFollowupAt:{type:Date,default:null},
  revision:{type:Number,default:0,min:0},
  history:{type:[historySchema],default:[]}
},{timestamps:true,versionKey:false});
schema.index({workspace:1,updatedAt:-1});
schema.index({workspace:1,stage:1,updatedAt:-1});
schema.index({workspace:1,nextFollowupAt:1});
schema.index({workspace:1,emailNormalized:1},{unique:true,partialFilterExpression:{emailNormalized:{$type:"string",$gt:""}}});
module.exports=mongoose.models.CrmLead||mongoose.model("CrmLead",schema);
