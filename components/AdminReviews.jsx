'use client';

import { useEffect, useMemo, useState } from 'react';

const empty = {
  id: '',
  customerName: '',
  rating: 5,
  title: '',
  reviewText: '',
  imageUrl: '',
  source: 'Website',
  productId: '',
  productName: '',
  status: 'APPROVED',
  featured: false,
  verified: false,
};

const MAX_IMAGE_BYTES = 300 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

async function readJson(response, label) {
  const body = await response.text();

  if (!body.trim()) {
    throw new Error(
      `${label} returned an empty response (HTTP ${response.status}).`
    );
  }

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error(
      `${label} returned invalid JSON (HTTP ${response.status}).`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error || `${label} failed (HTTP ${response.status}).`
    );
  }

  return data;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    featured: 0,
    averageRating: 0,
  });
  const [form, setForm] = useState(empty);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const editing = Boolean(form.id);

  const stars = useMemo(
    () => '★'.repeat(Math.max(1, Math.min(5, Number(form.rating || 5)))),
    [form.rating]
  );

  async function load(nextStatus = statusFilter, nextQuery = query) {
    const params = new URLSearchParams();
    params.set('status', nextStatus);
    if (nextQuery.trim()) params.set('q', nextQuery.trim());

    const response = await fetch(
      `/api/admin/reviews?${params.toString()}`,
      { cache: 'no-store' }
    );
    const data = await readJson(response, 'Reviews');

    setReviews(data.reviews || []);
    setStats(data.stats || {});
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function change(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function reset() {
    setForm(empty);
    setError('');
    setMessage('');
  }

  function edit(review) {
    setForm({ ...empty, ...review });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function uploadImage(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Only PNG, JPG or WebP images are allowed.');
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError('Customer image must be under 300 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setError('');
      change('imageUrl', String(reader.result || ''));
    };
    reader.onerror = () => setError('Could not read image.');
    reader.readAsDataURL(file);
  }

  async function save() {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        editing
          ? `/api/admin/reviews/${form.id}`
          : '/api/admin/reviews',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      await readJson(response, editing ? 'Update review' : 'Create review');

      setMessage(editing ? 'Review updated.' : 'Review created.');
      reset();
      setMessage(editing ? 'Review updated.' : 'Review created.');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function quickUpdate(review, patch) {
    setBusy(true);
    setError('');

    try {
      const response = await fetch(
        `/api/admin/reviews/${review.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...review,
            ...patch,
          }),
        }
      );

      await readJson(response, 'Update review');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this review permanently?')) return;

    setBusy(true);
    setError('');

    try {
      const response = await fetch(
        `/api/admin/reviews/${id}`,
        { method: 'DELETE' }
      );
      await readJson(response, 'Delete review');

      if (form.id === id) reset();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function applyFilter(event) {
    event?.preventDefault();
    setError('');

    try {
      await load(statusFilter, query);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="arr-admin">
      <div className="arr-heading">
        <div>
          <span className="eyebrow">SOCIAL PROOF</span>
          <h1>Customer Reviews</h1>
          <p className="muted">
            Approve website reviews and manage testimonials used by the Page Builder.
          </p>
        </div>

        <div className="arr-stats">
          <span><b>{stats.pending || 0}</b><small>Pending</small></span>
          <span><b>{stats.approved || 0}</b><small>Approved</small></span>
          <span><b>{stats.featured || 0}</b><small>Featured</small></span>
          <span>
            <b>{Number(stats.averageRating || 0).toFixed(1)}</b>
            <small>Avg Rating</small>
          </span>
        </div>
      </div>

      {error && <div className="arr-error">{error}</div>}
      {message && <div className="arr-success">{message}</div>}

      <section className="panel arr-form">
        <div className="arr-form-head">
          <div>
            <h2>{editing ? 'Edit Review' : 'Add Review'}</h2>
            <p className="muted">
              Public submissions stay pending until you approve them.
            </p>
          </div>

          {editing && (
            <button
              className="btn btn-outline"
              type="button"
              onClick={reset}
            >
              New Review
            </button>
          )}
        </div>

        <div className="arr-grid">
          <label>
            Customer Name
            <input
              value={form.customerName}
              onChange={(e) => change('customerName', e.target.value)}
            />
          </label>

          <label>
            Rating
            <select
              value={form.rating}
              onChange={(e) => change('rating', Number(e.target.value))}
            >
              <option value="5">★★★★★ 5 stars</option>
              <option value="4">★★★★☆ 4 stars</option>
              <option value="3">★★★☆☆ 3 stars</option>
              <option value="2">★★☆☆☆ 2 stars</option>
              <option value="1">★☆☆☆☆ 1 star</option>
            </select>
          </label>

          <label>
            Review Status
            <select
              value={form.status}
              onChange={(e) => change('status', e.target.value)}
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>

          <label>
            Source
            <input
              value={form.source}
              onChange={(e) => change('source', e.target.value)}
              placeholder="Website / Facebook / Messenger"
            />
          </label>

          <label className="arr-wide">
            Review Title
            <input
              value={form.title}
              onChange={(e) => change('title', e.target.value)}
              placeholder="Excellent product"
            />
          </label>

          <label className="arr-wide">
            Review
            <textarea
              rows="4"
              value={form.reviewText}
              onChange={(e) => change('reviewText', e.target.value)}
              placeholder="Customer feedback..."
            />
          </label>

          <label>
            Product Name
            <input
              value={form.productName}
              onChange={(e) => change('productName', e.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            Product ID
            <input
              value={form.productId}
              onChange={(e) => change('productId', e.target.value)}
              placeholder="Optional"
            />
          </label>

          <label className="arr-wide">
            Customer Image URL
            <input
              value={
                String(form.imageUrl || '').startsWith('data:image/')
                  ? ''
                  : form.imageUrl
              }
              onChange={(e) => change('imageUrl', e.target.value)}
              placeholder="https://... or /images/..."
            />
          </label>

          <label className="arr-upload">
            Upload Customer Image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={uploadImage}
            />
            <small>PNG/JPG/WebP · max 300 KB</small>
          </label>
        </div>

        {form.imageUrl && (
          <div className="arr-preview">
            <img src={form.imageUrl} alt="Customer preview" />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => change('imageUrl', '')}
            >
              Remove Image
            </button>
          </div>
        )}

        <div className="arr-checks">
          <label>
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => change('featured', e.target.checked)}
            />
            Featured
          </label>

          <label>
            <input
              type="checkbox"
              checked={form.verified}
              onChange={(e) => change('verified', e.target.checked)}
            />
            Verified Purchase
          </label>

          <span className="arr-stars">{stars}</span>
        </div>

        <button
          className="btn btn-primary"
          type="button"
          disabled={busy}
          onClick={save}
        >
          {busy ? 'Saving...' : editing ? 'Update Review' : 'Save Review'}
        </button>
      </section>

      <section className="panel">
        <div className="arr-list-head">
          <div>
            <h2>Review Moderation</h2>
            <p className="muted">
              Total reviews: {stats.total || 0}
            </p>
          </div>

          <form className="arr-filter" onSubmit={applyFilter}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, product or review..."
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button className="btn btn-outline" type="submit">
              Filter
            </button>
          </form>
        </div>

        <div className="arr-list">
          {reviews.length === 0 && (
            <p className="muted">No reviews found.</p>
          )}

          {reviews.map((review) => (
            <article className="arr-item" key={review.id}>
              <div className="arr-customer">
                {review.imageUrl ? (
                  <img src={review.imageUrl} alt={review.customerName} />
                ) : (
                  <span>
                    {(review.customerName || 'C').charAt(0).toUpperCase()}
                  </span>
                )}

                <div>
                  <b>
                    {review.customerName}
                    {review.verified ? ' ✓' : ''}
                  </b>
                  <div className="arr-rating">
                    {'★'.repeat(review.rating || 5)}
                    <span>
                      {'★'.repeat(5 - (review.rating || 5))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="arr-copy">
                <div className="arr-tags">
                  <span className={`arr-status arr-${review.status?.toLowerCase()}`}>
                    {review.status}
                  </span>
                  {review.featured && <span>FEATURED</span>}
                  {review.source && <span>{review.source}</span>}
                </div>

                {review.title && <strong>{review.title}</strong>}
                <p>{review.reviewText}</p>
                {review.productName && (
                  <small>Product: {review.productName}</small>
                )}
              </div>

              <div className="arr-actions">
                {review.status !== 'APPROVED' && (
                  <button
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() =>
                      quickUpdate(review, { status: 'APPROVED' })
                    }
                  >
                    Approve
                  </button>
                )}

                {review.status !== 'REJECTED' && (
                  <button
                    className="btn btn-outline"
                    disabled={busy}
                    onClick={() =>
                      quickUpdate(review, { status: 'REJECTED' })
                    }
                  >
                    Reject
                  </button>
                )}

                <button
                  className="btn btn-outline"
                  onClick={() => edit(review)}
                >
                  Edit
                </button>

                <button
                  className="btn btn-outline"
                  disabled={busy}
                  onClick={() => remove(review.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .arr-admin{display:grid;gap:18px}
        .arr-heading{display:flex;justify-content:space-between;align-items:end;gap:20px}
        .arr-heading h1{margin:5px 0}
        .arr-stats{display:flex;gap:8px;flex-wrap:wrap}
        .arr-stats span{min-width:86px;padding:11px;border:1px solid var(--border);border-radius:10px;background:#fff;text-align:center}
        .arr-stats b,.arr-stats small{display:block}
        .arr-stats small{font-size:10px;color:var(--muted);margin-top:2px}
        .arr-error,.arr-success{padding:12px 14px;border-radius:9px}
        .arr-error{background:#fff1ee;color:#a52c1d;border:1px solid #f1c3b9}
        .arr-success{background:#eef8ef;color:#206136;border:1px solid #bcdac2}
        .arr-form{display:grid;gap:16px}
        .arr-form-head,.arr-list-head{display:flex;justify-content:space-between;align-items:start;gap:16px}
        .arr-form-head h2,.arr-list-head h2{margin:0}
        .arr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .arr-grid label,.arr-upload{display:grid;gap:6px;font-size:13px;font-weight:700}
        .arr-grid input,.arr-grid select,.arr-grid textarea,.arr-filter input,.arr-filter select{width:100%;padding:10px 11px;border:1px solid var(--border);border-radius:8px;background:#fff}
        .arr-wide{grid-column:1/-1}
        .arr-upload small{color:var(--muted);font-weight:400}
        .arr-preview{display:flex;align-items:center;gap:12px}
        .arr-preview img{width:80px;height:80px;object-fit:cover;border-radius:50%;border:1px solid var(--border)}
        .arr-checks{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
        .arr-checks label{display:flex;align-items:center;gap:7px;font-weight:700}
        .arr-stars,.arr-rating{color:#C28A18;letter-spacing:2px}
        .arr-rating span{color:#D8DDD8}
        .arr-filter{display:flex;gap:7px;flex-wrap:wrap}
        .arr-filter input{min-width:240px}
        .arr-list{display:grid;gap:10px;margin-top:14px}
        .arr-item{display:grid;grid-template-columns:180px minmax(0,1fr) auto;gap:16px;align-items:start;padding:15px;border:1px solid var(--border);border-radius:12px;background:#fff}
        .arr-customer{display:flex;align-items:center;gap:10px}
        .arr-customer img,.arr-customer>span{width:42px;height:42px;border-radius:50%;flex:none}
        .arr-customer img{object-fit:cover;border:1px solid var(--border)}
        .arr-customer>span{display:grid;place-items:center;background:#EDF4E8;color:#235B37;font-weight:900}
        .arr-rating{font-size:11px;margin-top:3px}
        .arr-copy{display:grid;gap:6px;min-width:0}
        .arr-copy p{margin:0;color:#58645C;line-height:1.55}
        .arr-copy small{color:var(--muted)}
        .arr-tags{display:flex;gap:6px;flex-wrap:wrap}
        .arr-tags span{font-size:9px;font-weight:800;padding:3px 7px;border-radius:20px;background:#EEF1EE;color:#526057}
        .arr-tags .arr-approved{background:#E6F5E9;color:#1D6B35}
        .arr-tags .arr-pending{background:#FFF5DE;color:#825E0A}
        .arr-tags .arr-rejected{background:#FBEAEA;color:#9B2B2B}
        .arr-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
        @media(max-width:900px){.arr-heading,.arr-list-head{align-items:start;flex-direction:column}.arr-item{grid-template-columns:1fr}.arr-actions{justify-content:flex-start}}
        @media(max-width:650px){.arr-grid{grid-template-columns:1fr}.arr-wide{grid-column:auto}.arr-filter{width:100%}.arr-filter input,.arr-filter select,.arr-filter button{width:100%}}
      `}</style>
    </div>
  );
}
