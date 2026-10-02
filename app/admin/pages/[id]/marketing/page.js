import AdminPageMarketing from '@/components/AdminPageMarketing';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Page Marketing' };
export default async function Page({ params }) { const { id } = await params; return <AdminPageMarketing pageId={id} />; }
