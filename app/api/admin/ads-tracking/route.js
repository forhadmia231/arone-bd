import {prisma} from '@/lib/prisma';
import {adminUser} from '@/lib/auth';
import {json,readJson} from '@/lib/http';
import {EMPTY,validateAdsSettings} from '@/lib/ads-settings';
export const dynamic='force-dynamic';

// The configured canonical site origin is used instead of comparing against
// request.url, which may have a 0.0.0.0 hostname behind the local dev server.
function allowedOrigin(request) {
  const origin=request.headers.get('origin');
  const configured=process.env.NEXT_PUBLIC_SITE_URL;
  if(!origin || !configured) return false;
  try {return new URL(origin).origin===new URL(configured).origin;}
  catch {return false;}
}
export async function GET() {
  if(!await adminUser()) return json({error:'Forbidden'},403);
  const settings=await prisma.adsTrackingSettings.findUnique({where:{id:1}});
  return json({settings:settings ? Object.fromEntries(Object.keys(EMPTY).map(k=>[k,settings[k]])) : EMPTY});
}
export async function PUT(request) {
  if(!await adminUser())return json({error:'Forbidden'},403);
  if(!allowedOrigin(request))return json({error:'Invalid request origin'},403);
  const result=validateAdsSettings(await readJson(request));
  if(result.error)return json({error:result.error},400);
  const settings=await prisma.adsTrackingSettings.upsert({where:{id:1},create:{id:1,...result.data},update:result.data});
  return json({settings:Object.fromEntries(Object.keys(EMPTY).map(k=>[k,settings[k]])),message:'Saved'});
}
