"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

export default function SiteHeader() {
  const { count } = useCart();

  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [menu, setMenu] = useState(false);

  // FRONTEND THEME / LOGO
  const [siteTheme, setSiteTheme] = useState({
    logoUrl: "",
  });

  // Homepage and Admin Panel in English
  const english =
    pathname === "/" ||
    pathname?.startsWith("/admin") ||
    pathname === "/staff-login";

  const phone = (
    process.env.NEXT_PUBLIC_SUPPORT_PHONE || ""
  ).trim();

  const announcement =
    "অগ্রিম টাকা না দিয়ে, বাংলাদেশের যেকোনো প্রান্ত থেকে অর্ডার করুন। পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন। Arone Bd-এর সঙ্গে থাকুন।" +
    (phone ? ` অর্ডার করতে কল করুন: ${phone}` : "");

  /* =========================================
     LOAD CUSTOMER / ADMIN INFORMATION
  ========================================= */

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (active) {
            setUser(null);
          }
          return;
        }

        const data = await response.json();

        if (active) {
          setUser(data.user || null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      }
    };

    loadUser();

    window.addEventListener(
      "paaikar-auth-change",
      loadUser
    );

    window.addEventListener(
      "arone-auth-change",
      loadUser
    );

    return () => {
      active = false;

      window.removeEventListener(
        "paaikar-auth-change",
        loadUser
      );

      window.removeEventListener(
        "arone-auth-change",
        loadUser
      );
    };
  }, []);

  /* =========================================
     LOAD WEBSITE LOGO FROM BACKEND
  ========================================= */

  useEffect(() => {
    let active = true;

    const loadTheme = async () => {
      try {
        const response = await fetch("/api/theme", {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (active && data?.theme) {
          setSiteTheme({
            logoUrl: data.theme.logoUrl || "",
          });
        }
      } catch {
        // Default logo থাকবে
      }
    };

    loadTheme();

    return () => {
      active = false;
    };
  }, []);

  /* =========================================
     CLOSE MOBILE MENU AFTER NAVIGATION
  ========================================= */

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  const closeMenu = () => {
    setMenu(false);
  };

  const displayName =
    user?.name?.trim()?.split(/\s+/)[0] ||
    (english ? "Account" : "অ্যাকাউন্ট");

  const menuItems = [
    {
      href: "/",
      en: "Home",
      bn: "হোম",
    },
    {
      href: "/shop",
      en: "Shop All",
      bn: "সব পণ্য",
    },
    {
      href: "/shop?category=cast-iron-cookware",
      en: "Cast Iron Cookware",
      bn: "কাস্ট আয়রন কুকওয়্যার",
    },
    {
      href: "/track",
      en: "Track Order",
      bn: "অর্ডার ট্র্যাক করুন",
    },
    {
      href: "/account",
      en: "My Account",
      bn: "আমার অ্যাকাউন্ট",
    },
  ];

  return (
    <>
      {/* ======================================
          TOP SCROLLING ANNOUNCEMENT
      ====================================== */}

      <div className="top-strip arone-announcement">
        <div className="container arone-announcement-layout">
          <div
            className="arone-announcement-window"
            aria-label={announcement}
          >
            <div
              className="arone-announcement-track"
              aria-hidden="true"
            >
              <span className="arone-announcement-copy">
                {announcement}
              </span>

              <span className="arone-announcement-copy">
                {announcement}
              </span>
            </div>
          </div>

          {phone && (
            <a
              href={`tel:${phone.replace(
                /[^\d+]/g,
                ""
              )}`}
              className="arone-announcement-phone"
            >
              ☎ {phone}
            </a>
          )}
        </div>
      </div>

      {/* ======================================
          MAIN HEADER
      ====================================== */}

      <header className="site-header">
        <div className="container header-main">

          {/* ==================================
              LOGO / BRAND
          ================================== */}

          <Link
  href="/"
  className="brand"
  aria-label="Arone Bd Home"
  onClick={closeMenu}
>
  <span className="brand-logo-wrap">
    {siteTheme?.logoUrl ? (
      <img
        src={siteTheme.logoUrl}
        alt="Arone Bd"
        className="brand-image"
      />
    ) : (
      <span className="brand-mark">
        A<span>✦</span>
      </span>
    )}
  </span>

  <span className="brand-info">


  </span>
</Link>

          {/* ==================================
              SEARCH BAR
          ================================== */}

          <form
            action="/shop"
            method="GET"
            className="header-search"
            role="search"
          >
            <span
              className="search-icon"
              aria-hidden="true"
            >
              ⌕
            </span>

            <input
              type="search"
              name="q"
              placeholder={
                english
                  ? "Search products..."
                  : "আপনার পছন্দের পণ্য খুঁজুন..."
              }
              aria-label="Search products"
            />

            <button type="submit">
              {english ? "Search" : "খুঁজুন"}
            </button>
          </form>

          {/* ==================================
              HEADER ACTIONS
          ================================== */}

          <nav
            className="header-actions"
            aria-label="Account and cart"
          >
            {/* ACCOUNT */}

            <Link
              href="/account"
              className="header-action"
              aria-label={displayName}
              onClick={closeMenu}
            >
              <span
                className="account-icon"
                aria-hidden="true"
              >
                ♙
              </span>

              <span className="account-name">
                {displayName}
              </span>
            </Link>

            {/* ADMIN PANEL */}

            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="admin-link"
                onClick={closeMenu}
              >
                Admin
              </Link>
            )}

            {/* CART */}

            <Link
              href="/cart"
              className="cart-header"
              aria-label={
                english
                  ? `Shopping cart, ${
                      count || 0
                    } items`
                  : `কার্টে ${
                      count || 0
                    }টি পণ্য`
              }
              onClick={closeMenu}
            >
              <span aria-hidden="true">
                🛒
              </span>

              <span className="cart-label">
                {english
                  ? "Cart"
                  : "কার্ট"}
              </span>

              <em>{count || 0}</em>
            </Link>

            {/* MOBILE HAMBURGER */}

            <button
              type="button"
              className={`mobile-hamburger ${
                menu ? "is-open" : ""
              }`}
              aria-label={
                menu
                  ? "Close navigation"
                  : "Open navigation"
              }
              aria-controls="mobile-site-navigation"
              aria-expanded={menu}
              onClick={() =>
                setMenu((prev) => !prev)
              }
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </nav>
        </div>

        {/* ====================================
            MAIN NAVIGATION
        ==================================== */}

        <div
          id="mobile-site-navigation"
          className={`navbar ${
            menu ? "show" : ""
          }`}
        >
          <div className="container nav-inner">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={
                  pathname === item.href ||
                  (
                    item.href !== "/shop" &&
                    item.href.split("?")[0] ===
                      pathname
                  )
                    ? "nav-active"
                    : ""
                }
              >
                {english
                  ? item.en
                  : item.bn}
              </Link>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}