import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import './search.css';

export const dynamic = 'force-dynamic';

function int(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function sortOrder(sort) {
  if (sort === 'price-asc') return { price: 'asc' };
  if (sort === 'price-desc') return { price: 'desc' };
  if (sort === 'name-asc') return { name: 'asc' };
  if (sort === 'name-desc') return { name: 'desc' };
  if (sort === 'oldest') return { createdAt: 'asc' };
  return { createdAt: 'desc' };
}

function pageUrl(params, nextPage) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value) !== '') {
      q.set(key, String(value));
    }
  }
  q.set('page', String(nextPage));
  return `/search?${q.toString()}`;
}

export default async function SearchPage({ searchParams }) {
  const raw = await searchParams;

  const q = clean(raw?.q);
  const category = clean(raw?.category);
  const sort = clean(raw?.sort) || 'latest';
  const minPrice = Math.max(0, int(raw?.minPrice, 0));
  const maxPrice = Math.max(0, int(raw?.maxPrice, 0));
  const inStock = String(raw?.inStock || '') === '1';
  const featured = String(raw?.featured || '') === '1';
  const page = Math.max(1, int(raw?.page, 1));
  const limit = 20;

  const where = {
    active: true,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
            { slug: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(category ? { category: { slug: category } } : {}),
    ...(inStock ? { stock: { gt: 0 } } : {}),
    ...(featured ? { featured: true } : {}),
    ...((minPrice > 0 || maxPrice > 0)
      ? {
          price: {
            ...(minPrice > 0 ? { gte: minPrice } : {}),
            ...(maxPrice > 0 ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  };

  const [products, total, categories, priceAgg] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true, slug: true } } },
      orderBy: sortOrder(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, slug: true },
    }),
    prisma.product.aggregate({
      where: { active: true },
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));
  const queryState = {
    q,
    category,
    sort,
    minPrice: minPrice || '',
    maxPrice: maxPrice || '',
    inStock: inStock ? '1' : '',
    featured: featured ? '1' : '',
  };

  return (
    <main className="container ar-search-page">
      <div className="ar-search-heading">
        <div>
          <span className="eyebrow">PRODUCT DISCOVERY</span>
          <h1>Search & Filter Products</h1>
          <p className="muted">
            {total} product{total === 1 ? '' : 's'} found
            {q ? ` for “${q}”` : ''}.
          </p>
        </div>
      </div>

      <div className="ar-search-layout">
        <AdvancedSearchFilters
          initial={queryState}
          categories={categories}
          priceRange={{
            min: priceAgg._min.price || 0,
            max: priceAgg._max.price || 0,
          }}
        />

        <section>
          {products.length === 0 ? (
            <div className="ar-search-empty">
              <h2>No matching products</h2>
              <p>Try removing a filter or using a broader search term.</p>
              <Link href="/search" className="btn btn-primary">Clear filters</Link>
            </div>
          ) : (
            <div className="ar-search-grid">
              {products.map((product) => (
                <article key={product.id} className="ar-search-card">
                  <Link href={`/product/${product.slug}`} className="ar-search-image">
                    <img src={product.imageUrl} alt={product.name} loading="lazy" />
                    {product.featured && <span className="ar-featured-badge">Featured</span>}
                    {product.stock <= 0 && <span className="ar-stock-badge">Out of stock</span>}
                  </Link>

                  <div className="ar-search-card-body">
                    <small>{product.category?.name || 'Product'}</small>
                    <Link href={`/product/${product.slug}`} className="ar-search-title">
                      {product.name}
                    </Link>

                    <div className="ar-search-price">
                      <strong>৳{product.price}</strong>
                      {product.compareAtPrice && product.compareAtPrice > product.price ? (
                        <del>৳{product.compareAtPrice}</del>
                      ) : null}
                    </div>

                    <div className="ar-search-meta">
                      <span>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                      <Link href={`/product/${product.slug}`}>View →</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="ar-search-pagination" aria-label="Search results pages">
              {page > 1 ? (
                <Link href={pageUrl(queryState, page - 1)}>← Previous</Link>
              ) : <span />}
              <strong>Page {page} of {pages}</strong>
              {page < pages ? (
                <Link href={pageUrl(queryState, page + 1)}>Next →</Link>
              ) : <span />}
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
