'use client';
import { useEffect, useMemo, useState } from 'react';

const empty={code:'',name:'',description:'',active:true,discountType:'PERCENTAGE',discountValue:10,minOrderAmount:0,maxDiscountAmount:'',scope:'ALL_PRODUCTS',productIds:[],categoryIds:[],startsAt:'',expiresAt:'',usageLimit:'',perCustomerLimit:1,landingPageOnly:false,pageIds:[],autoApply:false};
function localDate(v){if(!v)return'';const d=new Date(v);const p=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`}
function toggle(list,id){return list.includes(id)?list.filter(x=>x!==id):[...list,id]}

export default function AdminCoupons(){
  const [data,setData]=useState({coupons:[],products:[],categories:[],pages:[]});const [form,setForm]=useState(empty);const [editing,setEditing]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');const [search,setSearch]=useState('');
  async function load(){const r=await fetch('/api/admin/coupons',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not load coupons.');setData(d)}
  useEffect(()=>{load().catch(e=>setError(e.message))},[])
  const shown=useMemo(()=>data.coupons.filter(c=>`${c.code} ${c.name}`.toLowerCase().includes(search.toLowerCase())),[data.coupons,search]);
  function edit(c){setEditing(c.id);setForm({...empty,...c,startsAt:localDate(c.startsAt),expiresAt:localDate(c.expiresAt),maxDiscountAmount:c.maxDiscountAmount??'',usageLimit:c.usageLimit??'',productIds:Array.isArray(c.productIds)?c.productIds:[],categoryIds:Array.isArray(c.categoryIds)?c.categoryIds:[],pageIds:Array.isArray(c.pageIds)?c.pageIds:[]});window.scrollTo({top:0,behavior:'smooth'})}
  async function save(e){e.preventDefault();setBusy(true);setError('');setMessage('');try{const r=await fetch(editing?`/api/admin/coupons/${editing}`:'/api/admin/coupons',{method:editing?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not save coupon.');setMessage(editing?'Coupon updated.':'Coupon created.');setEditing('');setForm(empty);await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
  async function remove(id){if(!confirm('Delete this coupon? Used coupons will be deactivated instead.'))return;const r=await fetch(`/api/admin/coupons/${id}`,{method:'DELETE'});const d=await r.json();if(!r.ok){setError(d.error||'Could not delete coupon.');return}setMessage(d.deactivated?'Coupon has usage history, so it was deactivated.':'Coupon deleted.');await load()}
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));
  return <div style={{display:'grid',gap:18}}>
    <div><span className="eyebrow">SALES · DISCOUNTS</span><h1 style={{marginBottom:5}}>Coupons & Discounts</h1><p className="muted">Create percentage/fixed coupons for checkout and landing-page direct orders.</p></div>
    {error&&<p className="error-text">{error}</p>}{message&&<p className="success-text">{message}</p>}
    <form className="panel" onSubmit={save} style={{display:'grid',gap:14}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><h2 style={{margin:0}}>{editing?'Edit Coupon':'Create Coupon'}</h2>{editing&&<button type="button" className="btn btn-outline" onClick={()=>{setEditing('');setForm(empty)}}>Cancel Edit</button>}</div>
      <div className="form-grid">
        <label>Coupon Code *<input required value={form.code} onChange={e=>f('code',e.target.value.toUpperCase().replace(/\s/g,''))} placeholder="EID20" /></label>
        <label>Name *<input required value={form.name} onChange={e=>f('name',e.target.value)} placeholder="Eid Special 20%" /></label>
        <label>Discount Type<select value={form.discountType} onChange={e=>f('discountType',e.target.value)}><option value="PERCENTAGE">Percentage (%)</option><option value="FIXED">Fixed BDT</option></select></label>
        <label>Discount Value *<input required type="number" min="1" value={form.discountValue} onChange={e=>f('discountValue',e.target.value)} /></label>
        <label>Minimum Order (BDT)<input type="number" min="0" value={form.minOrderAmount} onChange={e=>f('minOrderAmount',e.target.value)} /></label>
        <label>Maximum Discount (optional)<input type="number" min="1" value={form.maxDiscountAmount} onChange={e=>f('maxDiscountAmount',e.target.value)} placeholder="No cap" /></label>
        <label>Starts At<input type="datetime-local" value={form.startsAt} onChange={e=>f('startsAt',e.target.value)} /></label>
        <label>Expires At<input type="datetime-local" value={form.expiresAt} onChange={e=>f('expiresAt',e.target.value)} /></label>
        <label>Overall Usage Limit<input type="number" min="1" value={form.usageLimit} onChange={e=>f('usageLimit',e.target.value)} placeholder="Unlimited" /></label>
        <label>Per Customer / Phone Limit<input type="number" min="0" value={form.perCustomerLimit} onChange={e=>f('perCustomerLimit',e.target.value)} /></label>
        <label>Scope<select value={form.scope} onChange={e=>f('scope',e.target.value)}><option value="ALL_PRODUCTS">All Products</option><option value="SELECTED_PRODUCTS">Selected Products</option><option value="SELECTED_CATEGORIES">Selected Categories</option></select></label>
        <label className="wide">Description<textarea rows="2" value={form.description} onChange={e=>f('description',e.target.value)} /></label>
      </div>
      {form.scope==='SELECTED_PRODUCTS'&&<div><b>Select Products</b><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:7,marginTop:8,maxHeight:250,overflow:'auto'}}>{data.products.map(p=><label key={p.id} style={{display:'flex',gap:7,alignItems:'center'}}><input type="checkbox" checked={form.productIds.includes(p.id)} onChange={()=>f('productIds',toggle(form.productIds,p.id))}/>{p.name}</label>)}</div></div>}
      {form.scope==='SELECTED_CATEGORIES'&&<div><b>Select Categories</b><div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:8}}>{data.categories.map(c=><label key={c.id}><input type="checkbox" checked={form.categoryIds.includes(c.id)} onChange={()=>f('categoryIds',toggle(form.categoryIds,c.id))}/> {c.name}</label>)}</div></div>}
      <div style={{display:'flex',gap:18,flexWrap:'wrap'}}><label><input type="checkbox" checked={form.active} onChange={e=>f('active',e.target.checked)}/> Active</label><label><input type="checkbox" checked={form.autoApply} onChange={e=>f('autoApply',e.target.checked)}/> Auto apply when eligible</label><label><input type="checkbox" checked={form.landingPageOnly} onChange={e=>f('landingPageOnly',e.target.checked)}/> Landing Page only</label></div>
      {form.landingPageOnly&&<div><b>Restrict to specific published pages (optional)</b><div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:8}}>{data.pages.map(p=><label key={p.id}><input type="checkbox" checked={form.pageIds.includes(p.id)} onChange={()=>f('pageIds',toggle(form.pageIds,p.id))}/> {p.title}</label>)}</div></div>}
      <button className="btn btn-primary" disabled={busy} style={{justifySelf:'start'}}>{busy?'Saving...':editing?'Update Coupon':'Create Coupon'}</button>
    </form>
    <section className="panel"><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><h2 style={{margin:0}}>Coupons</h2><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search coupon..." style={{maxWidth:260}} /></div>
      <div style={{overflowX:'auto',marginTop:12}}><table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr><th align="left">Code</th><th align="left">Discount</th><th align="left">Status</th><th align="left">Usage</th><th align="right">Actions</th></tr></thead><tbody>{shown.map(c=><tr key={c.id} style={{borderTop:'1px solid #e7ece5'}}><td style={{padding:'12px 4px'}}><b>{c.code}</b><small style={{display:'block'}}>{c.name}</small></td><td>{c.discountType==='PERCENTAGE'?`${c.discountValue}%`:`৳${c.discountValue}`}</td><td>{c.active?'Active':'Inactive'}{c.autoApply?' · Auto':''}</td><td>{c.usedCount}{c.usageLimit!=null?` / ${c.usageLimit}`:''}</td><td align="right"><div style={{display:'flex',gap:6,justifyContent:'flex-end'}}><button type="button" className="btn btn-outline" onClick={()=>navigator.clipboard?.writeText(c.code)}>Copy</button><button type="button" className="btn btn-outline" onClick={()=>edit(c)}>Edit</button><button type="button" className="btn btn-outline" onClick={()=>remove(c.id)}>Delete</button></div></td></tr>)}{!shown.length&&<tr><td colSpan="5" style={{padding:20,textAlign:'center'}} className="muted">No coupons found.</td></tr>}</tbody></table></div>
    </section>
  </div>
}
