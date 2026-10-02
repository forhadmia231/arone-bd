const test=require('node:test');const assert=require('node:assert/strict');
const {amount,validCost,dateFromDhakaISO,dhakaDay,calculateReport}=require('../lib/finance-rules.cjs');
test('money fields reject decimals, negatives, string coercion and excess',()=>{
  for(const n of [-1,1.1,'300',NaN,1_000_000_001,Infinity])assert.equal(amount(n),null);
  assert.equal(amount(0),0);assert.equal(amount(1250),1250);
});
test('order costs require all five explicit amounts',()=>{
 const row={productCost:500,packagingCost:20,courierCost:80,adsCost:50,otherCost:0};
 assert.deepEqual(validCost(row),row);assert.equal(validCost({...row,courierCost:-1}),null);
 assert.equal(validCost({productCost:500}),null);
});
test('Dhaka dates parse strictly',()=>{
 assert.equal(dhakaDay(dateFromDhakaISO('2026-09-29')),'2026-09-29');
 assert.equal(dateFromDhakaISO('2026-02-30'),null);assert.equal(dateFromDhakaISO('2026-9-29'),null);
});
test('current delivered only; uncosted orders do not invent profit; voided expenses excluded',()=>{
 const orders=[
  {createdAt:'2026-09-29T01:00:00.000Z',status:'DELIVERED',total:1200,costRecord:{productCost:500,packagingCost:20,courierCost:80,adsCost:50,otherCost:0}},
  {createdAt:'2026-09-29T01:00:00.000Z',status:'DELIVERED',total:500,costRecord:null},
  {createdAt:'2026-09-29T01:00:00.000Z',status:'CANCELLED',total:900,costRecord:{productCost:100,packagingCost:0,courierCost:0,adsCost:0,otherCost:0}}
 ];
 const expenses=[{incurredOn:'2026-09-28T18:00:00.000Z',amount:100,voidedAt:null},{incurredOn:'2026-09-28T18:00:00.000Z',amount:200,voidedAt:new Date()}];
 const {summary}=calculateReport(orders,expenses,1,new Date('2026-09-28T18:00:00.000Z'));
 assert.equal(summary.deliveredValue,1700);assert.equal(summary.costedValue,1200);
 assert.equal(summary.uncostedCount,1);assert.equal(summary.directCost,650);assert.equal(summary.sharedExpense,100);
 assert.equal(summary.partialResult,450);assert.equal(summary.completeCostCoverage,false);
});
test('only dates in window counted',()=>{
 const r=calculateReport([{createdAt:'2026-09-27T12:00:00Z',status:'DELIVERED',total:900,costRecord:null}],[],1,new Date('2026-09-28T18:00:00Z'));
 assert.equal(r.summary.deliveredValue,0);
});
