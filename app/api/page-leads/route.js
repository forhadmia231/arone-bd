import { prisma } from '@/lib/prisma';
import { sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
function text(value, max){ return String(value||'').trim().slice(0,max); }

export async function POST(request){
  try{
    if(!sameOrigin(request)) return Response.json({error:'Invalid request origin'},{status:403});
    const body=await request.json();
    if(text(body?.company,80)) return Response.json({ok:true},{status:201});

    const name=text(body?.name,120), phone=text(body?.phone,40), email=text(body?.email,160), message=text(body?.message,1200);
    if(!name&&!phone&&!email&&!message) return Response.json({error:'Please provide your contact information.'},{status:400});
    if(email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({error:'Please enter a valid email address.'},{status:400});

    const pageId=text(body?.pageId,100);
    const source=text(body?.source,160)||'direct';
    const medium=text(body?.medium,160);
    const campaign=text(body?.campaign,200);
    const referrer=text(body?.referrer,700);
    const landingPath=text(body?.landingPath,700);

    const lead=await prisma.pageLead.create({
      data:{
        pageId,
        pageTitle:text(body?.pageTitle,180),
        pageSlug:text(body?.pageSlug,140),
        formName:text(body?.formName,160)||'Lead Form',
        name,phone,email,message,source,medium,campaign,referrer,landingPath,
        data:{source:'page-builder',utm_source:source,utm_medium:medium,utm_campaign:campaign}
      }
    });

    if(pageId){
      const settings=await prisma.pageMarketingSettings.findUnique({where:{pageId}}).catch(()=>null);
      if(settings?.analyticsEnabled!==false){
        await prisma.pageEvent.create({data:{pageId,pageSlug:text(body?.pageSlug,140),eventType:'LEAD_SUBMIT',label:text(body?.formName,180)||'Lead Form',source,medium,campaign,referrer,path:landingPath}}).catch(()=>{});
      }
    }

    return Response.json({ok:true,id:lead.id},{status:201});
  }catch(error){
    console.error('Public page lead POST:',error);
    return Response.json({error:'Could not submit the form. Please try again.'},{status:500});
  }
}
