import { prisma } from '@/lib/prisma';
import { productPermissionUser, sameOrigin } from '@/lib/auth';
import { json, readJson, errorMessage } from '@/lib/http';
import { parseProduct } from '@/lib/admin-product';

export async function GET() {
  if (!await productPermissionUser('canViewProducts')) {
    return json({ error: 'Forbidden' }, 403);
  }

  const products = await prisma.product.findMany({
    include: {
      category: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  return json({ products });
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return json({ error: 'Invalid request origin' }, 403);
  }

  if (!await productPermissionUser('canCreateProducts')) {
    return json({ error: 'You do not have permission to add products.' }, 403);
  }

  const parsed = parseProduct(await readJson(request));

  if (parsed.error) {
    return json({ error: parsed.error }, 400);
  }

  try {
    const product = await prisma.product.create({
      data: parsed.data,
    });

    return json({ product }, 201);
  } catch (error) {
    return json({ error: errorMessage(error) }, 400);
  }
}
