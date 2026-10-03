import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    const type = body?.type;

    if (!id || !['view', 'click'].includes(type)) {
      return Response.json({ ok: false }, { status: 400 });
    }

    await prisma.promotionCampaign.update({
      where: { id },
      data: type === 'click'
        ? { clickCount: { increment: 1 } }
        : { viewCount: { increment: 1 } },
    });

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false });
  }
}
