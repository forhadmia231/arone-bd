import {prisma} from '@/lib/prisma';import {json} from '@/lib/http';
export async function GET(req,{params}){const {slug}=await params;const product=await prisma.product.findFirst({where:{slug,active:true},include:{category:true}});return product?json({product}):json({error:'Product not found'},404);}
