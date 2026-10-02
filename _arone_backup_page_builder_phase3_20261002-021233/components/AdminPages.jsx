'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { publicPageHref } from '@/lib/page-builder';
import styles from './PageBuilder.module.css';

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadPages() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/pages', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load pages.');
      setPages(data.pages || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPages();
  }, []);

  async function removePage(page) {
    if (!window.confirm(`Delete “${page.title}”?`)) return;
    const response = await fetch(`/api/admin/pages/${page.id}`, { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || 'Could not delete page.');
      return;
    }
    setPages((items) => items.filter((item) => item.id !== page.id));
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminHeading}>
        <div>
          <span className={styles.eyebrow}>CONTENT</span>
          <h1>Pages & Landing Pages</h1>
          <p>Create normal website pages and campaign landing pages without editing code.</p>
        </div>
        <Link href="/admin/pages/new" className={styles.primaryButton}>+ Create New Page</Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableCard}>
        {loading ? (
          <p>Loading pages...</p>
        ) : pages.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No pages yet</h2>
            <p>Create your first normal page or landing page.</p>
            <Link href="/admin/pages/new" className={styles.primaryButton}>Create First Page</Link>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>URL</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id}>
                    <td><strong>{page.title}</strong></td>
                    <td>{page.pageType === 'LANDING' ? 'Landing' : 'Page'}</td>
                    <td><span className={`${styles.status} ${page.status === 'PUBLISHED' ? styles.published : styles.draft}`}>{page.status}</span></td>
                    <td><code>{publicPageHref(page)}</code></td>
                    <td>{new Date(page.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actionRow}>
                        <Link href={`/admin/pages/${page.id}`} className={styles.smallButton}>Edit</Link>
                        <Link href={`/admin/pages/${page.id}/preview`} className={styles.smallButton}>Preview</Link>
                        {page.status === 'PUBLISHED' && (
                          <Link href={publicPageHref(page)} target="_blank" className={styles.smallButton}>Open</Link>
                        )}
                        <button type="button" onClick={() => removePage(page)} className={styles.dangerButton}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
