'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './Phase4Admin.module.css';

async function readJson(response, label) { const text = await response.text(); if (!text.trim()) throw new Error(`${label} returned empty response.`); let data; try { data = JSON.parse(text); } catch { throw new Error(`${label} returned invalid JSON.`); } if (!response.ok) throw new Error(data?.error || `${label} failed.`); return data; }

export default function AdminReusableSections() {
  const [items, setItems] = useState([]); const [query, setQuery] = useState(''); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  useEffect(() => { fetch('/api/admin/page-sections', { cache: 'no-store' }).then((r) => readJson(r, 'Reusable sections')).then((d) => setItems(d.sections || [])).catch((e) => setError(e.message)); }, []);
  const filtered = useMemo(() => { const q = query.trim().toLowerCase(); return !q ? items : items.filter((x) => `${x.name} ${x.block?.type || ''}`.toLowerCase().includes(q)); }, [items, query]);
  async function remove(id) { if (!window.confirm('Delete this reusable section?')) return; try { await readJson(await fetch(`/api/admin/page-sections/${id}`, { method: 'DELETE' }), 'Delete section'); setItems((rows) => rows.filter((x) => x.id !== id)); setMessage('Reusable section deleted.'); } catch (e) { setError(e.message); } }
  return <div className={styles.page}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>PAGE BUILDER · PHASE 4</span><h1>Reusable Sections</h1><p>Save any Page Builder block once, then insert it into other pages.</p></div><div className={styles.actions}><Link className={styles.button} href="/admin/pages">← Pages</Link><Link className={styles.button} href="/admin/pages/media">Media</Link><Link className={styles.button} href="/admin/leads">Leads</Link></div></div>
    {error && <div className={styles.error}>{error}</div>}{message && <div className={styles.success}>{message}</div>}
    <div className={styles.card}><p style={{margin:0}}>To create one: open any page → find a section → click <b>Save Reusable</b>. It will appear here and in the Page Builder library.</p></div>
    <div className={styles.toolbar}><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reusable sections..." /><span>{filtered.length} saved</span></div>
    <div className={styles.grid}>{filtered.map((item) => <article className={styles.sectionCard} key={item.id}><div className={styles.cardBody}><strong>{item.name}</strong><small>Type: {item.block?.type || 'unknown'} · Saved {new Date(item.updatedAt).toLocaleDateString()}</small><div className={styles.sectionPreview}>{JSON.stringify(item.block, null, 2)}</div><div className={styles.rowActions}><button className={styles.danger} type="button" onClick={() => remove(item.id)}>Delete</button></div></div></article>)}</div>
    {filtered.length === 0 && <div className={styles.card + ' ' + styles.empty}>No reusable sections yet.</div>}
  </div>;
}
