import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function text(value, max = 1000) {
  return typeof value === 'string'
    ? value.trim().slice(0, max)
    : '';
}

function rating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function status(value) {
  const normalized = text(value, 20).toUpperCase();
  return ['PENDING', 'APPROVED', 'REJECTED'].includes(normalized)
    ? normalized
    : 'PENDING';
}

function imageUrl(value) {
  const valueText = text(value, 450000);
  if (!valueText) return '';

  if (
    /^data:image\/(?:png|jpeg|webp);base64,/i.test(valueText) &&
    valueText.length <= 450000
  ) {
    return valueText;
  }

  if (/^\/(?!\/)/.test(valueText)) return valueText;

  try {
    const url = new URL(valueText);
    if (url.protocol === 'https:') return valueText;
  } catch {}

  return '';
}

export async function PUT(request, { params }) {
  if (!sameOrigin(request)) {
    return Response.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }

  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const customerName = text(body?.customerName, 120);
    const reviewText = text(body?.reviewText, 3000);

    if (!customerName || reviewText.length < 3) {
      return Response.json(
        { error: 'Customer name and review text are required.' },
        { status: 400 }
      );
    }

    const review = await prisma.customerReview.update({
      where: { id },
      data: {
        customerName,
        rating: rating(body?.rating),
        title: text(body?.title, 180),
        reviewText,
        imageUrl: imageUrl(body?.imageUrl),
        source: text(body?.source, 80) || 'Website',
        productId: text(body?.productId, 100),
        productName: text(body?.productName, 180),
        status: status(body?.status),
        featured: body?.featured === true,
        verified: body?.verified === true,
      },
    });

    return Response.json({ review });
  } catch (error) {
    console.error('Admin reviews PUT error:', error);
    return Response.json(
      { error: error?.message || 'Could not update review.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) {
    return Response.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }

  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;

    await prisma.customerReview.delete({
      where: { id },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Admin reviews DELETE error:', error);
    return Response.json(
      { error: error?.message || 'Could not delete review.' },
      { status: 500 }
    );
  }
}
