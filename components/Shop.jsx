
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "./ProductCard";

export default function Shop() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryString = searchParams.toString();

  const [data, setData] = useState({
    products: [],
    total: 0,
    pages: 0,
    page: 1,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const [min, setMin] = useState(
    searchParams.get("min") || ""
  );

  const [max, setMax] = useState(
    searchParams.get("max") || ""
  );

  const [priceError, setPriceError] = useState("");

  // Fetch products
  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/products?${queryString}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const result = await response.json();

        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [queryString]);

  // Fetch categories
  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/categories", {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((result) => {
        if (!controller.signal.aborted) {
          setCategories(result.categories || []);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  // Synchronize input values with URL
  useEffect(() => {
    const params = new URLSearchParams(queryString);

    setMin(params.get("min") || "");
    setMax(params.get("max") || "");
  }, [queryString]);

  // Update filter / sort
  function change(key, value) {
    const params = new URLSearchParams(queryString);

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete("page");

    const query = params.toString();

    router.push(query ? `/shop?${query}` : "/shop");

    setFilterOpen(false);
  }

  // Apply price filter
  function applyPrice(event) {
    event.preventDefault();

    if (
      min !== "" &&
      max !== "" &&
      Number(min) > Number(max)
    ) {
      setPriceError("সর্বনিম্ন দাম সর্বোচ্চ দামের বেশি হতে পারে না।");
      return;
    }

    setPriceError("");

    const params = new URLSearchParams(queryString);

    if (min !== "") {
      params.set("min", min);
    } else {
      params.delete("min");
    }

    if (max !== "") {
      params.set("max", max);
    } else {
      params.delete("max");
    }

    params.delete("page");

    const query = params.toString();

    router.push(query ? `/shop?${query}` : "/shop");

    setFilterOpen(false);
  }

  // Reset filters, preserving search and sorting
  function resetFilters() {
    const params = new URLSearchParams(queryString);

    params.delete("category");
    params.delete("min");
    params.delete("max");
    params.delete("page");

    setMin("");
    setMax("");
    setPriceError("");
    setFilterOpen(false);

    const query = params.toString();
    router.push(query ? `/shop?${query}` : "/shop");
  }

  const activeFilters = [
    searchParams.get("category"),
    searchParams.get("min"),
    searchParams.get("max"),
  ].filter(Boolean).length;

  return (
    
 <main className="container section shop-page arone-reference-shop">


      {/* BREADCRUMB - DESKTOP ONLY */}

      <div className="breadcrumb">
        হোম / <b>সব পণ্য</b>
      </div>

      {/* COMPACT PAGE HEADING */}

      
 <div className="shop-header arone-shop-desktop-heading">


        <div>
          <span className="eyebrow">
            ARONE BD COLLECTION
          </span>

          <h1>
            {searchParams.get("q")
              ? "সার্চ ফলাফল"
              : "সব পণ্য"}
          </h1>

          <p>
            পছন্দের পণ্য খুঁজে নিন এবং সহজেই অর্ডার করুন।
          </p>
        </div>

        <span className="shop-total-pill">
          {data.total || 0}টি পণ্য
        </span>

      </div>

{/* MOBILE SHOP CONTROLS */}

<div className="arone-shop-mobile-top">

  {/* Compact Breadcrumb */}

  <div className="arone-shop-mobile-crumb">
    <span>Home</span>
    <span>/</span>
    <strong>
      {searchParams.get("q")
        ? "সার্চ ফলাফল"
        : "সব পণ্য"}
    </strong>
  </div>


  {/* Filter and Sort */}

  <div className="arone-shop-mobile-controls">

    <button
      type="button"
      className="arone-shop-filter-toggle"
      aria-label="Open product filters"
      aria-expanded={filterOpen}
      aria-controls="shop-filters-panel"
      onClick={() => setFilterOpen((prev) => !prev)}
    >
      ☷
    </button>

    <select
      aria-label="Sort products"
      value={searchParams.get("sort") || "latest"}
      onChange={(event) =>
        change("sort", event.target.value)
      }
    >
      <option value="latest">Product: Latest</option>
      <option value="oldest">Product: Oldest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="name_asc">Name: A-Z</option>
    </select>

  </div>

</div>

      {/* MAIN SHOP LAYOUT */}

      <div className="shop-layout">

        {/* FILTER SIDEBAR */}

        <aside
          id="shop-filters-panel"
          className={`filters ${filterOpen ? "is-open" : ""}`}
        >

          <div className="shop-filter-heading">

            <h3>ফিল্টার করুন</h3>

            <button
              type="button"
              className="shop-filter-close"
              onClick={() => setFilterOpen(false)}
              aria-label="Close filters"
            >
              ✕
            </button>

          </div>

          {/* CATEGORY FILTER */}

          <label>ক্যাটাগরি</label>

          <button
            type="button"
            className={
              !searchParams.get("category")
                ? "filter-active"
                : ""
            }
            onClick={() => change("category", "")}
          >
            সব পণ্য
          </button>

          {categories.map((category) => (

            <button
              key={category.id}
              type="button"
              className={
                searchParams.get("category") === category.slug
                  ? "filter-active"
                  : ""
              }
              onClick={() =>
                change("category", category.slug)
              }
            >
              {category.name} ({category._count?.products || 0})
            </button>

          ))}

          {/* PRICE FILTER */}

          <form onSubmit={applyPrice}>

            <label>দাম অনুযায়ী ফিল্টার</label>

            <div className="range-inputs">

              <input
                type="number"
                min="0"
                placeholder="সর্বনিম্ন"
                value={min}
                onChange={(event) =>
                  setMin(event.target.value)
                }
              />

              <input
                type="number"
                min="0"
                placeholder="সর্বোচ্চ"
                value={max}
                onChange={(event) =>
                  setMax(event.target.value)
                }
              />

            </div>

            {priceError && (
              <p className="shop-price-error" role="alert">
                {priceError}
              </p>
            )}

            <div className="shop-filter-actions">

              <button
                type="submit"
                className="filter-submit"
              >
                প্রয়োগ করুন
              </button>

              <button
                type="button"
                className="shop-reset-filter"
                onClick={resetFilters}
              >
                Reset
              </button>

            </div>

          </form>

        </aside>

        {/* PRODUCT RESULTS */}

        <div className="shop-results">

          {/* COMPACT FILTER + SORT TOOLBAR */}

          <div className="sort-bar shop-toolbar">

            <button
              type="button"
              className="shop-mobile-filter-toggle"
              aria-expanded={filterOpen}
              aria-controls="shop-filters-panel"
              onClick={() =>
                setFilterOpen((previous) => !previous)
              }
            >
              ☷ Filter

              {activeFilters > 0 && (
                <span className="shop-filter-count">
                  {activeFilters}
                </span>
              )}

            </button>

            <span className="shop-results-count">
              {loading
                ? "লোড হচ্ছে..."
                : `${data.total || 0}টি ফলাফল`}
            </span>

            <label className="shop-sort-control">

              <span className="shop-sort-label">
                Sort:
              </span>

              <select
                aria-label="Sort products"
                value={searchParams.get("sort") || "latest"}
                onChange={(event) =>
                  change("sort", event.target.value)
                }
              >
                <option value="latest">সর্বশেষ</option>
                <option value="oldest">পুরোনো আগে</option>
                <option value="price_asc">
                  দাম: কম থেকে বেশি
                </option>
                <option value="price_desc">
                  দাম: বেশি থেকে কম
                </option>
                <option value="name_asc">নাম A–Z</option>
              </select>

            </label>

          </div>

          {/* PRODUCT GRID */}

          <div className="product-grid shop-grid">

            {loading ? (

              <p className="shop-loading">
                পণ্য লোড হচ্ছে...
              </p>

            ) : (

              data.products?.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))

            )}

          </div>

          {/* EMPTY RESULTS */}

          {!loading && !data.products?.length && (

            <div className="empty">

              <h2>কোনো পণ্য পাওয়া যায়নি</h2>

              <p>
                অন্য ক্যাটাগরি বা দাম নির্বাচন করে দেখুন।
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={resetFilters}
              >
                সব ফিল্টার সরান
              </button>

            </div>

          )}

          {/* PAGINATION */}

          {data.pages > 1 && (

            <div className="pages">

              {Array.from(
                { length: Math.min(data.pages, 12) },
                (_, index) => {

                  const page = index + 1;

                  return (
                    <button
                      key={page}
                      type="button"
                      className={
                        data.page === page
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        change("page", String(page))
                      }
                    >
                      {page}
                    </button>
                  );
                }
              )}

            </div>

          )}

        </div>

      </div>

    </main>
  );
}
