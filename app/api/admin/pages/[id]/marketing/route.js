import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { MARKETING_DEFAULTS, normalizeMarketingInput } from '@/lib/page-marketing';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    if (!(await adminUser())) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const page = await prisma.page.findUnique({ where: { id }, select: { id: true, title: true, slug: true, pageType: true, status: true } });
    if (!page) return Response.json({ error: 'Page not found.' }, { status: 404 });
    const settings = await prisma.pageMarketingSettings.findUnique({ where: { pageId: id } });
    return Response.json({ page, settings: { ...MARKETING_DEFAULTS, ...(settings || {}) } });
  } catch (error) {
    console.error('Page marketing GET:', error);
    return Response.json({ error: 'Could not load marketing settings.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    if (!(await adminUser())) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;
    const page = await prisma.page.findUnique({ where: { id }, select: { id: true } });
    if (!page) return Response.json({ error: 'Page not found.' }, { status: 404 });
    const body = await request.json();
    const data = normalizeMarketingInput(body);
    const settings = await prisma.pageMarketingSettings.upsert({
      where: { pageId: id },
      update: data,
      create: { pageId: id, ...data },
    });
    return Response.json({ settings });
  } catch (error) {
    console.error('Page marketing PUT:', error);
    return Response.json({ error: error?.message || 'Could not save marketing settings.' }, { status: 400 });
  }
}
