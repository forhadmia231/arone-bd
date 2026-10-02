
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { money } from "@/lib/format";
import { homeProductName } from "@/lib/home-product";
import { useCart } from "./CartProvider";

import WishlistButton from "./WishlistButton";

export default function ProductCard({ product, home = false }) {
  const { add } = useCart();
  const router = useRouter();

  const [added, setAdded] = useState(false);
  const timerRef = useRef(null);

  // Product information
  const productName = home
    ? homeProductName(product.name)
    : product.name;

  const productUrl =
    "/product/" + encodeURIComponent(product.slug);

  const locale = home ? "en-BD" : "bn-BD";

  const inStock = Number(product.stock) > 0;

  // Discount calculation
  const price = Number(product.price);
  const comparePrice = Number(product.compareAtPrice || 0);

  const discount =
    comparePrice > price && price >= 0
      ? Math.round((1 - price / comparePrice) * 100)
      : 0;

  // Clear animation timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Add to Cart with animation
  function toCart() {
    if (!inStock) return;

    add(product);

    setAdded(true);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setAdded(false);
      timerRef.current = null;
    }, 1800);
  }

  // Order Now
  function order() {
    if (!inStock) return;

    add(product);
    router.push("/checkout");
  }

  return (
    <article
      className={`product-card ${added ? "cart-added" : ""}`}
    >
      <WishlistButton product={product} />
      {/* PRODUCT IMAGE */}

      <Link
        href={productUrl}
        className="product-image"
        aria-label={`View ${productName}`}
      >
        <img
          src={product.imageUrl}
          alt={productName}
          loading="lazy"
        />

        {/* DISCOUNT BADGE */}

        {discount > 0 && (
          <span className="discount">
            {discount}% OFF
          </span>
        )}

      </Link>

      {/* PRODUCT INFORMATION */}

      <div className="card-content">

        {/* CATEGORY */}

        <p className="eyebrow">
          {home
            ? "CAST IRON COLLECTION"
            : product.category?.name || "ARONE BD COLLECTION"}
        </p>

        {/* PRODUCT TITLE */}

        <Link
          href={productUrl}
          className="product-title"
        >
          {productName}
        </Link>

        {/* PRICE */}

        <div className="price-row">

          <strong>
            {money(price, locale)}
          </strong>

          {comparePrice > price && (
            <del>
              {money(comparePrice, locale)}
            </del>
          )}

        </div>

        {/* ACTION BUTTONS */}

        <div className="product-action arone-product-actions">

          {/* ADD TO CART */}

          <button
            type="button"
            disabled={!inStock}
            onClick={toCart}
            className={`arone-cart-btn ${added ? "is-added" : ""}`}
          >
            {!inStock
              ? "স্টক শেষ"
              : added
                ? "✓ কার্টে যোগ হয়েছে"
                : "কার্টে যোগ করুন"}
          </button>

          {/* ORDER NOW */}

          <button
            type="button"
            disabled={!inStock}
            onClick={order}
            className="arone-order-btn"
          >
            অর্ডার করুন
          </button>

        </div>

      </div>
    </article>
  );
}
