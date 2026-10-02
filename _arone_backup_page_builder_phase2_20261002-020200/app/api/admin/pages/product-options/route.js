import { prisma } from '@/lib/prisma';
import { adminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: 150,
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
      },
    });

    return Response.json({ products });
  } catch (error) {
    console.error('Page product options error:', error);
    return Response.json({ error: 'Could not load products.' }, { status: 500 });
  }
}
