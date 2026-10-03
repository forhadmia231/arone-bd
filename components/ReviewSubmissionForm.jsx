'use client';

import { useState } from 'react';

const initial = {
  customerName: '',
  rating: 5,
  title: '',
  reviewText: '',
  productName: '',
  website: '',
};

export default function ReviewSubmissionForm() {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function change(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const text = await response.text();
      const data = text.trim() ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data?.error || 'Could not submit review.');
      }

      setMessage(
        data?.message ||
          'Thank you. Your review is waiting for approval.'
      );
      setForm(initial);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="arrs-wrap">
      <div className="container">
        <div className="arrs-card">
          <div>
            <span className="eyebrow">SHARE YOUR EXPERIENCE</span>
            <h2>Write a Review</h2>
            <p className="muted">
              Your review will appear after moderation.
            </p>
          </div>

          {error && <div className="arrs-error">{error}</div>}
          {message && <div className="arrs-success">{message}</div>}

          <form onSubmit={submit}>
            <label>
              Your Name
              <input
                required
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
              Product Name (optional)
              <input
                value={form.productName}
                onChange={(e) => change('productName', e.target.value)}
              />
            </label>

            <label>
              Review Title (optional)
              <input
                value={form.title}
                onChange={(e) => change('title', e.target.value)}
              />
            </label>

            <label className="arrs-wide">
              Your Review
              <textarea
                required
                minLength="10"
                rows="5"
                value={form.reviewText}
                onChange={(e) => change('reviewText', e.target.value)}
              />
            </label>

            <input
              className="arrs-hp"
              tabIndex="-1"
              autoComplete="off"
              value={form.website}
              onChange={(e) => change('website', e.target.value)}
              aria-hidden="true"
            />

            <button
              className="btn btn-primary arrs-wide"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .arrs-wrap{padding:46px 0 66px;background:#fff}
        .arrs-card{max-width:780px;margin:0 auto;padding:24px;border:1px solid var(--border);border-radius:14px;background:#fff;box-shadow:0 8px 30px rgba(32,67,43,.06)}
        .arrs-card h2{margin:5px 0}
        form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin-top:20px}
        label{display:grid;gap:6px;font-size:13px;font-weight:700}
        input,select,textarea{width:100%;padding:11px 12px;border:1px solid var(--border);border-radius:8px;background:#fff}
        .arrs-wide{grid-column:1/-1}
        .arrs-error,.arrs-success{padding:11px 13px;border-radius:8px;margin-top:14px}
        .arrs-error{background:#FFF0ED;color:#9D2A1E;border:1px solid #F1C4BA}
        .arrs-success{background:#EDF8EF;color:#236439;border:1px solid #BEDCC4}
        .arrs-hp{position:absolute!important;left:-99999px!important;opacity:0!important;width:1px!important;height:1px!important}
        @media(max-width:620px){form{grid-template-columns:1fr}.arrs-wide{grid-column:auto}.arrs-card{padding:18px}}
      `}</style>
    </section>
  );
}
