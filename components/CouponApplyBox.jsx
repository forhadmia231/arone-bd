'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function money(v){ return `৳${Number(v||0).toLocaleString('en-US')}`; }

export default function CouponApplyBox({ items, phone='', pageId='', onChange }){
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const autoTried=useRef('');

  const signature=useMemo(()=>JSON.stringify({items,phone,pageId}),[items,phone,pageId]);

  async function validate(requestedCode='', auto=false){
    if(!Array.isArray(items)||!items.length)return;
    setBusy(true); if(!auto){setError('');setMessage('');}
    try{
      const response=await fetch('/api/coupons/validate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:requestedCode,items,phone,pageId})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.valid){ if(auto)return; throw new Error(data.error||'কুপনটি ব্যবহার করা যাচ্ছে না।'); }
      setCode(data.coupon.code);
      setMessage(`${data.coupon.code} applied — আপনি ${money(data.discountAmount)} সেভ করছেন।`);
      setError('');
      onChange?.({code:data.coupon.code,discountAmount:Number(data.discountAmount||0),coupon:data.coupon});
    }catch(e){ setError(e.message||'কুপন যাচাই করা যায়নি।'); onChange?.({code:'',discountAmount:0,coupon:null}); }
    finally{setBusy(false)}
  }

  useEffect(()=>{
    onChange?.({code:'',discountAmount:0,coupon:null});
    setMessage(''); setError('');
    if(autoTried.current===signature)return;
    autoTried.current=signature;
    const timer=setTimeout(()=>validate('',true),250);
    return ()=>clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[signature]);

  function remove(){setCode('');setMessage('');setError('');onChange?.({code:'',discountAmount:0,coupon:null});}

  return <div style={{border:'1px solid #dfe8dc',borderRadius:10,padding:12,margin:'12px 0',background:'#fbfdf9'}}>
    <div style={{fontWeight:800,marginBottom:7}}>Coupon / Discount</div>
    <div style={{display:'flex',gap:7}}>
      <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="Coupon code" maxLength={30} style={{minWidth:0,flex:1,padding:'10px 11px',border:'1px solid #ccd8c8',borderRadius:7}} />
      <button type="button" disabled={busy||!code.trim()} onClick={()=>validate(code,false)} style={{padding:'10px 14px',border:0,borderRadius:7,background:'#235B37',color:'#fff',fontWeight:800,cursor:'pointer'}}>{busy?'Checking...':'Apply'}</button>
    </div>
    {message&&<div style={{marginTop:8,color:'#1c6b37',fontSize:13,fontWeight:700}}>{message} <button type="button" onClick={remove} style={{border:0,background:'none',textDecoration:'underline',cursor:'pointer'}}>Remove</button></div>}
    {error&&<div style={{marginTop:8,color:'#b42318',fontSize:13}}>{error}</div>}
  </div>;
}
