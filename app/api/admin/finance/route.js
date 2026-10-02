import {prisma} from '@/lib/prisma';
import {adminUser} from '@/lib/auth';
import {json} from '@/lib/http';
import {dhakaWindow} from '@/lib/admin-report';
import finance from '@/lib/finance-rules.cjs';
const {calculateReport,dhakaDay}=finance;
export const dynamic='force-dynamic';
export async function GET(request){
  if(!await adminUser())return json({error:'Forbidden'},403);
  const n=Number(new URL(request.url).searchParams.get('days'));
  const days=[7,30,90].includes(n)?n:30;
  const {from}=dhakaWindow(days);
  const until=new Date(from.getTime()+days*86400000);
  try{
    const [orders,expenses,ledger,recentOrders,products,productTotal]=await Promise.all([
      prisma.order.findMany({where:{createdAt:{gte:from,lt:until}},select:{createdAt:true,status:true,total:true,costRecord:{select:{productCost:true,packagingCost:true,courierCost:true,adsCost:true,otherCost:true}}}}),
      prisma.financeExpense.findMany({where:{incurredOn:{gte:from,lt:until},voidedAt:null},select:{incurredOn:true,amount:true,voidedAt:true}}),
      prisma.financeExpense.findMany({orderBy:{createdAt:'desc'},take:50,select:{id:true,category:true,amount:true,description:true,incurredOn:true,createdAt:true,voidedAt:true,voidReason:true}}),
      prisma.order.findMany({where:{status:{not:'CANCELLED'}},orderBy:{createdAt:'desc'},take:80,select:{id:true,orderNo:true,total:true,status:true,createdAt:true,costRecord:{select:{id:true,productCost:true,packagingCost:true,courierCost:true,adsCost:true,otherCost:true,version:true}},items:{select:{name:true,quantity:true,product:{select:{unitCostProfile:{select:{unitCost:true}}}}}}}}),
      prisma.product.findMany({orderBy:{name:'asc'},take:500,select:{id:true,name:true,price:true,stock:true,active:true,unitCostProfile:{select:{unitCost:true,updatedAt:true}}}}),
      prisma.product.count()
    ]);
    const {summary,series}=calculateReport(orders,expenses,days,from);
    const options=recentOrders.map(o=>{
      const complete=o.items.length>0 && o.items.every(i=>i.product?.unitCostProfile!=null);
      return {...o,suggestedProductCost:complete?o.items.reduce((sum,i)=>sum+i.quantity*i.product.unitCostProfile.unitCost,0):null,items:o.items.map(i=>({name:i.name,quantity:i.quantity,hasReferenceCost:i.product?.unitCostProfile!=null}))};
    });
    return json({days,from:dhakaDay(from),until:dhakaDay(new Date(until.getTime()-1)),summary,series,ledger,orders:options,products,productTotal,
      methodology:'Orders grouped by Asia/Dhaka PLACEMENT date and CURRENT DELIVERED status; shared expenses grouped by incurred date. Only orders with a saved cost snapshot contribute to estimated result. COD collection is not verified by this finance screen. Expense and order direct-cost entries must never duplicate the same spend.'});
  }catch(error){console.error('Finance report failed',error);return json({error:'Could not load finance report. Check schema/migration and server logs.'},500);}
}
