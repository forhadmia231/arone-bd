'use client';

import { useEffect, useMemo, useState } from 'react';

const EVENT_OPTIONS = [
  ['ORDER_PENDING', 'Order Received'],
  ['ORDER_CONFIRMED', 'Order Confirmed'],
  ['ORDER_SHIPPED', 'Order Shipped'],
  ['ORDER_DELIVERED', 'Order Delivered'],
  ['ORDER_CANCELLED', 'Order Cancelled'],
];

export default function AdminNotifications() {
  const [data, setData] = useState({ templates: [], logs: [], lowStock: [], stats: {} });
  const [threshold, setThreshold] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [orderNo, setOrderNo] = useState('');
  const [eventKey, setEventKey] = useState('ORDER_CONFIRMED');
  const [channel, setChannel] = useState('WHATSAPP');
  const [manual, setManual] = useState({ recipient: '', customerName: '', channel: 'WHATSAPP', message: '' });

  async function load(nextThreshold = threshold) {
    setError('');
    const r = await fetch(`/api/admin/notifications?threshold=${encodeURIComponent(nextThreshold)}`, { cache: 'no-store' });
    const body = await r.json();
    if (!r.ok) throw new Error(body.error || 'Could not load notifications.');
    setData(body);
  }

  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const templateHelp = useMemo(() => '{{customerName}}, {{orderNo}}, {{total}}, {{status}}, {{courierName}}, {{consignmentId}}, {{trackingUrl}}, {{storeName}}', []);

  function updateTemplate(index, patch) {
    setData((prev) => ({
      ...prev,
      templates: prev.templates.map((item, i) => i === index ? { ...item, ...patch } : item),
    }));
  }

  async function saveTemplates() {
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await fetch('/api/admin/notifications/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: data.templates }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Could not save templates.');
      setData((prev) => ({ ...prev, templates: body.templates || prev.templates }));
      setMessage('Notification templates saved.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function prepareOrderNotification() {
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await fetch('/api/admin/notifications/order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo, eventKey, channel }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Could not prepare notification.');
      setMessage('Notification prepared. Use the WhatsApp/SMS button below to send it.');
      await load();
      if (channel === 'WHATSAPP' && body.whatsappUrl) window.open(body.whatsappUrl, '_blank', 'noopener,noreferrer');
      if (channel === 'SMS' && body.smsUrl) window.location.href = body.smsUrl;
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function queueManual() {
    setBusy(true); setError(''); setMessage('');
    try {
      const r = await fetch('/api/admin/notifications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(manual),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || 'Could not prepare notification.');
      setMessage('Manual notification prepared.');
      await load();
      if (manual.channel === 'WHATSAPP' && body.whatsappUrl) window.open(body.whatsappUrl, '_blank', 'noopener,noreferrer');
      if (manual.channel === 'SMS' && body.smsUrl) window.location.href = body.smsUrl;
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function setStatus(id, status) {
    const r = await fetch(`/api/admin/notifications/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body.error || 'Could not update notification.');
    await load();
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div>
        <span className="eyebrow">CUSTOMER COMMUNICATION</span>
        <h1 style={{ marginBottom: 5 }}>Notifications</h1>
        <p className="muted">Prepare order updates for WhatsApp or SMS, manage templates, and watch low-stock products.</p>
      </div>

      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      <div className="admin-stats">
        <div className="panel"><small>Queued</small><h2>{data.stats?.queued || 0}</h2></div>
        <div className="panel"><small>Sent</small><h2>{data.stats?.sent || 0}</h2></div>
        <div className="panel"><small>Failed</small><h2>{data.stats?.failed || 0}</h2></div>
        <div className="panel"><small>Low Stock</small><h2>{data.stats?.lowStock || 0}</h2></div>
      </div>

      <section className="panel" style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Prepare Order Update</h2>
        <p className="muted">This does not call a paid SMS/WhatsApp API. It prepares the message and opens your device/app for sending.</p>
        <div className="form-grid">
          <label>Order Number<input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="AR-..." /></label>
          <label>Event<select value={eventKey} onChange={(e) => setEventKey(e.target.value)}>{EVENT_OPTIONS.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Channel<select value={channel} onChange={(e) => setChannel(e.target.value)}><option>WHATSAPP</option><option>SMS</option></select></label>
        </div>
        <div><button className="btn btn-primary" disabled={busy || !orderNo.trim()} onClick={prepareOrderNotification}>Prepare & Open {channel}</button></div>
      </section>

      <section className="panel" style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Manual Message</h2>
        <div className="form-grid">
          <label>Customer Name<input value={manual.customerName} onChange={(e) => setManual({ ...manual, customerName: e.target.value })} /></label>
          <label>Phone<input value={manual.recipient} onChange={(e) => setManual({ ...manual, recipient: e.target.value })} placeholder="01XXXXXXXXX" /></label>
          <label>Channel<select value={manual.channel} onChange={(e) => setManual({ ...manual, channel: e.target.value })}><option>WHATSAPP</option><option>SMS</option></select></label>
          <label className="wide">Message<textarea rows={4} value={manual.message} onChange={(e) => setManual({ ...manual, message: e.target.value })} /></label>
        </div>
        <div><button className="btn btn-primary" disabled={busy || !manual.recipient || !manual.message} onClick={queueManual}>Prepare Manual Message</button></div>
      </section>

      <section className="panel" style={{ display: 'grid', gap: 14 }}>
        <div><h2 style={{ marginBottom: 4 }}>Order Templates</h2><p className="muted">Variables: {templateHelp}</p></div>
        {data.templates.map((t, index) => (
          <div key={t.id || t.key} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'grid', gap: 9 }}>
            <div className="form-grid">
              <label>Name<input value={t.name || ''} onChange={(e) => updateTemplate(index, { name: e.target.value })} /></label>
              <label>Channel<select value={t.channel || 'WHATSAPP'} onChange={(e) => updateTemplate(index, { channel: e.target.value })}><option>WHATSAPP</option><option>SMS</option></select></label>
              <label style={{ alignSelf: 'end' }}><input type="checkbox" checked={t.active !== false} onChange={(e) => updateTemplate(index, { active: e.target.checked })} /> Active</label>
              <label className="wide">Message<textarea rows={3} value={t.message || ''} onChange={(e) => updateTemplate(index, { message: e.target.value })} /></label>
            </div>
          </div>
        ))}
        <div><button className="btn btn-primary" disabled={busy} onClick={saveTemplates}>Save Templates</button></div>
      </section>

      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
          <div><h2 style={{ marginBottom: 4 }}>Low Stock Watch</h2><p className="muted">Active products at or below the selected stock threshold.</p></div>
          <label>Threshold<input type="number" min="0" max="1000" value={threshold} onChange={(e) => setThreshold(e.target.value)} onBlur={() => load(threshold).catch((e) => setError(e.message))} style={{ width: 100 }} /></label>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="admin-table"><thead><tr><th>Product</th><th>Stock</th><th>Price</th></tr></thead><tbody>
            {data.lowStock.length ? data.lowStock.map((p) => <tr key={p.id}><td>{p.name}</td><td><strong>{p.stock}</strong></td><td>৳{Number(p.price || 0).toLocaleString('en-US')}</td></tr>) : <tr><td colSpan="3" className="muted">No low-stock products at this threshold.</td></tr>}
          </tbody></table>
        </div>
      </section>

      <section className="panel">
        <h2>Recent Notification Log</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table"><thead><tr><th>Customer</th><th>Order</th><th>Channel</th><th>Message</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {data.logs.length ? data.logs.map((n) => <tr key={n.id}>
              <td>{n.customerName || '—'}<br/><small>{n.recipient}</small></td><td>{n.orderNo || 'Manual'}</td><td>{n.channel}</td><td style={{ minWidth: 280 }}>{n.message}</td><td>{n.status}</td><td>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {n.whatsappUrl && <a className="btn btn-outline" target="_blank" rel="noreferrer" href={n.whatsappUrl}>WhatsApp</a>}
                  {n.smsUrl && <a className="btn btn-outline" href={n.smsUrl}>SMS</a>}
                  {n.status !== 'SENT' && <button className="btn btn-primary" onClick={() => setStatus(n.id, 'SENT').catch((e) => setError(e.message))}>Mark Sent</button>}
                  {n.status !== 'FAILED' && <button className="btn btn-outline" onClick={() => setStatus(n.id, 'FAILED').catch((e) => setError(e.message))}>Failed</button>}
                </div>
              </td>
            </tr>) : <tr><td colSpan="6" className="muted">No notifications yet.</td></tr>}
          </tbody></table>
        </div>
      </section>
    </div>
  );
}
