import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }
    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean).slice(0, 100) : [];
    if (!ids.length) return Response.json({ error: 'No menu items supplied.' }, { status: 400 });

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.navigationItem.update({ where: { id }, data: { sortOrder: index } })
      )
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Navigation reorder error:', error);
    return Response.json({ error: 'Could not save menu order.' }, { status: 500 });
  }
}
