import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { normalizeCouponCode } from '@/lib/coupons';

function txt(v,n=500){return typeof v==='string'?v.trim().slice(0,n):''}
function int(v,f=0,min=0,max=100000000){const x=Number(v);return Number.isFinite(x)?Math.max(min,Math.min(max,Math.round(x))):f}
function ids(v){return Array.isArray(v)?[...new Set(v.map(String).filter(Boolean))].slice(0,200):[]}
function date(v){if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d}
function clean(body){
  const code=normalizeCouponCode(body?.code); if(!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new Error('Invalid coupon code.');
  const discountType=body?.discountType==='FIXED'?'FIXED':'PERCENTAGE'; const discountValue=int(body?.discountValue,0,1,10000000);
  if(discountType==='PERCENTAGE'&&discountValue>100)throw new Error('Percentage cannot exceed 100%.');
  const startsAt=date(body?.startsAt),expiresAt=date(body?.expiresAt);if(startsAt&&expiresAt&&expiresAt<=startsAt)throw new Error('Expiry must be after start time.');
  return {code,name:txt(body?.name,120)||code,description:txt(body?.description),active:body?.active!==false,discountType,discountValue,minOrderAmount:int(body?.minOrderAmount),maxDiscountAmount:body?.maxDiscountAmount===''||body?.maxDiscountAmount==null?null:int(body.maxDiscountAmount,0,1),scope:['ALL_PRODUCTS','SELECTED_PRODUCTS','SELECTED_CATEGORIES'].includes(body?.scope)?body.scope:'ALL_PRODUCTS',productIds:ids(body?.productIds),categoryIds:ids(body?.categoryIds),startsAt,expiresAt,usageLimit:body?.usageLimit===''||body?.usageLimit==null?null:int(body.usageLimit,0,1,10000000),perCustomerLimit:int(body?.perCustomerLimit,1,0,100000),landingPageOnly:body?.landingPageOnly===true,pageIds:ids(body?.pageIds),autoApply:body?.autoApply===true};
}

export async function PUT(request,{params}){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403});
  if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403});
  try{const {id}=await params;const coupon=await prisma.coupon.update({where:{id},data:clean(await request.json())});return Response.json({coupon});}
  catch(error){return Response.json({error:error?.code==='P2002'?'Coupon code already exists.':error?.message||'Could not update coupon.'},{status:400});}
}

export async function DELETE(request,{params}){
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403});
  if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403});
  const {id}=await params;
  const count=await prisma.couponUsage.count({where:{couponId:id}});
  if(count){await prisma.coupon.update({where:{id},data:{active:false}});return Response.json({ok:true,deactivated:true});}
  await prisma.coupon.delete({where:{id}});return Response.json({ok:true,deleted:true});
}
