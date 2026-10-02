'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {money} from '@/lib/format';
import AdminSalesChart from './AdminSalesChart';

const m=n=>money(n,'en-BD');
const cards=[
  {key:'revenue',label:'Delivered order value',symbol:'৳',format:m,note:'Lifetime · payment not verified',href:'/admin/analytics'},
  {key:'orders',label:'Total orders',symbol:'▤',note:'All order statuses',href:'/admin/orders'},
  {key:'pending',label:'Pending orders',symbol:'◷',note:'Awaiting confirmation',href:'/admin/orders'},
  {key:'lowStock',label:'Low stock products',symbol:'!',note:'Active products with 1–5 units',href:'/admin/inventory'}
];
export default function AdminDashboard(){
  const [d,setD]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    const controller=new AbortController();
    fetch('/api/admin/stats',{cache:'no-store',signal:controller.signal})
      .then(async r=>{const body=await r.json();if(!r.ok)throw Error(body.error||'Could not load dashboard');return body;})
      .then(setD).catch(e=>{if(e.name!=='AbortError')setError(e.message);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[]);
  return <div className="ar-admin-page">
    <div className="ar-page-title"><div><span className="ar-eyebrow">STORE PERFORMANCE</span>
      <h1>Business Overview <span className="ar-heading-star">✦</span></h1>
      <p>Orders, sales and stock — all in one place.</p></div>
      <Link className="ar-action" href="/admin/orders">Manage Orders ↗</Link></div>
    {error&&<p className="ar-error" role="alert">{error}</p>}
    <div className="ar-kpi-grid">
      {cards.map(c=><Link href={c.href} className="ar-kpi" key={c.key}>
        <div className="ar-kpi-head"><span>{c.label}</span><span className="ar-kpi-symbol">{c.symbol}</span></div>
        <strong>{loading?'—':c.format?c.format(d?.[c.key]):(d?.[c.key]??'—')}</strong>
        <small>{c.note} <span>↗</span></small>
      </Link>)}
    </div>
    <div className="ar-dashboard-grid">
      <section className="ar-panel">
        <div className="ar-panel-title"><div><h2>Sales overview</h2><p>Delivered value by order placement date · last 30 days</p></div>
          <Link href="/admin/analytics" className="ar-text-button">Full report ↗</Link></div>
        <div className="ar-chart-head"><div><span>30-day delivered order value</span>
          <strong>{loading?'—':m(d?.period?.deliveredOrderValue)}</strong></div><span className="ar-pill ar-pill-success">Delivered only</span></div>
        {d?.chart?<AdminSalesChart data={d.chart}/>:<p className="ar-empty">Loading sales chart...</p>}
        <p className="ar-hint">A delivered order is not proof that COD payment has been collected.</p>
      </section>
      <section className="ar-panel ar-quick-panel"><div className="ar-panel-title"><h2>Quick management</h2></div>
        <Link href="/admin/products"><span>▦</span><div><b>Add or edit products</b><small>Catalog and pricing</small></div><span>↗</span></Link>
        <Link href="/admin/inventory"><span>▧</span><div><b>Inventory control</b><small>{d?.outOfStock??'—'} out-of-stock products</small></div><span>↗</span></Link>
        <Link href="/admin/invoices"><span>▣</span><div><b>Order invoices</b><small>Print or save as PDF</small></div><span>↗</span></Link>
        <Link href="/admin/ads-tracking"><span>◎</span><div><b>Ads & conversion</b><small>Tracking preferences</small></div><span>↗</span></Link>
      </section>
    </div>
    <section className="ar-panel">
      <div className="ar-panel-title"><div><h2>Recent orders</h2><p>Latest activity from your storefront</p></div>
        <Link className="ar-text-button" href="/admin/orders">View all ↗</Link></div>
      <div className="ar-table-scroll"><table className="ar-table">
        <thead><tr><th>Order number</th><th>Customer</th><th>Placed on</th><th>Status</th><th>Total</th><th>Invoice</th></tr></thead>
        <tbody>{(d?.latest||[]).map(o=><tr key={o.id}>
          <td><b>{o.orderNo}</b></td><td>{o.customerName}</td>
          <td>{new Date(o.createdAt).toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',month:'short',day:'numeric',year:'numeric'})}</td>
          <td><span className={`ar-pill ${o.status==='DELIVERED'?'ar-pill-success':o.status==='CANCELLED'?'ar-pill-danger':'ar-pill-warning'}`}>{o.status}</span></td>
          <td><b>{m(o.total)}</b></td>
          <td><Link className="ar-text-button" href={`/admin/invoices/${encodeURIComponent(o.id)}`}>View ↗</Link></td></tr>)}</tbody>
      </table>{!loading&&!d?.latest?.length&&<p className="ar-empty">No orders yet.</p>}
      </div>
    </section>
  </div>;
}
