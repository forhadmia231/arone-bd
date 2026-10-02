import crypto from 'node:crypto';
import {prisma} from '@/lib/prisma';
import {sessionUser,sameOrigin} from '@/lib/auth';
import {json,readJson} from '@/lib/http';
import {string,positiveInt} from '@/lib/validate';
import {Prisma} from '@prisma/client';

export async function GET(){
  const user=await sessionUser();
  if(!user)return json({error:'Please login'},401);
  const orders=await prisma.order.findMany({where:{userId:user.id},include:{items:true},orderBy:{createdAt:'desc'},take:50});
  return json({orders});
}

export async function POST(req){
  if(!sameOrigin(req))return json({error:'Invalid request origin'},403);
  const b=await readJson(req);
  if(!b)return json({error:'Invalid JSON'},400);

  const customerName=string(b.name,100), email=string(b.email,200).toLowerCase(),phone=string(b.phone,25),address=string(b.address,300),area=string(b.area,100),note=string(b.note,300);
  const deliveryZone=string(b.deliveryZone,30);
  if(!['inside_dhaka','outside_dhaka'].includes(deliveryZone))return json({error:'ডেলিভারি এলাকা নির্বাচন করুন।'},400);
  const city=deliveryZone==='inside_dhaka'?'ঢাকা':string(b.city,80);
  if(customerName.length<2|| !/^[+\d][\d\s-]{7,19}$/.test(phone)||address.length<8||city.length<2||(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return json({error:'সঠিক নাম, ফোন, শহর ও ঠিকানা দিন।'},400);
  if(!Array.isArray(b.items)||!b.items.length||b.items.length>30)return json({error:'কার্টে ১–৩০ ধরনের পণ্য থাকতে হবে।'},400);

  const quantities=new Map(),expectedPrices=new Map();
  for(const item of b.items){
    if(typeof item?.id!=='string'||item.id.length>100||!positiveInt(item.qty,50)||!positiveInt(item.expectedPrice))return json({error:'Invalid cart item'},400);
    if(expectedPrices.has(item.id)&&expectedPrices.get(item.id)!==Number(item.expectedPrice))return json({error:'একই পণ্যের দামে অসঙ্গতি রয়েছে।'},400);
    expectedPrices.set(item.id,Number(item.expectedPrice));
    quantities.set(item.id,(quantities.get(item.id)||0)+Number(item.qty));
  }
  if([...quantities.values()].some(v=>v>50))return json({error:'Quantity limit exceeded'},400);

  const user=await sessionUser();
  try{
    const order=await prisma.$transaction(async tx=>{
      const ids=[...quantities.keys()];
      const products=await tx.product.findMany({where:{id:{in:ids},active:true}});
      if(products.length!==ids.length)throw new Error('কোনো পণ্য আর পাওয়া যাচ্ছে না।');
      const lines=[];let subtotal=0;
      for(const p of products){
        const qty=quantities.get(p.id);
        if(p.price!==expectedPrices.get(p.id))throw new Error('পণ্যের দাম পরিবর্তিত হয়েছে। পণ্যটি নতুন করে কার্টে যোগ করুন।');
        const update=await tx.product.updateMany({where:{id:p.id,active:true,stock:{gte:qty}},data:{stock:{decrement:qty}}});
        if(update.count!==1)throw new Error(`${p.name} পর্যাপ্ত স্টকে নেই।`);
        subtotal+=p.price*qty;
        if(subtotal>100000000)throw new Error('অর্ডারের মোট মূল্য অনুমোদিত সীমার বাইরে।');
        lines.push({productId:p.id,name:p.name,unitPrice:p.price,quantity:qty,lineTotal:p.price*qty});
      }
      // Server calculates delivery fee. Never trust an amount submitted by the browser.
      const shipping=deliveryZone==='inside_dhaka'?70:130;
      return tx.order.create({data:{orderNo:`AR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,userId:user?.id||null,customerName,email:email||null,phone,address,city,area,note,subtotal,shippingFee:shipping,total:subtotal+shipping,items:{create:lines}},include:{items:true}});
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:10000});
    return json({order},201);
  }catch(e){
    return json({error:e.message?.includes('স্টকে')||e.message?.includes('পণ্য')||e.message?.includes('মূল্য')?e.message:(e.code==='P2034'?'একই সময়ে স্টক পরিবর্তিত হয়েছে, আবার চেষ্টা করুন।':'অর্ডার সম্পন্ন হয়নি।')},409);
  }
}
