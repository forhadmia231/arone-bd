const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('public brand and homepage presentation are Arone Bd',()=>{
 assert.match(read('app/layout.js'),/Arone Bd \| Cookware/);
 assert.match(read('components/StoreHome.jsx'),/ARONE BD ORIGINAL COLLECTION/);
 assert.match(read('components/StoreHome.jsx'),/Featured Products/);
 assert.doesNotMatch(read('components/StoreHome.jsx'),/PAAIKAR/);
});
test('both Bengali product action buttons and direct checkout route are present',()=>{
 const card=read('components/ProductCard.jsx');
 assert.match(card,/কার্টে যোগ করুন/);assert.match(card,/অর্ডার করুন/);assert.match(card,/router\.push\('\/checkout'\)/);
 assert.match(read('components/BuyActions.jsx'),/router\.push\('\/checkout'\)/);
});
test('checkout copy is Bengali and staff-facing navigation is English',()=>{
 assert.match(read('components/CheckoutPage.jsx'),/ডেলিভারি তথ্য/);
 assert.match(read('components/CheckoutPage.jsx'),/অর্ডার নিশ্চিত করুন/);
 const layout=read('app/admin/layout.js');
 for(const label of ['Dashboard','Products','Orders','Categories','Ads Tracking'])assert.match(layout,new RegExp(label));
 assert.match(read('components/StaffLogin.jsx'),/Admin Sign In/);
});
test('no private environment file bundled and ads settings migration exists',()=>{
 assert.equal(fs.existsSync('.env'),false);
 assert.ok(fs.existsSync('prisma/migrations/202609290001_ads_tracking/migration.sql'));
 assert.match(read('app/api/admin/ads-tracking/route.js'),/adminUser/);
});
