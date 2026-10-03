import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { queueOrderNotification } from '@/lib/customer-notifications';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Invalid request origin' }, { status: 403 });
  if (!(await adminUser())) return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const orderNo = String(body?.orderNo || '').trim().slice(0, 120);
    const eventKey = String(body?.eventKey || '').trim().slice(0, 80);
    const channel = ['WHATSAPP', 'SMS'].includes(body?.channel) ? body.channel : undefined;

    if (!orderNo || !eventKey) {
      return Response.json({ error: 'Order number and event are required.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { orderNo },
      select: {
        id: true,
        orderNo: true,
        customerName: true,
        phone: true,
        total: true,
        status: true,
        shipment: {
          select: {
            courierName: true,
            consignmentId: true,
            trackingUrl: true,
            status: true,
          },
        },
      },
    });

    if (!order) return Response.json({ error: 'Order not found.' }, { status: 404 });

    const result = await queueOrderNotification(prisma, {
      order,
      eventKey,
      channel,
      storeName: 'ARONE BD',
    });

    return Response.json(result, { status: 201 });
  } catch (error) {
    return Response.json({ error: error?.message || 'Could not prepare notification.' }, { status: 400 });
  }
}
