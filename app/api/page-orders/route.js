import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { evaluateCoupon, claimCouponUsage } from '@/lib/coupons';

export const dynamic = 'force-dynamic';
function text(value,max=500){return typeof value==='string'?value.trim().slice(0,max):''}
function integer(value,fallback,min,max){const number=Number(value);if(!Number.isFinite(number))return fallback;return Math.max(min,Math.min(max,Math.round(number)))}
function requestIsSameOrigin(request){const origin=request.headers.get('origin');if(!origin)return true;try{return origin===new URL(request.url).origin}catch{return false}}
function getOrderBlock(content,blockId){const blocks=Array.isArray(content)?content:[];return blocks.find(block=>block?.type==='orderForm'&&block?.id===blockId)}
function orderNo(){return `AR-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`}

export async function POST(request){
  try{
    if(!requestIsSameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
    let body;try{body=await request.json()}catch{return Response.json({error:'Invalid request body.'},{status:400})}
    const pageId=text(body?.pageId,120),blockId=text(body?.blockId,160),customer=body?.customer||{};
    if(text(customer.website,200))return Response.json({error:'Invalid submission.'},{status:400});
    const customerName=text(customer.name,100),phone=text(customer.phone,24),email=text(customer.email,160),address=text(customer.address,500),city=text(customer.city,100),note=text(customer.note,500),zone=customer.zone==='OUTSIDE'?'OUTSIDE':'DHAKA';
    if(!pageId||!blockId)return Response.json({error:'Page information is missing.'},{status:400});
    if(!customerName||!phone||!address||!city)return Response.json({error:'Name, phone, city and address are required.'},{status:400});
    const phoneDigits=phone.replace(/\D/g,'');if(phoneDigits.length<8||phoneDigits.length>15)return Response.json({error:'Please enter a valid phone number.'},{status:400});
    const page=await prisma.page.findFirst({where:{id:pageId,status:'PUBLISHED'},select:{id:true,title:true,slug:true,pageType:true,content:true}});if(!page)return Response.json({error:'This order page is not available.'},{status:404});
    const block=getOrderBlock(page.content,blockId);if(!block)return Response.json({error:'Order form configuration was not found.'},{status:400});
    const allowedProductIds=Array.isArray(block.productIds)?[...new Set(block.productIds.map(String))].slice(0,8):[];const requested=Array.isArray(body?.items)?body.items.slice(0,8):[];const quantityById=new Map();
    for(const item of requested){const productId=text(item?.productId,120);if(!productId||!allowedProductIds.includes(productId))continue;const quantity=integer(item?.quantity,0,0,20);if(quantity>0)quantityById.set(productId,quantity)}
    const ids=[...quantityById.keys()];if(!ids.length)return Response.json({error:'Please select at least one product.'},{status:400});
    const tracking=body?.tracking||{}, couponCode=text(body?.couponCode,40);

    const created=await prisma.$transaction(async tx=>{
      const products=await tx.product.findMany({where:{id:{in:ids},active:true},select:{id:true,name:true,price:true,stock:true,categoryId:true}});if(products.length!==ids.length)throw new Error('One or more selected products are unavailable.');
      const orderItems=[];let subtotal=0;
      for(const product of products){const quantity=quantityById.get(product.id)||0;if(product.stock<=0||quantity>product.stock)throw new Error(`${product.name} does not have enough stock.`);const lineTotal=product.price*quantity;subtotal+=lineTotal;orderItems.push({productId:product.id,name:product.name,unitPrice:product.price,quantity,lineTotal})}
      let evaluation=null;if(couponCode)evaluation=await evaluateCoupon({db:tx,code:couponCode,products,quantities:quantityById,phone,pageId:page.id,context:'landing'});
      const insideDhakaFee=integer(block.insideDhakaFee,70,0,10000),outsideDhakaFee=integer(block.outsideDhakaFee,130,0,10000),shippingFee=zone==='DHAKA'?insideDhakaFee:outsideDhakaFee,discountAmount=evaluation?.discountAmount||0,total=Math.max(0,subtotal-discountAmount)+shippingFee;
      const pageNote=[note,`Landing page: ${page.title} (${page.slug})`,text(tracking.source,100)?`UTM source: ${text(tracking.source,100)}`:'',text(tracking.campaign,120)?`Campaign: ${text(tracking.campaign,120)}`:'',evaluation?`Coupon: ${evaluation.coupon.code} (-৳${discountAmount})`:'' ].filter(Boolean).join('\n').slice(0,1000);
      const order=await tx.order.create({data:{orderNo:orderNo(),customerName,email:email||null,phone,address,city,area:zone==='DHAKA'?'Dhaka Inside':'Dhaka Outside',note:pageNote,subtotal,shippingFee,discountAmount,couponCode:evaluation?.coupon.code||'',total,items:{create:orderItems}},select:{id:true,orderNo:true,subtotal:true,shippingFee:true,discountAmount:true,couponCode:true,total:true,createdAt:true}});
      if(evaluation)await claimCouponUsage({db:tx,evaluation,orderId:order.id,phone,source:'landing'});
      return order;
    });

    try{await prisma.pageEvent.create({data:{pageId:page.id,pageSlug:page.slug,eventType:'ORDER',label:created.orderNo,href:'/admin/orders',source:text(tracking.source,100)||'direct',medium:text(tracking.medium,100),campaign:text(tracking.campaign,120),referrer:text(tracking.referrer,500),path:`${page.pageType==='LANDING'?'/landing/':'/page/'}${page.slug}`}})}catch(eventError){console.error('Page order analytics error:',eventError)}
    return Response.json({ok:true,order:created},{status:201});
  }catch(error){console.error('Page order error:',error);return Response.json({error:error?.message||'Could not create order.'},{status:400})}
}
