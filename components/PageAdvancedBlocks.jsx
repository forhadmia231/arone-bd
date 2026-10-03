'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from './PageAdvancedBlocks.module.css';
import DynamicReviewsBlock from './DynamicReviewsBlock';
import BundleOfferBlock from './BundleOfferBlock';

function safeColor(value, fallback) {
  const text = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
}

function clamp(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function sectionStyle(block) {
  return {
    backgroundColor: safeColor(block.backgroundColor, '#FFFFFF'),
    color: safeColor(block.textColor, '#17251C'),
    paddingTop: clamp(block.paddingTop, 58, 0, 160),
    paddingBottom: clamp(block.paddingBottom, 58, 0, 160),
  };
}

function buttonStyle(block) {
  return {
    backgroundColor: safeColor(block.buttonColor, '#235B37'),
    color: safeColor(block.buttonTextColor, '#FFFFFF'),
  };
}

function parseDeadline(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function useCountdown(value) {
  const deadline = useMemo(() => parseDeadline(value), [value]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!deadline) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  if (!deadline) {
    return { expired: false, days: 0, hours: 0, minutes: 0, seconds: 0, unset: true };
  }

  const diff = Math.max(0, deadline.getTime() - now);
  const totalSeconds = Math.floor(diff / 1000);

  return {
    expired: diff <= 0,
    unset: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function embedUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw);

    if (url.hostname === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }

    if (url.hostname.includes('youtube.com')) {
      if (url.pathname.startsWith('/embed/')) return raw;
      const id = url.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : '';
    }

    if (url.hostname.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      return /^\d+$/.test(id || '') ? `https://player.vimeo.com/video/${id}` : '';
    }
  } catch {}

  return '';
}

function Countdown({ block, preview }) {
  const time = useCountdown(block.endsAt);

  const units = [
    ...(block.showDays !== false ? [['Days', time.days]] : []),
    ['Hours', time.hours],
    ['Minutes', time.minutes],
    ['Seconds', time.seconds],
  ];

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2>{block.heading}</h2>}
        {block.text && <p className={styles.intro}>{block.text}</p>}

        {time.expired && !preview ? (
          <div className={styles.expired}>
            {block.expiredText || 'This offer has ended.'}
          </div>
        ) : (
          <div className={styles.countdown}>
            {units.map(([label, value]) => (
              <div className={styles.timeBox} key={label}>
                <strong>{String(value).padStart(2, '0')}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        )}

        {!block.endsAt && (
          <small className={styles.hint}>Set an offer end date in the editor.</small>
        )}

        {block.buttonText && (
          <Link
            href={block.buttonUrl || '#'}
            className={styles.button}
            style={buttonStyle(block)}
            data-page-cta={`Countdown: ${block.buttonText}`}
          >
            {block.buttonText}
          </Link>
        )}
      </div>
    </section>
  );
}

function Trust({ block }) {
  const items = Array.isArray(block.items) ? block.items : [];
  const columns = [2, 3, 4].includes(Number(block.columns))
    ? Number(block.columns)
    : 3;

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2>{block.heading}</h2>}
        <div className={styles.grid} style={{ '--cols': columns }}>
          {items.map((item, index) => (
            <article className={styles.trustCard} key={index}>
              <span className={styles.trustIcon}>{item.icon || '✓'}</span>
              <strong>{item.title || 'Trust point'}</strong>
              {item.text && <p>{item.text}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials({ block }) {
  const items = Array.isArray(block.items) ? block.items : [];
  const columns = [1, 2, 3].includes(Number(block.columns))
    ? Number(block.columns)
    : 3;

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2>{block.heading}</h2>}
        <div className={styles.grid} style={{ '--cols': columns }}>
          {items.map((item, index) => {
            const rating = clamp(item.rating, 5, 1, 5);
            return (
              <article className={styles.testimonial} key={index}>
                <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </div>
                <p>“{item.text || 'Customer review'}”</p>
                <strong>{item.name || 'Customer'}</strong>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Video({ block }) {
  const src = embedUrl(block.videoUrl);
  const widthClass =
    block.width === 'full'
      ? styles.videoFull
      : block.width === 'normal'
        ? styles.videoNormal
        : styles.videoWide;

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2>{block.heading}</h2>}
        {block.text && <p className={styles.intro}>{block.text}</p>}
        <div className={`${styles.videoWrap} ${widthClass}`}>
          {src ? (
            <iframe
              src={src}
              title={block.heading || 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className={styles.videoPlaceholder}>
              Add a valid YouTube or Vimeo URL.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Gallery({ block }) {
  const images = Array.isArray(block.images) ? block.images : [];
  const columns = [2, 3, 4].includes(Number(block.columns))
    ? Number(block.columns)
    : 3;
  const fit = block.imageFit === 'contain' ? 'contain' : 'cover';

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2>{block.heading}</h2>}
        <div className={styles.gallery} style={{ '--cols': columns }}>
          {images.map((item, index) => (
            <figure key={item.id || index}>
              {item.url ? (
                <img
                  src={item.url}
                  alt={item.alt || ''}
                  loading="lazy"
                  style={{ objectFit: fit }}
                />
              ) : (
                <div className={styles.galleryPlaceholder}>Image</div>
              )}
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}


function Steps({ block }) {
  const items = Array.isArray(block.items) ? block.items : [];
  const columns = [2, 3, 4].includes(Number(block.columns))
    ? Number(block.columns)
    : 3;

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2>{block.heading}</h2>}
        <div className={styles.stepsGrid} style={{ '--cols': columns }}>
          {items.map((item, index) => (
            <article className={styles.stepCard} key={index}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <strong>{item.title || `Step ${index + 1}`}</strong>
              {item.text && <p>{item.text}</p>}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison({ block }) {
  const rows = Array.isArray(block.rows) ? block.rows : [];
  const highlight = safeColor(block.highlightColor, '#EDF4E8');

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2>{block.heading}</h2>}
        <div className={styles.tableScroll}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>{block.featureLabel || 'Feature'}</th>
                <th style={{ backgroundColor: highlight }}>
                  {block.ourLabel || 'Arone Bd'}
                </th>
                <th>{block.otherLabel || 'Others'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <th>{row.feature || 'Feature'}</th>
                  <td style={{ backgroundColor: highlight }}>{row.ours || '—'}</td>
                  <td>{row.others || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Coupon({ block }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    const code = String(block.code || '').trim();
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.couponCard}>
        {block.heading && <h2>{block.heading}</h2>}
        {block.text && <p>{block.text}</p>}
        <div className={styles.couponRow}>
          <code>{block.code || 'OFFER'}</code>
          <button type="button" onClick={copyCode} style={buttonStyle(block)}>
            {copied ? block.copiedText || 'Copied!' : block.buttonText || 'Copy Code'}
          </button>
        </div>
        {block.note && <small>{block.note}</small>}
      </div>
    </section>
  );
}

function BeforeAfter({ block }) {
  const [position, setPosition] = useState(() =>
    clamp(block.startPosition, 50, 5, 95)
  );

  useEffect(() => {
    setPosition(clamp(block.startPosition, 50, 5, 95));
  }, [block.startPosition]);

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2>{block.heading}</h2>}
        {block.text && <p className={styles.intro}>{block.text}</p>}

        <div className={styles.beforeAfter}>
          {block.beforeImage ? (
            <img src={block.beforeImage} alt={block.beforeLabel || 'Before'} />
          ) : (
            <div className={styles.comparePlaceholder}>Before image</div>
          )}

          {block.afterImage ? (
            <img
              className={styles.afterImage}
              src={block.afterImage}
              alt={block.afterLabel || 'After'}
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            />
          ) : (
            <div
              className={`${styles.comparePlaceholder} ${styles.afterImage}`}
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              After image
            </div>
          )}

          <span className={styles.beforeLabel}>{block.beforeLabel || 'Before'}</span>
          <span className={styles.afterLabel}>{block.afterLabel || 'After'}</span>
          <span className={styles.compareLine} style={{ left: `${position}%` }} />

          <input
            className={styles.compareRange}
            type="range"
            min="5"
            max="95"
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
            aria-label="Before and after comparison"
          />
        </div>
      </div>
    </section>
  );
}

function Specs({ block }) {
  const rows = Array.isArray(block.rows) ? block.rows : [];

  return (
    <section className={styles.section} style={sectionStyle(block)}>
      <div className={styles.inner}>
        {block.heading && <h2>{block.heading}</h2>}
        <div className={styles.specsTable}>
          {rows.map((row, index) => (
            <div className={styles.specRow} key={index}>
              <strong>{row.label || 'Specification'}</strong>
              <span>{row.value || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


export default function PageAdvancedBlocks({ block, preview = false }) {
  if (block.type === 'countdown') return <Countdown block={block} preview={preview} />;
  if (block.type === 'trust') return <Trust block={block} />;
  if (block.type === 'testimonials') return <Testimonials block={block} />;
  if (block.type === 'liveReviews') return <DynamicReviewsBlock block={block} preview={preview} />;
  if (block.type === 'video') return <Video block={block} />;
  if (block.type === 'gallery') return <Gallery block={block} />;
  if (block.type === 'steps') return <Steps block={block} />;
  if (block.type === 'comparison') return <Comparison block={block} />;
  if (block.type === 'coupon') return <Coupon block={block} />;
  if (block.type === 'beforeAfter') return <BeforeAfter block={block} />;
  if (block.type === 'specs') return <Specs block={block} />;
  if (block.type === 'bundleOffer') return <BundleOfferBlock block={block} preview={preview} />;
  return null;
}
