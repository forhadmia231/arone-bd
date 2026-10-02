'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// Optional: add an image path for a specific category slug to override the first product image.
// Example: 'cast-iron-cookware': '/products/kadai.svg'
const CATEGORY_IMAGES = {};

export default function MobileCategories({ fullPage = false }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/categories').then((r) => (r.ok ? r.json() : { categories: [] })),
      fetch('/api/products?limit=48').then((r) => (r.ok ? r.json() : { products: [] })),
    ]).then(([categoryData, productData]) => {
      if (!active) return;
      setCategories(categoryData.categories || []);
      setProducts(productData.products || []);
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  const imageByCategory = useMemo(() => {
    const result = {};
    for (const item of products) {
      const slug = item.category?.slug;
      if (slug && !result[slug] && item.imageUrl) result[slug] = item.imageUrl;
    }
    return result;
  }, [products]);

  return (
    <section
      id="mobile-categories"
      className={`arone-mobile-categories${fullPage ? ' is-full-page' : ''}`}
      aria-label="Shop by category"
    >
      <div className="container">
        <div className="arone-categories-heading">
          <h2>{fullPage ? 'Shop by Category' : 'Categories'}</h2>
          {!fullPage && <Link href="/categories">View all →</Link>}
        </div>
        <div className="arone-category-scroll">
          <Link href="/shop" className="arone-category-item">
            <span className="arone-category-picture"><img src="/products/default.svg" alt="" loading="lazy" /></span>
            <span>All Products</span>
          </Link>
          {categories.map((category) => (
            <Link
              className="arone-category-item"
              key={category.id}
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
            >
              <span className="arone-category-picture">
                <img
                  src={CATEGORY_IMAGES[category.slug] || imageByCategory[category.slug] || '/products/default.svg'}
                  alt=""
                  loading="lazy"
                />
              </span>
              <span title={category.name}>{category.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
