import {prisma} from '@/lib/prisma';
import {adminUser} from '@/lib/auth';
import {json} from '@/lib/http';
import {LOW_STOCK_THRESHOLD} from '@/lib/admin-report';
export const dynamic='force-dynamic';
export async function GET() {
  if (!await adminUser()) return json({error:'Forbidden'},403);
  const [products,adjustments,totalProducts,lowStock,outOfStock] = await Promise.all([
    prisma.product.findMany({
      orderBy:[{stock:'asc'},{name:'asc'}],take:500,
      select:{id:true,name:true,slug:true,imageUrl:true,stock:true,price:true,active:true,
        category:{select:{name:true}}}
    }),
    prisma.stockAdjustment.findMany({
      take:20,orderBy:{createdAt:'desc'},
      select:{id:true,beforeStock:true,afterStock:true,delta:true,reason:true,createdAt:true,
        product:{select:{name:true}},admin:{select:{name:true}}}
    }),
    prisma.product.count(),
    prisma.product.count({where:{active:true,stock:{gt:0,lte:LOW_STOCK_THRESHOLD}}}),
    prisma.product.count({where:{active:true,stock:0}})
  ]);
  return json({products,adjustments,totalProducts,lowStock,outOfStock,threshold:LOW_STOCK_THRESHOLD,
    note:'Adjustment history starts after this upgrade; checkout and cancelled order changes are recorded in Orders, not here.'});
}
