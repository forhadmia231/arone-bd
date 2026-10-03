import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const LOCATIONS = new Set(['HEADER', 'FOOTER']);

function locationValue(value) {
  const text = String(value || 'HEADER').toUpperCase();
  return LOCATIONS.has(text) ? text : 'HEADER';
}

function labelValue(value) {
  return typeof value === 'string' ? value.trim().slice(0, 80) : '';
}

function hrefValue(value) {
  const text = typeof value === 'string' ? value.trim().slice(0, 500) : '';
  if (!text) return '/';

  if (text.startsWith('/') && !text.startsWith('//')) return text;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(text)) return text;

  throw new Error('Link must start with /, https://, http://, mailto: or tel:.');
}

function normalize(body) {
  const labelEn = labelValue(body?.labelEn);
  const labelBn = labelValue(body?.labelBn);
  if (!labelEn && !labelBn) throw new Error('Enter an English or Bangla menu label.');

  return {
    location: locationValue(body?.location),
    labelEn,
    labelBn,
    href: hrefValue(body?.href),
    pageId: typeof body?.pageId === 'string' ? body.pageId.slice(0, 100) : '',
    linkType: body?.linkType === 'PAGE' ? 'PAGE' : 'CUSTOM',
    active: body?.active !== false,
  };
}

const starterHeader = [
  { labelEn: 'Home', labelBn: 'হোম', href: '/' },
  { labelEn: 'Shop All', labelBn: 'সব পণ্য', href: '/shop' },
  { labelEn: 'Track Order', labelBn: 'অর্ডার ট্র্যাক করুন', href: '/track' },
  { labelEn: 'My Account', labelBn: 'আমার অ্যাকাউন্ট', href: '/account' },
];

const starterFooter = [
  { labelEn: 'Shop', labelBn: 'শপ', href: '/shop' },
  { labelEn: 'Track Order', labelBn: 'অর্ডার ট্র্যাক', href: '/track' },
  { labelEn: 'My Account', labelBn: 'আমার অ্যাকাউন্ট', href: '/account' },
];

export async function GET(request) {
  try {
    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const location = locationValue(searchParams.get('location'));

    const items = await prisma.navigationItem.findMany({
      where: { location },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return Response.json({ items });
  } catch (error) {
    console.error('Admin navigation GET error:', error);
    return Response.json({ error: 'Could not load navigation.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    if (!sameOrigin(request)) {
      return Response.json({ error: 'Invalid request origin' }, { status: 403 });
    }

    if (!(await adminUser())) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    if (body?.action === 'seed') {
      const location = locationValue(body?.location);
      const count = await prisma.navigationItem.count({ where: { location } });
      if (count > 0) {
        return Response.json({ error: 'This menu already has items.' }, { status: 409 });
      }

      const source = location === 'FOOTER' ? starterFooter : starterHeader;
      await prisma.navigationItem.createMany({
        data: source.map((item, index) => ({
          location,
          labelEn: item.labelEn,
          labelBn: item.labelBn,
          href: item.href,
          linkType: 'CUSTOM',
          active: true,
          sortOrder: index,
        })),
      });

      const items = await prisma.navigationItem.findMany({
        where: { location },
        orderBy: { sortOrder: 'asc' },
      });

      return Response.json({ items }, { status: 201 });
    }

    const data = normalize(body);
    const aggregate = await prisma.navigationItem.aggregate({
      where: { location: data.location },
      _max: { sortOrder: true },
    });

    const item = await prisma.navigationItem.create({
      data: {
        ...data,
        sortOrder: (aggregate._max.sortOrder ?? -1) + 1,
      },
    });

    return Response.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Admin navigation POST error:', error);
    return Response.json({ error: error?.message || 'Could not create menu item.' }, { status: 400 });
  }
}
