'use client';

import { useEffect, useState } from 'react';

function Stars({ rating }) {
  const value = Math.max(1, Math.min(5, Number(rating || 5)));

  return (
    <span
      aria-label={`${value} out of 5 stars`}
      className="ars-stars"
    >
      {'★'.repeat(value)}
      <i>{'★'.repeat(5 - value)}</i>
    </span>
  );
}

export default function ReviewsShowcase() {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ count: 0, average: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch('/api/reviews?limit=12&minRating=1', {
      cache: 'no-store',
    })
      .then(async (response) => {
        const text = await response.text();
        if (!text.trim()) return null;
        const data = JSON.parse(text);
        if (!response.ok) throw new Error(data?.error || 'Could not load reviews.');
        return data;
      })
      .then((data) => {
        if (!active || !data) return;
        setReviews(data.reviews || []);
        setSummary(data.summary || { count: 0, average: 0 });
      })
      .catch(() => {
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="ars-wrap">
      <div className="container">
        <div className="ars-heading">
          <div>
            <span className="eyebrow">CUSTOMER FEEDBACK</span>
            <h1>What Customers Say</h1>
            <p>
              Approved reviews submitted by Arone Bd customers.
            </p>
          </div>

          {summary.count > 0 && (
            <div className="ars-score">
              <strong>{Number(summary.average || 0).toFixed(1)}</strong>
              <Stars rating={Math.round(summary.average)} />
              <small>{summary.count} approved reviews</small>
            </div>
          )}
        </div>

        {loading ? (
          <div className="ars-empty">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="ars-empty">
            No approved customer reviews yet.
          </div>
        ) : (
          <div className="ars-grid">
            {reviews.map((review) => (
              <article className="ars-card" key={review.id}>
                <div className="ars-person">
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
                      {review.verified ? <em>✓ Verified</em> : null}
                    </b>
                    <Stars rating={review.rating} />
                  </div>
                </div>

                {review.title && <h3>{review.title}</h3>}
                <p>{review.reviewText}</p>

                {(review.productName || review.source) && (
                  <small>
                    {review.productName || ''}
                    {review.productName && review.source ? ' · ' : ''}
                    {review.source || ''}
                  </small>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .ars-wrap{padding:52px 0;background:#F7FAF5}
        .ars-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:24px}
        .ars-heading h1{margin:5px 0;font-size:clamp(30px,4vw,44px)}
        .ars-heading p{margin:0;color:#6D796F}
        .ars-score{min-width:150px;text-align:right}
        .ars-score strong{display:block;font-size:32px;color:#235B37}
        .ars-score small{display:block;margin-top:4px;color:#7B867D}
        .ars-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .ars-card{display:grid;align-content:start;gap:10px;background:#fff;border:1px solid #E0E6DE;border-radius:14px;padding:18px;box-shadow:0 6px 22px rgba(32,67,43,.05)}
        .ars-person{display:flex;align-items:center;gap:11px}
        .ars-person img,.ars-person>span{width:46px;height:46px;border-radius:50%;flex:none}
        .ars-person img{object-fit:cover;border:1px solid #E2E8E0}
        .ars-person>span{display:grid;place-items:center;background:#EDF4E8;color:#235B37;font-weight:900}
        .ars-person b{display:block}
        .ars-person em{font-style:normal;color:#20733C;font-size:10px;margin-left:6px}
        .ars-stars{display:block;color:#C28A18;letter-spacing:2px;font-size:13px}
        .ars-stars i{font-style:normal;color:#D9DDD8}
        .ars-card h3{font-size:15px;margin:2px 0 0}
        .ars-card p{margin:0;color:#526057;line-height:1.65}
        .ars-card small{color:#879187}
        .ars-empty{padding:28px;border:1px solid #E0E6DE;border-radius:12px;background:#fff;color:#718074}
        @media(max-width:900px){.ars-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:620px){.ars-heading{align-items:start;flex-direction:column}.ars-score{text-align:left}.ars-grid{grid-template-columns:1fr}}
      `}</style>
    </section>
  );
}
