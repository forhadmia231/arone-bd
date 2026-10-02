'use client';
import {createContext,useContext,useEffect,useMemo,useState} from 'react';
import {trackCommerceEvent} from '@/lib/ads-events';
const Context=createContext(null);
export function CartProvider({children}){
 const [items,setItems]=useState([]),[loaded,setLoaded]=useState(false);
 useEffect(()=>{try{const old=JSON.parse(localStorage.getItem('paaikar-cart-v1')||'[]');if(Array.isArray(old))setItems(old.filter(x=>x&&typeof x.id==='string'&&Number.isInteger(x.qty)&&x.qty>0).slice(0,30));}catch{}setLoaded(true);},[]);
 useEffect(()=>{if(loaded)localStorage.setItem('paaikar-cart-v1',JSON.stringify(items));},[items,loaded]);
 function add(product,qty=1){if(product?.stock>0)trackCommerceEvent('AddToCart',{product,qty:Math.min(50,product.stock,qty)});setItems(prev=>{const found=prev.find(x=>x.id===product.id);const maximum=Math.max(0,product.stock||0);if(!maximum)return prev;if(found)return prev.map(x=>x.id===product.id?{...x,stock:maximum,qty:Math.min(50,maximum,x.qty+qty)}:x);return [...prev,{id:product.id,slug:product.slug,name:product.name,imageUrl:product.imageUrl,price:product.price,stock:maximum,qty:Math.min(50,maximum,qty)}].slice(0,30);});}
 function change(id,qty){setItems(old=>old.map(x=>x.id===id?{...x,qty:Math.max(1,Math.min(50,x.stock,qty))}:x));}
 function remove(id){setItems(old=>old.filter(x=>x.id!==id));}
 const value=useMemo(()=>({items,loaded,add,change,remove,clear:()=>setItems([]),count:items.reduce((n,i)=>n+i.qty,0),subtotal:items.reduce((n,i)=>n+i.qty*i.price,0)}),[items,loaded]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCart(){const c=useContext(Context);if(!c)throw new Error('CartProvider missing');return c;}
