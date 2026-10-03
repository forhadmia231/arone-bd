import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';

export async function PUT(request, { params }) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  if (!(await adminUser())) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const status = ['QUEUED', 'SENT', 'FAILED'].includes(body?.status) ? body.status : null;
  if (!status) return Response.json({ error: 'Invalid status.' }, { status: 400 });

  const item = await prisma.customerNotification.update({
    where: { id },
    data: {
      status,
      sentAt: status === 'SENT' ? new Date() : null,
      error: status === 'FAILED' ? String(body?.error || '').slice(0, 1000) : '',
    },
  });

  return Response.json({ item });
}

export async function DELETE(request, { params }) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  if (!(await adminUser())) return Response.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  await prisma.customerNotification.delete({ where: { id } });
  return Response.json({ ok: true });
}
