import {sessionUser} from '@/lib/auth';
import {json} from '@/lib/http';
export async function GET(){return json({user:await sessionUser()});}
