import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function text(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function bool(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function dateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function clean(body) {
  const type = body?.type === 'POPUP' ? 'POPUP' : 'BANNER';
  const position = body?.position === 'TOP' ? 'TOP' : 'BOTTOM';

  return {
    name: text(body?.name, 120) || 'Promotion',
    type,
    title: text(body?.title, 180),
    message: text(body?.message, 700),
    imageUrl: text(body?.imageUrl, 450000),
    buttonText: text(body?.buttonText, 80),
    buttonUrl: text(body?.buttonUrl, 600),
    couponCode: text(body?.couponCode, 60),
    active: bool(body?.active, true),
    dismissible: bool(body?.dismissible, true),
    showOncePerSession: bool(body?.showOncePerSession, false),
    startAt: dateOrNull(body?.startAt),
    endAt: dateOrNull(body?.endAt),
    backgroundColor: text(body?.backgroundColor, 20) || '#173F29',
    textColor: text(body?.textColor, 20) || '#FFFFFF',
    targetPath: text(body?.targetPath, 300) || '*',
    position,
    priority: Number.isFinite(Number(body?.priority)) ? Number(body.priority) : 0,
  };
}

export async function GET() {
  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const campaigns = await prisma.promotionCampaign.findMany({
    orderBy: [{ active: 'desc' }, { priority: 'desc' }, { updatedAt: 'desc' }],
  });

  return Response.json({ campaigns });
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const campaign = await prisma.promotionCampaign.create({ data: clean(body) });
  return Response.json({ campaign }, { status: 201 });
}
