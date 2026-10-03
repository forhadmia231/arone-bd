import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function cleanLabel(value) {
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

function cleanHref(value) {
  const text = typeof value === 'string' ? value.trim().slice(0, 500) : '';
  if (!text) return '/';
  if (text.startsWith('/') && !text.startsWith('//')) return text;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(text)) return text;
  throw new Error('Invalid menu link.');
}

export async function PUT(request, { params }) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }
    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const labelEn = cleanLabel(body?.labelEn);
    const labelBn = cleanLabel(body?.labelBn);
    if (!labelEn && !labelBn) throw new Error('Enter a menu label.');

    const item = await prisma.navigationItem.update({
      where: { id },
      data: {
        labelEn,
        labelBn,
        href: cleanHref(body?.href),
        pageId: typeof body?.pageId === 'string' ? body.pageId.slice(0, 100) : '',
        linkType: body?.linkType === 'PAGE' ? 'PAGE' : 'CUSTOM',
        active: body?.active !== false,
      },
    });

    return Response.json({ item });
  } catch (error) {
    console.error('Navigation item PUT error:', error);
    return Response.json({ error: error?.message || 'Could not update menu item.' }, { status: 400 });
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
    await prisma.navigationItem.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Navigation item DELETE error:', error);
    return Response.json({ error: 'Could not delete menu item.' }, { status: 500 });
  }
}
