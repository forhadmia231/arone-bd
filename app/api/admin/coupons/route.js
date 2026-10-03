import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { normalizeCouponCode } from '@/lib/coupons';

export const dynamic = 'force-dynamic';

function txt(v, n=500){ return typeof v === 'string' ? v.trim().slice(0,n) : ''; }
function int(v, fallback=0, min=0, max=100000000){ const x=Number(v); return Number.isFinite(x)?Math.max(min,Math.min(max,Math.round(x))):fallback; }
function ids(v){ return Array.isArray(v) ? [...new Set(v.map(String).filter(Boolean))].slice(0,200) : []; }
function date(v){ if(!v) return null; const d=new Date(v); return Number.isNaN(d.getTime())?null:d; }

function clean(body){
  const code=normalizeCouponCode(body?.code);
  if(!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new Error('Coupon code must be 3-30 letters/numbers, - or _.');
  const discountType=body?.discountType==='FIXED'?'FIXED':'PERCENTAGE';
  const discountValue=int(body?.discountValue,0,1,10000000);
  if(discountType==='PERCENTAGE' && discountValue>100) throw new Error('Percentage discount cannot be above 100%.');
  const scope=['ALL_PRODUCTS','SELECTED_PRODUCTS','SELECTED_CATEGORIES'].includes(body?.scope)?body.scope:'ALL_PRODUCTS';
  const startsAt=date(body?.startsAt), expiresAt=date(body?.expiresAt);
  if(startsAt && expiresAt && expiresAt<=startsAt) throw new Error('Expiry must be after start time.');
  return {
    code,
    name: txt(body?.name,120) || code,
    description: txt(body?.description,500),
    active: body?.active !== false,
    discountType,
    discountValue,
    minOrderAmount:int(body?.minOrderAmount,0),
    maxDiscountAmount:body?.maxDiscountAmount===''||body?.maxDiscountAmount==null?null:int(body.maxDiscountAmount,0,1),
    scope,
    productIds:ids(body?.productIds),
    categoryIds:ids(body?.categoryIds),
    startsAt,
    expiresAt,
    usageLimit:body?.usageLimit===''||body?.usageLimit==null?null:int(body.usageLimit,0,1,10000000),
    perCustomerLimit:int(body?.perCustomerLimit,1,0,100000),
    landingPageOnly:body?.landingPageOnly===true,
    pageIds:ids(body?.pageIds),
    autoApply:body?.autoApply===true,
  };
}

export async function GET(){
  if(!(await adminUser())) return Response.json({error:'Forbidden'},{status:403});
  const [coupons,products,categories,pages]=await Promise.all([
    prisma.coupon.findMany({orderBy:{createdAt:'desc'},include:{_count:{select:{usages:true}}}}),
    prisma.product.findMany({where:{active:true},select:{id:true,name:true,price:true,categoryId:true},orderBy:{name:'asc'},take:500}),
    prisma.category.findMany({select:{id:true,name:true},orderBy:{name:'asc'}}),
    prisma.page.findMany({where:{status:'PUBLISHED'},select:{id:true,title:true,slug:true,pageType:true},orderBy:{title:'asc'}}),
  ]);
  return Response.json({coupons,products,categories,pages});
}

export async function POST(request){
  if(!sameOrigin(request)) return Response.json({error:'Invalid request origin'},{status:403});
  if(!(await adminUser())) return Response.json({error:'Forbidden'},{status:403});
  try{
    const data=clean(await request.json());
    const coupon=await prisma.coupon.create({data});
    return Response.json({coupon},{status:201});
  }catch(error){
    return Response.json({error:error?.code==='P2002'?'Coupon code already exists.':error?.message||'Could not create coupon.'},{status:400});
  }
}
