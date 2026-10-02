import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
export const dynamic = 'force-dynamic';
const STATUS=['NEW','CONTACTED','DONE'];
export async function PATCH(request,{params}){ try{ if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403}); if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403}); const {id}=await params; const body=await request.json(); const status=STATUS.includes(body?.status)?body.status:'NEW'; const lead=await prisma.pageLead.update({where:{id},data:{status}}); return Response.json({lead}); }catch(error){console.error('Lead PATCH:',error);return Response.json({error:'Could not update lead.'},{status:400});} }
export async function DELETE(request,{params}){ try{ if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403}); if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403}); const {id}=await params; await prisma.pageLead.delete({where:{id}}); return Response.json({ok:true}); }catch(error){console.error('Lead DELETE:',error);return Response.json({error:'Could not delete lead.'},{status:400});} }
