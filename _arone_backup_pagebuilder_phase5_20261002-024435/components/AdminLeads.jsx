'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './Phase4Admin.module.css';

async function readJson(response, label) { const text = await response.text(); if (!text.trim()) throw new Error(`${label} returned empty response.`); let data; try { data = JSON.parse(text); } catch { throw new Error(`${label} returned invalid JSON.`); } if (!response.ok) throw new Error(data?.error || `${label} failed.`); return data; }

export default function AdminLeads() {
  const [leads, setLeads] = useState([]); const [query, setQuery] = useState(''); const [status, setStatus] = useState('ALL'); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  async function load(){ const data = await readJson(await fetch('/api/admin/page-leads', { cache:'no-store' }), 'Leads'); setLeads(data.leads || []); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  const filtered = useMemo(() => { const q=query.trim().toLowerCase(); return leads.filter((x)=>{ if(status!=='ALL' && x.status!==status) return false; if(!q) return true; return `${x.name} ${x.phone} ${x.email} ${x.pageTitle} ${x.formName}`.toLowerCase().includes(q); }); },[leads,query,status]);
  async function setLeadStatus(id,next){ try { const data=await readJson(await fetch(`/api/admin/page-leads/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:next})}),'Update lead'); setLeads((rows)=>rows.map((x)=>x.id===id?data.lead:x)); setMessage('Lead updated.'); } catch(e){setError(e.message);} }
  async function remove(id){ if(!window.confirm('Delete this lead permanently?'))return; try{await readJson(await fetch(`/api/admin/page-leads/${id}`,{method:'DELETE'}),'Delete lead');setLeads((rows)=>rows.filter((x)=>x.id!==id));}catch(e){setError(e.message);} }
  const counts={all:leads.length,new:leads.filter((x)=>x.status==='NEW').length,contacted:leads.filter((x)=>x.status==='CONTACTED').length,done:leads.filter((x)=>x.status==='DONE').length};
  return <div className={styles.page}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>LANDING PAGES · PHASE 4</span><h1>Leads</h1><p>Customer submissions from Page Builder lead forms.</p></div><div className={styles.actions}><Link className={styles.button} href="/admin/pages">← Pages</Link><Link className={styles.button} href="/admin/pages/media">Media</Link><Link className={styles.button} href="/admin/pages/sections">Reusable Sections</Link></div></div>
    {error&&<div className={styles.error}>{error}</div>}{message&&<div className={styles.success}>{message}</div>}
    <div className={styles.toolbar}><input type="search" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search name, phone, email or page..."/><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="ALL">All ({counts.all})</option><option value="NEW">New ({counts.new})</option><option value="CONTACTED">Contacted ({counts.contacted})</option><option value="DONE">Done ({counts.done})</option></select></div>
    <div className={styles.card+' '+styles.tableWrap}><table className={styles.table}><thead><tr><th>Date</th><th>Customer</th><th>Page / Form</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((lead)=><tr key={lead.id}><td>{new Date(lead.createdAt).toLocaleString()}</td><td><strong>{lead.name||'—'}</strong><br/>{lead.phone&&<a href={`tel:${lead.phone}`}>{lead.phone}</a>}<br/>{lead.email&&<a href={`mailto:${lead.email}`}>{lead.email}</a>}</td><td><strong>{lead.pageTitle||'Unknown page'}</strong><br/><small>{lead.formName}</small><br/><code>{lead.pageSlug}</code></td><td style={{maxWidth:260,whiteSpace:'pre-wrap'}}>{lead.message||'—'}</td><td><span className={`${styles.badge} ${lead.status==='DONE'?styles.badgeDone:''}`}>{lead.status}</span></td><td><div className={styles.rowActions}><button className={styles.button} onClick={()=>setLeadStatus(lead.id,'CONTACTED')}>Contacted</button><button className={styles.button} onClick={()=>setLeadStatus(lead.id,'DONE')}>Done</button><button className={styles.danger} onClick={()=>remove(lead.id)}>Delete</button></div></td></tr>)}</tbody></table>{filtered.length===0&&<div className={styles.empty}>No leads found.</div>}</div>
  </div>;
}
