import AdminPageBuilder from '@/components/AdminPageBuilder';

export const metadata = { title: 'Edit Page | Arone Bd Admin' };
export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  const { id } = await params;
  return <AdminPageBuilder pageId={id} />;
}
