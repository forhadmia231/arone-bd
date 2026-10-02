'use client';

import { useEffect, useState } from 'react';
import { getWishlist, toggleWishlist, WISHLIST_EVENT, WISHLIST_KEY } from '@/lib/wishlist';

export default function WishlistButton({ product }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sync = () => setSaved(getWishlist().some((item) => item.slug === product.slug));
    const onStorage = (event) => {
      if (event.key === WISHLIST_KEY) sync();
    };
    sync();
    window.addEventListener(WISHLIST_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, [product.slug]);

  return (
    <button
      type="button"
      className={`arone-wishlist-toggle${saved ? ' is-saved' : ''}`}
      aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={saved}
      title={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={(event) => {
        event.stopPropagation();
        setSaved(toggleWishlist(product));
      }}
    >
      <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    </button>
  );
}
