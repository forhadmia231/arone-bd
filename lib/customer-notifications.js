const DEFAULT_TEMPLATES = [
  {
    key: 'ORDER_PENDING',
    name: 'Order Received',
    channel: 'WHATSAPP',
    message: 'প্রিয় {{customerName}}, আপনার {{storeName}} অর্ডার {{orderNo}} গ্রহণ করা হয়েছে। মোট: ৳{{total}}। আমরা শীঘ্রই অর্ডারটি নিশ্চিত করব।',
  },
  {
    key: 'ORDER_CONFIRMED',
    name: 'Order Confirmed',
    channel: 'WHATSAPP',
    message: 'প্রিয় {{customerName}}, আপনার অর্ডার {{orderNo}} নিশ্চিত হয়েছে। মোট: ৳{{total}}। {{storeName}}-এর সাথে থাকার জন্য ধন্যবাদ।',
  },
  {
    key: 'ORDER_SHIPPED',
    name: 'Order Shipped',
    channel: 'WHATSAPP',
    message: 'প্রিয় {{customerName}}, আপনার অর্ডার {{orderNo}} কুরিয়ারে পাঠানো হয়েছে। Courier: {{courierName}} {{consignmentId}} {{trackingUrl}}',
  },
  {
    key: 'ORDER_DELIVERED',
    name: 'Order Delivered',
    channel: 'WHATSAPP',
    message: 'প্রিয় {{customerName}}, আপনার অর্ডার {{orderNo}} delivered হয়েছে। {{storeName}} থেকে কেনাকাটার জন্য ধন্যবাদ।',
  },
  {
    key: 'ORDER_CANCELLED',
    name: 'Order Cancelled',
    channel: 'WHATSAPP',
    message: 'প্রিয় {{customerName}}, আপনার অর্ডার {{orderNo}} cancelled হয়েছে। প্রয়োজন হলে আমাদের সাথে যোগাযোগ করুন।',
  },
];

export async function ensureNotificationTemplates(db) {
  const count = await db.customerNotificationTemplate.count();
  if (count > 0) return;

  await db.customerNotificationTemplate.createMany({
    data: DEFAULT_TEMPLATES,
    skipDuplicates: true,
  });
}

export function renderNotificationTemplate(message, data = {}) {
  return String(message || '').replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = data[key];
    return value == null ? '' : String(value);
  }).replace(/\s{2,}/g, ' ').trim();
}

export function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return digits;
  if (digits.startsWith('01')) return `88${digits}`;
  if (digits.startsWith('1') && digits.length === 10) return `880${digits}`;
  return digits;
}

export function notificationLinks(phone, message) {
  const normalized = normalizePhone(phone);
  const encoded = encodeURIComponent(message || '');
  return {
    whatsappUrl: normalized ? `https://wa.me/${normalized}?text=${encoded}` : '',
    smsUrl: normalized ? `sms:+${normalized}?body=${encoded}` : '',
  };
}

export async function queueOrderNotification(db, {
  order,
  eventKey,
  channel,
  storeName = 'ARONE BD',
}) {
  await ensureNotificationTemplates(db);

  const template = await db.customerNotificationTemplate.findUnique({
    where: { key: eventKey },
  });

  if (!template || !template.active) {
    throw new Error('Notification template is unavailable or inactive.');
  }

  const shipment = order?.shipment || null;
  const message = renderNotificationTemplate(template.message, {
    storeName,
    customerName: order?.customerName || 'Customer',
    orderNo: order?.orderNo || '',
    total: Number(order?.total || 0).toLocaleString('en-US'),
    status: order?.status || '',
    courierName: shipment?.courierName || '',
    consignmentId: shipment?.consignmentId || '',
    trackingUrl: shipment?.trackingUrl || '',
  });

  const finalChannel = channel || template.channel || 'WHATSAPP';

  const log = await db.customerNotification.create({
    data: {
      orderId: order?.id || null,
      orderNo: order?.orderNo || '',
      recipient: order?.phone || '',
      customerName: order?.customerName || '',
      channel: finalChannel,
      templateKey: template.key,
      eventKey,
      message,
      status: 'QUEUED',
    },
  });

  return {
    log,
    ...notificationLinks(order?.phone, message),
  };
}
