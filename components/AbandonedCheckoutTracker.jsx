'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const TRACKED_PATHS = ['/cart', '/checkout'];
const COMPLETE_PATH_RE = /(thank|success|order-confirm|order-success)/i;

function sessionKey() {
  const storageKey = 'arone_abandoned_checkout_session';
  let value = sessionStorage.getItem(storageKey);
  if (value) return value;

  value =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `ac_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  sessionStorage.setItem(storageKey, value);
  return value;
}

function inputValue(patterns) {
  const nodes = document.querySelectorAll('input, textarea, select');

  for (const node of nodes) {
    const key = [
      node.getAttribute('name'),
      node.getAttribute('id'),
      node.getAttribute('placeholder'),
      node.getAttribute('aria-label'),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (patterns.some((pattern) => pattern.test(key))) {
      return String(node.value || '').trim();
    }
  }

  return '';
}

function trafficSource() {
  const params = new URLSearchParams(window.location.search);
  const explicit = params.get('utm_source');
  if (explicit) return explicit.slice(0, 80);

  try {
    if (!document.referrer) return 'direct';
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (host.includes('facebook') || host.includes('fb.')) return 'facebook';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('google')) return 'google';
    return host.slice(0, 80);
  } catch {
    return 'other';
  }
}

function safeSummary() {
  const node =
    document.querySelector('[data-order-summary]') ||
    document.querySelector('.order-summary') ||
    document.querySelector('.cart-summary') ||
    document.querySelector('.checkout-summary');

  return node?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 800) || '';
}

export default function AbandonedCheckoutTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const key = sessionKey();

    async function markRecovered() {
      try {
        await fetch('/api/abandoned-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionKey: key, recovered: true }),
          keepalive: true,
        });
      } catch {}
    }

    if (COMPLETE_PATH_RE.test(pathname || '')) {
      markRecovered();
      return;
    }

    if (!TRACKED_PATHS.some((path) => pathname?.startsWith(path))) {
      return;
    }

    let timer = null;
    let fallbackUser = null;

    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        fallbackUser = data?.user || null;
      })
      .catch(() => {});

    function payload() {
      const params = new URLSearchParams(window.location.search);

      return {
        sessionKey: key,
        name:
          inputValue([/customer.?name/, /full.?name/, /^name$/]) ||
          fallbackUser?.name ||
          '',
        phone:
          inputValue([/phone/, /mobile/, /contact.?number/]) ||
          fallbackUser?.phone ||
          '',
        email:
          inputValue([/email/]) ||
          fallbackUser?.email ||
          '',
        address: inputValue([/address/, /street/]),
        city: inputValue([/^city$/, /district/]),
        area: inputValue([/^area$/, /thana/, /upazila/]),
        note: inputValue([/note/, /comment/, /instruction/]),
        source: trafficSource(),
        utmSource: params.get('utm_source') || '',
        utmMedium: params.get('utm_medium') || '',
        utmCampaign: params.get('utm_campaign') || '',
        pageUrl: `${window.location.pathname}${window.location.search}`,
        payload: {
          summary: safeSummary(),
          referrer: document.referrer || '',
        },
      };
    }

    async function save() {
      const data = payload();
      const digits = String(data.phone || '').replace(/\D/g, '');
      if (digits.length < 8) return;

      try {
        await fetch('/api/abandoned-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true,
        });
      } catch {}
    }

    function scheduleSave() {
      clearTimeout(timer);
      timer = setTimeout(save, 1000);
    }

    function onHidden() {
      if (document.visibilityState !== 'hidden') return;
      const data = payload();
      const digits = String(data.phone || '').replace(/\D/g, '');
      if (digits.length < 8 || !navigator.sendBeacon) return;

      try {
        const blob = new Blob([JSON.stringify(data)], {
          type: 'application/json',
        });
        navigator.sendBeacon('/api/abandoned-checkout', blob);
      } catch {}
    }

    document.addEventListener('input', scheduleSave, true);
    document.addEventListener('change', scheduleSave, true);
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('arone-order-complete', markRecovered);
    window.addEventListener('paaikar-order-complete', markRecovered);

    const initial = setTimeout(save, 1800);

    return () => {
      clearTimeout(timer);
      clearTimeout(initial);
      document.removeEventListener('input', scheduleSave, true);
      document.removeEventListener('change', scheduleSave, true);
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('arone-order-complete', markRecovered);
      window.removeEventListener('paaikar-order-complete', markRecovered);
    };
  }, [pathname]);

  return null;
}
