import { prisma } from '@/lib/prisma';
import {
  adminUser,
  productPermissionUser,
  sameOrigin,
} from '@/lib/auth';
import {
  json,
  readJson,
  errorMessage,
} from '@/lib/http';
import { string, slugify } from '@/lib/validate';

export async function GET() {
  if (!await productPermissionUser('canViewProducts')) {
    return json({ error: 'Forbidden' }, 403);
  }

  return json({
    categories: await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  });
}

export async function POST(request) {
  if (!sameOrigin(request) || !await adminUser()) {
    return json({ error: 'Forbidden' }, 403);
  }

  const body = await readJson(request);
  const name = string(body?.name, 150);
  const slug = slugify(body?.slug || name);
  const description = string(body?.description, 500);

  if (name.length < 2 || !slug) {
    return json(
      { error: 'Category name and slug required' },
      400
    );
  }

  try {
    return json(
      {
        category: await prisma.category.create({
          data: {
            name,
            slug,
            description,
          },
        }),
      },
      201
    );
  } catch (error) {
    return json({ error: errorMessage(error) }, 400);
  }
}
