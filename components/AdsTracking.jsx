'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
const KEY='paaikar-ads-consent-v1';
const privatePage=p=>/^\/(?:admin|account|track)(?:\/|$)/.test(p||'');
const safeSettings=s=>Boolean(s && (
  (s.googleEnabled && (/^AW-\d{6,15}$/.test(s.googleAdsId||'') || /^G-[A-Z0-9]{5,20}$/.test(s.ga4MeasurementId||''))) ||
  (s.metaEnabled && /^\d{5,25}$/.test(s.metaPixelId||''))
));
function initialise(settings){
  if(window.__paaikarAdsContext?.allowed)return window.__paaikarAdsContext;
  const google=Boolean(settings.googleEnabled&&(settings.ga4MeasurementId||settings.googleAdsId));
  if(google){
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());
    if(settings.ga4MeasurementId)window.gtag('config',settings.ga4MeasurementId,{send_page_view:false});
    if(settings.googleAdsId)window.gtag('config',settings.googleAdsId,{send_page_view:false});
    const script=document.createElement('script');script.async=true;
    script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(settings.ga4MeasurementId||settings.googleAdsId);
    document.head.appendChild(script);
  }
  if(settings.metaEnabled&&settings.metaPixelId){
    if(!window.fbq){
      const f=function(){f.callMethod?f.callMethod.apply(f,arguments):f.queue.push(arguments)};
      f.queue=[];f.loaded=true;f.version='2.0';window.fbq=f;window._fbq=f;
      const script=document.createElement('script');script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(script);
    }
    window.fbq('init',settings.metaPixelId);
  }
  window.__paaikarAdsContext={allowed:true,settings,sent:new Set(),lastPage:null};
  return window.__paaikarAdsContext;
}
export default function AdsTracking(){
  const pathname=usePathname();const excluded=privatePage(pathname);
  const [choice,setChoice]=useState('loading'),[settings,setSettings]=useState(null),[showSettings,setShowSettings]=useState(false);
  useEffect(()=>{try{const v=localStorage.getItem(KEY);setChoice(v==='accepted'||v==='declined'?v:'unset')}catch{setChoice('unset')}},[]);
  useEffect(()=>{
    if(excluded)return;
    const controller=new AbortController();
    fetch('/api/tracking',{cache:'no-store',signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{if(data)setSettings(data.settings)}).catch(()=>{});
    return ()=>controller.abort();
  },[excluded]);
  useEffect(()=>{
    if(excluded){if(window.__paaikarAdsContext)window.__paaikarAdsContext.lastPage=null;return;}
    if(choice!=='accepted'||!settings||!safeSettings(settings))return;
    const ctx=initialise(settings);
    if(ctx.lastPage!==pathname){
      ctx.lastPage=pathname;ctx.sent=new Set();
      if(settings.ga4MeasurementId&&typeof window.gtag==='function')window.gtag('event','page_view',{send_to:settings.ga4MeasurementId,page_location:window.location.href,page_title:document.title});
      if(settings.metaEnabled&&settings.metaPixelId&&typeof window.fbq==='function')window.fbq('track','PageView');
      window.dispatchEvent(new Event('paaikar:tracking-ready'));
    }
  },[choice,settings,pathname,excluded]);
  function select(v){try{localStorage.setItem(KEY,v)}catch{};setChoice(v);setShowSettings(false);if(v==='declined'&&window.__paaikarAdsContext?.allowed){window.__paaikarAdsContext.allowed=false;window.location.reload()}}
  if(excluded||choice==='loading'||!settings||!safeSettings(settings))return null;
  return <>
    {(choice==='unset'||showSettings)&&<div className="ads-consent" role="dialog" aria-label="Tracking consent"><div><strong>{pathname==='/'?'Tracking & cookies':'ট্র্যাকিং ও কুকিজ'}</strong><p>{pathname==='/'?'With your permission, Google Ads/Analytics and Meta Pixel help us measure product views, carts and orders. You may still shop if you decline.':'আপনি অনুমতি দিলে Google Ads/Analytics ও Meta Pixel দিয়ে পণ্য দেখা, কার্ট ও অর্ডারের পরিসংখ্যান সংগ্রহ করা হবে। অনুমতি না দিলেও কেনাকাটা করতে পারবেন।'}</p></div><div className="ads-consent-actions"><button type="button" onClick={()=>select('declined')}>{pathname==='/'?'Decline':'না, ধন্যবাদ'}</button><button type="button" className="accept" onClick={()=>select('accepted')}>{pathname==='/'?'Accept':'অনুমতি দিচ্ছি'}</button></div></div>}
    {choice!=='unset'&&!showSettings&&<button type="button" className="ads-preferences" onClick={()=>setShowSettings(true)} aria-label="Tracking preferences">{pathname==='/'?'Tracking Preferences':'ট্র্যাকিং পছন্দ'}</button>}
  </>;
}
