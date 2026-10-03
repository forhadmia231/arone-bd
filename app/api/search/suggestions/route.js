import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim().slice(0, 80);

  if (q.length < 2) {
    return Response.json({ products: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 7,
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        price: true,
      },
    });

    return Response.json(
      { products },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Search suggestion error:', error);
    return Response.json({ products: [] });
  }
}
