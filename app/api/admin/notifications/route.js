import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import {
  ensureNotificationTemplates,
  notificationLinks,
  normalizePhone,
} from '@/lib/customer-notifications';

export const dynamic = 'force-dynamic';

function text(value, max = 2000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function GET(request) {
  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureNotificationTemplates(prisma);
    const url = new URL(request.url);
    const threshold = Math.max(0, Math.min(1000, Number(url.searchParams.get('threshold') || 5)));

    const [templates, logs, lowStock, queued, sent, failed] = await Promise.all([
      prisma.customerNotificationTemplate.findMany({ orderBy: { name: 'asc' } }),
      prisma.customerNotification.findMany({ orderBy: { createdAt: 'desc' }, take: 80 }),
      prisma.product.findMany({
        where: { active: true, stock: { lte: threshold } },
        select: { id: true, name: true, stock: true, price: true, imageUrl: true },
        orderBy: [{ stock: 'asc' }, { name: 'asc' }],
        take: 100,
      }),
      prisma.customerNotification.count({ where: { status: 'QUEUED' } }),
      prisma.customerNotification.count({ where: { status: 'SENT' } }),
      prisma.customerNotification.count({ where: { status: 'FAILED' } }),
    ]);

    const enrichedLogs = logs.map((item) => ({
      ...item,
      ...notificationLinks(item.recipient, item.message),
    }));

    return Response.json({
      templates,
      logs: enrichedLogs,
      lowStock,
      stats: { queued, sent, failed, lowStock: lowStock.length },
      threshold,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return Response.json({ error: error?.message || 'Could not load notifications.' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  }
  if (!(await adminUser())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const recipient = text(body?.recipient, 40);
    const customerName = text(body?.customerName, 120);
    const message = text(body?.message, 4000);
    const channel = ['WHATSAPP', 'SMS'].includes(body?.channel) ? body.channel : 'WHATSAPP';

    if (!recipient || !normalizePhone(recipient)) {
      return Response.json({ error: 'Valid customer phone is required.' }, { status: 400 });
    }
    if (!message) {
      return Response.json({ error: 'Message is required.' }, { status: 400 });
    }

    const log = await prisma.customerNotification.create({
      data: {
        recipient,
        customerName,
        channel,
        templateKey: 'MANUAL',
        eventKey: 'MANUAL',
        message,
        status: 'QUEUED',
      },
    });

    return Response.json({
      log,
      ...notificationLinks(recipient, message),
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error?.message || 'Could not queue notification.' }, { status: 400 });
  }
}
