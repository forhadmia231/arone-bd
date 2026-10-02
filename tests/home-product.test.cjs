const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const file=fs.readFileSync('lib/home-product.js','utf8').replace('export function homeProductName','function homeProductName');
const homeProductName=Function(file+';return homeProductName;')();
test('homepage demo title in English',()=>assert.equal(homeProductName('কাস্ট আয়রন ১১ ইঞ্চি কান তাওয়া'),'Cast Iron Handled Tawa · 11"'));
test('homepage multipan title in English',()=>assert.equal(homeProductName('কাস্ট আয়রন ১০ ইঞ্চি মাল্টিপ্যান (অয়েল নজেল)'),'Cast Iron Multi Pan · 10" with Oil Spout'));
test('already-English names remain unchanged',()=>assert.equal(homeProductName('Steel Mug'),'Steel Mug'));
