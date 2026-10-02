'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {money} from '@/lib/format';
export default function AdminInvoices() {
  const [query,setQuery]=useState('');
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(1);
  const [data,setData]=useState({orders:[],pages:0,total:0});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  useEffect(()=>{
    const ctrl=new AbortController();
    setLoading(true);
    fetch(`/api/admin/invoices?page=${page}&q=${encodeURIComponent(search)}`,
      {cache:'no-store',signal:ctrl.signal})
      .then(async r=>{const b=await r.json();if(!r.ok)throw Error(b.error||'Could not load invoices');return b;})
      .then(d=>{setData(d);setError('');})
      .catch(e=>{if(e.name!=='AbortError')setError(e.message);})
      .finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});
    return()=>ctrl.abort();
  },[search,page]);
  return <div className="ar-admin-page">
    <div className="ar-page-title"><div><span className="ar-eyebrow">FINANCE / DOCUMENTS</span><h1>Invoices</h1>
      <p>View order snapshots and print an invoice or save it as a PDF.</p></div>
      <span className="ar-muted-label">{data.total} matching orders</span></div>
    <section className="ar-panel">
      <form className="ar-filter-row" onSubmit={e=>{e.preventDefault();setPage(1);setSearch(query);}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search order number, customer or phone" aria-label="Search invoices"/>
        <button className="ar-action" type="submit">Search</button>
      </form>
      {error&&<p role="alert" className="ar-error">{error}</p>}
      <div className="ar-table-scroll"><table className="ar-table"><thead><tr><th>Invoice / order no.</th><th>Date</th><th>Customer</th><th>Status</th><th>Amount</th><th>Invoice</th></tr></thead>
        <tbody>{data.orders.map(o=><tr key={o.id}>
          <td><b>{o.orderNo}</b></td><td>{new Date(o.createdAt).toLocaleDateString('en-BD',{timeZone:'Asia/Dhaka',year:'numeric',month:'short',day:'numeric'})}</td>
          <td>{o.customerName}</td><td><span className="ar-pill">{o.status}</span></td><td><b>{money(o.total,'en-BD')}</b></td>
          <td><Link className="ar-text-button" href={`/admin/invoices/${encodeURIComponent(o.id)}`}>View / Print ↗</Link></td>
        </tr>)}</tbody></table>
        {!loading&&!data.orders.length&&<p className="ar-empty">No invoices found.</p>}
        {loading&&<p className="ar-empty">Loading orders...</p>}
      </div>
      <div className="ar-pager"><button type="button" disabled={page<=1||loading} onClick={()=>setPage(x=>x-1)}>← Previous</button>
        <span>Page {page} of {Math.max(1,data.pages)}</span>
        <button type="button" disabled={page>=data.pages||loading} onClick={()=>setPage(x=>x+1)}>Next →</button></div>
      <p className="ar-hint">Invoice records reuse the immutable order-item name, price and quantity saved at checkout. Cash-on-delivery is not automatically marked as paid.</p>
    </section>
  </div>;
}
