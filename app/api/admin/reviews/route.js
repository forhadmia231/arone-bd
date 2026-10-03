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

export async function GET(request) {
  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const q = text(url.searchParams.get('q'), 120);
    const selectedStatus = status(
      url.searchParams.get('status') || 'PENDING'
    );
    const allStatus = url.searchParams.get('status') === 'ALL';

    const where = {
      ...(allStatus ? {} : { status: selectedStatus }),
      ...(q
        ? {
            OR: [
              { customerName: { contains: q, mode: 'insensitive' } },
              { title: { contains: q, mode: 'insensitive' } },
              { reviewText: { contains: q, mode: 'insensitive' } },
              { productName: { contains: q, mode: 'insensitive' } },
              { source: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [reviews, total, pending, approved, featured, aggregate] =
      await Promise.all([
        prisma.customerReview.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }],
          take: 200,
        }),
        prisma.customerReview.count(),
        prisma.customerReview.count({ where: { status: 'PENDING' } }),
        prisma.customerReview.count({ where: { status: 'APPROVED' } }),
        prisma.customerReview.count({
          where: { status: 'APPROVED', featured: true },
        }),
        prisma.customerReview.aggregate({
          where: { status: 'APPROVED' },
          _avg: { rating: true },
        }),
      ]);

    return Response.json({
      reviews,
      stats: {
        total,
        pending,
        approved,
        featured,
        averageRating: aggregate._avg.rating || 0,
      },
    });
  } catch (error) {
    console.error('Admin reviews GET error:', error);
    return Response.json(
      { error: error?.message || 'Could not load reviews.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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
    const body = await request.json();
    const customerName = text(body?.customerName, 120);
    const reviewText = text(body?.reviewText, 3000);

    if (!customerName || reviewText.length < 3) {
      return Response.json(
        { error: 'Customer name and review text are required.' },
        { status: 400 }
      );
    }

    const review = await prisma.customerReview.create({
      data: {
        customerName,
        rating: rating(body?.rating),
        title: text(body?.title, 180),
        reviewText,
        imageUrl: imageUrl(body?.imageUrl),
        source: text(body?.source, 80) || 'Admin',
        productId: text(body?.productId, 100),
        productName: text(body?.productName, 180),
        status: status(body?.status || 'APPROVED'),
        featured: body?.featured === true,
        verified: body?.verified === true,
      },
    });

    return Response.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Admin reviews POST error:', error);
    return Response.json(
      { error: error?.message || 'Could not create review.' },
      { status: 500 }
    );
  }
}
