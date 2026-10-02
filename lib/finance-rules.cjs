'use strict';
const CATEGORIES = Object.freeze(['ADVERTISING','RENT','SALARY','UTILITIES','SOFTWARE','SUPPLIES','OTHER']);
const COST_FIELDS = Object.freeze(['productCost','packagingCost','courierCost','adsCost','otherCost']);
const OFFSET = 6 * 60 * 60 * 1000;
function dhakaDay(value) { return new Date(new Date(value).getTime() + OFFSET).toISOString().slice(0,10); }
function amount(value, max=1_000_000_000) { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max ? value : null; }
function validCost(body) {
  if (!body || typeof body !== 'object') return null;
  const out = {};
  for (const k of COST_FIELDS) { const x = amount(body[k]); if(x === null) return null; out[k] = x; }
  return out;
}
function sumCosts(cost) { return COST_FIELDS.reduce((s,k)=>s+(cost?.[k]||0),0); }
function dateFromDhakaISO(s) {
  if(typeof s!=='string'|| !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const date=new Date(s+'T00:00:00+06:00');
  return Number.isNaN(date.getTime()) || dhakaDay(date)!==s ? null : date;
}
// Revenue grouping uses order placement date and current DELIVERED status; expenses use entered incurred-on date.
// Deliberately excludes orders with missing cost records from estimated contribution.
function calculateReport(orders, expenses, days, from) {
  const series = Array.from({length:days},(_,i)=>{
    const date=dhakaDay(new Date(new Date(from).getTime()+i*86400000));
    return {date,deliveredValue:0,costedValue:0,directCost:0,sharedExpense:0,deliveredCount:0,uncostedCount:0};
  });
  const byDate = new Map(series.map(x=>[x.date,x]));
  for(const o of orders){
    const d=byDate.get(dhakaDay(o.createdAt));
    if(!d || o.status!=='DELIVERED') continue;
    d.deliveredCount++;d.deliveredValue+=o.total;
    if(o.costRecord){d.costedValue+=o.total;d.directCost+=sumCosts(o.costRecord);}
    else d.uncostedCount++;
  }
  for(const e of expenses){
    if(e.voidedAt) continue;
    const d=byDate.get(dhakaDay(e.incurredOn));
    if(d)d.sharedExpense+=e.amount;
  }
  const result=series.reduce((s,d)=>{
    for(const k of ['deliveredValue','costedValue','directCost','sharedExpense','deliveredCount','uncostedCount'])s[k]+=d[k];
    return s;
  },{deliveredValue:0,costedValue:0,directCost:0,sharedExpense:0,deliveredCount:0,uncostedCount:0});
  result.coveredOrders=result.deliveredCount-result.uncostedCount;
  result.coveredContribution=result.costedValue-result.directCost;
  result.partialResult=result.coveredContribution-result.sharedExpense;
  result.completeCostCoverage=result.uncostedCount===0;
  return {summary:result,series};
}
module.exports={CATEGORIES,COST_FIELDS,dhakaDay,dateFromDhakaISO,amount,validCost,sumCosts,calculateReport};
