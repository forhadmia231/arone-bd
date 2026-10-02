import {prisma} from '@/lib/prisma';import {json} from '@/lib/http';
export async function GET(req){
 const q=new URL(req.url).searchParams;const page=Math.max(1,Math.min(9999,Number.parseInt(q.get('page')||'1')||1));
 const limit=Math.max(1,Math.min(48,Number.parseInt(q.get('limit')||'12')||12));
 const sortMap={latest:{createdAt:'desc'},oldest:{createdAt:'asc'},price_asc:{price:'asc'},price_desc:{price:'desc'},name_asc:{name:'asc'},name_desc:{name:'desc'}};
 const where={active:true};const search=q.get('q')?.trim().slice(0,100);
 if(search) where.OR=[{name:{contains:search,mode:'insensitive'}},{description:{contains:search,mode:'insensitive'}}];
 if(q.get('category')) where.category={slug:q.get('category')};
 const min=Number(q.get('min')),max=Number(q.get('max'));
 if(q.get('min')!==null&&Number.isFinite(min)&&min>=0)where.price={...where.price,gte:Math.floor(min)};
 if(q.get('max')!==null&&Number.isFinite(max)&&max>=0)where.price={...where.price,lte:Math.floor(max)};
 if(q.get('featured')==='true')where.featured=true;
 const [products,total]=await Promise.all([prisma.product.findMany({where,include:{category:{select:{name:true,slug:true}}},orderBy:sortMap[q.get('sort')]||sortMap.latest,skip:(page-1)*limit,take:limit}),prisma.product.count({where})]);
 return json({products,total,page,pages:Math.ceil(total/limit)});
}
