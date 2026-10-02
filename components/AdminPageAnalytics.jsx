'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from './Phase5Admin.module.css';

async function readJson(response){ const text=await response.text(); if(!text.trim())throw new Error('Analytics returned an empty response.'); let data; try{data=JSON.parse(text)}catch{throw new Error('Analytics returned invalid JSON.')} if(!response.ok)throw new Error(data?.error||'Could not load analytics.'); return data; }

export default function AdminPageAnalytics(){
  const [days,setDays]=useState(30); const [data,setData]=useState(null); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  useEffect(()=>{setLoading(true);setError('');fetch(`/api/admin/page-analytics?days=${days}`,{cache:'no-store'}).then(readJson).then(setData).catch((e)=>setError(e.message)).finally(()=>setLoading(false));},[days]);
  const totals=data?.totals||{views:0,clicks:0,leads:0,conversionRate:0};
  return <div className={styles.page}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>PAGE BUILDER · PHASE 5</span><h1>Landing Page Analytics</h1><p>Views, CTA clicks, leads, traffic sources and campaign attribution.</p></div><div className={styles.actions}><Link className={styles.button} href="/admin/pages">← Pages</Link><Link className={styles.button} href="/admin/leads">Leads</Link><select className={styles.select} value={days} onChange={(e)=>setDays(Number(e.target.value))}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></div></div>
    {error&&<div className={styles.error}>{error}</div>}
    <div className={styles.stats}><div><strong>{totals.views}</strong><span>Views</span></div><div><strong>{totals.clicks}</strong><span>CTA Clicks</span></div><div><strong>{totals.leads}</strong><span>Leads</span></div><div><strong>{totals.conversionRate}%</strong><span>Lead Conversion</span></div></div>
    {loading?<div className={styles.card}>Loading analytics...</div>:<>
      <section className={styles.card}><h2>Performance by Page</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Page</th><th>Views</th><th>CTA Clicks</th><th>Click Rate</th><th>Leads</th><th>Conversion</th><th></th></tr></thead><tbody>{(data?.rows||[]).map((row)=><tr key={row.pageId}><td><strong>{row.title}</strong><br/><code>{row.slug}</code></td><td>{row.views}</td><td>{row.clicks}</td><td>{row.clickRate}%</td><td>{row.leads}</td><td>{row.conversionRate}%</td><td><Link className={styles.button} href={`/admin/pages/${row.pageId}/marketing`}>Marketing</Link></td></tr>)}</tbody></table>{!(data?.rows||[]).length&&<div className={styles.empty}>No analytics events yet. Open a published landing page to start collecting data.</div>}</div></section>
      <div className={styles.twoCol}><section className={styles.card}><h2>Top Sources</h2><div className={styles.rankList}>{(data?.topSources||[]).map((x)=><div key={x.name}><span>{x.name}</span><strong>{x.count}</strong></div>)}{!(data?.topSources||[]).length&&<p className={styles.note}>No source data yet.</p>}</div></section><section className={styles.card}><h2>Top Campaigns</h2><div className={styles.rankList}>{(data?.topCampaigns||[]).map((x)=><div key={x.name}><span>{x.name}</span><strong>{x.count}</strong></div>)}{!(data?.topCampaigns||[]).length&&<p className={styles.note}>UTM campaigns will appear here.</p>}</div></section></div>
    </>}
  </div>;
}
