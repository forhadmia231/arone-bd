import {prisma} from '@/lib/prisma';
import {adminUser} from '@/lib/auth';
import {json} from '@/lib/http';
import {dhakaWindow,reportDays} from '@/lib/admin-report';

export const dynamic='force-dynamic';
export async function GET(request) {
  if (!await adminUser()) return json({error:'Forbidden'},403);
  const requested = Number(new URL(request.url).searchParams.get('days'));
  const days = [7,30,90].includes(requested) ? requested : 30;
  const {from} = dhakaWindow(days);
  const [orders,totalOrders,deliveredLifetime] = await Promise.all([
    prisma.order.findMany({where:{createdAt:{gte:from}},
      select:{status:true,total:true,subtotal:true,shippingFee:true,createdAt:true}}),
    prisma.order.count(),
    prisma.order.aggregate({where:{status:'DELIVERED'},_sum:{total:true}})
  ]);
  const statusCounts={PENDING:0,CONFIRMED:0,SHIPPED:0,DELIVERED:0,CANCELLED:0};
  for (const order of orders) statusCounts[order.status]++;
  const series=reportDays(orders,days,from);
  const delivered = orders.filter(o=>o.status==='DELIVERED');
  const deliveredValue=delivered.reduce((sum,o)=>sum+o.total,0);
  return json({
    days,series,statusCounts,totalOrders,
    placedOrders:orders.length,deliveredOrders:delivered.length,
    deliveredValue, averageDeliveredOrderValue:delivered.length?Math.round(deliveredValue/delivered.length):0,
    lifetimeDeliveredValue:deliveredLifetime._sum.total||0,
    note:'Orders are grouped by Asia/Dhaka placement date. Delivered value uses current order status; COD collection is not independently verified. Profit is not available without cost data.'
  });
}
