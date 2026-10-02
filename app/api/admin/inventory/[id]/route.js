import {Prisma} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {adminUser,sameOrigin} from '@/lib/auth';
import {json,readJson} from '@/lib/http';

export async function PATCH(request,{params}) {
  if(!sameOrigin(request)) return json({error:'Invalid request origin'},403);
  const admin=await adminUser();
  if(!admin)return json({error:'Forbidden'},403);
  const {id}=await params;
  const body=await readJson(request);
  const nextStock=body?.nextStock;
  const reason=typeof body?.reason==='string'?body.reason.trim():'';
  if(!Number.isSafeInteger(nextStock)||nextStock<0||nextStock>1000000||
    reason.length<4||reason.length>200) {
    return json({error:'Enter a stock quantity (0–1,000,000) and a reason (4–200 characters).'},400);
  }
  try {
    const result=await prisma.$transaction(async tx=>{
      const previous=await tx.product.findUnique({where:{id},select:{stock:true}});
      if(!previous)throw new Error('Product not found');
      if(previous.stock===nextStock)throw new Error('Stock is already set to this quantity');
      const updated=await tx.product.updateMany({where:{id,stock:previous.stock},
        data:{stock:nextStock}});
      if(updated.count!==1)throw new Error('Stock changed; refresh the page and retry');
      const adjustment=await tx.stockAdjustment.create({
        data:{productId:id,adminId:admin.id,beforeStock:previous.stock,
          afterStock:nextStock,delta:nextStock-previous.stock,reason}
      });
      return {stock:nextStock,adjustment};
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:10000});
    return json(result);
  }catch(error) {
    return json({error:error.code==='P2034'?'Concurrent stock change; reload and retry':
      ['Product not found','Stock is already set to this quantity',
       'Stock changed; refresh the page and retry'].includes(error.message)?
       error.message:'Could not update stock.'},409);
  }
}
