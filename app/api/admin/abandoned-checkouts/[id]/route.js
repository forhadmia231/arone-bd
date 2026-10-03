import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';

const ALLOWED = ['ACTIVE', 'CONTACTED', 'RECOVERED', 'DISMISSED'];

export async function PATCH(request, { params }) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = String(body?.status || '').toUpperCase();

  if (!ALLOWED.includes(status)) {
    return Response.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const now = new Date();
  const item = await prisma.abandonedCheckout.update({
    where: { id },
    data: {
      status,
      contactedAt: status === 'CONTACTED' ? now : undefined,
      recoveredAt: status === 'RECOVERED' ? now : undefined,
      dismissedAt: status === 'DISMISSED' ? now : undefined,
    },
  });

  return Response.json({ item });
}

export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.abandonedCheckout.delete({ where: { id } });
  return Response.json({ ok: true });
}
