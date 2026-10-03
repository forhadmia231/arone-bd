import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { ensureNotificationTemplates } from '@/lib/customer-notifications';

export const dynamic = 'force-dynamic';

function text(value, max = 5000) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function GET() {
  if (!(await adminUser())) return Response.json({ error: 'Forbidden' }, { status: 403 });
  await ensureNotificationTemplates(prisma);
  const templates = await prisma.customerNotificationTemplate.findMany({ orderBy: { name: 'asc' } });
  return Response.json({ templates });
}

export async function PUT(request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  if (!(await adminUser())) return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const items = Array.isArray(body?.templates) ? body.templates.slice(0, 30) : [];

    for (const item of items) {
      const key = text(item?.key, 80);
      if (!key) continue;

      await prisma.customerNotificationTemplate.upsert({
        where: { key },
        update: {
          name: text(item?.name, 120) || key,
          channel: ['WHATSAPP', 'SMS'].includes(item?.channel) ? item.channel : 'WHATSAPP',
          message: text(item?.message, 5000),
          active: item?.active !== false,
        },
        create: {
          key,
          name: text(item?.name, 120) || key,
          channel: ['WHATSAPP', 'SMS'].includes(item?.channel) ? item.channel : 'WHATSAPP',
          message: text(item?.message, 5000),
          active: item?.active !== false,
        },
      });
    }

    const templates = await prisma.customerNotificationTemplate.findMany({ orderBy: { name: 'asc' } });
    return Response.json({ ok: true, templates });
  } catch (error) {
    return Response.json({ error: error?.message || 'Could not save templates.' }, { status: 400 });
  }
}
