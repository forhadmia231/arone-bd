import bcrypt from 'bcryptjs';
import {prisma} from '@/lib/prisma';
import {createSession,sameOrigin} from '@/lib/auth';
import {json,readJson} from '@/lib/http';
import {string} from '@/lib/validate';
// Development-friendly rate limiter; use shared gateway/Redis throttling when deployed across instances.
const attempts = globalThis.__paaikarLoginAttempts || new Map();
globalThis.__paaikarLoginAttempts=attempts;
export async function POST(req){
 if(!sameOrigin(req)) return json({error:'Invalid request origin'},403);
 const ip=(req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();
 const now=Date.now(); const entry=attempts.get(ip)||{n:0,until:now+15*60*1000};
 if(entry.until<now){entry.n=0;entry.until=now+15*60*1000;}
 if(entry.n>=12) return json({error:'অনেকবার চেষ্টা হয়েছে। পরে চেষ্টা করুন।'},429);
 const b=await readJson(req);const email=string(b?.email,200).toLowerCase();
 const user=await prisma.user.findUnique({where:{email}});
 const okay=user&&typeof b?.password==='string'&&await bcrypt.compare(b.password,user.passwordHash);
 if(!okay){entry.n++;attempts.set(ip,entry);return json({error:'ইমেইল বা পাসওয়ার্ড সঠিক নয়।'},401)}
 attempts.delete(ip);await createSession(user.id);
 return json({user:{id:user.id,name:user.name,email:user.email,role:user.role}});
}
