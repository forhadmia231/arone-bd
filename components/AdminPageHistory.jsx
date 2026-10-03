'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './PageHistory.module.css';

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

export default function AdminPageHistory({ pageId }) {
  const router = useRouter();
  const [page, setPage] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/pages/${pageId}/revisions`, {
        cache: 'no-store',
      });
      const data = await readJson(response, 'Page history');
      setPage(data.page || null);
      setRevisions(data.revisions || []);
    } catch (err) {
      setError(err.message || 'Could not load page history.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [pageId]);

  async function createSnapshot() {
    setBusyId('snapshot');
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/admin/pages/${pageId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'Manual snapshot' }),
      });
      await readJson(response, 'Create snapshot');
      setMessage('Snapshot saved.');
      await load();
    } catch (err) {
      setError(err.message || 'Could not create snapshot.');
    } finally {
      setBusyId('');
    }
  }

  async function restore(revision) {
    const ok = window.confirm(
      `Restore “${revision.title}” from ${new Date(revision.createdAt).toLocaleString()}?\n\nA safety snapshot of the current page will be created first.`
    );

    if (!ok) return;

    setBusyId(revision.id);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `/api/admin/pages/${pageId}/revisions/${revision.id}/restore`,
        { method: 'POST' }
      );
      await readJson(response, 'Restore revision');
      setMessage('Revision restored successfully. Opening editor...');
      router.push(`/admin/pages/${pageId}`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Could not restore revision.');
      setBusyId('');
    }
  }

  if (loading) {
    return <div className={styles.page}>Loading revision history...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>PAGE BUILDER · PHASE 6</span>
          <h1>Version History</h1>
          <p>
            Automatic snapshots are created before every page save or publish. Restore an older
            version without losing the current version.
          </p>
        </div>

        <div className={styles.actions}>
          <Link href="/admin/pages" className={styles.button}>All Pages</Link>
          <Link href={`/admin/pages/${pageId}`} className={styles.button}>Edit Page</Link>
          <button
            type="button"
            className={styles.primary}
            disabled={busyId === 'snapshot'}
            onClick={createSnapshot}
          >
            {busyId === 'snapshot' ? 'Saving...' : '+ Save Snapshot'}
          </button>
        </div>
      </div>

      {page && (
        <div className={styles.pageCard}>
          <div>
            <strong>{page.title}</strong>
            <span>/{page.slug}</span>
          </div>
          <small>Last updated {new Date(page.updatedAt).toLocaleString()}</small>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      {revisions.length === 0 ? (
        <div className={styles.empty}>
          <h2>No snapshots yet</h2>
          <p>Save the page once, or click “Save Snapshot”, to start revision history.</p>
        </div>
      ) : (
        <div className={styles.timeline}>
          {revisions.map((revision, index) => (
            <article className={styles.revision} key={revision.id}>
              <div className={styles.dot}>{index + 1}</div>

              <div className={styles.revisionMain}>
                <div className={styles.revisionTop}>
                  <div>
                    <strong>{revision.title}</strong>
                    <span className={styles.badge}>{revision.status}</span>
                    <span className={styles.badge}>{revision.pageType}</span>
                  </div>
                  <time>{new Date(revision.createdAt).toLocaleString()}</time>
                </div>

                <p>{revision.note || 'Automatic snapshot'}</p>
                <code>/{revision.slug}</code>
              </div>

              <button
                type="button"
                className={styles.restore}
                disabled={busyId === revision.id}
                onClick={() => restore(revision)}
              >
                {busyId === revision.id ? 'Restoring...' : 'Restore'}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
