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

export async function PATCH(
  request,
  { params }
) {
  if (!sameOrigin(request)) {
    return json(
      { error: 'Invalid request origin' },
      403
    );
  }

  if (!await adminUser()) {
    return json({ error: 'Forbidden' }, 403);
  }

  const { id } = await params;
  const existing =
    await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

  if (!existing || existing.role !== 'STAFF') {
    return json(
      { error: 'Staff user not found.' },
      404
    );
  }

  const body = await readJson(request);

  const name = cleanString(body?.name, 120);
  const phone = cleanString(body?.phone, 40);
  const staffRole =
    cleanString(body?.staffRole, 60) ||
    'Viewer';

  const data = {
    name,
    phone: phone || null,
    staffRole,
    staffActive: body?.staffActive !== false,

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

  if (name.length < 2) {
    return json(
      { error: 'Staff name is required.' },
      400
    );
  }

  if (
    typeof body?.password === 'string' &&
    body.password.length > 0
  ) {
    if (body.password.length < 10) {
      return json(
        {
          error:
            'New password must be at least 10 characters.',
        },
        400
      );
    }

    data.passwordHash =
      await bcrypt.hash(body.password, 12);
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: staffSelect,
    });

    if (!data.staffActive) {
      await prisma.session.deleteMany({
        where: { userId: id },
      });
    }

    return json({ user });
  } catch (error) {
    return json(
      { error: errorMessage(error) },
      400
    );
  }
}
