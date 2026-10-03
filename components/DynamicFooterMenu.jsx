'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DynamicFooterMenu({ className = '' }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;
    fetch('/api/navigation?location=FOOTER', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active) setItems(data?.items || []);
      })
      .catch(() => {});

    return () => { active = false; };
  }, []);

  if (!items.length) return null;

  return (
    <nav className={className} aria-label="Footer links">
      {items.map((item) => (
        <Link key={item.id} href={item.href}>
          {item.labelBn || item.labelEn}
        </Link>
      ))}
    </nav>
  );
}
