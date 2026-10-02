'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './Phase5Admin.module.css';

const defaults = {
  analyticsEnabled: true,
  metaEvent: 'Lead',
  ga4Event: 'generate_lead',
  stickyEnabled: false,
  stickyType: 'LINK',
  stickyLabel: 'Order Now',
  stickyUrl: '/shop',
  stickyPhone: '',
  stickyMessage: 'Hello, I want to know more about this offer.',
  publishAt: '',
  unpublishAt: '',
  thankYouUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  canonicalUrl: '',
};

async function readJson(response, label) {
  const text = await response.text();
  if (!text.trim()) throw new Error(`${label} returned empty response.`);
  let data; try { data = JSON.parse(text); } catch { throw new Error(`${label} returned invalid JSON.`); }
  if (!response.ok) throw new Error(data?.error || `${label} failed.`);
  return data;
}

function localValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0,16);
}

function apiDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function AdminPageMarketing({ pageId }) {
  const [page, setPage] = useState(null);
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/admin/pages/${pageId}/marketing`, { cache:'no-store' })
      .then((r)=>readJson(r,'Marketing settings'))
      .then((data)=>{
        setPage(data.page);
        setForm({
          ...defaults,
          ...data.settings,
          publishAt: localValue(data.settings?.publishAt),
          unpublishAt: localValue(data.settings?.unpublishAt),
        });
      })
      .catch((e)=>setError(e.message))
      .finally(()=>setLoading(false));
  },[pageId]);

  function change(name,value){ setForm((prev)=>({...prev,[name]:value})); }

  async function save(){
    setBusy(true); setError(''); setMessage('');
    try{
      const response=await fetch(`/api/admin/pages/${pageId}/marketing`,{
        method:'PUT',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...form,publishAt:apiDate(form.publishAt),unpublishAt:apiDate(form.unpublishAt)}),
      });
      const data=await readJson(response,'Save marketing settings');
      setForm((prev)=>({...prev,...data.settings,publishAt:localValue(data.settings.publishAt),unpublishAt:localValue(data.settings.unpublishAt)}));
      setMessage('Marketing, tracking and publishing settings saved.');
    }catch(e){setError(e.message);}finally{setBusy(false);}
  }

  if(loading) return <div className={styles.card}>Loading marketing settings...</div>;
  if(!page) return <div className={styles.error}>{error||'Page not found.'}</div>;

  return <div className={styles.page}>
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>PAGE BUILDER · PHASE 5</span><h1>Marketing & Publishing</h1><p>{page.title} · /{page.slug}</p></div>
      <div className={styles.actions}><Link className={styles.button} href="/admin/pages">← Pages</Link><Link className={styles.button} href={`/admin/pages/${pageId}`}>Edit Page</Link><Link className={styles.button} href={`/admin/pages/${pageId}/preview`} target="_blank">Preview</Link><Link className={styles.button} href="/admin/pages/analytics">Analytics</Link></div>
    </div>
    {error&&<div className={styles.error}>{error}</div>}{message&&<div className={styles.success}>{message}</div>}

    <section className={styles.card}><h2>Analytics & Conversion Events</h2><div className={styles.formGrid}>
      <label className={styles.toggle}><input type="checkbox" checked={form.analyticsEnabled} onChange={(e)=>change('analyticsEnabled',e.target.checked)}/> Track page views, CTA clicks and leads</label>
      <label>Meta Pixel lead event<input value={form.metaEvent} onChange={(e)=>change('metaEvent',e.target.value)} placeholder="Lead"/><small>Runs only if Meta Pixel is already installed globally.</small></label>
      <label>GA4 lead event<input value={form.ga4Event} onChange={(e)=>change('ga4Event',e.target.value)} placeholder="generate_lead"/><small>Runs only if GA4/gtag is already installed globally.</small></label>
    </div></section>

    <section className={styles.card}><h2>Sticky Mobile CTA</h2><div className={styles.formGrid}>
      <label className={styles.toggle}><input type="checkbox" checked={form.stickyEnabled} onChange={(e)=>change('stickyEnabled',e.target.checked)}/> Enable mobile sticky CTA</label>
      <label>Action<select value={form.stickyType} onChange={(e)=>change('stickyType',e.target.value)}><option value="LINK">Link / Order page</option><option value="WHATSAPP">WhatsApp</option><option value="CALL">Phone call</option></select></label>
      <label>Button text<input value={form.stickyLabel} onChange={(e)=>change('stickyLabel',e.target.value)}/></label>
      {form.stickyType==='LINK'&&<label>Button URL<input value={form.stickyUrl} onChange={(e)=>change('stickyUrl',e.target.value)} placeholder="/shop"/></label>}
      {(form.stickyType==='WHATSAPP'||form.stickyType==='CALL')&&<label>Phone number<input value={form.stickyPhone} onChange={(e)=>change('stickyPhone',e.target.value)} placeholder="8801XXXXXXXXX"/></label>}
      {form.stickyType==='WHATSAPP'&&<label className={styles.full}>WhatsApp message<textarea rows="3" value={form.stickyMessage} onChange={(e)=>change('stickyMessage',e.target.value)}/></label>}
    </div></section>

    <section className={styles.card}><h2>Publish Schedule</h2><p className={styles.note}>Page status must remain PUBLISHED. The schedule controls when the public URL is available.</p><div className={styles.formGrid}>
      <label>Publish from<input type="datetime-local" value={form.publishAt} onChange={(e)=>change('publishAt',e.target.value)}/></label>
      <label>Unpublish at<input type="datetime-local" value={form.unpublishAt} onChange={(e)=>change('unpublishAt',e.target.value)}/></label>
      <label className={styles.full}>Thank-you URL after lead form<input value={form.thankYouUrl} onChange={(e)=>change('thankYouUrl',e.target.value)} placeholder="/page/thank-you or https://..."/></label>
    </div></section>

    <section className={styles.card}><h2>SEO & Social Sharing</h2><div className={styles.formGrid}>
      <label>Open Graph title<input value={form.ogTitle} onChange={(e)=>change('ogTitle',e.target.value)} placeholder="Facebook / social title"/></label>
      <label>Canonical URL<input value={form.canonicalUrl} onChange={(e)=>change('canonicalUrl',e.target.value)} placeholder="https://yourdomain.com/..."/></label>
      <label className={styles.full}>Open Graph description<textarea rows="3" value={form.ogDescription} onChange={(e)=>change('ogDescription',e.target.value)}/></label>
      <label className={styles.full}>Open Graph image URL / public path<input value={form.ogImage} onChange={(e)=>change('ogImage',e.target.value)} placeholder="/images/campaign.webp or https://..."/></label>
    </div>
    <div className={styles.socialPreview}><small>Social preview</small><strong>{form.ogTitle||page.title}</strong><p>{form.ogDescription||'Your page SEO description will be used when this is empty.'}</p></div>
    </section>

    <div className={styles.saveBar}><button className={styles.primary} disabled={busy} onClick={save}>{busy?'Saving...':'Save Marketing Settings'}</button></div>
  </div>;
}
