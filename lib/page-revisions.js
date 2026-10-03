export const REVISION_LIMIT = 50;

export function revisionSnapshot(page, { note = '', createdById = '' } = {}) {
  return {
    pageId: page.id,
    title: page.title,
    slug: page.slug,
    pageType: page.pageType,
    status: page.status,
    seoTitle: page.seoTitle || '',
    seoDescription: page.seoDescription || '',
    featuredImage: page.featuredImage || '',
    showHeader: page.showHeader !== false,
    showFooter: page.showFooter !== false,
    fullWidth: page.fullWidth === true,
    content: page.content ?? [],
    publishedAt: page.publishedAt || null,
    note: String(note || '').trim().slice(0, 160),
    createdById: String(createdById || '').slice(0, 120),
  };
}

export async function savePageRevision(prisma, page, options = {}) {
  const revision = await prisma.pageRevision.create({
    data: revisionSnapshot(page, options),
  });

  const stale = await prisma.pageRevision.findMany({
    where: { pageId: page.id },
    orderBy: { createdAt: 'desc' },
    skip: REVISION_LIMIT,
    select: { id: true },
  });

  if (stale.length) {
    await prisma.pageRevision.deleteMany({
      where: { id: { in: stale.map((item) => item.id) } },
    });
  }

  return revision;
}

export function revisionToPageData(revision) {
  return {
    title: revision.title,
    slug: revision.slug,
    pageType: revision.pageType,
    status: revision.status,
    seoTitle: revision.seoTitle || '',
    seoDescription: revision.seoDescription || '',
    featuredImage: revision.featuredImage || '',
    showHeader: revision.showHeader !== false,
    showFooter: revision.showFooter !== false,
    fullWidth: revision.fullWidth === true,
    content: revision.content ?? [],
    publishedAt:
      revision.status === 'PUBLISHED'
        ? revision.publishedAt || new Date()
        : null,
  };
}
