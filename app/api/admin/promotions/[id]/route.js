import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';

function text(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function dateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function clean(body) {
  return {
    name: text(body?.name, 120) || 'Promotion',
    type: body?.type === 'POPUP' ? 'POPUP' : 'BANNER',
    title: text(body?.title, 180),
    message: text(body?.message, 700),
    imageUrl: text(body?.imageUrl, 450000),
    buttonText: text(body?.buttonText, 80),
    buttonUrl: text(body?.buttonUrl, 600),
    couponCode: text(body?.couponCode, 60),
    active: Boolean(body?.active),
    dismissible: body?.dismissible !== false,
    showOncePerSession: Boolean(body?.showOncePerSession),
    startAt: dateOrNull(body?.startAt),
    endAt: dateOrNull(body?.endAt),
    backgroundColor: text(body?.backgroundColor, 20) || '#173F29',
    textColor: text(body?.textColor, 20) || '#FFFFFF',
    targetPath: text(body?.targetPath, 300) || '*',
    position: body?.position === 'TOP' ? 'TOP' : 'BOTTOM',
    priority: Number.isFinite(Number(body?.priority)) ? Number(body.priority) : 0,
  };
}

export async function PUT(request, context) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await request.json();

  const campaign = await prisma.promotionCampaign.update({
    where: { id },
    data: clean(body),
  });

  return Response.json({ campaign });
}

export async function DELETE(request, context) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.promotionCampaign.delete({ where: { id } });
  return Response.json({ ok: true });
}
