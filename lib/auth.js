import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const COOKIE = 'paaikar_session';

function tokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const sessionUserSelect = {
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
};

export async function sessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;

  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: tokenHash(token) },
    include: {
      user: {
        select: sessionUserSelect,
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) return null;

  if (session.user.role === 'STAFF' && !session.user.staffActive) {
    return null;
  }

  return session.user;
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');

  await prisma.session.create({
    data: {
      tokenHash: tokenHash(token),
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const jar = await cookies();

  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: tokenHash(token) },
    });
  }

  jar.set(COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;

  try {
    const actual = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url);
    const given = new URL(origin);
    return given.origin === actual.origin;
  } catch {
    return false;
  }
}

/**
 * Strict Super Admin guard.
 * Existing sensitive admin APIs can continue using this helper.
 */
export async function adminUser() {
  const user = await sessionUser();
  return user?.role === 'ADMIN' ? user : null;
}

/**
 * Allows both Super Admin and active STAFF accounts into the back-office shell.
 * Individual APIs still decide what a STAFF account can do.
 */
export async function backofficeUser() {
  const user = await sessionUser();

  if (!user) return null;
  if (user.role === 'ADMIN') return user;

  if (user.role === 'STAFF' && user.staffActive) {
    return user;
  }

  return null;
}

export function hasProductPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role !== 'STAFF' || !user.staffActive) return false;

  return Boolean(user[permission]);
}

export async function productPermissionUser(permission) {
  const user = await backofficeUser();

  if (!hasProductPermission(user, permission)) {
    return null;
  }

  return user;
}
