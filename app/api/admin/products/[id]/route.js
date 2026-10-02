import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { productPermissionUser, sameOrigin } from '@/lib/auth';
import { json, readJson, errorMessage } from '@/lib/http';
import { parseProduct } from '@/lib/admin-product';

export async function PATCH(request, { params }) {
  if (!sameOrigin(request)) {
    return json({ error: 'Invalid request origin' }, 403);
  }

  const staff = await productPermissionUser('canEditProducts');

  if (!staff) {
    return json(
      { error: 'You do not have permission to edit products.' },
      403
    );
  }

  const { id } = await params;
  const body = await readJson(request);
  const parsed = parseProduct(body);

  if (parsed.error) {
    return json({ error: parsed.error }, 400);
  }

  try {
    const product = await prisma.$transaction(
      async (tx) => {
        const previous = await tx.product.findUnique({
          where: { id },
          select: { stock: true },
        });

        if (!previous) {
          throw new Error('Product not found');
        }

        if (
          !Number.isSafeInteger(body?.expectedStock) ||
          previous.stock !== body.expectedStock
        ) {
          throw new Error('Stock changed; reload before saving.');
        }

        const updated = await tx.product.updateMany({
          where: {
            id,
            stock: previous.stock,
          },
          data: parsed.data,
        });

        if (updated.count !== 1) {
          throw new Error('Stock changed; reload before saving.');
        }

        if (previous.stock !== parsed.data.stock) {
          await tx.stockAdjustment.create({
            data: {
              productId: id,
              adminId: staff.id,
              beforeStock: previous.stock,
              afterStock: parsed.data.stock,
              delta: parsed.data.stock - previous.stock,
              reason: 'Updated from product editor',
            },
          });
        }

        return tx.product.findUnique({
          where: { id },
        });
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    );

    return json({ product });
  } catch (error) {
    if (
      error.code === 'P2034' ||
      error.message === 'Stock changed; reload before saving.'
    ) {
      return json(
        { error: 'Stock changed; reload before saving.' },
        409
      );
    }

    if (error.message === 'Product not found') {
      return json({ error: error.message }, 404);
    }

    return json({ error: errorMessage(error) }, 400);
  }
}

export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) {
    return json({ error: 'Invalid request origin' }, 403);
  }

  if (!await productPermissionUser('canDeleteProducts')) {
    return json(
      { error: 'You do not have permission to archive products.' },
      403
    );
  }

  const { id } = await params;

  try {
    await prisma.product.update({
      where: { id },
      data: { active: false },
    });

    return json({ ok: true });
  } catch {
    return json({ error: 'Product not found' }, 404);
  }
}
