import { prisma } from '@/lib/prisma';
import { adminUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    if (!(await adminUser())) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const rawDays = Number(url.searchParams.get('days') || 30);
    const days = [7, 30, 90].includes(rawDays) ? rawDays : 30;
    const since = new Date(Date.now() - days * 86400000);

    const [events, pages] = await Promise.all([
      prisma.pageEvent.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'asc' },
        take: 20000,
      }),
      prisma.page.findMany({
        select: { id: true, title: true, slug: true, pageType: true },
        orderBy: { title: 'asc' },
      }),
    ]);

    const pageMap = new Map(pages.map((page) => [page.id, page]));
    const byPage = new Map();
    const bySource = new Map();
    const byCampaign = new Map();
    const daily = new Map();

    for (const event of events) {
      const page = pageMap.get(event.pageId) || { id: event.pageId, title: event.pageSlug || 'Unknown page', slug: event.pageSlug || '' };
      const row = byPage.get(event.pageId) || { pageId: event.pageId, title: page.title, slug: page.slug, views: 0, clicks: 0, leads: 0, orders: 0 };
      if (event.eventType === 'VIEW') row.views += 1;
      if (event.eventType === 'CTA_CLICK') row.clicks += 1;
      if (event.eventType === 'LEAD_SUBMIT') row.leads += 1;
      if (event.eventType === 'ORDER') row.orders += 1;
      byPage.set(event.pageId, row);

      const source = event.source || 'direct';
      bySource.set(source, (bySource.get(source) || 0) + 1);
      if (event.campaign) byCampaign.set(event.campaign, (byCampaign.get(event.campaign) || 0) + 1);

      const day = event.createdAt.toISOString().slice(0, 10);
      const d = daily.get(day) || { date: day, views: 0, clicks: 0, leads: 0, orders: 0 };
      if (event.eventType === 'VIEW') d.views += 1;
      if (event.eventType === 'CTA_CLICK') d.clicks += 1;
      if (event.eventType === 'LEAD_SUBMIT') d.leads += 1;
      if (event.eventType === 'ORDER') d.orders += 1;
      daily.set(day, d);
    }

    const rows = [...byPage.values()].map((row) => ({
      ...row,
      conversionRate: row.views ? Number(((row.leads / row.views) * 100).toFixed(2)) : 0,
      clickRate: row.views ? Number(((row.clicks / row.views) * 100).toFixed(2)) : 0,
      orderConversionRate: row.views ? Number(((row.orders / row.views) * 100).toFixed(2)) : 0,
    })).sort((a,b) => b.views - a.views);

    const totals = rows.reduce((acc,row) => ({ views:acc.views+row.views, clicks:acc.clicks+row.clicks, leads:acc.leads+row.leads, orders:acc.orders+row.orders }), {views:0,clicks:0,leads:0,orders:0});
    totals.conversionRate = totals.views ? Number(((totals.leads/totals.views)*100).toFixed(2)) : 0;
    totals.orderConversionRate = totals.views ? Number(((totals.orders/totals.views)*100).toFixed(2)) : 0;

    const topSources = [...bySource.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,10);
    const topCampaigns = [...byCampaign.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,10);

    return Response.json({ days, since, totals, rows, topSources, topCampaigns, daily:[...daily.values()] });
  } catch (error) {
    console.error('Page analytics GET:', error);
    return Response.json({ error: 'Could not load page analytics.' }, { status: 500 });
  }
}
