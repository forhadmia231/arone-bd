import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function numberParam(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limit = numberParam(url.searchParams.get('limit'), 6, 1, 24);
    const minRating = numberParam(
      url.searchParams.get('minRating'),
      1,
      1,
      5
    );
    const featuredOnly = url.searchParams.get('featuredOnly') === '1';
    const productId = String(
      url.searchParams.get('productId') || ''
    ).trim();

    const where = {
      status: 'APPROVED',
      rating: { gte: minRating },
      ...(featuredOnly ? { featured: true } : {}),
      ...(productId ? { productId } : {}),
    };

    const [reviews, count, aggregate] = await Promise.all([
      prisma.customerReview.findMany({
        where,
        orderBy: [
          { featured: 'desc' },
          { verified: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
        select: {
          id: true,
          customerName: true,
          rating: true,
          title: true,
          reviewText: true,
          imageUrl: true,
          source: true,
          productId: true,
          productName: true,
          featured: true,
          verified: true,
          createdAt: true,
        },
      }),
      prisma.customerReview.count({ where }),
      prisma.customerReview.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    return Response.json(
      {
        reviews,
        summary: {
          count,
          average: aggregate._avg.rating || 0,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Public reviews GET error:', error);

    return Response.json(
      {
        error: 'Could not load customer reviews.',
        reviews: [],
        summary: { count: 0, average: 0 },
      },
      { status: 500 }
    );
  }
}
