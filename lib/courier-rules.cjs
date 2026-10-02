'use strict';
const STATES = Object.freeze(['DRAFT','BOOKED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RETURNED','CANCELLED']);
const TRANSITIONS = Object.freeze({
  DRAFT:['BOOKED','CANCELLED'],
  BOOKED:['IN_TRANSIT','OUT_FOR_DELIVERY','FAILED','CANCELLED'],
  IN_TRANSIT:['OUT_FOR_DELIVERY','DELIVERED','FAILED','RETURNED'],
  OUT_FOR_DELIVERY:['DELIVERED','FAILED','RETURNED'],
  FAILED:['IN_TRANSIT','RETURNED','CANCELLED'],
  DELIVERED:['RETURNED'],
  RETURNED:[], CANCELLED:[]
});
function canTransition(from,to){return from===to || !!TRANSITIONS[from]?.includes(to);}
function cleanText(value,max){return typeof value==='string'?value.trim().slice(0,max+1):'';}
function safeTrackingUrl(value){
 if(value===''||value==null)return '';
 if(typeof value!=='string'||value.length>400)return null;
 try {const u=new URL(value);return u.protocol==='https:'&&u.hostname&&(!u.username&&!u.password)?u.href:null;}catch{return null;}
}
function moneyInt(value,max=2000000000){return Number.isSafeInteger(value)&&value>=0&&value<=max;}
function validateCourierFields(body){
 const courierName=cleanText(body?.courierName,60);
 const consignmentId=cleanText(body?.consignmentId??'',100);
 const trackingUrl=safeTrackingUrl(body?.trackingUrl??'');
 if(courierName.length<2||courierName.length>60) return {error:'Courier name must be 2–60 characters.'};
 if(consignmentId.length>100) return {error:'Consignment ID is too long.'};
 if(trackingUrl===null) return {error:'Tracking URL must be an HTTPS address of up to 400 characters.'};
 return {courierName,consignmentId,trackingUrl};
}
module.exports={STATES,TRANSITIONS,canTransition,cleanText,safeTrackingUrl,moneyInt,validateCourierFields};
