import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import PageRenderer from '@/components/PageRenderer';
import { marketingMetadata, pageIsLiveNow } from '@/lib/page-marketing';

export const dynamic = 'force-dynamic';

const PAGE_TYPE = 'LANDING';

async function load(slug) {
  const page = await prisma.page.findFirst({ where: { slug, pageType: PAGE_TYPE } });
  if (!page) return { page: null, settings: null };
  const settings = await prisma.pageMarketingSettings.findUnique({ where: { pageId: page.id } });
  return { page, settings };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { page, settings } = await load(slug);
  if (!page || !pageIsLiveNow(page, settings)) return {};
  return marketingMetadata(page, settings);
}

export default async function Page({ params }) {
  const { slug } = await params;
  const { page, settings } = await load(slug);
  if (!page || !pageIsLiveNow(page, settings)) notFound();
  return <PageRenderer page={page} />;
}
