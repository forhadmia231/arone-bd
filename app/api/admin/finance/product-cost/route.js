import {prisma} from '@/lib/prisma';
import {adminUser,sameOrigin} from '@/lib/auth';
import {json,readJson} from '@/lib/http';
import finance from '@/lib/finance-rules.cjs';
export async function POST(request){
  if(!sameOrigin(request))return json({error:'Invalid origin'},403);
  const admin=await adminUser();if(!admin)return json({error:'Forbidden'},403);
  const body=await readJson(request);
  const productId=typeof body?.productId==='string'?body.productId.trim():'';
  const unitCost=finance.amount(body?.unitCost);
  if(!productId||productId.length>100||unitCost===null)return json({error:'Select a product and enter a valid integer BDT purchase cost.'},400);
  try{
    const product=await prisma.product.findUnique({where:{id:productId},select:{id:true}});
    if(!product)return json({error:'Product not found.'},404);
    const profile=await prisma.productUnitCost.upsert({where:{productId},update:{unitCost,changedById:admin.id},create:{productId,unitCost,changedById:admin.id}});
    return json({profile,note:'Reference cost updated. Existing order cost snapshots remain unchanged.'});
  }catch(error){console.error('Product cost update failed',error);return json({error:'Could not save product reference cost.'},500);}
}
