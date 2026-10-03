'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

function sessionKey(id) {
  return `arone_promo_seen_${id}`;
}

export default function PromotionLayer() {
  const pathname = usePathname();
  const [campaign, setCampaign] = useState(null);
  const [closed, setClosed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setClosed(false);
    setCopied(false);

    if (!pathname || pathname.startsWith('/admin')) {
      setCampaign(null);
      return () => {
        active = false;
      };
    }

    fetch(`/api/promotions/active?path=${encodeURIComponent(pathname)}`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        const next = data?.campaign || null;

        if (
          next?.showOncePerSession &&
          typeof window !== 'undefined' &&
          sessionStorage.getItem(sessionKey(next.id)) === '1'
        ) {
          setCampaign(null);
          return;
        }

        setCampaign(next);

        if (next?.id) {
          fetch('/api/promotions/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: next.id, type: 'view' }),
            keepalive: true,
          }).catch(() => {});

          if (next.showOncePerSession && typeof window !== 'undefined') {
            sessionStorage.setItem(sessionKey(next.id), '1');
          }
        }
      })
      .catch(() => {
        if (active) setCampaign(null);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  const styleVars = useMemo(
    () => ({
      '--promo-bg': campaign?.backgroundColor || '#173F29',
      '--promo-text': campaign?.textColor || '#FFFFFF',
    }),
    [campaign]
  );

  if (!campaign || closed) return null;

  function trackClick() {
    fetch('/api/promotions/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: campaign.id, type: 'click' }),
      keepalive: true,
    }).catch(() => {});
  }

  async function copyCoupon() {
    if (!campaign.couponCode) return;
    try {
      await navigator.clipboard.writeText(campaign.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  const content = (
    <div className="ar-promo-card" style={styleVars}>
      {campaign.dismissible && (
        <button
          type="button"
          className="ar-promo-close"
          aria-label="Close promotion"
          onClick={() => setClosed(true)}
        >
          ×
        </button>
      )}

      {campaign.imageUrl && (
        <img
          className="ar-promo-image"
          src={campaign.imageUrl}
          alt=""
        />
      )}

      <div className="ar-promo-copy">
        {campaign.title && <strong>{campaign.title}</strong>}
        {campaign.message && <p>{campaign.message}</p>}

        <div className="ar-promo-actions">
          {campaign.couponCode && (
            <button
              type="button"
              className="ar-promo-coupon"
              onClick={copyCoupon}
            >
              {copied ? 'Copied!' : `Copy ${campaign.couponCode}`}
            </button>
          )}

          {campaign.buttonText && campaign.buttonUrl && (
            <a
              href={campaign.buttonUrl}
              className="ar-promo-cta"
              onClick={trackClick}
            >
              {campaign.buttonText}
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (campaign.type === 'POPUP') {
    return (
      <>
        <div className="ar-promo-overlay" role="presentation">
          <div className="ar-promo-popup" role="dialog" aria-modal="true">
            {content}
          </div>
        </div>
        <PromoStyles />
      </>
    );
  }

  const pos = campaign.position === 'TOP' ? 'top' : 'bottom';

  return (
    <>
      <div className={`ar-promo-banner ar-promo-${pos}`}>
        {content}
      </div>
      <PromoStyles />
    </>
  );
}

function PromoStyles() {
  return (
    <style jsx global>{`
      .ar-promo-banner {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9990;
        width: min(980px, calc(100% - 24px));
      }
      .ar-promo-top { top: 12px; }
      .ar-promo-bottom { bottom: 12px; }
      .ar-promo-card {
        position: relative;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 18px;
        border-radius: 16px;
        background: var(--promo-bg);
        color: var(--promo-text);
        box-shadow: 0 18px 55px rgba(0,0,0,.2);
      }
      .ar-promo-image {
        width: 76px;
        height: 76px;
        object-fit: cover;
        border-radius: 12px;
        flex: none;
      }
      .ar-promo-copy { min-width: 0; flex: 1; }
      .ar-promo-copy strong {
        display: block;
        font-size: 18px;
        line-height: 1.2;
      }
      .ar-promo-copy p {
        margin: 5px 0 0;
        opacity: .88;
        font-size: 13px;
        line-height: 1.5;
      }
      .ar-promo-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .ar-promo-coupon,
      .ar-promo-cta {
        border: 0;
        border-radius: 9px;
        padding: 9px 13px;
        font-weight: 800;
        font-size: 12px;
        cursor: pointer;
        text-decoration: none;
      }
      .ar-promo-coupon {
        background: rgba(255,255,255,.12);
        color: var(--promo-text);
        border: 1px dashed rgba(255,255,255,.42);
      }
      .ar-promo-cta {
        background: #fff;
        color: #173F29;
      }
      .ar-promo-close {
        position: absolute;
        top: 7px;
        right: 8px;
        width: 28px;
        height: 28px;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,.15);
        color: var(--promo-text);
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
      }
      .ar-promo-overlay {
        position: fixed;
        inset: 0;
        z-index: 9991;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(0,0,0,.48);
        backdrop-filter: blur(4px);
      }
      .ar-promo-popup { width: min(520px, 100%); }
      .ar-promo-popup .ar-promo-card {
        display: block;
        padding: 22px;
      }
      .ar-promo-popup .ar-promo-image {
        width: 100%;
        height: auto;
        max-height: 240px;
        margin-bottom: 16px;
      }
      @media (max-width: 640px) {
        .ar-promo-card { padding: 12px; border-radius: 13px; }
        .ar-promo-image { width: 58px; height: 58px; }
        .ar-promo-copy strong { font-size: 15px; }
        .ar-promo-copy p { font-size: 12px; }
      }
    `}</style>
  );
}
