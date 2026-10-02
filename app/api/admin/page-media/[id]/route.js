import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export async function DELETE(request,{params}){ try{ if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403}); if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403}); const {id}=await params; await prisma.pageMedia.delete({where:{id}}); return Response.json({ok:true}); }catch(error){console.error('Page media DELETE:',error);return Response.json({error:'Could not delete media.'},{status:400});} }
