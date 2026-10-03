import { prisma } from '@/lib/prisma';
import { evaluateCoupon, findBestAutoCoupon } from '@/lib/coupons';

export const dynamic = 'force-dynamic';

function text(value, max = 120) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const rawItems = Array.isArray(body?.items) ? body.items.slice(0, 30) : [];
    const quantities = new Map();

    for (const item of rawItems) {
      const id = text(item?.productId || item?.id, 120);
      const quantity = Math.max(0, Math.min(50, Number(item?.quantity || item?.qty || 0)));
      if (id && quantity) quantities.set(id, quantity);
    }

    const ids = [...quantities.keys()];
    if (!ids.length) {
      return Response.json({ valid: false, error: 'কুপন ব্যবহারের আগে পণ্য নির্বাচন করুন।' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: ids }, active: true },
      select: { id: true, price: true, categoryId: true },
    });

    if (products.length !== ids.length) {
      return Response.json({ valid: false, error: 'এক বা একাধিক পণ্য পাওয়া যাচ্ছে না।' }, { status: 409 });
    }

    const args = {
      db: prisma,
      products,
      quantities,
      phone: text(body?.phone, 30),
      pageId: text(body?.pageId, 120),
      context: body?.pageId ? 'landing' : 'checkout',
    };

    const code = text(body?.code, 40);
    const result = code
      ? await evaluateCoupon({ ...args, code })
      : await findBestAutoCoupon(args);

    if (!result) return Response.json({ valid: false, auto: true });

    return Response.json({
      valid: true,
      auto: !code,
      coupon: {
        code: result.coupon.code,
        name: result.coupon.name,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
      },
      discountAmount: result.discountAmount,
      subtotal: result.subtotal,
      finalSubtotal: result.finalSubtotal,
    });
  } catch (error) {
    return Response.json(
      { valid: false, error: error?.message || 'কুপন যাচাই করা যায়নি।' },
      { status: 400 }
    );
  }
}
