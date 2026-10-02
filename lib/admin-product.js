import {string,positiveInt,nonNegativeInt,slugify,imageUrl} from './validate';
export function parseProduct(b){
 const name=string(b?.name,180),slug=slugify(b?.slug||b?.name);
 const price=positiveInt(b?.price),stock=nonNegativeInt(b?.stock,1000000);
 const compareAtPrice=b?.compareAtPrice===''||b?.compareAtPrice===null||b?.compareAtPrice===undefined?null:positiveInt(b?.compareAtPrice);
 const categoryId=string(b?.categoryId,100);
 if(name.length<2||!slug||!price||stock===null||!categoryId|| (b?.compareAtPrice!==''&&b?.compareAtPrice!=null&&!compareAtPrice))return {error:'Check the name, slug, price, stock and category.'};
 if(compareAtPrice!==null&&compareAtPrice<price)return {error:'Compare-at price cannot be lower than the selling price.'};
 return {data:{name,slug,price,stock,compareAtPrice,categoryId,imageUrl:imageUrl(b.imageUrl),description:string(b.description,3000),featured:b.featured===true,active:b.active!==false}};
}
