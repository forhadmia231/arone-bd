import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function uniqueSlug(base) {
  const cleaned = String(base || 'page-copy')
    .replace(/-copy(?:-\d+)?$/i, '')
    .slice(0, 105);

  for (let number = 1; number <= 100; number += 1) {
    const suffix = number === 1 ? '-copy' : `-copy-${number}`;
    const slug = `${cleaned}${suffix}`.slice(0, 120);
    const exists = await prisma.page.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!exists) return slug;
  }

  return `${cleaned}-copy-${Date.now()}`.slice(0, 120);
}

export async function POST(request, { params }) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const current = await prisma.page.findUnique({ where: { id } });

    if (!current) {
      return Response.json({ error: 'Page not found.' }, { status: 404 });
    }

    const slug = await uniqueSlug(current.slug);

    const page = await prisma.page.create({
      data: {
        title: `${current.title} Copy`.slice(0, 180),
        slug,
        pageType: current.pageType,
        status: 'DRAFT',
        seoTitle: current.seoTitle,
        seoDescription: current.seoDescription,
        featuredImage: current.featuredImage,
        showHeader: current.showHeader,
        showFooter: current.showFooter,
        fullWidth: current.fullWidth,
        content: current.content,
        publishedAt: null,
      },
    });

    return Response.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Duplicate page error:', error);
    return Response.json(
      { error: error?.message || 'Could not duplicate page.' },
      { status: 500 }
    );
  }
}
