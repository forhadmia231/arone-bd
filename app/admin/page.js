import { redirect } from 'next/navigation';
import { backofficeUser } from '@/lib/auth';
import AdminDashboard from '@/components/AdminDashboard';

export const metadata = { title: 'Admin Dashboard' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const user = await backofficeUser();

  if (user?.role === 'STAFF') {
    redirect('/admin/products');
  }

  return <AdminDashboard />;
}
