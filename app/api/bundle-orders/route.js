import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { bundleAvailability, calculateBundlePricing, normalizeBundleItems } from '@/lib/bundles';
import { evaluateCoupon, claimCouponUsage } from '@/lib/coupons';
export const dynamic='force-dynamic';
function text(v,n=500){return typeof v==='string'?v.trim().slice(0,n):''}
function integer(v,f,min,max){const x=Number(v);return Number.isFinite(x)?Math.max(min,Math.min(max,Math.round(x))):f}
function sameOrigin(request){const o=request.headers.get('origin');if(!o)return true;try{return o===new URL(request.url).origin}catch{return false}}
function orderNo(){return `AR-B-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`}
export async function POST(request){try{
  if(!sameOrigin(request))return Response.json({error:'Invalid request origin.'},{status:403});
  let body;try{body=await request.json()}catch{return Response.json({error:'Invalid request body.'},{status:400})}
  const customer=body?.customer||{};if(text(customer.website,200))return Response.json({error:'Invalid submission.'},{status:400});
  const slug=text(body?.slug,90).toLowerCase(),bundleQuantity=integer(body?.quantity,1,1,10),customerName=text(customer.name,100),phone=text(customer.phone,24),email=text(customer.email,160),address=text(customer.address,500),city=text(customer.city,100),note=text(customer.note,500),zone=customer.zone==='OUTSIDE'?'OUTSIDE':'DHAKA',couponCode=text(body?.couponCode,40);
  if(!slug)return Response.json({error:'Bundle information is missing.'},{status:400});if(!customerName||!phone||!address||!city)return Response.json({error:'Name, phone, city and address are required.'},{status:400});const phoneDigits=phone.replace(/\D/g,'');if(phoneDigits.length<8||phoneDigits.length>15)return Response.json({error:'Please enter a valid phone number.'},{status:400});
  const tracking=body?.tracking||{};
  const created=await prisma.$transaction(async tx=>{
    const bundle=await tx.bundleOffer.findUnique({where:{slug}});if(!bundle)throw new Error('Bundle offer was not found.');const available=bundleAvailability(bundle);if(!available.available)throw new Error(available.reason);
    if(bundle.perCustomerLimit>0){const used=await tx.bundleUsage.count({where:{bundleId:bundle.id,phone:phoneDigits}});if(used>=bundle.perCustomerLimit)throw new Error('This phone number has reached the bundle order limit.');}
    const configItems=normalizeBundleItems(bundle.items);const ids=configItems.map(x=>x.productId);const products=await tx.product.findMany({where:{id:{in:ids},active:true},select:{id:true,name:true,price:true,stock:true,categoryId:true}});if(products.length!==ids.length)throw new Error('One or more bundle products are unavailable.');
    const pricing=calculateBundlePricing(bundle,products,bundleQuantity);for(const line of pricing.lines){if(Number(line.product.stock||0)<line.quantity)throw new Error(`${line.product.name} does not have enough stock.`)}
    const quantities=new Map(pricing.lines.map(line=>[line.product.id,line.quantity]));let couponEvaluation=null;let couponDiscount=0;if(couponCode){if(!bundle.allowCoupon)throw new Error('Coupons cannot be used with this bundle.');couponEvaluation=await evaluateCoupon({db:tx,code:couponCode,products,quantities,phone:phoneDigits,context:'checkout'});couponDiscount=Math.min(Number(couponEvaluation.discountAmount||0),Math.max(0,pricing.bundleAmount));couponEvaluation={...couponEvaluation,discountAmount:couponDiscount};}
    const shippingFee=zone==='DHAKA'?Number(bundle.insideDhakaFee||0):Number(bundle.outsideDhakaFee||0);const total=Math.max(0,pricing.regularAmount-pricing.bundleDiscountAmount-couponDiscount)+shippingFee;
    const orderItems=pricing.lines.map(line=>({productId:line.product.id,name:line.product.name,unitPrice:line.product.price,quantity:line.quantity,lineTotal:line.product.price*line.quantity}));
    const combinedNote=[note,`Bundle: ${bundle.title} (${bundle.slug}) x${bundleQuantity}`,`Bundle discount: -৳${pricing.bundleDiscountAmount}`,text(tracking.source,100)?`UTM source: ${text(tracking.source,100)}`:'',text(tracking.campaign,120)?`Campaign: ${text(tracking.campaign,120)}`:'',couponEvaluation?`Coupon: ${couponEvaluation.coupon.code} (-৳${couponDiscount})`:'' ].filter(Boolean).join('\n').slice(0,1200);
    const order=await tx.order.create({data:{orderNo:orderNo(),customerName,email:email||null,phone,address,city,area:zone==='DHAKA'?'Dhaka Inside':'Dhaka Outside',note:combinedNote,subtotal:pricing.regularAmount,shippingFee,discountAmount:couponDiscount,couponCode:couponEvaluation?.coupon.code||'',bundleOfferId:bundle.id,bundleOfferTitle:bundle.title,bundleDiscountAmount:pricing.bundleDiscountAmount,total,items:{create:orderItems}},select:{id:true,orderNo:true,subtotal:true,shippingFee:true,discountAmount:true,couponCode:true,bundleOfferTitle:true,bundleDiscountAmount:true,total:true,createdAt:true}});
    if(couponEvaluation&&couponDiscount>0)await claimCouponUsage({db:tx,evaluation:couponEvaluation,orderId:order.id,phone:phoneDigits,source:'bundle'});
    if(bundle.usageLimit!=null){const claim=await tx.bundleOffer.updateMany({where:{id:bundle.id,active:true,usedCount:{lt:bundle.usageLimit}},data:{usedCount:{increment:1}}});if(claim.count!==1)throw new Error('This bundle offer is sold out.');}else await tx.bundleOffer.update({where:{id:bundle.id},data:{usedCount:{increment:1}}});
    await tx.bundleUsage.create({data:{bundleId:bundle.id,orderId:order.id,phone:phoneDigits,quantity:bundleQuantity,regularAmount:pricing.regularAmount,bundleAmount:pricing.bundleAmount,discountAmount:pricing.bundleDiscountAmount}});
    return order;
  });
  return Response.json({ok:true,order:created},{status:201});
}catch(error){console.error('Bundle order error:',error);return Response.json({error:error?.message||'Could not create bundle order.'},{status:400})}}
