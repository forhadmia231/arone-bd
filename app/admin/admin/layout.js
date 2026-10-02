import Link from 'next/link';
import {adminUser} from '@/lib/auth';
import './admin-v2.css';

export const dynamic='force-dynamic';
const links=[
  {href:'/admin',icon:'◫',label:'Overview'},
  {href:'/admin/analytics',icon:'↗',label:'Sales Analytics'},
  {href:'/admin/orders',icon:'▤',label:'Orders'},
  {href:'/admin/products',icon:'▦',label:'Products'},
  {href:'/admin/inventory',icon:'▧',label:'Inventory'},
  {href:'/admin/invoices',icon:'▣',label:'Invoices'},
  {href:'/admin/categories',icon:'◇',label:'Categories'},
  {href:'/admin/ads-tracking',icon:'◎',label:'Ads Tracking'}, 
  {href: "/admin/appearance", icon: "✦", label: "Appearance" }

];
export default async function AdminLayout({children}) {
  const admin=await adminUser();
  if(!admin)return <main className="container section empty">
    <h1>Admin access required</h1>
    <p>Please sign in using an administrator account.</p>
    <Link className="btn btn-primary" href="/staff-login">Admin Sign In</Link>
  </main>;
  return <div className="ar-admin-shell">
    <aside className="ar-admin-sidebar" aria-label="Administration">
      <Link className="ar-admin-brand" href="/admin"><span className="ar-admin-mark">A<span>✦</span></span>
        <span><b>ARONE BD</b><small>BUSINESS CONSOLE</small></span></Link>
      <div className="ar-sidebar-caption">WORKSPACE</div>
      <nav className="ar-admin-nav" aria-label="Admin sections">
        {links.map(link=><Link key={link.href} href={link.href}>
          <span className="ar-admin-nav-icon" aria-hidden="true">{link.icon}</span>{link.label}</Link>)}
      </nav>
      <div className="ar-admin-side-bottom">
        <Link href="/" className="ar-back-store">↖ View storefront</Link>
        <div className="ar-admin-profile"><span className="ar-avatar">{admin.name?.charAt(0)?.toUpperCase()||'A'}</span>
          <span><b>{admin.name}</b><small>Administrator</small></span></div>
      </div>
    </aside>
    <div className="ar-admin-main"><div className="ar-admin-topbar">
      <div><span className="ar-topbar-dot"/> Store management <span className="ar-topbar-divider">/</span> ARONE BD</div>
      <div className="ar-topbar-right"><span className="ar-live-label">● Business console</span>
        <Link href="/" className="ar-topbar-link">View Store ↗</Link></div>
    </div><div className="ar-admin-content">{children}</div></div>
  </div>;
}
