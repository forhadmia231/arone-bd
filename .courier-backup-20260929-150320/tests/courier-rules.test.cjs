const test=require('node:test');
const assert=require('node:assert/strict');
const {STATES,canTransition,safeTrackingUrl,moneyInt,validateCourierFields}=require('../lib/courier-rules.cjs');
test('all expected states exist and status progression is restricted',()=>{
 assert.equal(STATES.length,8);
 assert.equal(canTransition('DRAFT','BOOKED'),true);
 assert.equal(canTransition('DRAFT','DELIVERED'),false);
 assert.equal(canTransition('BOOKED','IN_TRANSIT'),true);
 assert.equal(canTransition('OUT_FOR_DELIVERY','DELIVERED'),true);
 assert.equal(canTransition('DELIVERED','RETURNED'),true);
 assert.equal(canTransition('RETURNED','BOOKED'),false);
 assert.equal(canTransition('DELIVERED','DELIVERED'),true);
});
test('tracking links are HTTPS only and no credentials are accepted',()=>{
 assert.equal(safeTrackingUrl('https://courier.example/track?x=1'),'https://courier.example/track?x=1');
 assert.equal(safeTrackingUrl('javascript:alert(1)'),null);
 assert.equal(safeTrackingUrl('http://courier.example'),null);
 assert.equal(safeTrackingUrl('https://user:pass@courier.example'),null);
 assert.equal(safeTrackingUrl(''),'');
});
test('manual COD entries accept only safe non-negative integers',()=>{
 assert.equal(moneyInt(1200),true);
 for(const n of [-1,1.1,NaN,Infinity,'1200',2000000001])assert.equal(moneyInt(n),false);
});
test('courier input is validated and trimmed',()=>{
 assert.deepEqual(validateCourierFields({courierName:' Steadfast ',consignmentId:' 001 ',trackingUrl:''}),{courierName:'Steadfast',consignmentId:'001',trackingUrl:''});
 assert.ok(validateCourierFields({courierName:'',trackingUrl:''}).error);
 assert.ok(validateCourierFields({courierName:'Own',trackingUrl:'http://example.com'}).error);
});
