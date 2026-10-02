import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PageRenderer from '@/components/PageRenderer';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, pageType: 'LANDING', status: 'PUBLISHED' } });
  if (!page) return {};
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    openGraph: page.featuredImage ? { images: [page.featuredImage] } : undefined,
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, pageType: 'LANDING', status: 'PUBLISHED' } });
  if (!page) notFound();
  return <PageRenderer page={page} />;
}
