'use client';
import {useEffect} from 'react';
import {trackCommerceEvent} from '@/lib/ads-events';
export default function ProductViewTracking({product}){
  useEffect(()=>{
    const send=()=>{if(trackCommerceEvent('ViewContent',{product}))window.removeEventListener('paaikar:tracking-ready',send)};
    if(!trackCommerceEvent('ViewContent',{product}))window.addEventListener('paaikar:tracking-ready',send);
    return ()=>window.removeEventListener('paaikar:tracking-ready',send);
  },[product.id]);
  return null;
}
