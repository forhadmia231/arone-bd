'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getWishlist, WISHLIST_EVENT, WISHLIST_KEY } from '@/lib/wishlist';

const paths = {
  category: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  wishlist: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>,
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/></>,
  product: <><path d="M3 10h18l-1.4 11H4.4L3 10Z"/><path d="M5 10V5h14v5M2 5h20M9 14h6"/></>,
  search: <><circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/></>,
};

function NavIcon({ name }) {
  return <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const links = [
  { icon: 'category', label: 'Category', href: '/categories' },
  { icon: 'wishlist', label: 'Wishlist', href: '/wishlist' },
  { icon: 'home', label: 'Home', href: '/' },
  { icon: 'product', label: 'Product', href: '/shop' },
  { icon: 'search', label: 'Search', href: '/search' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const update = () => setWishlistCount(getWishlist().length);
    const onStorage = (event) => { if (event.key === WISHLIST_KEY) update(); };
    update();
    window.addEventListener(WISHLIST_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(WISHLIST_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (pathname?.startsWith('/admin') || pathname === '/staff-login') return null;

  return (
    <nav className="arone-bottom-nav" aria-label="Mobile quick navigation">
      {links.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname === item.href || (item.href === '/shop' && pathname?.startsWith('/product/'));
        return (
          <Link key={item.icon} href={item.href} className={`arone-bottom-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}>
            <span className="arone-bottom-icon"><NavIcon name={item.icon}/>{item.icon === 'wishlist' && wishlistCount > 0 && <span className="arone-bottom-count">{wishlistCount}</span>}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
