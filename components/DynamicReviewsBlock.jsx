'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function safeColor(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
}

function clamp(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function Stars({ rating }) {
  const value = Math.max(1, Math.min(5, Number(rating || 5)));

  return (
    <span
      aria-label={`${value} out of 5 stars`}
      style={{
        letterSpacing: 2,
        color: '#C28A18',
        fontSize: 15,
        whiteSpace: 'nowrap',
      }}
    >
      {'★'.repeat(value)}
      <span style={{ color: '#D9DDD8' }}>{'★'.repeat(5 - value)}</span>
    </span>
  );
}

export default function DynamicReviewsBlock({ block, preview = false }) {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    count: 0,
    average: 0,
  });
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => {
    const query = new URLSearchParams();
    query.set('limit', String(clamp(block.limit, 6, 1, 12)));
    query.set('minRating', String(clamp(block.minRating, 1, 1, 5)));

    if (block.featuredOnly === true) {
      query.set('featuredOnly', '1');
    }

    return query.toString();
  }, [block.limit, block.minRating, block.featuredOnly]);

  useEffect(() => {
    let active = true;

    fetch(`/api/reviews?${params}`, {
      cache: 'no-store',
    })
      .then(async (response) => {
        const text = await response.text();
        if (!text.trim()) return null;
        const data = JSON.parse(text);
        if (!response.ok) {
          throw new Error(data?.error || 'Could not load reviews.');
        }
        return data;
      })
      .then((data) => {
        if (!active || !data) return;
        setReviews(data.reviews || []);
        setSummary(data.summary || { count: 0, average: 0 });
      })
      .catch(() => {
        if (active) {
          setReviews([]);
          setSummary({ count: 0, average: 0 });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params]);

  const columns = [1, 2, 3].includes(Number(block.columns))
    ? Number(block.columns)
    : 3;

  return (
    <section
      style={{
        backgroundColor: safeColor(block.backgroundColor, '#F7FAF5'),
        color: safeColor(block.textColor, '#17251C'),
        paddingTop: clamp(block.paddingTop, 58, 0, 160),
        paddingBottom: clamp(block.paddingBottom, 58, 0, 160),
      }}
    >
      <div
        style={{
          width: 'min(1180px, calc(100% - 32px))',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'space-between',
            gap: 18,
            marginBottom: 22,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2
              style={{
                margin: '0 0 7px',
                fontSize: 'clamp(26px, 4vw, 38px)',
                lineHeight: 1.15,
              }}
            >
              {block.heading || 'Customer Reviews'}
            </h2>

            {summary.count > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  color: '#6A776C',
                  fontSize: 13,
                }}
              >
                <Stars rating={Math.round(summary.average)} />
                <span>
                  {Number(summary.average || 0).toFixed(1)} average · {summary.count}{' '}
                  approved reviews
                </span>
              </div>
            )}
          </div>

          {block.showSubmitLink !== false && (
            <Link
              href={block.submitLink || '/reviews'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 42,
                padding: '0 16px',
                borderRadius: 9,
                background: '#235B37',
                color: '#fff',
                fontWeight: 800,
                textDecoration: 'none',
                fontSize: 13,
              }}
            >
              Write a Review
            </Link>
          )}
        </div>

        {loading ? (
          <div
            style={{
              padding: 30,
              border: '1px solid #E1E7DF',
              borderRadius: 12,
              background: '#fff',
              color: '#718074',
            }}
          >
            Loading customer reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div
            style={{
              padding: 30,
              border: '1px solid #E1E7DF',
              borderRadius: 12,
              background: '#fff',
              color: '#718074',
            }}
          >
            {preview
              ? 'No approved reviews yet. Add reviews from Admin → Reviews.'
              : 'Customer reviews will appear here soon.'}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: 16,
            }}
            className="ar-live-review-grid"
          >
            {reviews.map((review) => (
              <article
                key={review.id}
                style={{
                  display: 'grid',
                  alignContent: 'start',
                  gap: 10,
                  padding: 18,
                  background: '#fff',
                  border: '1px solid #E0E6DE',
                  borderRadius: 14,
                  boxShadow: '0 6px 22px rgba(32, 67, 43, .05)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                  }}
                >
                  {block.showImages !== false && review.imageUrl ? (
                    <img
                      src={review.imageUrl}
                      alt={review.customerName}
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid #E2E8E0',
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: 46,
                        height: 46,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        background: '#EDF4E8',
                        color: '#235B37',
                        fontWeight: 900,
                      }}
                    >
                      {(review.customerName || 'C').charAt(0).toUpperCase()}
                    </span>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>
                      {review.customerName}
                      {review.verified ? (
                        <span
                          title="Verified review"
                          style={{
                            marginLeft: 6,
                            color: '#20733C',
                            fontSize: 11,
                          }}
                        >
                          ✓ Verified
                        </span>
                      ) : null}
                    </strong>
                    <Stars rating={review.rating} />
                  </div>
                </div>

                {review.title && (
                  <strong style={{ fontSize: 15 }}>{review.title}</strong>
                )}

                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.65,
                    color: '#526057',
                    fontSize: 14,
                  }}
                >
                  {review.reviewText}
                </p>

                {(review.productName ||
                  (block.showSource !== false && review.source)) && (
                  <small
                    style={{
                      color: '#879187',
                      fontSize: 11,
                      marginTop: 3,
                    }}
                  >
                    {review.productName ? review.productName : ''}
                    {review.productName &&
                    block.showSource !== false &&
                    review.source
                      ? ' · '
                      : ''}
                    {block.showSource !== false ? review.source : ''}
                  </small>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .ar-live-review-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 600px) {
          .ar-live-review-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
