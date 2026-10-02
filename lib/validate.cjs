function string(value, max = 255) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }
function positiveInt(v, max = 10000000) { return Number.isSafeInteger(Number(v)) && Number(v) > 0 && Number(v) <= max ? Number(v) : null; }
function nonNegativeInt(v, max = 10000000) { return Number.isSafeInteger(Number(v)) && Number(v) >= 0 && Number(v) <= max ? Number(v) : null; }
function slugify(v) { return string(v, 180).toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 150); }
function imageUrl(v) { const s = string(v, 1200); return s.startsWith('/products/') || s.startsWith('/uploads/') || /^https:\/\//i.test(s) ? s : '/products/default.svg'; }
function safeReturnTo(v) { return typeof v === 'string' && /^\/(?!\/)[a-zA-Z0-9/_?=\-&%]*$/.test(v) ? v : '/account'; }
function shippingFee(city) { return /^(dhaka|ঢাকা)$/i.test(string(city, 80)) ? 70 : 130; }
module.exports = {string, positiveInt, nonNegativeInt, slugify, imageUrl, safeReturnTo, shippingFee};
