import {notFound} from 'next/navigation';
import {prisma} from '@/lib/prisma';
import {adminUser} from '@/lib/auth';
import {money} from '@/lib/format';
import AdminInvoiceActions from '@/components/AdminInvoiceActions';

export const metadata={title:'Order Invoice'};
export const dynamic='force-dynamic';
export default async function InvoicePage({params}) {
  const admin=await adminUser();
  if(!admin)notFound();
  const {id}=await params;
  const order=await prisma.order.findUnique({where:{id},include:{items:true}});
  if(!order)notFound();
  const date=new Date(order.createdAt).toLocaleString('en-BD',
    {timeZone:'Asia/Dhaka',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
  return <div className="ar-admin-page ar-invoice-page">
    <div className="ar-page-title"><div><span className="ar-eyebrow">ORDER DOCUMENT</span><h1>Invoice: {order.orderNo}</h1>
      <p>Use your browser Print dialog and choose Save as PDF to download.</p></div></div>
    <AdminInvoiceActions/>
    <article className="ar-invoice-sheet">
      <header className="ar-invoice-head">
        <div><div className="ar-invoice-brand">ARONE <span>BD</span></div><p>Order invoice · Jewellery & Gift Collection</p></div>
        <div className="ar-invoice-meta"><h2>INVOICE</h2><b>{order.orderNo}</b><span>{date} (Bangladesh time)</span></div>
      </header>
      <div className="ar-invoice-info">
        <div><span className="ar-eyebrow">BILL TO</span><h3>{order.customerName}</h3>
          <p>{order.phone}</p>{order.email&&<p>{order.email}</p>}
          <p>{[order.address,order.area,order.city].filter(Boolean).join(', ')}</p></div>
        <div><span className="ar-eyebrow">ORDER DETAILS</span>
          <p><b>Order status:</b> {order.status}</p>
          <p><b>Payment method:</b> {order.paymentMethod==='CASH_ON_DELIVERY'?'Cash on Delivery':order.paymentMethod}</p>
          <p><b>Payment confirmation:</b> Not independently recorded</p>
        </div>
      </div>
      <div className="ar-table-scroll"><table className="ar-table ar-invoice-table"><thead><tr><th>Product</th><th>Unit price</th><th>Qty</th><th>Line total</th></tr></thead>
        <tbody>{order.items.map(item=><tr key={item.id}><td>{item.name}</td>
          <td>{money(item.unitPrice,'en-BD')}</td><td>{item.quantity}</td><td>{money(item.lineTotal,'en-BD')}</td></tr>)}</tbody></table></div>
      <div className="ar-invoice-totals">
        <div><span>Subtotal</span><strong>{money(order.subtotal,'en-BD')}</strong></div>
        <div><span>Delivery charge</span><strong>{money(order.shippingFee,'en-BD')}</strong></div>
        <div className="ar-invoice-grand"><span>Total</span><strong>{money(order.total,'en-BD')}</strong></div>
      </div>
      {order.note&&<p className="ar-invoice-note"><b>Customer note:</b> {order.note}</p>}
      <footer className="ar-invoice-foot"><p>Thank you for shopping with ARONE BD.</p>
        <small>This is an order invoice, not a receipt or proof of COD payment.</small></footer>
    </article>
  </div>;
}
