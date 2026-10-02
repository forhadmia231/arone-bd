import {prisma} from '@/lib/prisma';
import {adminUser} from '@/lib/auth';
import {json} from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(request) {
  if (!await adminUser()) return json({error:'Forbidden'},403);
  const sp=new URL(request.url).searchParams;
  const page=Math.min(10000,Math.max(1,Number.parseInt(sp.get('page')||'1',10)||1));
  const term=(sp.get('q')||'').trim().slice(0,60);
  const where=term?{OR:[
    {orderNo:{contains:term,mode:'insensitive'}},
    {customerName:{contains:term,mode:'insensitive'}},
    {phone:{contains:term}}
  ]}:{};
  const [orders,total]=await Promise.all([
    prisma.order.findMany({where,orderBy:{createdAt:'desc'},take:15,skip:(page-1)*15,
      select:{id:true,orderNo:true,createdAt:true,customerName:true,total:true,status:true,paymentMethod:true}}),
    prisma.order.count({where})
  ]);
  return json({orders,total,page,pages:Math.ceil(total/15)});
}
