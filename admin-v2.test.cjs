const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
async function helper() {
  const source=fs.readFileSync(path.join(__dirname,'../lib/admin-report.js'),'utf8');
  return import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));
}
test('Dhaka business date changes at UTC 18:00',async()=>{
  const {dhakaDay}=await helper();
  assert.equal(dhakaDay('2026-09-27T17:59:59.999Z'),'2026-09-27');
  assert.equal(dhakaDay('2026-09-27T18:00:00.000Z'),'2026-09-28');
});
test('Report counts all orders but only delivered value',async()=>{
  const {reportDays}=await helper();
  const from=new Date('2026-09-27T18:00:00Z');
  const series=reportDays([
    {createdAt:new Date('2026-09-27T18:30:00Z'),status:'DELIVERED',total:1200},
    {createdAt:new Date('2026-09-27T20:30:00Z'),status:'CANCELLED',total:300},
    {createdAt:new Date('2026-09-28T18:30:00Z'),status:'DELIVERED',total:800}
  ],2,from);
  assert.deepEqual(series,[
    {date:'2026-09-28',orders:2,deliveredValue:1200},
    {date:'2026-09-29',orders:1,deliveredValue:800}
  ]);
});
test('Reporting window begins at a Dhaka midnight',async()=>{
  const {dhakaWindow,dhakaDay}=await helper();
  const {from,days}=dhakaWindow(30);
  assert.equal(days,30);
  assert.equal(from.getUTCHours(),18);
  assert.equal(from.getUTCMinutes(),0);
  assert.match(dhakaDay(from),/^\d{4}-\d{2}-\d{2}$/);
});
