import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function text(value, max = 250) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function phone(value) {
  return text(value, 40).replace(/[^0-9+\- ()]/g, '');
}

function session(value) {
  const clean = text(value, 120);
  return /^[A-Za-z0-9_-]{8,120}$/.test(clean) ? clean : '';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const sessionKey = session(body?.sessionKey);

    if (!sessionKey) {
      return Response.json({ error: 'Invalid session.' }, { status: 400 });
    }

    if (body?.recovered === true) {
      await prisma.abandonedCheckout.updateMany({
        where: { sessionKey },
        data: {
          status: 'RECOVERED',
          recoveredAt: new Date(),
        },
      });

      return Response.json({ ok: true });
    }

    const customerPhone = phone(body?.phone);
    const digits = customerPhone.replace(/\D/g, '');

    if (digits.length < 8) {
      return Response.json({ ok: true, ignored: true }, { status: 202 });
    }

    const data = {
      name: text(body?.name, 120),
      phone: customerPhone,
      email: text(body?.email, 180),
      address: text(body?.address, 500),
      city: text(body?.city, 120),
      area: text(body?.area, 120),
      note: text(body?.note, 500),
      source: text(body?.source, 80),
      utmSource: text(body?.utmSource, 120),
      utmMedium: text(body?.utmMedium, 120),
      utmCampaign: text(body?.utmCampaign, 160),
      pageUrl: text(body?.pageUrl, 500),
      payload:
        body?.payload && typeof body.payload === 'object'
          ? body.payload
          : undefined,
    };

    const record = await prisma.abandonedCheckout.upsert({
      where: { sessionKey },
      update: {
        ...data,
        status: 'ACTIVE',
        recoveredAt: null,
        dismissedAt: null,
      },
      create: {
        sessionKey,
        ...data,
      },
      select: { id: true, status: true },
    });

    return Response.json({ ok: true, record });
  } catch (error) {
    console.error('Abandoned checkout capture error:', error);
    return Response.json(
      { error: 'Could not save checkout progress.' },
      { status: 500 }
    );
  }
}
