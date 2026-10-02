import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { normalizePageInput } from '@/lib/page-builder';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        pageType: true,
        status: true,
        showHeader: true,
        showFooter: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return Response.json({ pages });
  } catch (error) {
    console.error('Admin pages GET error:', error);
    return Response.json({ error: 'Could not load pages.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const data = normalizePageInput(body);

    const duplicate = await prisma.page.findUnique({ where: { slug: data.slug } });
    if (duplicate) {
      return Response.json({ error: 'This page URL slug is already in use.' }, { status: 409 });
    }

    const page = await prisma.page.create({
      data: {
        ...data,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      },
    });

    return Response.json({ page }, { status: 201 });
  } catch (error) {
    console.error('Admin pages POST error:', error);
    return Response.json({ error: error?.message || 'Could not create page.' }, { status: 400 });
  }
}
