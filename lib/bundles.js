export function normalizeBundleSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function normalizeBundleItems(value) {
  const input = Array.isArray(value) ? value : [];
  const map = new Map();
  for (const raw of input.slice(0, 30)) {
    const productId = String(raw?.productId || raw?.id || '').trim().slice(0, 120);
    const quantity = Math.max(1, Math.min(20, Math.round(Number(raw?.quantity || raw?.qty || 1))));
    if (!productId) continue;
    map.set(productId, Math.min(20, Number(map.get(productId) || 0) + quantity));
  }
  return [...map.entries()].slice(0, 12).map(([productId, quantity]) => ({ productId, quantity }));
}

export function bundleAvailability(bundle, now = new Date()) {
  if (!bundle?.active) return { available: false, reason: 'This bundle is not active.' };
  if (bundle.startsAt && new Date(bundle.startsAt) > now) return { available: false, reason: 'This bundle has not started yet.' };
  if (bundle.expiresAt && new Date(bundle.expiresAt) < now) return { available: false, reason: 'This bundle offer has ended.' };
  if (bundle.usageLimit != null && Number(bundle.usedCount || 0) >= Number(bundle.usageLimit)) {
    return { available: false, reason: 'This bundle offer is sold out.' };
  }
  return { available: true, reason: '' };
}

export function calculateBundlePricing(bundle, products, bundleQuantity = 1) {
  const qty = Math.max(1, Math.min(10, Math.round(Number(bundleQuantity || 1))));
  const items = normalizeBundleItems(bundle?.items);
  const map = products instanceof Map ? products : new Map((products || []).map((p) => [String(p.id), p]));
  const lines = [];
  let regularSingle = 0;

  for (const item of items) {
    const product = map.get(String(item.productId));
    if (!product) throw new Error('One or more bundle products are unavailable.');
    const unitQty = Number(item.quantity || 1);
    const lineRegular = Number(product.price || 0) * unitQty;
    regularSingle += lineRegular;
    lines.push({
      product,
      unitQuantity: unitQty,
      quantity: unitQty * qty,
      unitPrice: Number(product.price || 0),
      regularAmount: lineRegular * qty,
    });
  }

  if (!lines.length) throw new Error('This bundle has no products.');

  let offerSingle = regularSingle;
  if (bundle.pricingType === 'FIXED_PRICE') {
    offerSingle = Math.max(0, Math.min(regularSingle, Number(bundle.bundlePrice || 0)));
  } else if (bundle.pricingType === 'PERCENTAGE') {
    const percent = Math.max(0, Math.min(100, Number(bundle.discountValue || 0)));
    offerSingle = regularSingle - Math.floor((regularSingle * percent) / 100);
  } else if (bundle.pricingType === 'FIXED_DISCOUNT') {
    offerSingle = Math.max(0, regularSingle - Number(bundle.discountValue || 0));
  }

  const regularAmount = regularSingle * qty;
  const bundleAmount = Math.max(0, offerSingle * qty);
  const bundleDiscountAmount = Math.max(0, regularAmount - bundleAmount);

  return { quantity: qty, regularSingle, offerSingle, regularAmount, bundleAmount, bundleDiscountAmount, lines };
}

export async function publicBundlePayload(db, bundle, bundleQuantity = 1) {
  if (!bundle) return null;
  const availability = bundleAvailability(bundle);
  const items = normalizeBundleItems(bundle.items);
  const ids = items.map((x) => x.productId);
  const products = ids.length
    ? await db.product.findMany({
        where: { id: { in: ids }, active: true },
        select: { id: true, name: true, slug: true, imageUrl: true, price: true, compareAtPrice: true, stock: true, categoryId: true },
      })
    : [];
  const pricing = calculateBundlePricing(bundle, products, bundleQuantity);
  return {
    id: bundle.id,
    title: bundle.title,
    slug: bundle.slug,
    description: bundle.description,
    badge: bundle.badge,
    imageUrl: bundle.imageUrl,
    allowCoupon: bundle.allowCoupon,
    insideDhakaFee: bundle.insideDhakaFee,
    outsideDhakaFee: bundle.outsideDhakaFee,
    startsAt: bundle.startsAt,
    expiresAt: bundle.expiresAt,
    usageLimit: bundle.usageLimit,
    usedCount: bundle.usedCount,
    available: availability.available,
    unavailableReason: availability.reason,
    pricingType: bundle.pricingType,
    bundlePrice: bundle.bundlePrice,
    discountValue: bundle.discountValue,
    pricing: {
      regularAmount: pricing.regularAmount,
      bundleAmount: pricing.bundleAmount,
      bundleDiscountAmount: pricing.bundleDiscountAmount,
      regularSingle: pricing.regularSingle,
      offerSingle: pricing.offerSingle,
    },
    items: pricing.lines.map((line) => ({
      productId: line.product.id,
      quantity: line.unitQuantity,
      product: line.product,
    })),
  };
}
