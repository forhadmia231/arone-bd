import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { savePageRevision } from '@/lib/page-revisions';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const page = await prisma.page.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, updatedAt: true },
    });

    if (!page) {
      return Response.json({ error: 'Page not found.' }, { status: 404 });
    }

    const revisions = await prisma.pageRevision.findMany({
      where: { pageId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        slug: true,
        pageType: true,
        status: true,
        note: true,
        createdAt: true,
      },
    });

    return Response.json({ page, revisions });
  } catch (error) {
    console.error('Page revisions GET error:', error);
    return Response.json({ error: 'Could not load page history.' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const user = await adminUser();
    if (!user) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const page = await prisma.page.findUnique({ where: { id } });

    if (!page) {
      return Response.json({ error: 'Page not found.' }, { status: 404 });
    }

    let body = {};
    try {
      body = await request.json();
    } catch {}

    const revision = await savePageRevision(prisma, page, {
      createdById: user.id,
      note: String(body?.note || 'Manual snapshot').trim().slice(0, 160),
    });

    return Response.json({ ok: true, revision });
  } catch (error) {
    console.error('Page revisions POST error:', error);
    return Response.json({ error: 'Could not create snapshot.' }, { status: 500 });
  }
}
