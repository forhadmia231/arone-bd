import { prisma } from '@/lib/prisma';
import { adminUser } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function GET(){ try{ if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403}); const leads=await prisma.pageLead.findMany({orderBy:{createdAt:'desc'},take:500}); return Response.json({leads}); }catch(error){console.error('Admin leads GET:',error);return Response.json({error:'Could not load leads.'},{status:500});} }
