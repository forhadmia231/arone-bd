'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {money} from '@/lib/format';
import AdminSalesChart from './AdminSalesChart';
const m=n=>money(n,'en-BD');
const statuses=['PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED'];
export default function AdminAnalytics(){
  const [days,setDays]=useState(30);
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    const ctrl=new AbortController();setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`,{cache:'no-store',signal:ctrl.signal})
      .then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error||'Report not available');return b;})
      .then(d=>{setData(d);setError('');}).catch(e=>{if(e.name!=='AbortError')setError(e.message);})
      .finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
    return()=>ctrl.abort();
  },[days]);
  return <div className="ar-admin-page">
    <div className="ar-page-title"><div><span className="ar-eyebrow">BUSINESS INTELLIGENCE</span><h1>Sales Analytics</h1>
      <p>Understand order trends without confusing placed orders with collected payments.</p></div>
      <Link href="/admin/invoices" className="ar-action">Invoices ↗</Link></div>
    <div className="ar-tabs" role="group" aria-label="Reporting period">{[7,30,90].map(n=>
      <button type="button" key={n} className={days===n?'active':''} onClick={()=>setDays(n)}>Last {n} days</button>)}</div>
    {error&&<p role="alert" className="ar-error">{error}</p>}
    <div className="ar-kpi-grid ar-kpi-grid-three">
      <article className="ar-kpi"><span>Orders placed</span><strong>{loading?'—':data?.placedOrders}</strong><small>Includes cancellations</small></article>
      <article className="ar-kpi"><span>Delivered order value</span><strong>{loading?'—':m(data?.deliveredValue)}</strong><small>Payment not independently verified</small></article>
      <article className="ar-kpi"><span>Average delivered order</span><strong>{loading?'—':m(data?.averageDeliveredOrderValue)}</strong><small>For delivered orders placed in range</small></article>
    </div>
    <section className="ar-panel"><div className="ar-panel-title"><div><h2>Delivery-value trend</h2>
      <p>Orders grouped by original placement date, Bangladesh time</p></div></div>
      {data?<AdminSalesChart data={data.series} height={240}/>:<p className="ar-empty">Loading chart...</p>}
    </section>
    <section className="ar-panel"><div className="ar-panel-title"><h2>Order status breakdown</h2></div>
      <div className="ar-status-grid">{statuses.map(s=><div key={s}><span>{s}</span><b>{data?.statusCounts?.[s]??'—'}</b></div>)}</div>
      <p className="ar-hint">{data?.note||'Sales totals are based on current order status. No cost or verified payment data is stored yet.'}</p>
    </section>
  </div>;
}
