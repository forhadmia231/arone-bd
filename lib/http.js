import { NextResponse } from 'next/server';
export const json=(data,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function readJson(request) { try { return await request.json(); } catch { return null; } }
export function errorMessage(err){ if(err?.code==='P2002') return 'এই তথ্যটি আগে থেকেই রয়েছে।'; return 'অনুরোধ সম্পন্ন হয়নি। আবার চেষ্টা করুন।'; }
