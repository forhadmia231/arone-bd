"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import ProductCard from "./ProductCard";
import MobileCategories from "./MobileCategories";

export default function StoreHome() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured products
  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const response = await fetch("/api/products?limit=8");

        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();

        if (active) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Product loading error:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>

      {/* =====================================
          DESKTOP HERO SECTION
      ===================================== */}

      <section className="hero arone-desktop-hero">

        <div className="container hero-inner">

          <div className="hero-copy">

            <span className="hero-kicker">
              ✦ ARONE BD-এর বিশেষ কালেকশন
            </span>

            <h2>
              
              
              আপনার পছন্দ, আপনার স্টাইল
              <br />
              ARONE-এর সাথে।
            </h2>

            <p>
              ট্রেন্ডিং পণ্য ও ফ্যাশন অ্যাক্সেসরিজের
              আকর্ষণীয় কালেকশন—আপনার প্রতিদিনের
              জীবন ও স্টাইলকে আরও সুন্দর করতে।
            </p>

            <div className="hero-buttons">

              <Link
                className="btn btn-primary"
                href="/shop"
              >
                কালেকশন দেখুন <span>↗</span>
              </Link>

              <Link
                className="btn btn-outline"
                href="/track"
              >
                অর্ডার ট্র্যাক করুন
              </Link>

            </div>

            <div className="hero-stats">

              <span>
                <b>৫০+</b>
                <small>ট্রেন্ডিং পণ্য</small>
              </span>

              <span>
                <b>COD</b>
                <small>ক্যাশ অন ডেলিভারি</small>
              </span>

              <span>
                <b>BD</b>
                <small>সারা দেশে ডেলিভারি</small>
              </span>

            </div>

          </div>

<div className="hero-visual">
  <div
    className="hero-orbit"
    aria-hidden="true"
  />

  <img
    src="/images/arone-gift-hero.png"
    alt="Arone Bd Gift Collection"
    className="hero-gift-image"
  />
</div>

        </div>

      </section>


      {/* =====================================
          MOBILE JEWELLERY BANNER
      ===================================== */}

      <section
        className="arone-mobile-banner"
        aria-label="Aron Jewellery Collection"
      >

        <Link
          href="/shop"
          aria-label="Explore Aron Jewellery and Gift Collection"
        >

          <Image
            src="/banners/arone-mobile.webp"
            alt="Aron Jewellery and Gift Combo Collection"
            width={1200}
            height={560}
            sizes="(max-width: 780px) calc(100vw - 20px), 1px"
            className="arone-mobile-banner-image"
          />

        </Link>

      </section>


      {/* =====================================
          MOBILE CATEGORY SECTION
      ===================================== */}

      <div className="arone-mobile-category-section">

        <MobileCategories />

      </div>


      {/* =====================================
          DESKTOP FEATURES SECTION
      ===================================== */}

      <section className="features arone-desktop-features">

        <div className="container features-row">

          <span>
            ✧ <b>মানসম্মত পণ্য</b>
            <small>প্রতিটি অর্ডারে যত্ন</small>
          </span>

          <span>
            ♧ <b>ট্রেন্ডি কালেকশন</b>
            <small>নতুন ও আকর্ষণীয় পণ্য</small>
          </span>

          <span>
            ♙ <b>কাস্টমার সাপোর্ট</b>
            <small>আপনার পাশে সবসময়</small>
          </span>

          <span>
            ▤ <b>ক্যাশ অন ডেলিভারি</b>
            <small>পণ্য হাতে পেয়ে পেমেন্ট</small>
          </span>

        </div>

      </section>


      {/* =====================================
          FEATURED PRODUCTS SECTION
      ===================================== */}

      <section className="section container arone-home-products">

        <div className="section-heading">

          <div>

            <span className="eyebrow">
              আমাদের কালেকশন
            </span>

            <h2>

              <span className="desktop-product-title">
                জনপ্রিয় পণ্যসমূহ
              </span>

              <span className="mobile-product-title">
                জুয়েলারি ও গিফট কম্বো
              </span>

            </h2>

            <p>
              আপনার জন্য বাছাই করা ট্রেন্ডিং পণ্য
              ও ফ্যাশন অ্যাক্সেসরিজ।
            </p>

          </div>

          <Link href="/shop" className="text-link">
            সব পণ্য দেখুন ↗
          </Link>

        </div>


        {/* PRODUCT GRID */}

        <div className="product-grid">

          {loading ? (

            <p>পণ্য লোড হচ্ছে...</p>

          ) : products.length > 0 ? (

            products.map((product) => (

              <ProductCard
                key={product.id}
                product={product}
                home
              />

            ))

          ) : (

            <p>এই মুহূর্তে কোনো পণ্য পাওয়া যাচ্ছে না।</p>

          )}

        </div>

      </section>


      {/* =====================================
          DESKTOP PROMOTIONAL SECTION
      ===================================== */}

      <section className="container arone-desktop-promo">

        <div className="promo">

          <div>

            <span className="eyebrow">
              মান ও স্টাইলে আস্থা
            </span>

            <h2>
              প্রতিদিনের জন্য ট্রেন্ডি পছন্দ।
            </h2>

            <p>
              আপনার দৈনন্দিন জীবন ও স্টাইলের জন্য
              বেছে নিন আমাদের আকর্ষণীয় কালেকশন।
            </p>

            <Link
              className="btn btn-primary"
              href="/shop"
            >
              কালেকশন দেখুন ↗
            </Link>

          </div>

<img
  src="/images/gift-lifestyle-banner.png"
  alt="Arone Bd Gift & Lifestyle Collection"
  className="promo-gift-image"
/>

        </div>

      </section>

    </>
  );
}