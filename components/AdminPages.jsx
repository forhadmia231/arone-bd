'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { publicPageHref } from '@/lib/page-builder';
import styles from './PageBuilder.module.css';

async function readJson(response, label) {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`${label} returned an empty response (HTTP ${response.status}).`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${label} returned invalid JSON (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `${label} failed (HTTP ${response.status}).`);
  }

  return data;
}

export default function AdminPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  async function loadPages() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/pages', { cache: 'no-store' });
      const data = await readJson(response, 'Pages');
      setPages(data.pages || []);
    } catch (err) {
      setError(err.message || 'Could not load pages.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPages();
  }, []);

  const filteredPages = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return pages.filter((page) => {
      if (typeFilter !== 'ALL' && page.pageType !== typeFilter) return false;
      if (statusFilter !== 'ALL' && page.status !== statusFilter) return false;

      if (!needle) return true;

      return `${page.title} ${page.slug}`.toLowerCase().includes(needle);
    });
  }, [pages, query, typeFilter, statusFilter]);

  const counts = useMemo(
    () => ({
      all: pages.length,
      published: pages.filter((page) => page.status === 'PUBLISHED').length,
      draft: pages.filter((page) => page.status === 'DRAFT').length,
      landing: pages.filter((page) => page.pageType === 'LANDING').length,
    }),
    [pages]
  );

  async function removePage(page) {
    if (!window.confirm(`Delete “${page.title}”? This cannot be undone.`)) return;

    setBusyId(page.id);
    setError('');

    try {
      const response = await fetch(`/api/admin/pages/${page.id}`, {
        method: 'DELETE',
      });
      await readJson(response, 'Delete page');
      setPages((items) => items.filter((item) => item.id !== page.id));
    } catch (err) {
      setError(err.message || 'Could not delete page.');
    } finally {
      setBusyId('');
    }
  }

  async function duplicatePage(page) {
    setBusyId(page.id);
    setError('');

    try {
      const response = await fetch(`/api/admin/pages/${page.id}/duplicate`, {
        method: 'POST',
      });
      const data = await readJson(response, 'Duplicate page');
      window.location.href = `/admin/pages/${data.page.id}`;
    } catch (err) {
      setError(err.message || 'Could not duplicate page.');
      setBusyId('');
    }
  }

  return (
    <div className={styles.adminPage}>
      <div className={styles.adminHeading}>
        <div>
          <span className={styles.eyebrow}>CONTENT · PHASE 6</span>
          <h1>Pages & Landing Pages</h1>
          <p>Build pages, manage media, leads, analytics, publishing, conversion tools and version history.</p>
        </div>

        <div className={styles.actionRow}>
          <Link href="/admin/pages/media" className={styles.smallButton}>Media</Link>
          <Link href="/admin/pages/sections" className={styles.smallButton}>Reusable Sections</Link>
          <Link href="/admin/leads" className={styles.smallButton}>Leads</Link>
          <Link href="/admin/pages/analytics" className={styles.smallButton}>Analytics</Link>
          <Link href="/admin/pages/new" className={styles.primaryButton}>
            + Create New Page
          </Link>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.pageStats}>
        <div><strong>{counts.all}</strong><span>All Pages</span></div>
        <div><strong>{counts.published}</strong><span>Published</span></div>
        <div><strong>{counts.draft}</strong><span>Drafts</span></div>
        <div><strong>{counts.landing}</strong><span>Landing Pages</span></div>
      </div>

      <div className={styles.pageToolbar}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or URL slug..."
        />

        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="ALL">All Types</option>
          <option value="PAGE">Normal Pages</option>
          <option value="LANDING">Landing Pages</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <p>Loading pages...</p>
        ) : pages.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No pages yet</h2>
            <p>Create your first normal page or campaign landing page.</p>
            <Link href="/admin/pages/new" className={styles.primaryButton}>
              Create First Page
            </Link>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className={styles.emptyState}>
            <h2>No matching pages</h2>
            <p>Try changing the search or filters.</p>
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
                {filteredPages.map((page) => (
                  <tr key={page.id}>
                    <td>
                      <strong>{page.title}</strong>
                      <small className={styles.tableSubtext}>{page.slug}</small>
                    </td>
                    <td>{page.pageType === 'LANDING' ? 'Landing' : 'Page'}</td>
                    <td>
                      <span
                        className={`${styles.status} ${
                          page.status === 'PUBLISHED' ? styles.published : styles.draft
                        }`}
                      >
                        {page.status}
                      </span>
                    </td>
                    <td><code>{publicPageHref(page)}</code></td>
                    <td>{new Date(page.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actionRow}>
                        <Link href={`/admin/pages/${page.id}`} className={styles.smallButton}>
                          Edit
                        </Link>

                        <Link href={`/admin/pages/${page.id}/marketing`} className={styles.smallButton}>
                          Marketing
                        </Link>

                        <Link href={`/admin/pages/${page.id}/history`} className={styles.smallButton}>
                          History
                        </Link>

                        <Link
                          href={`/admin/pages/${page.id}/preview`}
                          className={styles.smallButton}
                          target="_blank"
                        >
                          Preview
                        </Link>

                        <button
                          type="button"
                          className={styles.smallButton}
                          disabled={busyId === page.id}
                          onClick={() => duplicatePage(page)}
                        >
                          Duplicate
                        </button>

                        {page.status === 'PUBLISHED' && (
                          <Link
                            href={publicPageHref(page)}
                            target="_blank"
                            className={styles.smallButton}
                          >
                            Open
                          </Link>
                        )}

                        <button
                          type="button"
                          disabled={busyId === page.id}
                          onClick={() => removePage(page)}
                          className={styles.dangerButton}
                        >
                          Delete
                        </button>
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
