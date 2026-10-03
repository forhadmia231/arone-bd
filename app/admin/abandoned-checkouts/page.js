import AdminAbandonedCheckouts from '@/components/AdminAbandonedCheckouts';

export const metadata = { title: 'Abandoned Checkouts' };
export const dynamic = 'force-dynamic';

export default function Page() {
  return <AdminAbandonedCheckouts />;
}
