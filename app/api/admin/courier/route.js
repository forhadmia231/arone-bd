import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {adminUser,sameOrigin} from '@/lib/auth';
import {json,readJson} from '@/lib/http';
import rules from '@/lib/courier-rules.cjs';

const {STATES,validateCourierFields}=rules;
const orderFields={id:true,orderNo:true,customerName:true,phone:true,city:true,total:true,shippingFee:true,status:true,createdAt:true};
export const dynamic='force-dynamic';

export async function GET(request){
  if(!await adminUser())return json({error:'Forbidden'},403);
  const q=new URL(request.url).searchParams;
  const status=STATES.includes(q.get('status'))?q.get('status'):'';
  const search=(q.get('q')||'').trim().slice(0,70);
  const page=Math.min(10000,Math.max(1,Number.parseInt(q.get('page')||'1',10)||1));
  const where={...(status?{status}:{}),...(search?{OR:[
    {order:{is:{orderNo:{contains:search,mode:'insensitive'}}}},
    {order:{is:{customerName:{contains:search,mode:'insensitive'}}}},
    {consignmentId:{contains:search,mode:'insensitive'}},
    {courierName:{contains:search,mode:'insensitive'}}
  ]}:{})};
  const [total,shipments,unassigned,counts]=await prisma.$transaction([
    prisma.courierShipment.count({where}),
    prisma.courierShipment.findMany({where,select:{id:true,courierName:true,consignmentId:true,status:true,codExpected:true,codCollected:true,updatedAt:true,order:{select:orderFields}},orderBy:{updatedAt:'desc'},skip:(page-1)*20,take:20}),
    prisma.order.findMany({where:{shipment:{is:null},status:{not:'CANCELLED'}},select:orderFields,orderBy:{createdAt:'desc'},take:80}),
    prisma.courierShipment.groupBy({by:['status'],_count:{_all:true}})
  ]);
  return json({total,pages:Math.ceil(total/20),page,shipments,unassigned,counts:Object.fromEntries(counts.map(row=>[row.status,row._count._all]))});
}

export async function POST(request){
  if(!sameOrigin(request))return json({error:'Invalid request origin'},403);
  const admin=await adminUser();
  if(!admin)return json({error:'Forbidden'},403);
  const body=await readJson(request);
  const orderId=typeof body?.orderId==='string'?body.orderId.trim():'';
  const fields=validateCourierFields(body);
  if(fields.error||!orderId||orderId.length>100)return json({error:fields.error||'Select a valid order.'},400);
  try{
    const shipment=await prisma.$transaction(async tx=>{
      const order=await tx.order.findUnique({where:{id:orderId},select:{id:true,status:true,total:true,paymentMethod:true}});
      if(!order)throw new Error('Order not found');
      if(order.status==='CANCELLED')throw new Error('Cancelled orders cannot be booked.');
      if(order.paymentMethod!=='CASH_ON_DELIVERY')throw new Error('This initial version supports Cash on Delivery orders only.');
      const created=await tx.courierShipment.create({data:{orderId,courierName:fields.courierName,consignmentId:fields.consignmentId,trackingUrl:fields.trackingUrl,codExpected:order.total,codCollected:0,status:'DRAFT'}});
      await tx.courierShipmentEvent.create({data:{shipmentId:created.id,adminId:admin.id,fromStatus:null,toStatus:'DRAFT',beforeCollected:0,afterCollected:0,fromCourierName:'',toCourierName:fields.courierName,fromConsignment:'',toConsignment:fields.consignmentId,note:'Shipment record created by admin.'}});
      return created;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    return json({shipment},201);
  }catch(error){
    return json({error:error.code==='P2002'?'This order already has a shipment. Open its existing record.':
      ['Order not found','Cancelled orders cannot be booked.','This initial version supports Cash on Delivery orders only.'].includes(error.message)?error.message:'Could not create shipment.'},409);
  }
}
