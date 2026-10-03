import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { normalizePageInput } from '@/lib/page-builder';
import { savePageRevision } from '@/lib/page-revisions';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const page = await prisma.page.findUnique({ where: { id } });
    if (!page) return Response.json({ error: 'Page not found.' }, { status: 404 });

    return Response.json({ page });
  } catch (error) {
    console.error('Admin page GET error:', error);
    return Response.json({ error: 'Could not load page.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const user = await adminUser();
    if (!user) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const current = await prisma.page.findUnique({ where: { id } });
    if (!current) return Response.json({ error: 'Page not found.' }, { status: 404 });

    const body = await request.json();
    const data = normalizePageInput(body);

    const duplicate = await prisma.page.findFirst({
      where: { slug: data.slug, NOT: { id } },
      select: { id: true },
    });

    if (duplicate) {
      return Response.json(
        { error: 'This page URL slug is already in use.' },
        { status: 409 }
      );
    }

    await savePageRevision(prisma, current, {
      createdById: user.id,
      note: data.status === 'PUBLISHED' ? 'Before publish/update' : 'Before draft save',
    });

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...data,
        publishedAt:
          data.status === 'PUBLISHED'
            ? current.publishedAt || new Date()
            : null,
      },
    });

    return Response.json({ page });
  } catch (error) {
    console.error('Admin page PUT error:', error);
    return Response.json(
      { error: error?.message || 'Could not update page.' },
      { status: 400 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.pageRevision.deleteMany({ where: { pageId: id } });
    await prisma.page.delete({ where: { id } });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Admin page DELETE error:', error);
    return Response.json({ error: 'Could not delete page.' }, { status: 500 });
  }
}
