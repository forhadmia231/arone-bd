require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const products = require('./seed-products.json');
const prisma = new PrismaClient();
async function main(){
  const category=await prisma.category.upsert({where:{slug:'cast-iron-cookware'},update:{name:'Cast Iron Cookware'},create:{name:'Cast Iron Cookware',slug:'cast-iron-cookware',description:'খাঁটি কাস্ট আয়রন কুকওয়্যার কালেকশন'}});
  for(const item of products){const {sourceImageUrl,...data}=item; await prisma.product.upsert({where:{slug:data.slug},update:{},create:{...data,categoryId:category.id}});}
  const email=(process.env.SEED_ADMIN_EMAIL||'').trim().toLowerCase();
  const password=process.env.SEED_ADMIN_PASSWORD||'';
  if(email && password.length>=16 && !password.includes('REPLACE_WITH')) {
    const existing=await prisma.user.findUnique({where:{email}});
    if(existing){console.log('Admin email already exists; role/password unchanged for safety.');}
    else { await prisma.user.create({data:{name:process.env.SEED_ADMIN_NAME||'Administrator',email,passwordHash:await bcrypt.hash(password,12),role:'ADMIN'}}); console.log('Admin account created:',email); }
  } else console.log('Admin not seeded: set unique SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (16+ chars).');
  console.log('Sample products ready:',products.length);
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
