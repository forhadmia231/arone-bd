'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './NavigationManager.module.css';

const blank = {
  labelEn: '',
  labelBn: '',
  href: '/',
  pageId: '',
  linkType: 'CUSTOM',
  active: true,
};

async function readJson(response, label) {
  const text = await response.text();
  if (!text.trim()) throw new Error(`${label}: empty response (HTTP ${response.status}).`);
  let data;
  try { data = JSON.parse(text); } catch { throw new Error(`${label}: invalid JSON.`); }
  if (!response.ok) throw new Error(data?.error || `${label} failed.`);
  return data;
}

export default function AdminNavigationManager() {
  const [location, setLocation] = useState('HEADER');
  const [items, setItems] = useState([]);
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadMenu(nextLocation = location) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/navigation?location=${nextLocation}`, { cache: 'no-store' });
      const data = await readJson(response, 'Navigation');
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || 'Could not load navigation.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenu(location);
  }, [location]);

  useEffect(() => {
    fetch('/api/admin/navigation/pages', { cache: 'no-store' })
      .then((r) => readJson(r, 'Published pages'))
      .then((data) => setPages(data.pages || []))
      .catch((err) => setError(err.message || 'Could not load pages.'));
  }, []);

  const selectedPage = useMemo(
    () => pages.find((page) => page.id === form.pageId) || null,
    [pages, form.pageId]
  );

  function resetForm() {
    setForm(blank);
    setEditingId('');
  }

  function choosePage(pageId) {
    const page = pages.find((item) => item.id === pageId);
    setForm((current) => ({
      ...current,
      pageId,
      href: page?.href || '/',
      labelEn: current.labelEn || page?.title || '',
    }));
  }

  async function saveItem(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const payload = { ...form, location };
      const response = await fetch(
        editingId ? `/api/admin/navigation/${editingId}` : '/api/admin/navigation',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      await readJson(response, editingId ? 'Update menu item' : 'Create menu item');
      setMessage(editingId ? 'Menu item updated.' : 'Menu item added.');
      resetForm();
      await loadMenu(location);
    } catch (err) {
      setError(err.message || 'Could not save menu item.');
    } finally {
      setBusy(false);
    }
  }

  function editItem(item) {
    setEditingId(item.id);
    setForm({
      labelEn: item.labelEn || '',
      labelBn: item.labelBn || '',
      href: item.href || '/',
      pageId: item.pageId || '',
      linkType: item.linkType || 'CUSTOM',
      active: item.active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeItem(item) {
    if (!window.confirm(`Delete “${item.labelEn || item.labelBn}”?`)) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/navigation/${item.id}`, { method: 'DELETE' });
      await readJson(response, 'Delete menu item');
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (err) {
      setError(err.message || 'Could not delete menu item.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleItem(item) {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/navigation/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, active: !item.active }),
      });
      await readJson(response, 'Update menu item');
      await loadMenu(location);
    } catch (err) {
      setError(err.message || 'Could not update menu item.');
    } finally {
      setBusy(false);
    }
  }

  async function saveOrder(nextItems) {
    setItems(nextItems);
    try {
      const response = await fetch('/api/admin/navigation/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: nextItems.map((item) => item.id) }),
      });
      await readJson(response, 'Save menu order');
      setMessage('Menu order saved.');
    } catch (err) {
      setError(err.message || 'Could not save menu order.');
      await loadMenu(location);
    }
  }

  function move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    saveOrder(next);
  }

  async function seedMenu() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed', location }),
      });
      const data = await readJson(response, 'Create starter menu');
      setItems(data.items || []);
      setMessage(`${location === 'HEADER' ? 'Header' : 'Footer'} starter menu created.`);
    } catch (err) {
      setError(err.message || 'Could not create starter menu.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <span>WEBSITE · NAVIGATION</span>
          <h1>Menu & Navigation Manager</h1>
          <p>Manage storefront links without editing SiteHeader code.</p>
        </div>

        <div className={styles.tabs}>
          <button className={location === 'HEADER' ? styles.activeTab : ''} onClick={() => { setLocation('HEADER'); resetForm(); }}>
            Header Menu
          </button>
          <button className={location === 'FOOTER' ? styles.activeTab : ''} onClick={() => { setLocation('FOOTER'); resetForm(); }}>
            Footer Menu
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {message && <div className={styles.success}>{message}</div>}

      <div className={styles.grid}>
        <form className={styles.panel} onSubmit={saveItem}>
          <h2>{editingId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>

          <label>
            Link Source
            <select
              value={form.linkType}
              onChange={(e) => setForm((current) => ({ ...current, linkType: e.target.value, pageId: '', href: '/' }))}
            >
              <option value="CUSTOM">Custom / System Link</option>
              <option value="PAGE">Published Page / Landing Page</option>
            </select>
          </label>

          {form.linkType === 'PAGE' && (
            <label>
              Select Published Page
              <select value={form.pageId} onChange={(e) => choosePage(e.target.value)}>
                <option value="">Choose page...</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title} · {page.pageType === 'LANDING' ? 'Landing' : 'Page'}
                  </option>
                ))}
              </select>
              {selectedPage && <small>{selectedPage.href}</small>}
            </label>
          )}

          <div className={styles.twoCols}>
            <label>
              English Label
              <input value={form.labelEn} onChange={(e) => setForm((c) => ({ ...c, labelEn: e.target.value }))} placeholder="About Us" />
            </label>
            <label>
              Bangla Label
              <input value={form.labelBn} onChange={(e) => setForm((c) => ({ ...c, labelBn: e.target.value }))} placeholder="আমাদের সম্পর্কে" />
            </label>
          </div>

          <label>
            Link / URL
            <input value={form.href} onChange={(e) => setForm((c) => ({ ...c, href: e.target.value }))} placeholder="/page/about-us" readOnly={form.linkType === 'PAGE'} />
          </label>

          <label className={styles.check}>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((c) => ({ ...c, active: e.target.checked }))} />
            Show this menu item
          </label>

          <div className={styles.actions}>
            <button className={styles.primary} disabled={busy} type="submit">
              {busy ? 'Saving...' : editingId ? 'Update Item' : '+ Add Menu Item'}
            </button>
            {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
          </div>
        </form>

        <section className={styles.panel}>
          <div className={styles.listHeading}>
            <div>
              <h2>{location === 'HEADER' ? 'Header Menu' : 'Footer Menu'}</h2>
              <p>Use ↑ ↓ to change the display order.</p>
            </div>
            {!loading && items.length === 0 && (
              <button className={styles.secondary} onClick={seedMenu} disabled={busy}>Create Starter Menu</button>
            )}
          </div>

          {loading ? (
            <p>Loading menu...</p>
          ) : items.length === 0 ? (
            <div className={styles.empty}>No menu items yet. Create a starter menu or add your first link.</div>
          ) : (
            <div className={styles.items}>
              {items.map((item, index) => (
                <article key={item.id} className={`${styles.item} ${!item.active ? styles.inactive : ''}`}>
                  <div className={styles.orderButtons}>
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0}>↑</button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1}>↓</button>
                  </div>
                  <div className={styles.itemMain}>
                    <strong>{item.labelEn || item.labelBn}</strong>
                    {item.labelBn && item.labelEn && <small>{item.labelBn}</small>}
                    <code>{item.href}</code>
                  </div>
                  <div className={styles.itemActions}>
                    <button type="button" onClick={() => toggleItem(item)}>{item.active ? 'Hide' : 'Show'}</button>
                    <button type="button" onClick={() => editItem(item)}>Edit</button>
                    <button type="button" className={styles.danger} onClick={() => removeItem(item)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {location === 'FOOTER' && (
        <div className={styles.note}>
          Footer menu data is ready. If your current footer does not yet render it, use the included <code>DynamicFooterMenu.jsx</code> component in your footer.
        </div>
      )}
    </div>
  );
}
