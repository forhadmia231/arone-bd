import {prisma} from '@/lib/prisma';
import {adminUser} from '@/lib/auth';
import {json} from '@/lib/http';
import {LOW_STOCK_THRESHOLD, dhakaWindow, reportDays} from '@/lib/admin-report';

export const dynamic = 'force-dynamic';
export async function GET() {
  if (!await adminUser()) return json({error:'Forbidden'},403);
  const {from} = dhakaWindow(30);
  const [
    products, customers, orders, pending, delivered, revenue,
    lowStock, outOfStock, latest, periodOrders
  ] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({where:{role:'CUSTOMER'}}),
    prisma.order.count(),
    prisma.order.count({where:{status:'PENDING'}}),
    prisma.order.count({where:{status:'DELIVERED'}}),
    prisma.order.aggregate({where:{status:'DELIVERED'},_sum:{total:true}}),
    prisma.product.count({where:{active:true,stock:{gt:0,lte:LOW_STOCK_THRESHOLD}}}),
    prisma.product.count({where:{active:true,stock:0}}),
    prisma.order.findMany({orderBy:{createdAt:'desc'},take:6,
      select:{id:true,orderNo:true,customerName:true,total:true,status:true,createdAt:true}}),
    prisma.order.findMany({where:{createdAt:{gte:from}},
      select:{createdAt:true,status:true,total:true}})
  ]);
  const chart = reportDays(periodOrders,30,from);
  return json({
    products,customers,orders,pending,delivered,revenue:revenue._sum.total||0,
    lowStock,outOfStock,latest,chart,
    period:{
      placedOrders:periodOrders.length,
      deliveredOrderValue:chart.reduce((sum,row)=>sum+row.deliveredValue,0)
    },
    note:'Delivered order value, grouped by original order placement date. COD collection is not verified.'
  });
}
