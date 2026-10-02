'use client';
import {useCallback,useEffect,useState} from 'react';
import Link from 'next/link';
import {money} from '@/lib/format';
const nextStates={DRAFT:['BOOKED','CANCELLED'],BOOKED:['IN_TRANSIT','OUT_FOR_DELIVERY','FAILED','CANCELLED'],IN_TRANSIT:['OUT_FOR_DELIVERY','DELIVERED','FAILED','RETURNED'],OUT_FOR_DELIVERY:['DELIVERED','FAILED','RETURNED'],FAILED:['IN_TRANSIT','RETURNED','CANCELLED'],DELIVERED:['RETURNED'],RETURNED:[],CANCELLED:[]};
const names={DRAFT:'Draft',BOOKED:'Booked',IN_TRANSIT:'In transit',OUT_FOR_DELIVERY:'Out for delivery',DELIVERED:'Delivered',FAILED:'Failed attempt',RETURNED:'Returned',CANCELLED:'Cancelled'};

export default function AdminCourierDetail({id}){
 const [shipment,setShipment]=useState(null),[draft,setDraft]=useState(null),[note,setNote]=useState('');
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const load=useCallback(async()=>{
   setLoading(true);
   try{
     const response=await fetch('/api/admin/courier/'+encodeURIComponent(id),{cache:'no-store'});const body=await response.json();
     if(!response.ok)throw Error(body.error||'Shipment not found.');
     setShipment(body.shipment);
     setDraft({courierName:body.shipment.courierName,consignmentId:body.shipment.consignmentId,trackingUrl:body.shipment.trackingUrl,status:body.shipment.status,codCollected:String(body.shipment.codCollected)});
     setError('');setNote('');
   }catch(e){setError(e.message);}finally{setLoading(false);}
 },[id]);
 useEffect(()=>{load();},[load]);
 const set=(key,value)=>setDraft(old=>({...old,[key]:value}));
 async function save(e){
   e.preventDefault();setBusy(true);setError('');setSuccess('');
   try{
     const response=await fetch('/api/admin/courier/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({...draft,codCollected:Number(draft.codCollected),expectedVersion:shipment.version,note})});
     const body=await response.json();if(!response.ok)throw Error(body.error||'Could not save shipment.');
     await load();setSuccess('Shipment changes saved with an audit history entry.');
   }catch(e){setError(e.message);}finally{setBusy(false);}
 }
 return <div className="ar-admin-page ar-courier-page">
   <div className="ar-page-title"><div><span className="ar-eyebrow">COURIER / DELIVERY RECORD</span><h1>Shipment details</h1><p>Manual tracking and COD reconciliation with audit history.</p></div>
     <Link className="ar-soft-action" href="/admin/courier">← All shipments</Link></div>
   {loading&&<p className="ar-empty">Loading shipment...</p>}{error&&<p role="alert" className="ar-courier-error">{error}</p>}{success&&<p role="status" className="ar-courier-success">{success}</p>}
   {shipment&&draft&&<><section className="ar-panel"><div className="ar-panel-title"><h2>{shipment.order.orderNo}</h2><span className="ar-courier-status">{names[shipment.status]}</span></div>
     <div className="ar-courier-summary"><p><b>Customer</b><br/>{shipment.order.customerName} · {shipment.order.phone}</p><p><b>City / Area</b><br/>{shipment.order.city} · {shipment.order.area||'—'}</p>
       <p><b>Order value / Expected COD</b><br/>{money(shipment.order.total,'en-BD')} / {money(shipment.codExpected,'en-BD')}</p>
       <p><b>Original order status</b><br/>{shipment.order.status}</p></div>
     <div className="ar-courier-links"><Link className="ar-soft-action" href="/admin/orders">Orders ↗</Link><Link className="ar-soft-action" href={'/admin/invoices/'+encodeURIComponent(shipment.order.id)}>Invoice ↗</Link>
       {shipment.trackingUrl&&<a className="ar-soft-action" target="_blank" rel="noopener noreferrer" href={shipment.trackingUrl}>Courier tracking ↗</a>}</div>
   </section>
   <section className="ar-panel"><div className="ar-panel-title"><h2>Update shipment</h2><span>Each change requires a reason</span></div>
     <form onSubmit={save} className="ar-courier-form">
       <label>Courier name<input required minLength={2} maxLength={60} value={draft.courierName} onChange={e=>set('courierName',e.target.value)}/></label>
       <label>Consignment / Tracking ID<input maxLength={100} value={draft.consignmentId} onChange={e=>set('consignmentId',e.target.value)}/></label>
       <label>Tracking HTTPS link (optional)<input type="url" value={draft.trackingUrl} onChange={e=>set('trackingUrl',e.target.value)} placeholder="https://..."/></label>
       <label>Delivery status<select value={draft.status} onChange={e=>set('status',e.target.value)}>{[shipment.status,...nextStates[shipment.status]].map(s=><option key={s} value={s}>{names[s]}</option>)}</select></label>
       <label>COD physically received / verified (৳)<input type="number" required step="1" min="0" max={shipment.codExpected} value={draft.codCollected} onChange={e=>set('codCollected',e.target.value)}/></label>
       <label className="ar-courier-full">Reason / courier settlement reference<input required minLength={4} maxLength={200} value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Courier portal shows delivered; settlement ref #..."/></label>
       <button className="ar-action" type="submit" disabled={busy}>{busy?'Saving...':'Save shipment update'}</button>
     </form>
     <p className="ar-courier-hint">Collected COD is not inferred from status. Enter only an amount that you have independently verified. This form does not change order status, stock or customer payments.</p>
   </section>
   <section className="ar-panel"><div className="ar-panel-title"><h2>Change history</h2><span>Latest 100 updates</span></div>
     <div className="ar-courier-timeline">{shipment.events.map(event=><article key={event.id}><span className="ar-courier-timeline-dot"/><div><b>{event.fromStatus?names[event.fromStatus]+' → ':''}{names[event.toStatus]}</b>
       <small>{new Date(event.createdAt).toLocaleString('en-BD',{timeZone:'Asia/Dhaka'})} · {event.admin.name}</small><p>{event.note}</p>
       {event.beforeCollected!==event.afterCollected&&<small>COD: {money(event.beforeCollected,'en-BD')} → {money(event.afterCollected,'en-BD')}</small>}
       {event.fromCourierName!==event.toCourierName&&<small>Courier: {event.fromCourierName||'—'} → {event.toCourierName}</small>}
       {event.fromConsignment!==event.toConsignment&&<small>Consignment: {event.fromConsignment||'—'} → {event.toConsignment||'—'}</small>}
       </div></article>)}</div>
   </section></>}
 </div>;
}
