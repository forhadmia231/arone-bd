import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { revisionToPageData, savePageRevision } from '@/lib/page-revisions';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const user = await adminUser();
    if (!user) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, revisionId } = await params;

    const [page, revision] = await Promise.all([
      prisma.page.findUnique({ where: { id } }),
      prisma.pageRevision.findUnique({ where: { id: revisionId } }),
    ]);

    if (!page) {
      return Response.json({ error: 'Page not found.' }, { status: 404 });
    }

    if (!revision || revision.pageId !== id) {
      return Response.json({ error: 'Revision not found.' }, { status: 404 });
    }

    const duplicate = await prisma.page.findFirst({
      where: {
        slug: revision.slug,
        NOT: { id },
      },
      select: { id: true },
    });

    if (duplicate) {
      return Response.json(
        { error: 'The old revision URL slug is now used by another page.' },
        { status: 409 }
      );
    }

    await savePageRevision(prisma, page, {
      createdById: user.id,
      note: `Before restoring revision ${revisionId.slice(-6)}`,
    });

    const restored = await prisma.page.update({
      where: { id },
      data: revisionToPageData(revision),
    });

    return Response.json({ ok: true, page: restored });
  } catch (error) {
    console.error('Restore page revision error:', error);
    return Response.json(
      { error: error?.message || 'Could not restore revision.' },
      { status: 500 }
    );
  }
}
