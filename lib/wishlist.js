// Client-side wishlist. No cookies, external requests or database changes.
export const WISHLIST_KEY = 'arone-wishlist-v1';
export const WISHLIST_EVENT = 'arone-wishlist-updated';

export function getWishlist() {
  if (typeof window === 'undefined') return [];
  try {
    const data = JSON.parse(window.localStorage.getItem(WISHLIST_KEY) || '[]');
    return Array.isArray(data)
      ? data.filter((item) => item && typeof item.slug === 'string').slice(0, 60)
      : [];
  } catch {
    return [];
  }
}

export function toggleWishlist(product) {
  if (typeof window === 'undefined' || !product?.slug) return false;
  const list = getWishlist();
  const existing = list.some((item) => item.slug === product.slug);
  const next = existing
    ? list.filter((item) => item.slug !== product.slug)
    : [
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          imageUrl: product.imageUrl || '/products/default.svg',
          price: Number(product.price) || 0,
          compareAtPrice: product.compareAtPrice == null ? null : Number(product.compareAtPrice),
          stock: Number(product.stock) || 0,
          category: product.category ? { name: product.category.name, slug: product.category.slug } : null,
        },
        ...list,
      ].slice(0, 60);
  try {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(WISHLIST_EVENT));
  } catch {
    return existing;
  }
  return !existing;
}
