import { prisma } from '@/lib/prisma';
import { adminUser, sameOrigin } from '@/lib/auth';
import { BLOCK_TYPES } from '@/lib/page-builder';
export const dynamic = 'force-dynamic';

function cleanBlock(block){ if(!block||typeof block!=='object'||!BLOCK_TYPES.includes(block.type)) throw new Error('Invalid section block.'); const json=JSON.stringify(block); if(json.length>1500000) throw new Error('Section is too large to save.'); return JSON.parse(json); }
export async function GET(){ try{ if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403}); const sections=await prisma.reusableSection.findMany({orderBy:{updatedAt:'desc'}}); return Response.json({sections}); }catch(error){console.error('Reusable sections GET:',error);return Response.json({error:'Could not load reusable sections.'},{status:500});} }
export async function POST(request){ try{ if(!sameOrigin(request))return Response.json({error:'Invalid request origin'},{status:403}); if(!(await adminUser()))return Response.json({error:'Forbidden'},{status:403}); const body=await request.json(); const name=String(body?.name||'').trim().slice(0,160); if(!name) throw new Error('Section name is required.'); const section=await prisma.reusableSection.create({data:{name,block:cleanBlock(body?.block)}}); return Response.json({section},{status:201}); }catch(error){console.error('Reusable sections POST:',error);return Response.json({error:error?.message||'Could not save reusable section.'},{status:400});} }
