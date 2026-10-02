'use client';
const CURRENCY='BDT';
const item=(p,qty=1)=>({item_id:String(p.productId||p.id||''),item_name:String(p.name||''),price:Number(p.unitPrice??p.price??0),quantity:Number(p.quantity??qty)});
function context(){if(typeof window==='undefined')return null;return window.__paaikarAdsContext?.allowed?window.__paaikarAdsContext:null;}
function meta(name,params,opts){if(typeof window.fbq==='function')window.fbq('track',name,params,opts)}
function ga(name,params,ctx){if(ctx.settings.ga4MeasurementId&&typeof window.gtag==='function')window.gtag('event',name,{...params,send_to:ctx.settings.ga4MeasurementId})}
export function trackCommerceEvent(name,{product,items=[],qty=1,value}={}){
  const ctx=context();if(!ctx)return false;
  const pathname=window.location.pathname;
  const fixedKey=name==='ViewContent'?`${name}:${pathname}:${product?.id}`:name==='InitiateCheckout'?`${name}:${pathname}`:'';
  if(fixedKey){ctx.sent ||= new Set();if(ctx.sent.has(fixedKey))return true;ctx.sent.add(fixedKey)}
  const list=product?[item(product,qty)]:items.map(p=>item(p,p.qty));
  const total=value??list.reduce((n,p)=>n+p.price*p.quantity,0);
  const params={currency:CURRENCY,value:Number(total),items:list};
  if(name==='ViewContent'){
    ga('view_item',params,ctx);
    if(ctx.settings.metaEnabled)meta('ViewContent',{content_ids:[list[0].item_id],content_type:'product',content_name:list[0].item_name,value:params.value,currency:CURRENCY});
  }else if(name==='AddToCart'){
    ga('add_to_cart',params,ctx);
    if(ctx.settings.metaEnabled)meta('AddToCart',{content_ids:list.map(i=>i.item_id),contents:list.map(i=>({id:i.item_id,quantity:i.quantity,item_price:i.price})),content_type:'product',value:params.value,currency:CURRENCY});
  }else if(name==='InitiateCheckout'){
    ga('begin_checkout',params,ctx);
    if(ctx.settings.metaEnabled)meta('InitiateCheckout',{content_ids:list.map(i=>i.item_id),num_items:list.reduce((n,i)=>n+i.quantity,0),value:params.value,currency:CURRENCY});
  }
  return true;
}
export function trackPlacedOrder(order){
  const ctx=context();if(!ctx||!order?.orderNo||!Array.isArray(order.items))return false;
  // Fire only immediately after a successful POST /api/orders, never from a URL.
  const dedup=`paaikar-ads-purchase-${order.orderNo}`;
  try{if(sessionStorage.getItem(dedup))return true;}catch{}
  const total=Number(order.total),lines=order.items.map(p=>item(p,p.quantity));
  if(!Number.isFinite(total)||total<0)return false;
  const params={transaction_id:order.orderNo,currency:CURRENCY,value:total,items:lines,shipping:Number(order.shippingFee)||0};
  ga('purchase',params,ctx);
  if(ctx.settings.googleEnabled&&ctx.settings.googleAdsId&&ctx.settings.googlePurchaseLabel&&typeof window.gtag==='function'){
    window.gtag('event','conversion',{send_to:`${ctx.settings.googleAdsId}/${ctx.settings.googlePurchaseLabel}`,value:total,currency:CURRENCY,transaction_id:order.orderNo});
  }
  if(ctx.settings.metaEnabled)meta('Purchase',{value:total,currency:CURRENCY,content_ids:lines.map(i=>i.item_id),contents:lines.map(i=>({id:i.item_id,quantity:i.quantity,item_price:i.price})),content_type:'product',num_items:lines.reduce((n,i)=>n+i.quantity,0)},{eventID:order.orderNo});
  try{sessionStorage.setItem(dedup,'1')}catch{}
  return true;
}
