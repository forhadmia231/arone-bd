import { prisma } from '@/lib/prisma';
import { sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const TYPES = ['VIEW', 'CTA_CLICK'];
function text(value, max) { return String(value || '').trim().slice(0, max); }

export async function POST(request) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    const body = await request.json();
    const pageId = text(body?.pageId, 100);
    const eventType = TYPES.includes(body?.eventType) ? body.eventType : '';

    if (!pageId || !eventType) {
      return Response.json({ error: 'Invalid analytics event.' }, { status: 400 });
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, slug: true },
    });
    if (!page) return Response.json({ ok: true });

    const settings = await prisma.pageMarketingSettings.findUnique({ where: { pageId } });
    if (settings?.analyticsEnabled === false) return Response.json({ ok: true });

    await prisma.pageEvent.create({
      data: {
        pageId,
        pageSlug: text(body?.pageSlug || page.slug, 140),
        eventType,
        label: text(body?.label, 180),
        href: text(body?.href, 700),
        source: text(body?.source, 160) || 'direct',
        medium: text(body?.medium, 160),
        campaign: text(body?.campaign, 200),
        content: text(body?.content, 200),
        term: text(body?.term, 200),
        referrer: text(body?.referrer, 700),
        path: text(body?.path, 700),
      },
    });

    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error('Page event POST:', error);
    return Response.json({ ok: true });
  }
}
