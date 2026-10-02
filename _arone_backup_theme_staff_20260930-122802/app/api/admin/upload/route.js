import {adminUser,sameOrigin} from '@/lib/auth';import {json} from '@/lib/http';
import crypto from 'node:crypto';import {writeFile,mkdir} from 'node:fs/promises';import path from 'node:path';
export const runtime='nodejs';
export async function POST(req){
 if(!sameOrigin(req)||!await adminUser())return json({error:'Forbidden'},403);
 if(process.env.ENABLE_LOCAL_UPLOADS!=='true')return json({error:'Local upload disabled. Configure durable object storage for deployment.'},503);
 const data=await req.formData();const file=data.get('image');
 if(!file||typeof file.arrayBuffer!=='function'||file.size>3*1024*1024||file.size===0)return json({error:'PNG/JPEG/WebP under 3 MB required'},400);
 const buffer=Buffer.from(await file.arrayBuffer());let ext='';
 if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))ext='png';
 else if(buffer[0]===0xff&&buffer[1]===0xd8&&buffer[2]===0xff)ext='jpg';
 else if(buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP')ext='webp';
 if(!ext)return json({error:'Unsupported image format'},400);
 const dir=path.join(process.cwd(),'public','uploads');await mkdir(dir,{recursive:true});
 const filename=crypto.randomBytes(16).toString('hex')+'.'+ext;
 await writeFile(path.join(dir,filename),buffer,{flag:'wx'});
 return json({url:'/uploads/'+filename},201);
}
