'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './Phase4Admin.module.css';

const MAX = 450 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

async function readJson(response, label) {
  const text = await response.text();
  if (!text.trim()) throw new Error(`${label} returned an empty response.`);
  let data; try { data = JSON.parse(text); } catch { throw new Error(`${label} returned invalid JSON.`); }
  if (!response.ok) throw new Error(data?.error || `${label} failed.`);
  return data;
}

export default function AdminMediaLibrary() {
  const [media, setMedia] = useState([]);
  const [form, setForm] = useState({ name: '', alt: '', url: '' });
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const data = await readJson(await fetch('/api/admin/page-media', { cache: 'no-store' }), 'Media');
    setMedia(data.media || []);
  }

  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return media;
    return media.filter((item) => `${item.name} ${item.alt}`.toLowerCase().includes(q));
  }, [media, query]);

  function pickFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError('Only PNG, JPG and WebP are allowed.');
    if (file.size > MAX) return setError('Image must be under 450 KB.');
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, name: prev.name || file.name.replace(/\.[^.]+$/, ''), url: String(reader.result || '') }));
    reader.onerror = () => setError('Could not read the image.');
    reader.readAsDataURL(file);
  }

  async function add(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const data = await readJson(await fetch('/api/admin/page-media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      }), 'Add media');
      setMedia((items) => [data.item, ...items]);
      setForm({ name: '', alt: '', url: '' });
      setMessage('Media saved. It is now available inside Page Builder image fields.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function remove(id) {
    if (!window.confirm('Delete this media library item? Existing pages using it will keep their saved image value.')) return;
    try {
      await readJson(await fetch(`/api/admin/page-media/${id}`, { method: 'DELETE' }), 'Delete media');
      setMedia((items) => items.filter((item) => item.id !== id));
    } catch (e) { setError(e.message); }
  }

  async function copyUrl(url) {
    try { await navigator.clipboard.writeText(url); setMessage('Image value copied.'); }
    catch { setMessage('Copy failed. You can still select this image directly inside Page Builder.'); }
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div><span className={styles.eyebrow}>PAGE BUILDER · PHASE 4</span><h1>Media Library</h1><p>Save optimized images once and reuse them in pages and landing pages.</p></div>
        <div className={styles.actions}><Link className={styles.button} href="/admin/pages">← Pages</Link><Link className={styles.button} href="/admin/pages/sections">Reusable Sections</Link><Link className={styles.button} href="/admin/leads">Leads</Link></div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      <form className={styles.card} onSubmit={add}>
        <div className={styles.formGrid}>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Eid hero banner" required /></label>
          <label>Alt Text<input value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} placeholder="Optional accessibility text" /></label>
          <label className={styles.full}>Upload Image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickFile} /></label>
          <label className={styles.full}>Or HTTPS URL / Public Path<input value={form.url.startsWith('data:image/') ? '' : form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://... or /images/..." /></label>
        </div>
        {form.url && <div style={{marginTop:12,maxWidth:320}}><img src={form.url} alt="Preview" style={{width:'100%',maxHeight:180,objectFit:'contain',border:'1px solid #e0e7df',borderRadius:8}} /></div>}
        <div style={{marginTop:14}}><button className={styles.primary} disabled={busy}>{busy ? 'Saving...' : '+ Save to Media Library'}</button></div>
      </form>

      <div className={styles.toolbar}><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media..." /><span>{filtered.length} item(s)</span></div>

      <div className={styles.grid}>
        {filtered.map((item) => <article className={styles.mediaCard} key={item.id}>
          <div className={styles.mediaPreview}><img src={item.url} alt={item.alt || item.name} /></div>
          <div className={styles.cardBody}><strong>{item.name}</strong>{item.alt && <small>{item.alt}</small>}<code className={styles.previewCode}>{item.url.startsWith('data:image/') ? 'Uploaded image stored in database' : item.url}</code><div className={styles.rowActions}><button className={styles.button} type="button" onClick={() => copyUrl(item.url)}>Copy</button><button className={styles.danger} type="button" onClick={() => remove(item.id)}>Delete</button></div></div>
        </article>)}
      </div>
      {filtered.length === 0 && <div className={styles.card + ' ' + styles.empty}>No media found.</div>}
    </div>
  );
}
