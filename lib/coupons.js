export function normalizeCouponCode(value) {
  return typeof value === 'string'
    ? value.trim().toUpperCase().replace(/\s+/g, '')
    : '';
}

function array(value) {
  return Array.isArray(value) ? value.map(String) : [];
}

function qtyFor(quantities, id) {
  if (quantities instanceof Map) return Number(quantities.get(id) || 0);
  return Number(quantities?.[id] || 0);
}

export async function evaluateCouponRecord({
  db,
  coupon,
  products,
  quantities,
  phone = '',
  pageId = '',
  context = 'checkout',
}) {
  if (!coupon || !coupon.active) throw new Error('এই কুপনটি সক্রিয় নয়।');

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    throw new Error('এই কুপনটি এখনো শুরু হয়নি।');
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    throw new Error('এই কুপনের মেয়াদ শেষ হয়ে গেছে।');
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    throw new Error('এই কুপনের ব্যবহারসীমা শেষ হয়েছে।');
  }

  const allowedPages = array(coupon.pageIds);
  if (coupon.landingPageOnly && context !== 'landing') {
    throw new Error('এই কুপনটি শুধু Landing Page-এ ব্যবহার করা যাবে।');
  }
  if (allowedPages.length && (!pageId || !allowedPages.includes(String(pageId)))) {
    throw new Error('এই কুপনটি এই পেজে প্রযোজ্য নয়।');
  }

  const cleanPhone = String(phone || '').replace(/\D/g, '');
  if (cleanPhone && coupon.perCustomerLimit > 0) {
    const usedByPhone = await db.couponUsage.count({
      where: { couponId: coupon.id, phone: cleanPhone },
    });
    if (usedByPhone >= coupon.perCustomerLimit) {
      throw new Error('এই মোবাইল নম্বরে কুপনের ব্যবহারসীমা পূর্ণ হয়েছে।');
    }
  }

  const selectedProductIds = new Set(array(coupon.productIds));
  const selectedCategoryIds = new Set(array(coupon.categoryIds));

  let subtotal = 0;
  let eligibleSubtotal = 0;

  for (const product of products || []) {
    const quantity = Math.max(0, qtyFor(quantities, product.id));
    if (!quantity) continue;

    const line = Number(product.price || 0) * quantity;
    subtotal += line;

    let eligible = coupon.scope === 'ALL_PRODUCTS';
    if (coupon.scope === 'SELECTED_PRODUCTS') {
      eligible = selectedProductIds.has(String(product.id));
    }
    if (coupon.scope === 'SELECTED_CATEGORIES') {
      eligible = selectedCategoryIds.has(String(product.categoryId || ''));
    }
    if (eligible) eligibleSubtotal += line;
  }

  if (subtotal < Number(coupon.minOrderAmount || 0)) {
    throw new Error(`এই কুপনের জন্য ন্যূনতম অর্ডার ৳${Number(coupon.minOrderAmount || 0).toLocaleString('en-US')}।`);
  }
  if (eligibleSubtotal <= 0) {
    throw new Error('নির্বাচিত পণ্যগুলোর জন্য এই কুপন প্রযোজ্য নয়।');
  }

  let discountAmount = 0;
  if (coupon.discountType === 'FIXED') {
    discountAmount = Math.min(Number(coupon.discountValue || 0), eligibleSubtotal);
  } else {
    const percent = Math.max(0, Math.min(100, Number(coupon.discountValue || 0)));
    discountAmount = Math.floor((eligibleSubtotal * percent) / 100);
  }

  if (coupon.maxDiscountAmount != null) {
    discountAmount = Math.min(discountAmount, Number(coupon.maxDiscountAmount));
  }
  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));
  if (!discountAmount) throw new Error('এই কুপনে কোনো ডিসকাউন্ট প্রযোজ্য হচ্ছে না।');

  return {
    coupon,
    subtotal,
    eligibleSubtotal,
    discountAmount,
    finalSubtotal: subtotal - discountAmount,
  };
}

export async function evaluateCoupon({
  db,
  code,
  products,
  quantities,
  phone = '',
  pageId = '',
  context = 'checkout',
}) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) throw new Error('কুপন কোড লিখুন।');

  const coupon = await db.coupon.findUnique({ where: { code: normalized } });
  if (!coupon) throw new Error('কুপন কোডটি সঠিক নয়।');

  return evaluateCouponRecord({ db, coupon, products, quantities, phone, pageId, context });
}

export async function findBestAutoCoupon(args) {
  const candidates = await args.db.coupon.findMany({
    where: { active: true, autoApply: true },
    orderBy: [{ discountValue: 'desc' }, { createdAt: 'desc' }],
    take: 25,
  });

  let best = null;
  for (const coupon of candidates) {
    try {
      const result = await evaluateCouponRecord({ ...args, coupon });
      if (!best || result.discountAmount > best.discountAmount) best = result;
    } catch {}
  }
  return best;
}

export async function claimCouponUsage({ db, evaluation, orderId, phone = '', source = '' }) {
  const coupon = evaluation?.coupon;
  if (!coupon || !evaluation.discountAmount) return;

  if (coupon.usageLimit != null) {
    const claimed = await db.coupon.updateMany({
      where: { id: coupon.id, active: true, usedCount: { lt: coupon.usageLimit } },
      data: { usedCount: { increment: 1 } },
    });
    if (claimed.count !== 1) throw new Error('এই কুপনের ব্যবহারসীমা শেষ হয়েছে।');
  } else {
    await db.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });
  }

  await db.couponUsage.create({
    data: {
      couponId: coupon.id,
      orderId: String(orderId),
      phone: String(phone || '').replace(/\D/g, ''),
      discountAmount: evaluation.discountAmount,
      orderAmount: evaluation.subtotal,
      source: String(source || '').slice(0, 100),
    },
  });
}
