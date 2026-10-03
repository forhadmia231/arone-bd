'use client';

import { useMemo, useState } from 'react';
import CouponApplyBox from './CouponApplyBox';
import styles from './PageOrderForm.module.css';

function money(value) { return `৳${Number(value || 0).toLocaleString('en-US')}`; }
function initialQty(products) { return Object.fromEntries((products || []).map((product) => [product.id, 1])); }

export default function PageOrderForm({ block, products, page, thankYouUrl = '' }) {
  const [quantities, setQuantities] = useState(() => initialQty(products));
  const [customer, setCustomer] = useState({name:'',phone:'',email:'',address:'',city:'',zone:'DHAKA',note:'',website:''});
  const [coupon,setCoupon]=useState({code:'',discountAmount:0});
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [result, setResult] = useState(null);

  const selectedItems = useMemo(() => (products || []).map((product) => ({product,quantity:Math.max(0,Number(quantities[product.id]||0))})).filter((item)=>item.quantity>0), [products, quantities]);
  const couponItems=useMemo(()=>selectedItems.map(item=>({productId:item.product.id,quantity:item.quantity})),[selectedItems]);
  const subtotal=selectedItems.reduce((sum,item)=>sum+Number(item.product.price||0)*item.quantity,0);
  const shippingFee=customer.zone==='DHAKA'?Number(block.insideDhakaFee??70):Number(block.outsideDhakaFee??130);
  const discount=Math.min(subtotal,Number(coupon.discountAmount||0));
  const total=Math.max(0,subtotal-discount)+shippingFee;
  function updateCustomer(name,value){setCustomer(prev=>({...prev,[name]:value}))}
  function setQty(productId,value){const quantity=Math.max(0,Math.min(20,Number(value||0)));setQuantities(prev=>({...prev,[productId]:quantity}))}

  async function submit(event){event.preventDefault();if(busy)return;setError('');setResult(null);if(!selectedItems.length){setError('কমপক্ষে একটি পণ্য নির্বাচন করুন।');return}setBusy(true);
    try{const params=new URLSearchParams(window.location.search);const response=await fetch('/api/page-orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pageId:page?.id||'',blockId:block?.id||'',couponCode:coupon.code,items:couponItems,customer,tracking:{source:params.get('utm_source')||'',medium:params.get('utm_medium')||'',campaign:params.get('utm_campaign')||'',referrer:document.referrer||''}})});const text=await response.text();let data={};if(text.trim()){try{data=JSON.parse(text)}catch{throw new Error(`Order API returned invalid JSON (HTTP ${response.status}).`)}}if(!response.ok)throw new Error(data?.error||`Order failed (HTTP ${response.status}).`);setResult(data.order);
      try{if(typeof window.fbq==='function')window.fbq('track','Purchase',{value:Number(data.order?.total||0),currency:'BDT'});if(typeof window.gtag==='function')window.gtag('event','purchase',{transaction_id:data.order?.orderNo||'',value:Number(data.order?.total||0),currency:'BDT'})}catch{}
      if(thankYouUrl)setTimeout(()=>{window.location.href=thankYouUrl},1200);
    }catch(err){setError(err.message||'অর্ডার সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।')}finally{setBusy(false)}}

  if(result)return <div className={styles.wrap}><div className={styles.success}><span className={styles.successIcon}>✓</span><h2>{block.successMessage||'ধন্যবাদ। আপনার অর্ডারটি গ্রহণ করা হয়েছে।'}</h2><p>Order No: <strong>{result.orderNo}</strong></p>{Number(result.discountAmount||0)>0&&<p>Coupon Discount: <strong>−{money(result.discountAmount)}</strong></p>}<p>Total: <strong>{money(result.total)}</strong></p><small>আমাদের টিম প্রয়োজন হলে ফোনে যোগাযোগ করবে।</small></div></div>;

  return <div className={styles.wrap}><div className={styles.heading}><h2>{block.heading||'অর্ডার করুন'}</h2>{block.text&&<p>{block.text}</p>}</div><form onSubmit={submit} className={styles.grid}>
    <div className={styles.productsPanel}><h3>পণ্য নির্বাচন</h3><div className={styles.products}>{(products||[]).map(product=>{const qty=Number(quantities[product.id]||0);const outOfStock=Number(product.stock||0)<=0;return <article className={styles.product} key={product.id}><div className={styles.productImage}>{product.imageUrl?<img src={product.imageUrl} alt={product.name}/>:null}</div><div className={styles.productInfo}><strong>{product.name}</strong><span>{money(product.price)}</span>{outOfStock&&<small>Out of stock</small>}</div>{block.allowQuantity!==false?<div className={styles.qty}><button type="button" onClick={()=>setQty(product.id,Math.max(0,qty-1))} disabled={outOfStock}>−</button><input type="number" min="0" max="20" value={qty} onChange={e=>setQty(product.id,e.target.value)} disabled={outOfStock}/><button type="button" onClick={()=>setQty(product.id,qty+1)} disabled={outOfStock}>+</button></div>:<label className={styles.selectOne}><input type="checkbox" checked={qty>0} onChange={e=>setQty(product.id,e.target.checked?1:0)} disabled={outOfStock}/> Select</label>}</article>})}</div></div>
    <div className={styles.customerPanel}><h3>ডেলিভারি তথ্য</h3>{error&&<div className={styles.error}>{error}</div>}<div className={styles.fields}>
      <label>নাম *<input required maxLength="100" value={customer.name} onChange={e=>updateCustomer('name',e.target.value)} placeholder="আপনার নাম"/></label>
      <label>মোবাইল নাম্বার *<input required inputMode="tel" maxLength="24" value={customer.phone} onChange={e=>updateCustomer('phone',e.target.value)} placeholder="01XXXXXXXXX"/></label>
      {block.showEmail===true&&<label>Email<input type="email" maxLength="160" value={customer.email} onChange={e=>updateCustomer('email',e.target.value)} placeholder="you@example.com"/></label>}
      <label>জেলা / শহর *<input required maxLength="100" value={customer.city} onChange={e=>updateCustomer('city',e.target.value)} placeholder="Dhaka / Mymensingh / ..."/></label>
      <label className={styles.full}>সম্পূর্ণ ঠিকানা *<textarea required rows="3" maxLength="500" value={customer.address} onChange={e=>updateCustomer('address',e.target.value)} placeholder="বাসা/রোড/এলাকা/থানা"/></label>
      <div className={styles.full}><span className={styles.labelText}>Delivery Area *</span><div className={styles.zoneRow}><label><input type="radio" name={`zone-${block.id}`} checked={customer.zone==='DHAKA'} onChange={()=>updateCustomer('zone','DHAKA')}/> ঢাকার ভিতরে — {money(block.insideDhakaFee??70)}</label><label><input type="radio" name={`zone-${block.id}`} checked={customer.zone==='OUTSIDE'} onChange={()=>updateCustomer('zone','OUTSIDE')}/> ঢাকার বাইরে — {money(block.outsideDhakaFee??130)}</label></div></div>
      {block.showNote!==false&&<label className={styles.full}>Order Note (optional)<textarea rows="2" maxLength="500" value={customer.note} onChange={e=>updateCustomer('note',e.target.value)} placeholder="বিশেষ নির্দেশনা থাকলে লিখুন"/></label>}
      <input type="text" tabIndex="-1" autoComplete="off" className={styles.honeypot} value={customer.website} onChange={e=>updateCustomer('website',e.target.value)} aria-hidden="true"/>
    </div>
    <CouponApplyBox items={couponItems} phone={customer.phone} pageId={page?.id||''} onChange={setCoupon}/>
    <div className={styles.summary}><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>{discount>0&&<div><span>Coupon {coupon.code}</span><strong>−{money(discount)}</strong></div>}<div><span>Delivery</span><strong>{money(shippingFee)}</strong></div><div className={styles.total}><span>Total</span><strong>{money(total)}</strong></div><small>Payment: Cash on Delivery</small></div>
    <button type="submit" className={styles.submit} disabled={busy||selectedItems.length===0} style={{backgroundColor:block.buttonColor||'#235B37',color:block.buttonTextColor||'#FFFFFF'}}>{busy?'অর্ডার হচ্ছে...':block.buttonText||'অর্ডার কনফার্ম করুন'}</button>
    </div></form></div>;
}
