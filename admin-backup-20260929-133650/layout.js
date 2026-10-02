import Link from 'next/link';
import {adminUser} from '@/lib/auth';
export const dynamic='force-dynamic';
export default async function AdminLayout({children}){
 const admin=await adminUser();
 if(!admin)return <main className="container section empty"><h1>Admin access required</h1><p>Please sign in using an administrator account.</p><Link className="btn btn-primary" href="/staff-login">Admin Sign In</Link></main>;
 return <main className="container section admin-layout"><aside className="admin-sidebar"><h2>⚙ Arone Bd Manager</h2><p>{admin.name}</p><Link href="/admin">◫ Dashboard</Link><Link href="/admin/products">▦ Products</Link><Link href="/admin/orders">▤ Orders</Link><Link href="/admin/categories">▧ Categories</Link><Link href="/admin/ads-tracking">◉ Ads Tracking</Link><Link href="/">↖ View Store</Link></aside><div className="admin-body">{children}</div></main>;
}
