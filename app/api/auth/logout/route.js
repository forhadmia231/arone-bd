import {destroySession,sameOrigin} from '@/lib/auth';
import {json} from '@/lib/http';
export async function POST(req){if(!sameOrigin(req))return json({error:'Invalid request origin'},403);await destroySession();return json({ok:true});}
