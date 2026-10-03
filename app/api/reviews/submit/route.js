import { prisma } from '@/lib/prisma';
import { sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function text(value, max = 1000) {
  return typeof value === 'string'
    ? value.trim().slice(0, max)
    : '';
}

function rating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(5, Math.round(n)));
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return Response.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Honeypot for basic bot protection.
    if (text(body?.website, 100)) {
      return Response.json({ ok: true });
    }

    const customerName = text(body?.customerName, 120);
    const reviewText = text(body?.reviewText, 2000);

    if (customerName.length < 2) {
      return Response.json(
        { error: 'Please enter your name.' },
        { status: 400 }
      );
    }

    if (reviewText.length < 10) {
      return Response.json(
        { error: 'Please write at least 10 characters.' },
        { status: 400 }
      );
    }

    await prisma.customerReview.create({
      data: {
        customerName,
        rating: rating(body?.rating),
        title: text(body?.title, 160),
        reviewText,
        imageUrl: '',
        source: 'Website',
        productId: text(body?.productId, 100),
        productName: text(body?.productName, 180),
        status: 'PENDING',
        featured: false,
        verified: false,
      },
    });

    return Response.json(
      {
        ok: true,
        message:
          'Thank you. Your review was submitted and is waiting for approval.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Review submission error:', error);

    return Response.json(
      { error: 'Could not submit your review.' },
      { status: 500 }
    );
  }
}
