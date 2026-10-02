import bcrypt from 'bcryptjs';
import {prisma} from '@/lib/prisma';
import {createSession, sameOrigin} from '@/lib/auth';
import {json,readJson,errorMessage} from '@/lib/http';
import {string} from '@/lib/validate';
export async function POST(req){
 if(!sameOrigin(req)) return json({error:'Invalid request origin'},403);
 const b=await readJson(req); if(!b) return json({error:'Invalid JSON'},400);
 const name=string(b.name,100), email=string(b.email,200).toLowerCase(),password=b.password;
 if(name.length<2|| !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||typeof password!=='string'||password.length<8||password.length>128) return json({error:'নাম, সঠিক ইমেইল এবং ৮–১২৮ অক্ষরের পাসওয়ার্ড দিন।'},400);
 try{
 const user=await prisma.user.create({data:{name,email,passwordHash:await bcrypt.hash(password,12)}});
 await createSession(user.id); return json({user:{id:user.id,name:user.name,email:user.email,role:user.role}},201);
 }catch(e){return json({error:errorMessage(e)},e.code==='P2002'?409:500)}
}
