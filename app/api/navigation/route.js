import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const allowedLocations = new Set(['HEADER', 'FOOTER']);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requested = (searchParams.get('location') || 'HEADER').toUpperCase();
    const location = allowedLocations.has(requested) ? requested : 'HEADER';

    const items = await prisma.navigationItem.findMany({
      where: { location, active: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        labelEn: true,
        labelBn: true,
        href: true,
        linkType: true,
      },
    });

    return Response.json(
      { items },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Public navigation GET error:', error);
    return Response.json(
      { items: [] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}
