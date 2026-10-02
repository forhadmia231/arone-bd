'use client';
import Link from 'next/link';
export default function AdminInvoiceActions(){
  return <div className="ar-invoice-actions">
    <Link href="/admin/invoices" className="ar-soft-action">← Back to invoices</Link>
    <button type="button" className="ar-action" onClick={()=>window.print()}>Print / Save as PDF</button>
  </div>;
}
