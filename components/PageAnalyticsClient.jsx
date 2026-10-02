'use client';

import { useEffect } from 'react';

function attribution() {
  const params = new URLSearchParams(window.location.search);
  let referrer = document.referrer || '';
  let source = params.get('utm_source') || '';
  const medium = params.get('utm_medium') || '';
  const campaign = params.get('utm_campaign') || '';
  const content = params.get('utm_content') || '';
  const term = params.get('utm_term') || '';

  if (!source && referrer) {
    try {
      source = new URL(referrer).hostname.replace(/^www\./, '');
    } catch {}
  }

  if (!source) source = 'direct';

  return {
    source,
    medium,
    campaign,
    content,
    term,
    referrer: referrer.slice(0, 700),
    path: `${window.location.pathname}${window.location.search}`.slice(0, 700),
  };
}

function sendEvent(payload) {
  fetch('/api/page-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, ...attribution() }),
    keepalive: true,
  }).catch(() => {});
}

export default function PageAnalyticsClient({ page }) {
  useEffect(() => {
    if (!page?.id) return;

    sendEvent({
      pageId: page.id,
      pageSlug: page.slug || '',
      eventType: 'VIEW',
    });

    const click = (event) => {
      const target = event.target?.closest?.('[data-page-cta]');
      if (!target) return;

      sendEvent({
        pageId: page.id,
        pageSlug: page.slug || '',
        eventType: 'CTA_CLICK',
        label: target.getAttribute('data-page-cta') || target.textContent || '',
        href: target.getAttribute('href') || '',
      });
    };

    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [page?.id, page?.slug]);

  return null;
}
