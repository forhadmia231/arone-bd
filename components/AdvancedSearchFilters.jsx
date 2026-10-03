'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdvancedSearchFilters({ initial, categories, priceRange }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    const q = String(form.q || '').trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = response.ok ? await response.json() : { products: [] };
        setSuggestions(data.products || []);
        setOpen(true);
      } catch {}
    }, 220);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [form.q]);

  const activeCount = useMemo(() => {
    return [form.category, form.minPrice, form.maxPrice, form.inStock, form.featured]
      .filter(Boolean).length;
  }, [form]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function apply(event) {
    event?.preventDefault();
    const params = new URLSearchParams();

    Object.entries(form).forEach(([key, value]) => {
      if (value !== '' && value !== false && value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    });

    params.delete('page');
    router.push(`/search?${params.toString()}`);
    setOpen(false);
  }

  function clear() {
    const next = {
      q: '',
      category: '',
      sort: 'latest',
      minPrice: '',
      maxPrice: '',
      inStock: '',
      featured: '',
    };
    setForm(next);
    setSuggestions([]);
    router.push('/search');
  }

  return (
    <aside className="ar-search-filters">
      <form onSubmit={apply}>
        <div className="ar-filter-head">
          <div>
            <strong>Filters</strong>
            <small>{activeCount ? `${activeCount} active` : 'Refine products'}</small>
          </div>
          <button type="button" onClick={clear}>Clear</button>
        </div>

        <label className="ar-search-field">
          Search
          <input
            value={form.q || ''}
            onChange={(e) => update('q', e.target.value)}
            onFocus={() => suggestions.length && setOpen(true)}
            placeholder="Product name..."
            autoComplete="off"
          />

          {open && suggestions.length > 0 && (
            <div className="ar-search-suggestions">
              {suggestions.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/product/${item.slug}`);
                  }}
                >
                  <img src={item.imageUrl} alt="" />
                  <span>
                    <b>{item.name}</b>
                    <small>৳{item.price}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </label>

        <label>
          Category
          <select value={form.category || ''} onChange={(e) => update('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>{item.name}</option>
            ))}
          </select>
        </label>

        <div className="ar-price-pair">
          <label>
            Min Price
            <input
              type="number"
              min="0"
              value={form.minPrice || ''}
              onChange={(e) => update('minPrice', e.target.value)}
              placeholder={String(priceRange.min || 0)}
            />
          </label>

          <label>
            Max Price
            <input
              type="number"
              min="0"
              value={form.maxPrice || ''}
              onChange={(e) => update('maxPrice', e.target.value)}
              placeholder={String(priceRange.max || 0)}
            />
          </label>
        </div>

        <label>
          Sort By
          <select value={form.sort || 'latest'} onChange={(e) => update('sort', e.target.value)}>
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A-Z</option>
            <option value="name-desc">Name: Z-A</option>
          </select>
        </label>

        <label className="ar-check-row">
          <input
            type="checkbox"
            checked={form.inStock === '1'}
            onChange={(e) => update('inStock', e.target.checked ? '1' : '')}
          />
          <span>In-stock products only</span>
        </label>

        <label className="ar-check-row">
          <input
            type="checkbox"
            checked={form.featured === '1'}
            onChange={(e) => update('featured', e.target.checked ? '1' : '')}
          />
          <span>Featured products</span>
        </label>

        <button type="submit" className="btn btn-primary ar-apply-filter">Apply Filters</button>
      </form>
    </aside>
  );
}
