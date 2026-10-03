import Link from 'next/link';
import { backofficeUser } from '@/lib/auth';
import './admin-v2.css';

export const dynamic = 'force-dynamic';

const adminLinks = [
  {
    href: '/admin',
    icon: '◫',
    label: 'Overview',
  },
  {
    href: '/admin/analytics',
    icon: '↗',
    label: 'Sales Analytics',
  },
  {
    href: '/admin/orders',
    icon: '▤',
    label: 'Orders',
  },
  {
    href: '/admin/products',
    icon: '◆',
    label: 'Products',
  },
  {
    href: '/admin/inventory',
    icon: '▦',
    label: 'Inventory',
  },
  {
    href: '/admin/invoices',
    icon: '▣',
    label: 'Invoices',
  },
  {
    href: '/admin/finance',
    icon: '◈',
    label: 'Profit & Expenses',
  },
  {
    href: '/admin/courier',
    icon: '↗',
    label: 'Courier & Delivery',
  },
  {
    href: '/admin/categories',
    icon: '◇',
    label: 'Categories',
  },
  {
    href: '/admin/ads-tracking',
    icon: '◎',
    label: 'Ads Tracking',
  },

  // PAGE BUILDER
  {
    href: '/admin/pages',
    icon: '▧',
    label: 'Pages',
  },

  {
    href: '/admin/navigation',
    icon: '☰',
    label: 'Navigation',
  },
  {
    href: '/admin/bundles',
    icon: 'â–¥',
    label: 'Bundles',
  },
  {
    href: '/admin/coupons',
    icon: '%',
    label: 'Coupons',
  },
  {
    href: '/admin/reviews',
    icon: 'â˜…',
    label: 'Reviews',
  },
  {
    href: '/admin/promotions',
    icon: 'â—‰',
    label: 'Promotions',
  },
  {
    href: '/admin/settings',
    icon: '⚙',
    label: 'Settings',
  },
  { href: '/admin/abandoned-checkouts', icon: 'â†º', label: 'Abandoned Checkouts' },
  { href: '/admin/notifications', icon: 'âœ‰', label: 'Notifications' },
];

function staffLinks(user) {
  const links = [];

  if (
    user.canViewProducts ||
    user.canCreateProducts ||
    user.canEditProducts ||
    user.canDeleteProducts
  ) {
    links.push({
      href: '/admin/products',
      icon: '◆',
      label: 'Products',
    });
  }

  return links;
}

export default async function AdminLayout({
  children,
}) {
  const user = await backofficeUser();

  if (!user) {
    return (
      <main className="container section empty">
        <h1>Staff access required</h1>

        <p>
          Please sign in using an administrator
          or staff account.
        </p>

        <Link
          className="btn btn-primary"
          href="/staff-login"
        >
          Staff Sign In
        </Link>
      </main>
    );
  }

  const isAdmin = user.role === 'ADMIN';

  const links = isAdmin
    ? adminLinks
    : staffLinks(user);

  return (
    <div className="ar-admin-shell">

      {/* =====================================
          ADMIN SIDEBAR
      ===================================== */}

      <aside
        className="ar-admin-sidebar"
        aria-label="Administration"
      >
        <Link
          className="ar-admin-brand"
          href={
            isAdmin
              ? '/admin'
              : '/admin/products'
          }
        >
          <span className="ar-admin-mark">
            A<span>✦</span>
          </span>

          <span>
            <b>ARONE BD</b>
            <small>
              BUSINESS CONSOLE
            </small>
          </span>
        </Link>

        <div className="ar-sidebar-caption">
          {isAdmin
            ? 'WORKSPACE'
            : 'STAFF WORKSPACE'}
        </div>

        {/* ADMIN MENU */}

        <nav
          className="ar-admin-nav"
          aria-label="Admin sections"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
            >
              <span
                className="ar-admin-nav-icon"
                aria-hidden="true"
              >
                {link.icon}
              </span>

              {link.label}
            </Link>
          ))}
        </nav>

        {/* =================================
            SIDEBAR BOTTOM
        ================================= */}

        <div className="ar-admin-side-bottom">
          <Link
            href="/"
            className="ar-back-store"
          >
            ↖ View storefront
          </Link>

          <div className="ar-admin-profile">
            <span className="ar-avatar">
              {user.name
                ?.charAt(0)
                ?.toUpperCase() || 'A'}
            </span>

            <span>
              <b>{user.name}</b>

              <small>
                {isAdmin
                  ? 'Super Administrator'
                  : user.staffRole ||
                    'Staff'}
              </small>
            </span>
          </div>
        </div>
      </aside>

      {/* =====================================
          ADMIN MAIN AREA
      ===================================== */}

      <div className="ar-admin-main">

        {/* TOPBAR */}

        <div className="ar-admin-topbar">
          <div>
            <span className="ar-topbar-dot" />

            {' '}
            Store management

            <span className="ar-topbar-divider">
              {' / '}
            </span>

            ARONE BD
          </div>

          <div className="ar-topbar-right">
            <span className="ar-live-label">
              ●{' '}
              {isAdmin
                ? 'Business console'
                : 'Staff console'}
            </span>

            <Link
              href="/"
              className="ar-topbar-link"
            >
              View Store ↗
            </Link>
          </div>
        </div>

        <div className="ar-admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
