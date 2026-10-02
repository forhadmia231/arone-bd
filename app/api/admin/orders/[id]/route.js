import {prisma} from '@/lib/prisma';import {adminUser,sameOrigin} from '@/lib/auth';import {json,readJson} from '@/lib/http';
const allowed={PENDING:['CONFIRMED','CANCELLED'],CONFIRMED:['SHIPPED','CANCELLED'],SHIPPED:['DELIVERED'],DELIVERED:[],CANCELLED:[]};
export async function PATCH(req,{params}){
 if(!sameOrigin(req)||!await adminUser())return json({error:'Forbidden'},403);
 const b=await readJson(req),status=b?.status,{id}=await params;
 if(!['CONFIRMED','CANCELLED','SHIPPED','DELIVERED'].includes(status))return json({error:'Invalid status'},400);
 try{
 const order=await prisma.$transaction(async tx=>{
  const existing=await tx.order.findUnique({where:{id},include:{items:true}});
  if(!existing)throw new Error('Order not found');
  if(!allowed[existing.status].includes(status))throw new Error('Invalid status transition');
  const update=await tx.order.updateMany({where:{id,status:existing.status},data:{status}});
  if(update.count!==1)throw new Error('Order changed; reload');
  if(status==='CANCELLED')for(const item of existing.items){if(item.productId)await tx.product.updateMany({where:{id:item.productId},data:{stock:{increment:item.quantity}}});}
  return tx.order.findUnique({where:{id},include:{items:true}});
 });return json({order});
 }catch(e){return json({error:e.message||'Could not update order'},409)}
}
