'use client';

import { useEffect, useMemo, useState } from 'react';

const tabs = ['ACTIVE', 'CONTACTED', 'RECOVERED', 'DISMISSED', 'ALL'];

function when(value) {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('en-BD', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function waLink(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '#';
  const normalized = digits.startsWith('0') ? `88${digits}` : digits;
  return `https://wa.me/${normalized}`;
}

export default function AdminAbandonedCheckouts() {
  const [status, setStatus] = useState('ACTIVE');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ status });
      if (query.trim()) params.set('q', query.trim());

      const response = await fetch(
        `/api/admin/abandoned-checkouts?${params.toString()}`,
        { cache: 'no-store' }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load checkouts.');
      setItems(data.items || []);
      setCounts(data.counts || {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  const total = useMemo(
    () => Object.values(counts).reduce((sum, n) => sum + Number(n || 0), 0),
    [counts]
  );

  async function changeStatus(id, nextStatus) {
    const response = await fetch(`/api/admin/abandoned-checkouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || 'Could not update status.');
      return;
    }
    load();
  }

  async function remove(id) {
    if (!window.confirm('Delete this abandoned checkout record?')) return;
    const response = await fetch(`/api/admin/abandoned-checkouts/${id}`, {
      method: 'DELETE',
    });
    if (response.ok) load();
  }

  return (
    <div className="ab-page">
      <div className="ab-head">
        <div>
          <span className="eyebrow">SALES RECOVERY</span>
          <h1>Abandoned Checkouts</h1>
          <p className="muted">
            Follow up with customers who entered a phone number but did not finish checkout.
          </p>
        </div>
        <div className="ab-total">{total}<small>Total captured</small></div>
      </div>

      <div className="ab-stats">
        <div><b>{counts.ACTIVE || 0}</b><span>Active</span></div>
        <div><b>{counts.CONTACTED || 0}</b><span>Contacted</span></div>
        <div><b>{counts.RECOVERED || 0}</b><span>Recovered</span></div>
        <div><b>{counts.DISMISSED || 0}</b><span>Dismissed</span></div>
      </div>

      <div className="panel ab-tools">
        <div className="ab-tabs">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              className={status === tab ? 'active' : ''}
              onClick={() => setStatus(tab)}
            >
              {tab === 'ALL' ? 'All' : tab[0] + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <form
          className="ab-search"
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search phone, name, email or campaign"
          />
          <button className="btn btn-primary">Search</button>
        </form>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="panel ab-list">
        {loading ? (
          <p>Loading...</p>
        ) : items.length === 0 ? (
          <div className="empty"><h3>No abandoned checkouts found</h3></div>
        ) : (
          items.map((item) => (
            <article className="ab-card" key={item.id}>
              <div className="ab-customer">
                <span className="ab-avatar">
                  {(item.name || item.phone || '?').charAt(0).toUpperCase()}
                </span>
                <div>
                  <h3>{item.name || 'Unnamed customer'}</h3>
                  <a href={`tel:${item.phone}`}>{item.phone}</a>
                  {item.email && <small>{item.email}</small>}
                </div>
              </div>

              <div className="ab-info">
                <p><b>Address:</b> {[item.address, item.area, item.city].filter(Boolean).join(', ') || '-'}</p>
                <p><b>Last activity:</b> {when(item.lastSeenAt)}</p>
                <p><b>Source:</b> {item.source || 'direct'} {item.utmCampaign ? `· ${item.utmCampaign}` : ''}</p>
                {item.payload?.summary && <p className="ab-summary"><b>Checkout:</b> {item.payload.summary}</p>}
              </div>

              <div className="ab-actions">
                <a className="btn btn-outline" href={`tel:${item.phone}`}>Call</a>
                <a className="btn btn-outline" href={waLink(item.phone)} target="_blank" rel="noreferrer">WhatsApp</a>
                {item.status !== 'CONTACTED' && (
                  <button className="btn btn-outline" type="button" onClick={() => changeStatus(item.id, 'CONTACTED')}>Contacted</button>
                )}
                {item.status !== 'RECOVERED' && (
                  <button className="btn btn-primary" type="button" onClick={() => changeStatus(item.id, 'RECOVERED')}>Recovered</button>
                )}
                {item.status !== 'DISMISSED' && (
                  <button className="btn btn-outline" type="button" onClick={() => changeStatus(item.id, 'DISMISSED')}>Dismiss</button>
                )}
                <button className="ab-delete" type="button" onClick={() => remove(item.id)}>Delete</button>
              </div>
            </article>
          ))
        )}
      </div>

      <style jsx>{`
        .ab-page{display:grid;gap:18px}.ab-head{display:flex;justify-content:space-between;align-items:end;gap:20px}.ab-head h1{margin:4px 0}.ab-total{min-width:120px;text-align:center;border:1px solid var(--border);border-radius:14px;background:#fff;padding:13px;font-size:28px;font-weight:800}.ab-total small{display:block;font-size:10px;color:var(--muted);font-weight:600}.ab-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.ab-stats>div{background:white;border:1px solid var(--border);border-radius:12px;padding:15px}.ab-stats b{display:block;font-size:25px;color:var(--green)}.ab-stats span{font-size:12px;color:var(--muted)}.ab-tools{display:flex;align-items:center;justify-content:space-between;gap:12px}.ab-tabs{display:flex;gap:5px;flex-wrap:wrap}.ab-tabs button{border:1px solid var(--border);background:#fff;border-radius:7px;padding:8px 10px;font-weight:700;font-size:12px}.ab-tabs button.active{background:var(--green);border-color:var(--green);color:#fff}.ab-search{display:flex;gap:7px;min-width:min(420px,100%)}.ab-search input{min-width:0;flex:1}.ab-list{display:grid;gap:0;padding:0;overflow:hidden}.ab-card{display:grid;grid-template-columns:240px minmax(0,1fr) 180px;gap:18px;padding:18px;border-bottom:1px solid var(--border)}.ab-card:last-child{border-bottom:0}.ab-customer{display:flex;gap:11px}.ab-avatar{width:40px;height:40px;display:grid;place-items:center;border-radius:50%;background:var(--green-light);color:var(--green);font-weight:800;flex:none}.ab-customer h3{font-size:15px;margin:1px 0 5px}.ab-customer a{display:block;font-weight:800;color:var(--green)}.ab-customer small{display:block;color:var(--muted);margin-top:3px}.ab-info p{font-size:12px;margin:2px 0 8px;line-height:1.5}.ab-summary{color:var(--muted)}.ab-actions{display:flex;flex-direction:column;gap:6px}.ab-actions .btn{font-size:11px;padding:7px 9px;text-align:center}.ab-delete{border:0;background:none;color:#a33;font-size:11px;cursor:pointer}.error-text{color:#b42318}.empty{padding:35px;text-align:center}@media(max-width:950px){.ab-card{grid-template-columns:1fr}.ab-actions{flex-direction:row;flex-wrap:wrap}.ab-tools{align-items:stretch;flex-direction:column}.ab-search{min-width:0}.ab-stats{grid-template-columns:1fr 1fr}}@media(max-width:520px){.ab-head{align-items:start;flex-direction:column}.ab-stats{grid-template-columns:1fr 1fr}}
      `}</style>
    </div>
  );
}
