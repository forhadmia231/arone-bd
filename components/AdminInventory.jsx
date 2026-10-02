'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {money} from '@/lib/format';

export default function AdminInventory() {
  const [data,setData]=useState({products:[],adjustments:[],threshold:5});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('all');
  const [selected,setSelected]=useState(null);
  const [quantity,setQuantity]=useState('');
  const [reason,setReason]=useState('');
  const [busy,setBusy]=useState(false);
  const load=useCallback(async()=>{
    try {
      const r=await fetch('/api/admin/inventory',{cache:'no-store'});
      const body=await r.json();
      if(!r.ok)throw new Error(body.error||'Inventory could not be loaded');
      setData(body);setError('');
    } catch(e){setError(e.message);}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  const products=useMemo(()=>data.products.filter(p=>{
    if(query && !`${p.name} ${p.slug} ${p.category?.name||''}`.toLowerCase().includes(query.toLowerCase()))return false;
    if(filter==='low')return p.active && p.stock>0 && p.stock<=data.threshold;
    if(filter==='out')return p.active && p.stock===0;
    if(filter==='active')return p.active;
    return true;
  }),[data,query,filter]);
  const low=data.lowStock??0;
  const out=data.outOfStock??0;
  function begin(p){setSelected(p);setQuantity(String(p.stock));setReason('');setError('');}
  async function save(event) {
    event.preventDefault();
    if(!selected)return;
    const n=Number(quantity);
    if(!Number.isSafeInteger(n)||n<0||n>1000000){setError('Enter a valid quantity.');return;}
    setBusy(true);setError('');
    try{
      const r=await fetch(`/api/admin/inventory/${encodeURIComponent(selected.id)}`,{
        method:'PATCH',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({nextStock:n,reason})
      });
      const body=await r.json();
      if(!r.ok)throw new Error(body.error||'Stock update failed');
      setSelected(null);await load();
    }catch(e){setError(e.message);}
    finally{setBusy(false);}
  }
  return <div className="ar-admin-page">
    <div className="ar-page-title"><div><span className="ar-eyebrow">OPERATIONS / STOCK CONTROL</span><h1>Inventory</h1>
      <p>Track available quantities, spot shortages and record manual adjustments.</p></div>
      <Link className="ar-action" href="/admin/products">Manage Products ↗</Link></div>
    <div className="ar-kpi-grid ar-kpi-grid-three">
      <article className="ar-kpi"><span>Products in inventory</span><strong>{data.totalProducts??0}</strong><small>Up to 500 entries shown in the table</small></article>
      <article className="ar-kpi"><span>Low stock (1–{data.threshold})</span><strong>{low}</strong><small>Active products needing attention</small></article>
      <article className="ar-kpi"><span>Out of stock</span><strong>{out}</strong><small>Active products currently unavailable</small></article>
    </div>
    <section className="ar-panel">
      <div className="ar-panel-title"><h2>Stock availability</h2><span>Quantity updates require a reason.</span></div>
      <div className="ar-filter-row">
        <input aria-label="Search inventory" placeholder="Search product or category" value={query} onChange={e=>setQuery(e.target.value)}/>
        <select aria-label="Filter inventory" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All products</option><option value="active">Active products</option>
          <option value="low">Low stock</option><option value="out">Out of stock</option>
        </select>
        <button type="button" className="ar-soft-action" onClick={()=>{setLoading(true);load();}}>Refresh</button>
      </div>
      {error&&<p role="alert" className="ar-error">{error}</p>}
      <div className="ar-table-scroll"><table className="ar-table"><thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Availability</th><th>Action</th></tr></thead>
        <tbody>{products.map(p=><tr key={p.id}><td><div className="ar-product-cell"><img src={p.imageUrl} alt=""/><span><b>{p.name}</b><small>{p.category?.name||'Uncategorised'} · {p.active?'Active':'Hidden'}</small></span></div></td>
          <td>{money(p.price,'en-BD')}</td><td><strong>{p.stock}</strong></td>
          <td><span className={`ar-pill ${p.stock===0?'ar-pill-danger':p.stock<=data.threshold?'ar-pill-warning':'ar-pill-success'}`}>{p.stock===0?'Out of stock':p.stock<=data.threshold?'Low stock':'In stock'}</span></td>
          <td><button type="button" className="ar-text-button" onClick={()=>begin(p)}>Adjust stock</button></td></tr>)}</tbody></table>
        {!loading&&products.length===0&&<p className="ar-empty">No matching products found.</p>}
        {loading&&<p className="ar-empty">Loading inventory...</p>}
      </div>
    </section>
    {selected&&<section className="ar-panel ar-adjust-panel" aria-label="Adjust selected product stock">
      <div className="ar-panel-title"><h2>Adjust: {selected.name}</h2><button type="button" className="ar-soft-action" onClick={()=>setSelected(null)}>Close ✕</button></div>
      <p>Current stock: <b>{selected.stock}</b>. This is a manual correction; new orders continue to deduct stock automatically.</p>
      <form onSubmit={save} className="ar-adjust-form">
        <label>New quantity<input type="number" min="0" max="1000000" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)} required/></label>
        <label>Reason (required)<input maxLength={200} minLength={4} value={reason} onChange={e=>setReason(e.target.value)} placeholder="e.g. Restock from supplier" required/></label>
        <button className="ar-action" type="submit" disabled={busy}>{busy?'Saving...':'Save adjustment'}</button>
      </form>
    </section>}
    <section className="ar-panel">
      <div className="ar-panel-title"><h2>Recent manual adjustments</h2><span>History begins after installing Admin V2.</span></div>
      <div className="ar-table-scroll"><table className="ar-table"><thead><tr><th>Date</th><th>Product</th><th>Before → After</th><th>Reason</th><th>By</th></tr></thead><tbody>
        {data.adjustments.map(a=><tr key={a.id}><td>{new Date(a.createdAt).toLocaleString('en-BD')}</td>
          <td>{a.product.name}</td><td><b>{a.beforeStock} → {a.afterStock}</b> ({a.delta>0?'+':''}{a.delta})</td>
          <td>{a.reason}</td><td>{a.admin.name}</td></tr>)}</tbody></table>
        {!data.adjustments.length&&<p className="ar-empty">No manual adjustments recorded yet.</p>}
      </div>
      <p className="ar-hint">This log records manual adjustments, including product-editor stock changes. Checkout and cancellation are represented by their orders, not by this manual adjustment table.</p>
    </section>
  </div>;
}
