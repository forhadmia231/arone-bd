const {test}=require('node:test');const assert=require('node:assert/strict');const {validateAdsSettings,EMPTY}=require('../lib/ads-settings.cjs');
const good={...EMPTY,googleEnabled:true,googleAdsId:'AW-123456789',googlePurchaseLabel:'AbC_de-123',ga4MeasurementId:'G-ABCDE12345',metaEnabled:true,metaPixelId:'123456789012345'};
test('accepts normal Google and Meta IDs',()=>assert.deepEqual(validateAdsSettings(good).data,good));
test('does not accept arbitrary script strings as tracking IDs',()=>{
  for(const key of ['googleAdsId','metaPixelId','ga4MeasurementId','googlePurchaseLabel'])assert.ok(validateAdsSettings({...good,[key]:'<script>alert(1)</script>'}).error);
});
test('rejects enabling a tag without its ID and rejects bad field types',()=>{
  assert.ok(validateAdsSettings({...good,googleAdsId:'',ga4MeasurementId:''}).error);
  assert.ok(validateAdsSettings({...good,metaPixelId:''}).error);
  assert.ok(validateAdsSettings({...good,metaEnabled:'true'}).error);
});
test('disabled blank settings are safe defaults',()=>assert.deepEqual(validateAdsSettings({...EMPTY}).data,EMPTY));
test('a conversion label must have a corresponding Ads ID',()=>assert.ok(validateAdsSettings({...EMPTY,googlePurchaseLabel:'ValidLabel'}).error));
