'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { getWishlist, WISHLIST_EVENT, WISHLIST_KEY } from '@/lib/wishlist';

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const update = () => setItems(getWishlist());
    const onStorage = (event) => { if (event.key === WISHLIST_KEY) update(); };
    update();
    window.addEventListener(WISHLIST_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return (
    <main className="container section arone-mobile-route">
      <div className="section-heading"><div><span className="eyebrow">SAVED FOR LATER</span><h1>My Wishlist</h1><p>Your saved products on this device.</p></div></div>
      {items.length ? (
        <div className="product-grid">{items.map((product) => <ProductCard key={product.slug} product={product}/>)}</div>
      ) : (
        <div className="arone-mobile-empty"><span aria-hidden="true">♡</span><h2>Your wishlist is empty</h2><p>Tap the heart on a product to save it here.</p><Link className="btn btn-primary" href="/shop">Explore Products</Link></div>
      )}
    </main>
  );
}
