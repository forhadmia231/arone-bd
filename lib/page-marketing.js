export const MARKETING_DEFAULTS = {
  analyticsEnabled: true,
  metaEvent: 'Lead',
  ga4Event: 'generate_lead',
  stickyEnabled: false,
  stickyType: 'LINK',
  stickyLabel: 'Order Now',
  stickyUrl: '/shop',
  stickyPhone: '',
  stickyMessage: 'Hello, I want to know more about this offer.',
  publishAt: null,
  unpublishAt: null,
  thankYouUrl: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  canonicalUrl: '',
};

export function withMarketingDefaults(value = {}) {
  return {
    ...MARKETING_DEFAULTS,
    ...(value || {}),
  };
}

export function pageIsLiveNow(page, settings, now = new Date()) {
  if (!page || page.status !== 'PUBLISHED') return false;

  const data = withMarketingDefaults(settings);
  const time = now.getTime();

  if (data.publishAt) {
    const start = new Date(data.publishAt).getTime();
    if (Number.isFinite(start) && time < start) return false;
  }

  if (data.unpublishAt) {
    const end = new Date(data.unpublishAt).getTime();
    if (Number.isFinite(end) && time >= end) return false;
  }

  return true;
}

export function cleanPublicUrl(value, { local = true } = {}) {
  const text = String(value || '').trim();
  if (!text) return '';

  if (local && /^\/(?!\/)/.test(text)) return text.slice(0, 1000);

  try {
    const url = new URL(text);
    if (url.protocol === 'https:') return text.slice(0, 1000);
  } catch {}

  return '';
}

export function cleanMarketingImage(value) {
  const text = String(value || '').trim();
  if (!text) return '';

  if (/^data:image\/(png|jpeg|webp);base64,/i.test(text)) {
    if (text.length > 650000) {
      throw new Error('Open Graph image is too large. Use an optimized image under 450 KB.');
    }
    return text;
  }

  return cleanPublicUrl(text, { local: true });
}

export function parseOptionalDate(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid schedule date/time.');
  }
  return date;
}

export function normalizeMarketingInput(body = {}) {
  const stickyType = ['LINK', 'WHATSAPP', 'CALL'].includes(body?.stickyType)
    ? body.stickyType
    : 'LINK';

  const metaEvent = String(body?.metaEvent || 'Lead').trim().slice(0, 80) || 'Lead';
  const ga4Event = String(body?.ga4Event || 'generate_lead').trim().slice(0, 80) || 'generate_lead';
  const publishAt = parseOptionalDate(body?.publishAt);
  const unpublishAt = parseOptionalDate(body?.unpublishAt);

  if (publishAt && unpublishAt && unpublishAt <= publishAt) {
    throw new Error('Unpublish time must be after publish time.');
  }

  return {
    analyticsEnabled: body?.analyticsEnabled !== false,
    metaEvent,
    ga4Event,
    stickyEnabled: body?.stickyEnabled === true,
    stickyType,
    stickyLabel: String(body?.stickyLabel || 'Order Now').trim().slice(0, 80) || 'Order Now',
    stickyUrl: cleanPublicUrl(body?.stickyUrl || '/shop', { local: true }) || '/shop',
    stickyPhone: String(body?.stickyPhone || '').replace(/[^\d+]/g, '').slice(0, 30),
    stickyMessage: String(body?.stickyMessage || '').trim().slice(0, 300),
    publishAt,
    unpublishAt,
    thankYouUrl: cleanPublicUrl(body?.thankYouUrl, { local: true }),
    ogTitle: String(body?.ogTitle || '').trim().slice(0, 180),
    ogDescription: String(body?.ogDescription || '').trim().slice(0, 320),
    ogImage: cleanMarketingImage(body?.ogImage),
    canonicalUrl: cleanPublicUrl(body?.canonicalUrl, { local: false }),
  };
}

export function marketingMetadata(page, settings) {
  const data = withMarketingDefaults(settings);
  const title = data.ogTitle || page.seoTitle || page.title;
  const description = data.ogDescription || page.seoDescription || undefined;
  const image = data.ogImage || page.featuredImage || '';

  return {
    title,
    description,
    alternates: data.canonicalUrl
      ? { canonical: data.canonicalUrl }
      : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(image ? { images: [image] } : {}),
    },
  };
}
