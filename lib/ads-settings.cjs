const EMPTY = Object.freeze({
  googleEnabled: false,
  googleAdsId: '',
  googlePurchaseLabel: '',
  ga4MeasurementId: '',
  metaEnabled: false,
  metaPixelId: ''
});
function validateAdsSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {error:'Invalid payload'};
  const data = {};
  for (const key of ['googleAdsId','googlePurchaseLabel','ga4MeasurementId','metaPixelId']) {
    if (typeof input[key] !== 'string' || input[key].length > 128) return {error:`Invalid ${key}`};
    data[key] = input[key].trim();
  }
  for (const key of ['googleEnabled','metaEnabled']) {
    if (typeof input[key] !== 'boolean') return {error:`Invalid ${key}`};
    data[key] = input[key];
  }
  if (data.googleAdsId && !/^AW-[0-9]{6,15}$/.test(data.googleAdsId)) return {error:'Google Ads ID must look like AW-123456789'};
  if (data.ga4MeasurementId && !/^G-[A-Z0-9]{5,20}$/.test(data.ga4MeasurementId)) return {error:'GA4 Measurement ID must look like G-XXXXXXXX'};
  if (data.googlePurchaseLabel && !/^[A-Za-z0-9_-]{3,100}$/.test(data.googlePurchaseLabel)) return {error:'Invalid Google Ads conversion label'};
  if (data.googlePurchaseLabel && !data.googleAdsId) return {error:'Conversion label requires Google Ads ID'};
  if (data.googleEnabled && !(data.googleAdsId || data.ga4MeasurementId)) return {error:'Enter Google Ads ID or GA4 Measurement ID to enable Google tracking'};
  if (data.metaPixelId && !/^[0-9]{5,25}$/.test(data.metaPixelId)) return {error:'Meta Pixel ID must contain only digits'};
  if (data.metaEnabled && !data.metaPixelId) return {error:'Enter a Meta Pixel ID to enable Meta tracking'};
  return {data};
}
module.exports={EMPTY,validateAdsSettings};
