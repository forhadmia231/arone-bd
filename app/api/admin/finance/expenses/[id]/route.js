import {prisma} from '@/lib/prisma';
import {adminUser,sameOrigin} from '@/lib/auth';
import {json,readJson} from '@/lib/http';
export async function PATCH(request,{params}){
  if(!sameOrigin(request))return json({error:'Invalid origin'},403);
  const admin=await adminUser();if(!admin)return json({error:'Forbidden'},403);
  const {id}=await params;
  if(!id||id.length>100)return json({error:'Invalid expense ID.'},400);
  const input=await readJson(request);
  const reason=typeof input?.reason==='string'?input.reason.trim():'';
  if(reason.length<8||reason.length>240)return json({error:'Enter a correction reason (8–240 characters).'},400);
  try{
    const changed=await prisma.financeExpense.updateMany({where:{id,voidedAt:null},data:{voidedAt:new Date(),voidedById:admin.id,voidReason:reason}});
    if(changed.count!==1)return json({error:'Expense not found or already voided.'},409);
    return json({ok:true,note:'Expense marked void; ledger entry was retained for audit.'});
  }catch(error){console.error('Finance expense void failed',error);return json({error:'Could not void expense.'},500);}
}
