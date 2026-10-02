import {prisma} from '@/lib/prisma';
import {adminUser,sameOrigin} from '@/lib/auth';
import {json,readJson} from '@/lib/http';
import finance from '@/lib/finance-rules.cjs';
const {CATEGORIES,amount,dateFromDhakaISO,dhakaDay}=finance;
export async function POST(request){
  if(!sameOrigin(request))return json({error:'Invalid origin'},403);
  const admin=await adminUser();if(!admin)return json({error:'Forbidden'},403);
  const body=await readJson(request);
  const category=body?.category, value=amount(body?.amount);
  const description=typeof body?.description==='string'?body.description.trim():'';
  const incurredOn=dateFromDhakaISO(body?.incurredOn);
  if(!CATEGORIES.includes(category)||value===null||value===0||description.length<4||description.length>180||!incurredOn||dhakaDay(incurredOn)>dhakaDay(new Date()))return json({error:'Select a category, positive integer BDT amount, valid past/today Dhaka date and description (4–180 characters).'},400);
  try{
    const expense=await prisma.financeExpense.create({data:{category,amount:value,description,incurredOn,enteredById:admin.id}});
    return json({expense},201);
  }catch(error){console.error('Finance expense create failed',error);return json({error:'Could not save shared expense.'},500);}
}
