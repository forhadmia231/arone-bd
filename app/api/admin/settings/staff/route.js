import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  adminUser,
  sameOrigin,
} from '@/lib/auth';
import {
  json,
  readJson,
  errorMessage,
} from '@/lib/http';

const staffSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  staffRole: true,
  staffActive: true,
  canViewProducts: true,
  canCreateProducts: true,
  canEditProducts: true,
  canDeleteProducts: true,
  createdAt: true,
};

function cleanString(value, max = 200) {
  return typeof value === 'string'
    ? value.trim().slice(0, max)
    : '';
}

function bool(value) {
  return value === true;
}

export async function GET() {
  if (!await adminUser()) {
    return json({ error: 'Forbidden' }, 403);
  }

  const users = await prisma.user.findMany({
    where: { role: 'STAFF' },
    select: staffSelect,
    orderBy: { createdAt: 'desc' },
  });

  return json({ users });
}

export async function POST(request) {
  if (!sameOrigin(request)) {
    return json(
      { error: 'Invalid request origin' },
      403
    );
  }

  if (!await adminUser()) {
    return json({ error: 'Forbidden' }, 403);
  }

  const body = await readJson(request);

  const name = cleanString(body?.name, 120);
  const email = cleanString(
    body?.email,
    200
  ).toLowerCase();
  const phone = cleanString(body?.phone, 40);
  const password =
    typeof body?.password === 'string'
      ? body.password
      : '';

  const staffRole =
    cleanString(body?.staffRole, 60) ||
    'Viewer';

  if (name.length < 2) {
    return json(
      { error: 'Staff name is required.' },
      400
    );
  }

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return json(
      { error: 'A valid email is required.' },
      400
    );
  }

  if (password.length < 10) {
    return json(
      {
        error:
          'Staff password must be at least 10 characters.',
      },
      400
    );
  }

  const permissions = {
    canViewProducts:
      bool(body?.canViewProducts) ||
      bool(body?.canCreateProducts) ||
      bool(body?.canEditProducts) ||
      bool(body?.canDeleteProducts),

    canCreateProducts:
      bool(body?.canCreateProducts),

    canEditProducts:
      bool(body?.canEditProducts),

    canDeleteProducts:
      bool(body?.canDeleteProducts),
  };

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash:
          await bcrypt.hash(password, 12),
        role: 'STAFF',
        staffRole,
        staffActive: true,
        ...permissions,
      },
      select: staffSelect,
    });

    return json({ user }, 201);
  } catch (error) {
    return json(
      { error: errorMessage(error) },
      400
    );
  }
}
