import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {adminUser,sameOrigin} from '@/lib/auth';
import {json,readJson} from '@/lib/http';
import finance from '@/lib/finance-rules.cjs';
const {validCost,COST_FIELDS}=finance;
const fields={id:true,version:true,...Object.fromEntries(COST_FIELDS.map(k=>[k,true]))};
function costValues(row){return Object.fromEntries(COST_FIELDS.map(k=>[k,row[k]]));}
export async function GET(request){
  if(!await adminUser())return json({error:'Forbidden'},403);
  const orderId=new URL(request.url).searchParams.get('orderId')||'';
  if(!orderId||orderId.length>100)return json({error:'Order ID required.'},400);
  try{
    const record=await prisma.financeOrderCost.findUnique({where:{orderId},select:{id:true,version:true,revisions:{take:50,orderBy:{createdAt:'desc'},select:{id:true,createdAt:true,adminId:true,reason:true,before:true,after:true}}}});
    return record?json(record):json({error:'No order cost snapshot found.'},404);
  }catch(error){console.error('Finance revision read failed',error);return json({error:'Could not load revision history.'},500);}
}
export async function POST(request){
  if(!sameOrigin(request))return json({error:'Invalid origin'},403);
  const admin=await adminUser();if(!admin)return json({error:'Forbidden'},403);
  const input=await readJson(request);
  const orderId=typeof input?.orderId==='string'?input.orderId.trim():'';
  const costs=validCost(input);
  if(!orderId||orderId.length>100||!costs)return json({error:'Select an order and enter all five integer BDT costs (zero allowed).'},400);
  const reason=typeof input?.reason==='string'?input.reason.trim():'';
  try{
    const updated=await prisma.$transaction(async tx=>{
      const order=await tx.order.findUnique({where:{id:orderId},select:{id:true,status:true}});
      if(!order)throw new Error('ORDER_NOT_FOUND');
      if(order.status==='CANCELLED')throw new Error('ORDER_CANCELLED');
      const prior=await tx.financeOrderCost.findUnique({where:{orderId},select:fields});
      if(!prior){
        const created=await tx.financeOrderCost.create({data:{orderId,...costs,recordedById:admin.id}});
        await tx.financeOrderCostRevision.create({data:{orderCostId:created.id,adminId:admin.id,before:Prisma.JsonNull,after:costs,reason:'Initial cost snapshot created'}});
        return created;
      }
      if(!Number.isInteger(input.version)||input.version!==prior.version)throw new Error('VERSION_CONFLICT');
      if(reason.length<8||reason.length>240)throw new Error('REASON_REQUIRED');
      const before=costValues(prior);
      if(COST_FIELDS.every(k=>before[k]===costs[k]))throw new Error('NO_CHANGE');
      const result=await tx.financeOrderCost.updateMany({where:{id:prior.id,version:prior.version},data:{...costs,recordedById:admin.id,version:{increment:1}}});
      if(result.count!==1)throw new Error('VERSION_CONFLICT');
      await tx.financeOrderCostRevision.create({data:{orderCostId:prior.id,adminId:admin.id,before,after:costs,reason}});
      return tx.financeOrderCost.findUnique({where:{id:prior.id}});
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return json({costRecord:updated,note:'Cost snapshot saved. Existing invoices and product prices are unchanged.'});
  }catch(error){
    const messages={ORDER_NOT_FOUND:'Order not found.',ORDER_CANCELLED:'Cancelled orders cannot receive a new cost snapshot.',VERSION_CONFLICT:'This cost record was changed in another tab. Reload before editing.',REASON_REQUIRED:'A correction reason of 8–240 characters is required.',NO_CHANGE:'No amounts changed.'};
    if(messages[error.message])return json({error:messages[error.message]},error.message==='ORDER_NOT_FOUND'?404:409);
    if(error.code==='P2002'||error.code==='P2034')return json({error:'Concurrent change detected. Reload and retry.'},409);
    console.error('Order finance cost failed',error);return json({error:'Could not save order cost snapshot.'},500);
  }
}
