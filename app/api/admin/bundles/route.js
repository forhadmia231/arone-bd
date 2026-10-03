import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { normalizeBundleItems, normalizeBundleSlug } from '@/lib/bundles';

export const dynamic = 'force-dynamic';

function text(v,n=500){return typeof v==='string'?v.trim().slice(0,n):''}
function int(v,f=0,min=0,max=100000000){const x=Number(v);return Number.isFinite(x)?Math.max(min,Math.min(max,Math.round(x))):f}
function date(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d}
function image(v){const s=text(v,450000);if(!s)return'';if(s.startsWith('/')||s.startsWith('data:image/'))return s;try{const u=new URL(s);return u.protocol==='https:'?s:''}catch{return''}}
function clean(body){
  const title=text(body?.title,140); if(!title)throw new Error('Bundle title is required.');
  const slug=normalizeBundleSlug(body?.slug||title); if(!slug)throw new Error('Valid bundle slug is required.');
  const items=normalizeBundleItems(body?.items); if(!items.length)throw new Error('Select at least one product.');
  const pricingType=['FIXED_PRICE','PERCENTAGE','FIXED_DISCOUNT'].includes(body?.pricingType)?body.pricingType:'FIXED_PRICE';
  const bundlePrice=body?.bundlePrice===''||body?.bundlePrice==null?null:int(body.bundlePrice,0,0);
  const discountValue=int(body?.discountValue,0,0,10000000);
  if(pricingType==='FIXED_PRICE' && (!bundlePrice || bundlePrice<1))throw new Error('Bundle price must be greater than 0.');
  if(pricingType==='PERCENTAGE' && (discountValue<1||discountValue>100))throw new Error('Percentage discount must be 1-100%.');
  if(pricingType==='FIXED_DISCOUNT' && discountValue<1)throw new Error('Fixed discount must be greater than 0.');
  const startsAt=date(body?.startsAt),expiresAt=date(body?.expiresAt); if(startsAt&&expiresAt&&expiresAt<=startsAt)throw new Error('Expiry must be after start time.');
  return {title,slug,description:text(body?.description,1200),badge:text(body?.badge,40)||'COMBO OFFER',imageUrl:image(body?.imageUrl),active:body?.active!==false,pricingType,bundlePrice,discountValue,items,insideDhakaFee:int(body?.insideDhakaFee,70,0,10000),outsideDhakaFee:int(body?.outsideDhakaFee,130,0,10000),allowCoupon:body?.allowCoupon!==false,startsAt,expiresAt,usageLimit:body?.usageLimit===''||body?.usageLimit==null?null:int(body.usageLimit,0,1,10000000),perCustomerLimit:int(body?.perCustomerLimit,5,0,100000)};
}

export async function GET(){
  if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403});
  const [bundles,products]=await Promise.all([
    prisma.bundleOffer.findMany({orderBy:{createdAt:'desc'},include:{_count:{select:{usages:true}}}}),
    prisma.product.findMany({where:{active:true},select:{id:true,name:true,price:true,stock:true,imageUrl:true,categoryId:true},orderBy:{name:'asc'},take:600}),
  ]);
  return Response.json({bundles,products});
}

export async function POST(request){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403});
  if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403});
  try{const bundle=await prisma.bundleOffer.create({data:clean(await request.json())});return Response.json({bundle},{status:201})}
  catch(error){return Response.json({error:error?.code==='P2002'?'Bundle slug already exists.':error?.message||'Could not create bundle.'},{status:400})}
}
