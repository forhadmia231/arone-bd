'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {money} from '@/lib/format';

const choices=['','DRAFT','BOOKED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RETURNED','CANCELLED'];
const titles={DRAFT:'Draft',BOOKED:'Booked',IN_TRANSIT:'In transit',OUT_FOR_DELIVERY:'Out for delivery',DELIVERED:'Delivered',FAILED:'Failed attempt',RETURNED:'Returned',CANCELLED:'Cancelled'};
const providers=['Steadfast','Pathao Courier','REDX','Sundarban Courier','Own Delivery','Other'];

export default function AdminCourier(){
 const [data,setData]=useState({shipments:[],unassigned:[],counts:{},total:0,page:1,pages:0});
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const [search,setSearch]=useState(''),[submitted,setSubmitted]=useState(''),[filter,setFilter]=useState(''),[page,setPage]=useState(1);
 const [orderId,setOrderId]=useState(''),[courierName,setCourierName]=useState('Steadfast'),[custom,setCustom]=useState('');
 const [consignmentId,setConsignmentId]=useState(''),[trackingUrl,setTrackingUrl]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
   setLoading(true);
   try{
     const q=new URLSearchParams({page:String(page)});
     if(filter)q.set('status',filter);
     if(submitted)q.set('q',submitted);
     const response=await fetch('/api/admin/courier?'+q.toString(),{cache:'no-store'});
     const body=await response.json();
     if(!response.ok)throw Error(body.error||'Could not load courier information.');
     setData(body);setError('');
   }catch(e){setError(e.message);}finally{setLoading(false);}
 },[filter,submitted,page]);
 useEffect(()=>{load();},[load]);
 async function create(event){
   event.preventDefault();setError('');setSuccess('');setBusy(true);
   try{
     const response=await fetch('/api/admin/courier',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId,courierName:courierName==='Other'?custom:courierName,consignmentId,trackingUrl})});
     const body=await response.json();if(!response.ok)throw Error(body.error||'Could not create shipment.');
     setOrderId('');setConsignmentId('');setTrackingUrl('');setSuccess('Shipment record created. Open it to update delivery status and COD collection.');
     await load();
   }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <div className="ar-admin-page ar-courier-page">
   <div className="ar-page-title"><div><span className="ar-eyebrow">OPERATIONS / FULFILLMENT</span><h1>Courier & Delivery</h1>
     <p>Manage bookings, consignment IDs, delivery progress and verified manual COD entries.</p></div>
     <Link className="ar-soft-action" href="/admin/orders">Order Management ↗</Link></div>
   <div className="ar-courier-notice"><b>Manual integration:</b> courier statuses and COD figures are entered by your staff. Nothing is fetched from a provider and no parcel is booked automatically. The original order status and inventory remain unchanged.</div>
   <div className="ar-kpi-grid ar-kpi-grid-three">
     <div className="ar-kpi"><span>Shipment records</span><strong>{Object.values(data.counts).reduce((sum,n)=>sum+n,0)}</strong><small>Across all delivery statuses</small></div>
     <div className="ar-kpi"><span>On the way</span><strong>{(data.counts.IN_TRANSIT||0)+(data.counts.OUT_FOR_DELIVERY||0)}</strong><small>Manually updated statuses</small></div>
     <div className="ar-kpi"><span>Not completed</span><strong>{(data.counts.DRAFT||0)+(data.counts.BOOKED||0)+(data.counts.FAILED||0)}</strong><small>Draft, booked and failed attempt</small></div>
   </div>
   <section className="ar-panel">
     <div className="ar-panel-title"><h2>Create shipment record</h2><span>One shipment per order in this phase</span></div>
     <form className="ar-courier-form" onSubmit={create}>
       <label>Unassigned order<select required value={orderId} onChange={e=>setOrderId(e.target.value)}>
         <option value="">Select an order</option>{data.unassigned.map(o=><option key={o.id} value={o.id}>{o.orderNo} — {o.customerName} — {money(o.total,'en-BD')} ({o.status})</option>)}
       </select></label>
       <label>Courier<select value={courierName} onChange={e=>setCourierName(e.target.value)}>{providers.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
       {courierName==='Other'&&<label>Courier name<input required minLength={2} maxLength={60} value={custom} onChange={e=>setCustom(e.target.value)}/></label>}
       <label>Consignment ID (optional)<input maxLength={100} value={consignmentId} onChange={e=>setConsignmentId(e.target.value)} placeholder="Enter after booking"/></label>
       <label>Courier tracking HTTPS URL (optional)<input type="url" value={trackingUrl} onChange={e=>setTrackingUrl(e.target.value)} placeholder="https://..."/></label>
       <button className="ar-action" disabled={busy||!orderId} type="submit">{busy?'Creating...':'Create shipment record +'}</button>
     </form>
     <p className="ar-courier-hint">Only the latest 80 eligible unassigned orders are shown. This action never calls the courier provider.</p>
   </section>
   <section className="ar-panel">
     <div className="ar-panel-title"><h2>Shipment register</h2><span>{data.total} result(s) · 20 per page</span></div>
     <form className="ar-courier-filter" onSubmit={e=>{e.preventDefault();setPage(1);setSubmitted(search.trim());}}>
       <input aria-label="Search by order, customer, courier or consignment" placeholder="Order no, customer or consignment ID" value={search} onChange={e=>setSearch(e.target.value)}/>
       <select aria-label="Filter delivery status" value={filter} onChange={e=>{setPage(1);setFilter(e.target.value);}}>{choices.map(x=><option key={x} value={x}>{x?titles[x]:'All delivery statuses'}</option>)}</select>
       <button type="submit" className="ar-soft-action">Search</button>
       <button type="button" className="ar-soft-action" onClick={()=>{setSearch('');setSubmitted('');setFilter('');setPage(1);}}>Reset</button>
     </form>
     {error&&<p role="alert" className="ar-courier-error">{error}</p>}{success&&<p role="status" className="ar-courier-success">{success}</p>}
     <div className="ar-table-scroll"><table className="ar-table"><thead><tr><th>Order / Customer</th><th>Courier / Parcel</th><th>Delivery status</th><th>COD received (manual)</th><th>Manage</th></tr></thead><tbody>
       {data.shipments.map(s=><tr key={s.id}><td><strong>{s.order.orderNo}</strong><small className="ar-courier-sub">{s.order.customerName} · {s.order.city}</small></td>
         <td>{s.courierName}<small className="ar-courier-sub">{s.consignmentId||'No consignment ID yet'}</small></td>
         <td><span className={'ar-courier-status ar-courier-status-'+s.status.toLowerCase()}>{titles[s.status]}</span><small className="ar-courier-sub">Order: {s.order.status}</small></td>
         <td>{money(s.codCollected,'en-BD')} / {money(s.codExpected,'en-BD')}</td>
         <td><Link className="ar-text-button" href={'/admin/courier/'+encodeURIComponent(s.id)}>Manage ↗</Link></td></tr>)}
       </tbody></table>{loading&&<p className="ar-empty">Loading shipments...</p>}{!loading&&!data.shipments.length&&<p className="ar-empty">No shipment records found.</p>}</div>
     <div className="ar-courier-pager"><button type="button" className="ar-soft-action" disabled={page===1||loading} onClick={()=>setPage(p=>p-1)}>← Previous</button>
       <span>Page {page} of {Math.max(1,data.pages)}</span><button type="button" className="ar-soft-action" disabled={loading||page>=data.pages} onClick={()=>setPage(p=>p+1)}>Next →</button></div>
   </section>
 </div>;
}
