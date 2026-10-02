import {prisma} from '@/lib/prisma';
import {json} from '@/lib/http';
import {EMPTY,validateAdsSettings} from '@/lib/ads-settings';
export const dynamic='force-dynamic';
export async function GET(){
  const stored=await prisma.adsTrackingSettings.findUnique({where:{id:1}});
  if(!stored)return json({settings:EMPTY});
  // Validate even on read so a direct database edit cannot inject arbitrary IDs.
  const check=validateAdsSettings(Object.fromEntries(Object.keys(EMPTY).map(k=>[k,stored[k]])));
  if(check.error)return json({settings:EMPTY});
  // Only validated public IDs, never credentials or arbitrary Javascript.
  return json({settings:{
    googleEnabled:stored.googleEnabled,
    googleAdsId:stored.googleEnabled?stored.googleAdsId:'',
    googlePurchaseLabel:stored.googleEnabled?stored.googlePurchaseLabel:'',
    ga4MeasurementId:stored.googleEnabled?stored.ga4MeasurementId:'',
    metaEnabled:stored.metaEnabled,
    metaPixelId:stored.metaEnabled?stored.metaPixelId:''
  }});
}
