'use client';

import { useEffect, useMemo, useState } from 'react';

const empty = {
  id: '',
  name: 'New Promotion',
  type: 'BANNER',
  title: 'Special Offer',
  message: 'Limited-time offer for Arone Bd customers.',
  imageUrl: '',
  buttonText: 'Shop Now',
  buttonUrl: '/shop',
  couponCode: '',
  active: true,
  dismissible: true,
  showOncePerSession: false,
  startAt: '',
  endAt: '',
  backgroundColor: '#173F29',
  textColor: '#FFFFFF',
  targetPath: '*',
  position: 'BOTTOM',
  priority: 0,
};

function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function AdminPromotions() {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const editing = Boolean(form.id);

  const totals = useMemo(() => ({
    views: campaigns.reduce((a, b) => a + (b.viewCount || 0), 0),
    clicks: campaigns.reduce((a, b) => a + (b.clickCount || 0), 0),
  }), [campaigns]);

  async function load() {
    setError('');
    const response = await fetch('/api/admin/promotions', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load promotions.');
    setCampaigns(data.campaigns || []);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function change(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function edit(item) {
    setForm({
      ...empty,
      ...item,
      startAt: toLocalInput(item.startAt),
      endAt: toLocalInput(item.endAt),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setForm(empty);
    setError('');
    setMessage('');
  }

  async function save() {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const url = editing
        ? `/api/admin/promotions/${form.id}`
        : '/api/admin/promotions';
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save promotion.');

      setMessage(editing ? 'Promotion updated.' : 'Promotion created.');
      await load();
      if (!editing) setForm(empty);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this promotion?')) return;
    const response = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Could not delete promotion.');
      return;
    }
    if (form.id === id) reset();
    await load();
  }

  return (
    <div className="arp-admin">
      <div className="arp-heading">
        <div>
          <span className="eyebrow">MARKETING</span>
          <h1>Promotions</h1>
          <p className="muted">Create scheduled banners and popups without editing frontend code.</p>
        </div>
        <div className="arp-stats">
          <span><b>{totals.views}</b><small>Views</small></span>
          <span><b>{totals.clicks}</b><small>Clicks</small></span>
        </div>
      </div>

      {error && <div className="arp-error">{error}</div>}
      {message && <div className="arp-success">{message}</div>}

      <section className="panel arp-form">
        <div className="arp-form-head">
          <h2>{editing ? 'Edit Promotion' : 'Create Promotion'}</h2>
          {editing && <button className="btn btn-outline" onClick={reset}>New Promotion</button>}
        </div>

        <div className="arp-grid">
          <label>Name<input value={form.name} onChange={(e) => change('name', e.target.value)} /></label>
          <label>Type<select value={form.type} onChange={(e) => change('type', e.target.value)}><option value="BANNER">Banner</option><option value="POPUP">Popup</option></select></label>
          <label>Title<input value={form.title} onChange={(e) => change('title', e.target.value)} /></label>
          <label>Target Path<input value={form.targetPath} onChange={(e) => change('targetPath', e.target.value)} placeholder="* or /landing/eid-sale" /></label>
          <label className="arp-wide">Message<textarea rows="3" value={form.message} onChange={(e) => change('message', e.target.value)} /></label>
          <label className="arp-wide">Image URL<input value={form.imageUrl} onChange={(e) => change('imageUrl', e.target.value)} placeholder="https://... or data:image/..." /></label>
          <label>Button Text<input value={form.buttonText} onChange={(e) => change('buttonText', e.target.value)} /></label>
          <label>Button URL<input value={form.buttonUrl} onChange={(e) => change('buttonUrl', e.target.value)} /></label>
          <label>Coupon Code<input value={form.couponCode} onChange={(e) => change('couponCode', e.target.value)} /></label>
          <label>Position<select value={form.position} onChange={(e) => change('position', e.target.value)}><option value="BOTTOM">Bottom</option><option value="TOP">Top</option></select></label>
          <label>Background<input type="color" value={form.backgroundColor} onChange={(e) => change('backgroundColor', e.target.value)} /></label>
          <label>Text Color<input type="color" value={form.textColor} onChange={(e) => change('textColor', e.target.value)} /></label>
          <label>Start At<input type="datetime-local" value={form.startAt || ''} onChange={(e) => change('startAt', e.target.value)} /></label>
          <label>End At<input type="datetime-local" value={form.endAt || ''} onChange={(e) => change('endAt', e.target.value)} /></label>
          <label>Priority<input type="number" value={form.priority} onChange={(e) => change('priority', Number(e.target.value || 0))} /></label>
        </div>

        <div className="arp-checks">
          <label><input type="checkbox" checked={form.active} onChange={(e) => change('active', e.target.checked)} /> Active</label>
          <label><input type="checkbox" checked={form.dismissible} onChange={(e) => change('dismissible', e.target.checked)} /> Dismissible</label>
          <label><input type="checkbox" checked={form.showOncePerSession} onChange={(e) => change('showOncePerSession', e.target.checked)} /> Once per session</label>
        </div>

        <button className="btn btn-primary" type="button" disabled={busy} onClick={save}>
          {busy ? 'Saving...' : editing ? 'Update Promotion' : 'Create Promotion'}
        </button>
      </section>

      <section className="panel">
        <h2>Campaigns</h2>
        <div className="arp-list">
          {campaigns.length === 0 && <p className="muted">No promotions yet.</p>}
          {campaigns.map((item) => (
            <article key={item.id} className="arp-item">
              <div>
                <div className="arp-item-title">
                  <b>{item.name}</b>
                  <span className={item.active ? 'arp-on' : 'arp-off'}>{item.active ? 'ACTIVE' : 'OFF'}</span>
                  <span>{item.type}</span>
                </div>
                <small>{item.targetPath || '*'} · Priority {item.priority || 0}</small>
                <div className="arp-metrics">{item.viewCount || 0} views · {item.clickCount || 0} clicks</div>
              </div>
              <div className="arp-row-actions">
                <button className="btn btn-outline" onClick={() => edit(item)}>Edit</button>
                <button className="btn btn-outline" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .arp-admin{display:grid;gap:18px}.arp-heading{display:flex;justify-content:space-between;align-items:end;gap:20px}.arp-heading h1{margin:5px 0}.arp-stats{display:flex;gap:8px}.arp-stats span{min-width:90px;padding:12px;border:1px solid var(--border);border-radius:10px;background:#fff;text-align:center}.arp-stats b,.arp-stats small{display:block}.arp-stats small{color:var(--muted);font-size:11px}.arp-error,.arp-success{padding:12px 14px;border-radius:9px}.arp-error{background:#fff1ee;color:#a52c1d;border:1px solid #f1c3b9}.arp-success{background:#eef8ef;color:#206136;border:1px solid #bcdac2}.arp-form{display:grid;gap:16px}.arp-form-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.arp-form-head h2{margin:0}.arp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.arp-grid label{display:grid;gap:6px;font-weight:700;font-size:13px}.arp-grid input,.arp-grid select,.arp-grid textarea{width:100%;padding:10px 11px;border:1px solid var(--border);border-radius:8px;background:#fff}.arp-wide{grid-column:1/-1}.arp-checks{display:flex;gap:18px;flex-wrap:wrap}.arp-checks label{display:flex;align-items:center;gap:7px;font-weight:700}.arp-list{display:grid;gap:10px;margin-top:12px}.arp-item{display:flex;justify-content:space-between;gap:18px;align-items:center;padding:14px;border:1px solid var(--border);border-radius:11px;background:#fff}.arp-item-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.arp-item-title span{font-size:10px;padding:3px 7px;border-radius:20px;background:#edf1ed}.arp-item-title .arp-on{background:#e7f5ea;color:#1d6b35}.arp-item-title .arp-off{background:#f2f2f2;color:#666}.arp-item small,.arp-metrics{display:block;color:var(--muted);margin-top:5px;font-size:12px}.arp-row-actions{display:flex;gap:7px}@media(max-width:720px){.arp-heading{align-items:start;flex-direction:column}.arp-grid{grid-template-columns:1fr}.arp-wide{grid-column:auto}.arp-item{align-items:start;flex-direction:column}.arp-row-actions{width:100%}.arp-row-actions button{flex:1}}
      `}</style>
    </div>
  );
}
