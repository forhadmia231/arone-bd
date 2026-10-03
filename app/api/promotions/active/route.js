import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const now = new Date();
    const path = new URL(request.url).searchParams.get('path') || '/';

    const campaigns = await prisma.promotionCampaign.findMany({
      where: {
        active: true,
        AND: [
          { OR: [{ startAt: null }, { startAt: { lte: now } }] },
          { OR: [{ endAt: null }, { endAt: { gte: now } }] },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' },
      ],
      take: 20,
    });

    const campaign = campaigns.find((item) => {
      const target = (item.targetPath || '*').trim();
      if (!target || target === '*') return true;
      if (target === '/') return path === '/';
      return path === target || path.startsWith(`${target}/`);
    }) || null;

    return Response.json(
      { campaign },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (error) {
    console.error('Public promotion error:', error);
    return Response.json({ campaign: null });
  }
}
