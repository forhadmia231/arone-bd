import AdminPageHistory from '@/components/AdminPageHistory';

export const metadata = { title: 'Page Version History' };
export const dynamic = 'force-dynamic';

export default async function PageHistoryPage({ params }) {
  const { id } = await params;
  return <AdminPageHistory pageId={id} />;
}
