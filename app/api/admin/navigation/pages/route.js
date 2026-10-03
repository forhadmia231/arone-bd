import { prisma } from '@/lib/prisma';
import { adminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pages = await prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ pageType: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        slug: true,
        pageType: true,
      },
    });

    return Response.json({
      pages: pages.map((page) => ({
        ...page,
        href:
          page.pageType === 'LANDING'
            ? `/landing/${page.slug}`
            : `/page/${page.slug}`,
      })),
    });
  } catch (error) {
    console.error('Navigation page options error:', error);
    return Response.json({ error: 'Could not load published pages.' }, { status: 500 });
  }
}
