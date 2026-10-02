export const PAGE_TYPES = ['PAGE', 'LANDING'];
export const PAGE_STATUSES = ['DRAFT', 'PUBLISHED'];
export const BLOCK_TYPES = ['hero', 'text', 'imageText', 'products', 'cta', 'faq'];

export function slugifyPage(value = '') {
  return String(value)
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function normalizePageInput(body = {}) {
  const title = String(body.title || '').trim().slice(0, 180);
  const slug = slugifyPage(body.slug || title);
  const pageType = PAGE_TYPES.includes(body.pageType) ? body.pageType : 'PAGE';
  const status = PAGE_STATUSES.includes(body.status) ? body.status : 'DRAFT';

  if (!title) throw new Error('Page title is required.');
  if (!slug) throw new Error('Page slug is required.');

  const rawContent = Array.isArray(body.content) ? body.content : [];
  const content = rawContent
    .filter((block) => block && BLOCK_TYPES.includes(block.type))
    .slice(0, 60)
    .map((block) => ({ ...block, id: String(block.id || cryptoRandomId()) }));

  return {
    title,
    slug,
    pageType,
    status,
    seoTitle: String(body.seoTitle || '').trim().slice(0, 180),
    seoDescription: String(body.seoDescription || '').trim().slice(0, 320),
    featuredImage: cleanImage(body.featuredImage),
    showHeader: body.showHeader !== false,
    showFooter: body.showFooter !== false,
    fullWidth: body.fullWidth === true,
    content,
  };
}

function cryptoRandomId() {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function cleanImage(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('/')) return text.slice(0, 700);
  try {
    const url = new URL(text);
    if (url.protocol === 'https:') return text.slice(0, 700);
  } catch {}
  return '';
}

export function publicPageHref(page) {
  return page?.pageType === 'LANDING'
    ? `/landing/${page.slug}`
    : `/page/${page.slug}`;
}
