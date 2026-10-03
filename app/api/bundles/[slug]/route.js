import { prisma } from '@/lib/prisma';
import { normalizeBundleSlug, publicBundlePayload } from '@/lib/bundles';
export const dynamic='force-dynamic';
export async function GET(request,{params}){try{const{slug:raw}=await params;const slug=normalizeBundleSlug(raw);const bundle=await prisma.bundleOffer.findUnique({where:{slug}});if(!bundle)return Response.json({error:'Bundle not found.'},{status:404});const payload=await publicBundlePayload(prisma,bundle,1);return Response.json({bundle:payload},{headers:{'Cache-Control':'no-store, max-age=0'}})}catch(error){return Response.json({error:error?.message||'Could not load bundle.'},{status:400})}}
