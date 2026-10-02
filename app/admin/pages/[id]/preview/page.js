import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { adminUser } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const dynamic = 'force-dynamic';

export default async function Page({ params }) {
  if (!(await adminUser())) return <div style={{ padding: 30 }}>Forbidden</div>;
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();
  return <PageRenderer page={page} preview />;
}
