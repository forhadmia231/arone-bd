'use client';
import {useCallback,useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {money} from '@/lib/format';

const categories={ADVERTISING:'Shared advertising',RENT:'Rent',SALARY:'Salary',UTILITIES:'Utilities',SOFTWARE:'Software / subscriptions',SUPPLIES:'Office supplies',OTHER:'Other overhead'};
const costFields=[['productCost','Products (total buying cost)'],['packagingCost','Packaging'],['courierCost','Courier cost paid'],['adsCost','Ads allocated to this order'],['otherCost','Other direct cost']];
const emptyCosts={productCost:'',packagingCost:'0',courierCost:'0',adsCost:'0',otherCost:'0'};
const dateDhaka=()=>new Date(Date.now()+21600000).toISOString().slice(0,10);
const bdt=n=>money(n,'en-BD');
async function requestJson(url,options={}){
  const response=await fetch(url,{cache:'no-store',...options});
  const raw=await response.text();let body;
  try{body=JSON.parse(raw);}catch{throw Error(`Server returned a non-JSON response (HTTP ${response.status}). Check the Next.js terminal.`);}
  if(!response.ok)throw Error(body?.error||`Request failed (HTTP ${response.status}).`);
  return body;
}
export default function AdminFinance(){
  const [days,setDays]=useState(30),[data,setData]=useState(null),[loading,setLoading]=useState(true);
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const [productId,setProductId]=useState(''),[unitCost,setUnitCost]=useState('');
  const [orderId,setOrderId]=useState(''),[costs,setCosts]=useState(emptyCosts),[revisionReason,setRevisionReason]=useState('');
  const [history,setHistory]=useState(null),[historyBusy,setHistoryBusy]=useState(false);
  const [expense,setExpense]=useState({category:'ADVERTISING',amount:'',description:'',incurredOn:dateDhaka()});
  const [tab,setTab]=useState('overview');
  const load=useCallback(async()=>{
    setLoading(true);
    try{const value=await requestJson('/api/admin/finance?days='+days);setData(value);setError('');}
    catch(e){setError(e.message);}finally{setLoading(false);}
  },[days]);
  useEffect(()=>{load();},[load]);
  const selectedOrder=useMemo(()=>data?.orders.find(o=>o.id===orderId),[data,orderId]);
  function chooseProduct(id){setProductId(id);const p=data?.products.find(x=>x.id===id);setUnitCost(p?.unitCostProfile?.unitCost!=null?String(p.unitCostProfile.unitCost):'');}
  function chooseOrder(id){
    setOrderId(id);setRevisionReason('');setHistory(null);const o=data?.orders.find(x=>x.id===id);
    setCosts(o?.costRecord?Object.fromEntries(costFields.map(([k])=>[k,String(o.costRecord[k])])):{...emptyCosts});
  }
  function useReferenceEstimate(){if(selectedOrder?.suggestedProductCost!=null)setCosts(old=>({...old,productCost:String(selectedOrder.suggestedProductCost)}));}
  async function loadHistory(){
    if(!orderId)return;setHistoryBusy(true);setError('');
    try{const body=await requestJson('/api/admin/finance/order-cost?orderId='+encodeURIComponent(orderId));setHistory(body.revisions||[]);}
    catch(e){setError(e.message);}finally{setHistoryBusy(false);}
  }
  async function mutate(url,body,success){
    setBusy(true);setError('');setNotice('');
    try{
      await requestJson(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      await load();setNotice(success);return true;
    }catch(e){setError(e.message);return false;}finally{setBusy(false);}
  }
  async function saveProduct(event){event.preventDefault();
    const ok=await mutate('/api/admin/finance/product-cost',{productId,unitCost:Number(unitCost)},'Reference product cost saved. Previous order snapshots stay unchanged.');
    if(ok){setProductId('');setUnitCost('');}
  }
  async function saveOrder(event){event.preventDefault();
    if(!selectedOrder)return;
    const values=Object.fromEntries(costFields.map(([k])=>[k,costs[k]===''?null:Number(costs[k])]));
    const ok=await mutate('/api/admin/finance/order-cost',{orderId,...values,version:selectedOrder.costRecord?.version,reason:revisionReason},selectedOrder.costRecord?'Order cost corrected and revision recorded.':'Order cost snapshot saved.');
    if(ok){setOrderId('');setCosts({...emptyCosts});setRevisionReason('');}
  }
  async function saveExpense(event){event.preventDefault();
    const ok=await mutate('/api/admin/finance/expenses',{...expense,amount:Number(expense.amount)},'Shared expense recorded. Do not also allocate this same spend to an order.');
    if(ok)setExpense({category:'ADVERTISING',amount:'',description:'',incurredOn:dateDhaka()});
  }
  async function voidExpense(id){
    const reason=window.prompt('Reason for voiding this expense (at least 8 characters):');
    if(reason===null)return;
    if(reason.trim().length<8){setError('Please enter a correction reason of at least 8 characters.');return;}
    setBusy(true);setError('');setNotice('');
    try{await requestJson('/api/admin/finance/expenses/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});await load();setNotice('Expense voided; audit record retained.');}
    catch(e){setError(e.message);}finally{setBusy(false);}
  }
  const summary=data?.summary;
  const chart=(data?.series||[]).slice(-14);
  const ceiling=Math.max(1,...chart.map(x=>x.deliveredValue));
  return <div className="ar-admin-page ar-finance">
    <div className="ar-page-title"><div><span className="ar-eyebrow">BUSINESS / FINANCIAL OPERATIONS</span><h1>Profit & Expense Management ✦</h1>
      <p>Record purchase costs, order-level cost snapshots and shared expenses without changing checkout or invoices.</p></div>
      <Link className="ar-soft-action" href="/admin/courier">Courier Management ↗</Link></div>
    <div className="ar-finance-note"><b>Important:</b> This is a management estimate, not audited net profit or verified COD receipts. Orders use placement date and their current DELIVERED status; overhead uses expense date. Costs for old orders are never invented automatically.</div>
    <div className="ar-finance-toolbar"><div className="ar-tabs" role="group" aria-label="Finance sections">
      {[["overview","Overview"],["costs","Product & order costs"],["expenses","Shared expenses"]].map(([id,label])=><button key={id} type="button" className={tab===id?'active':''} onClick={()=>setTab(id)}>{label}</button>)}
    </div><label>Report window <select value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select></label></div>
    {error&&<p role="alert" className="ar-error">{error}</p>}{notice&&<p role="status" className="ar-finance-success">{notice}</p>}
    {loading&&!data&&<p className="ar-empty">Loading finance report...</p>}
    {data&&<>
      {tab==='overview'&&<>
        <div className="ar-kpi-grid ar-finance-kpis">
          <div className="ar-kpi"><span>Delivered order value</span><strong>{bdt(summary.deliveredValue)}</strong><small>{summary.deliveredCount} delivered orders (not payment verification)</small></div>
          <div className="ar-kpi"><span>Costed-order revenue</span><strong>{bdt(summary.costedValue)}</strong><small>{summary.coveredOrders} orders with saved cost snapshots</small></div>
          <div className="ar-kpi"><span>Recorded direct costs</span><strong>{bdt(summary.directCost)}</strong><small>Buying + packaging + courier + allocated ads + other</small></div>
          <div className="ar-kpi"><span>Shared expenses</span><strong>{bdt(summary.sharedExpense)}</strong><small>Non-voided overhead recorded in period</small></div>
        </div>
        <div className="ar-finance-result"><div><span>Partial estimated result</span><strong className={summary.partialResult<0?'negative':''}>{bdt(summary.partialResult)}</strong><small>Costed-order revenue − direct costs − shared expenses</small></div><div><span>Cost coverage</span><strong>{summary.coveredOrders}/{summary.deliveredCount}</strong><small>{summary.uncostedCount} delivered order(s) do not have cost data</small></div></div>
        {summary.uncostedCount>0&&<p className="ar-finance-warning" role="note">Estimated result is INCOMPLETE: {summary.uncostedCount} delivered order(s) lack recorded costs; their revenue is excluded from this estimate. Add their actual cost snapshots before interpreting performance.</p>}
        <section className="ar-panel"><div className="ar-panel-title"><h2>Daily delivered value</h2><span>Last {chart.length} days of chosen period</span></div>
          <div className="ar-finance-chart" role="img" aria-label="Daily delivered order values">
            {chart.map(row=><div className="ar-finance-day" key={row.date} title={`${row.date}: ${bdt(row.deliveredValue)} delivered value`}>
              <div className="ar-finance-bar-track"><div style={{height:`${Math.max(2,Math.round(row.deliveredValue/ceiling*100))}%`}}/></div><small>{row.date.slice(5)}</small></div>)}
          </div><p className="ar-hint">Values are grouped by order placement date, not confirmed payment or actual delivery date.</p></section>
        <section className="ar-panel"><div className="ar-panel-title"><h2>Accounting notes</h2></div><p className="ar-finance-copy">Product purchase cost is a reference for NEW entries. Clicking “Use current reference estimate” copies it into an editable snapshot. Later product-cost changes never rewrite past snapshots. Expense dates and order-placement dates are different accounting bases; do not treat the partial result as audited net profit. Do not record the same ad/courier spend both as a direct order cost and a shared expense.</p></section>
      </>}
      {tab==='costs'&&<>
        <section className="ar-panel"><div className="ar-panel-title"><h2>Product purchase cost</h2><span>{data.productTotal>500?'First 500 products are available.':'Reference unit cost only; no stock adjustment.'}</span></div>
          <form className="ar-finance-form" onSubmit={saveProduct}>
            <label>Product<select required value={productId} onChange={e=>chooseProduct(e.target.value)}><option value="">Select product</option>{data.products.map(p=><option key={p.id} value={p.id}>{p.name}{!p.active?' (archived)':''}</option>)}</select></label>
            <label>Buying cost per unit (৳)<input required type="number" min="0" max="1000000000" step="1" value={unitCost} onChange={e=>setUnitCost(e.target.value)} placeholder="e.g. 650"/></label>
            <button className="ar-action" type="submit" disabled={busy||!productId||unitCost===''}>{busy?'Saving...':'Save reference cost'}</button>
          </form><p className="ar-hint">This setting does not change selling price, product stock, historical orders or invoices.</p></section>
        <section className="ar-panel"><div className="ar-panel-title"><h2>Order direct-cost snapshot</h2><span>Latest 80 non-cancelled orders; initial and correction history retained.</span></div>
          <form onSubmit={saveOrder} className="ar-finance-form ar-finance-order-form">
            <label className="ar-finance-wide">Order<select required value={orderId} onChange={e=>chooseOrder(e.target.value)}><option value="">Select order</option>{data.orders.map(o=><option key={o.id} value={o.id}>{o.orderNo} · {bdt(o.total)} · {o.status}{o.costRecord?' · cost recorded':' · no cost snapshot'}</option>)}</select></label>
            {selectedOrder&&<div className="ar-finance-wide ar-finance-order-note"><span>Order value: <b>{bdt(selectedOrder.total)}</b> · Status: {selectedOrder.status} · Snapshot: {selectedOrder.costRecord?'Version '+selectedOrder.costRecord.version:'Not recorded'}</span><span>Current product-cost estimate: <b>{selectedOrder.suggestedProductCost==null?'Unavailable: set buying costs for every retained product':bdt(selectedOrder.suggestedProductCost)}</b></span>
              <button type="button" className="ar-soft-action" disabled={selectedOrder.suggestedProductCost==null} onClick={useReferenceEstimate}>Use current reference estimate</button><small>This is only a suggested starting value, NOT historical proof. Review actual costs before saving.</small>{selectedOrder.costRecord&&<button type="button" className="ar-soft-action" disabled={historyBusy} onClick={loadHistory}>{historyBusy?'Loading...':'View revision history'}</button>}</div>}
            {costFields.map(([key,label])=><label key={key}>{label} (৳)<input required type="number" min="0" max="1000000000" step="1" value={costs[key]} onChange={e=>setCosts(old=>({...old,[key]:e.target.value}))}/></label>)}
            {selectedOrder?.costRecord&&<label className="ar-finance-wide">Reason for correction (required)<input required minLength={8} maxLength={240} value={revisionReason} onChange={e=>setRevisionReason(e.target.value)} placeholder="e.g. Corrected supplier invoice"/></label>}
            <div className="ar-finance-form-foot"><span>Total direct cost: <b>{bdt(costFields.reduce((s,[k])=>s+Number(costs[k]||0),0))}</b></span><button className="ar-action" type="submit" disabled={busy||!selectedOrder}>{busy?'Saving...':selectedOrder?.costRecord?'Save correction + revision':'Create order cost snapshot'}</button></div>
          </form>
          {history&&<div className="ar-finance-history"><h3>Recent cost revisions</h3>{history.map(row=><div key={row.id}><b>{new Date(row.createdAt).toLocaleString('en-GB',{timeZone:'Asia/Dhaka'})}</b> — {row.reason}<small>Before: {row.before?bdt(Object.values(row.before).reduce((a,b)=>a+Number(b||0),0)):'First entry'} · After: {bdt(Object.values(row.after||{}).reduce((a,b)=>a+Number(b||0),0))}</small></div>)}{!history.length&&<p>No revision history yet.</p>}</div>}
        </section>
      </>}
      {tab==='expenses'&&<>
        <section className="ar-panel"><div className="ar-panel-title"><h2>Record shared operating expense</h2><span>Only costs NOT already allocated to individual orders.</span></div>
          <form className="ar-finance-form" onSubmit={saveExpense}>
            <label>Category<select value={expense.category} onChange={e=>setExpense(x=>({...x,category:e.target.value}))}>{Object.entries(categories).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label>
            <label>Amount (৳)<input required type="number" step="1" min="1" max="1000000000" value={expense.amount} onChange={e=>setExpense(x=>({...x,amount:e.target.value}))}/></label>
            <label>Expense date (Asia/Dhaka)<input required type="date" max={dateDhaka()} value={expense.incurredOn} onChange={e=>setExpense(x=>({...x,incurredOn:e.target.value}))}/></label>
            <label className="ar-finance-wide">Description<input required minLength={4} maxLength={180} value={expense.description} onChange={e=>setExpense(x=>({...x,description:e.target.value}))} placeholder="e.g. Monthly office rent"/></label>
            <button className="ar-action" type="submit" disabled={busy}>{busy?'Saving...':'Add expense +'}</button>
          </form></section>
        <section className="ar-panel"><div className="ar-panel-title"><h2>Expense ledger</h2><span>Latest 50 entries. Corrections are voided, never hard-deleted.</span></div>
          <div className="ar-table-scroll"><table className="ar-table"><thead><tr><th>Date</th><th>Category / Note</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {data.ledger.map(e=><tr key={e.id}><td>{new Date(e.incurredOn).toLocaleDateString('en-GB',{timeZone:'Asia/Dhaka'})}</td><td><b>{categories[e.category]||e.category}</b><br/>{e.description}{e.voidReason&&<small className="ar-finance-sub">Void reason: {e.voidReason}</small>}</td><td>{bdt(e.amount)}</td><td>{e.voidedAt?'Voided':'Recorded'}</td><td>{!e.voidedAt&&<button type="button" className="ar-text-button" disabled={busy} onClick={()=>voidExpense(e.id)}>Void ↗</button>}</td></tr>)}
          </tbody></table>{!data.ledger.length&&<p className="ar-empty">No expenses recorded yet.</p>}</div></section>
      </>}
      <p className="ar-finance-footnote">{data.methodology}</p>
    </>}
  </div>;
}
