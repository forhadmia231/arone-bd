import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
const COOKIE = 'paaikar_session';
function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }
export async function sessionUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: tokenHash(token) }, include: { user: { select: { id:true, name:true, email:true, role:true, phone:true } } } });
  return session && session.expiresAt > new Date() ? session.user : null;
}
export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.session.create({data:{tokenHash:tokenHash(token),userId,expiresAt:new Date(Date.now()+7*24*60*60*1000)}});
  const jar = await cookies();
  jar.set(COOKIE, token, {httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge:7*24*60*60});
}
export async function destroySession() {
  const jar=await cookies(); const token=jar.get(COOKIE)?.value;
  if(token) await prisma.session.deleteMany({where:{tokenHash:tokenHash(token)}});
  jar.set(COOKIE,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});
}
export function sameOrigin(request) {
  const origin=request.headers.get('origin');
  if(!origin) return false;
  try { const actual = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url); const given = new URL(origin); return given.origin===actual.origin; } catch { return false; }
}
export async function adminUser() { const user=await sessionUser(); return user?.role==='ADMIN' ? user : null; }
