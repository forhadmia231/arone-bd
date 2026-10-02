import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {adminUser,sameOrigin} from '@/lib/auth';
import {json,readJson} from '@/lib/http';
import rules from '@/lib/courier-rules.cjs';
const {STATES,canTransition,cleanText,validateCourierFields,moneyInt}=rules;
export const dynamic='force-dynamic';

export async function GET(request,{params}){
  if(!await adminUser())return json({error:'Forbidden'},403);
  const {id}=await params;
  const shipment=await prisma.courierShipment.findUnique({where:{id},include:{
    order:{select:{id:true,orderNo:true,status:true,customerName:true,phone:true,city:true,address:true,area:true,total:true,shippingFee:true,createdAt:true}},
    events:{orderBy:{createdAt:'desc'},take:100,include:{admin:{select:{name:true}}}}
  }});
  return shipment?json({shipment}):json({error:'Shipment not found.'},404);
}

export async function PATCH(request,{params}){
  if(!sameOrigin(request))return json({error:'Invalid request origin'},403);
  const admin=await adminUser();
  if(!admin)return json({error:'Forbidden'},403);
  const {id}=await params;
  const b=await readJson(request);
  const fields=validateCourierFields(b);
  const note=cleanText(b?.note,200);
  if(fields.error)return json({error:fields.error},400);
  if(!STATES.includes(b?.status))return json({error:'Invalid shipment status.'},400);
  if(!moneyInt(b?.codCollected))return json({error:'COD collected must be a whole amount of 0 or greater.'},400);
  if(!Number.isSafeInteger(b?.expectedVersion)||b.expectedVersion<0)return json({error:'Reload this shipment before saving.'},400);
  if(note.length<4||note.length>200)return json({error:'A 4–200 character reason or settlement reference is required.'},400);
  try{
    const result=await prisma.$transaction(async tx=>{
      const current=await tx.courierShipment.findUnique({where:{id},include:{order:{select:{status:true}}}});
      if(!current)throw new Error('Shipment not found.');
      if(current.version!==b.expectedVersion)throw new Error('This shipment changed; refresh before saving.');
      if(!canTransition(current.status,b.status))throw new Error('Invalid delivery status transition.');
      if(current.order.status==='CANCELLED' && b.status!==current.status && b.status!=='CANCELLED')throw new Error('Order was cancelled. Do not advance delivery status.');
      if(b.codCollected>current.codExpected)throw new Error('Collected COD cannot exceed the order total.');
      const changed=current.status!==b.status||current.codCollected!==b.codCollected||
        current.courierName!==fields.courierName||current.consignmentId!==fields.consignmentId||current.trackingUrl!==fields.trackingUrl;
      if(!changed)throw new Error('No changes to save.');
      const changedRow=await tx.courierShipment.updateMany({where:{id,version:b.expectedVersion},data:{
        status:b.status,courierName:fields.courierName,consignmentId:fields.consignmentId,
        trackingUrl:fields.trackingUrl,codCollected:b.codCollected,version:{increment:1}
      }});
      if(changedRow.count!==1)throw new Error('This shipment changed; refresh before saving.');
      await tx.courierShipmentEvent.create({data:{shipmentId:id,adminId:admin.id,
        fromStatus:current.status,toStatus:b.status,beforeCollected:current.codCollected,
        afterCollected:b.codCollected,fromCourierName:current.courierName,toCourierName:fields.courierName,fromConsignment:current.consignmentId,toConsignment:fields.consignmentId,note}});
      return tx.courierShipment.findUnique({where:{id},select:{id:true,version:true}});
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:10000});
    return json({shipment:result});
  }catch(error){
    const allowed=['Shipment not found.','This shipment changed; refresh before saving.','Invalid delivery status transition.',
      'Order was cancelled. Do not advance delivery status.','Collected COD cannot exceed the order total.','No changes to save.'];
    return json({error:error.code==='P2034'?'Concurrent shipment update; reload and retry.':allowed.includes(error.message)?error.message:'Could not update shipment.'},409);
  }
}
