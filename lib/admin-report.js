// Dhaka day boundaries: report values are grouped by ORDER PLACEMENT date.
// Revenue is only orders whose CURRENT status is DELIVERED; this does not verify COD payment.
const OFFSET = 6 * 60 * 60 * 1000;
export const LOW_STOCK_THRESHOLD = 5;
export function dhakaDay(date) {
  return new Date(new Date(date).getTime() + OFFSET).toISOString().slice(0, 10);
}
export function dhakaWindow(days) {
  const local = new Date(Date.now() + OFFSET);
  const utcMidnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - OFFSET;
  return { from: new Date(utcMidnight - (days - 1) * 86400000), days };
}
export function reportDays(orders, days, from) {
  const value = new Map();
  for (let i = 0; i < days; i++) {
    const date = dhakaDay(new Date(from.getTime() + i * 86400000));
    value.set(date, {date, orders: 0, deliveredValue: 0});
  }
  for (const order of orders) {
    const day = value.get(dhakaDay(order.createdAt));
    if (!day) continue;
    day.orders += 1;
    if (order.status === 'DELIVERED') day.deliveredValue += order.total;
  }
  return [...value.values()];
}
