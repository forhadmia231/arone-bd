import { prisma } from '@/lib/prisma';
import { adminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const STATUSES = ['ALL', 'ACTIVE', 'CONTACTED', 'RECOVERED', 'DISMISSED'];

export async function GET(request) {
  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const rawStatus = (url.searchParams.get('status') || 'ACTIVE').toUpperCase();
  const status = STATUSES.includes(rawStatus) ? rawStatus : 'ACTIVE';
  const q = (url.searchParams.get('q') || '').trim().slice(0, 120);

  const where = {
    ...(status !== 'ALL' ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { utmCampaign: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, grouped] = await Promise.all([
    prisma.abandonedCheckout.findMany({
      where,
      orderBy: { lastSeenAt: 'desc' },
      take: 300,
    }),
    prisma.abandonedCheckout.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);

  const counts = {
    ACTIVE: 0,
    CONTACTED: 0,
    RECOVERED: 0,
    DISMISSED: 0,
  };

  for (const row of grouped) {
    if (row.status in counts) counts[row.status] = row._count._all;
  }

  return Response.json({ items, counts });
}
