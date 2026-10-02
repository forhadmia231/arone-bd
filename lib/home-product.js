const digits={'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
export function homeProductName(name){
 let s=String(name||'').replace(/[০-৯]/g,x=>digits[x]).replace(/Paaikar|Arone Bd/gi,'').replace(/\s*\|.*$/,'').trim();
 if(!/[\u0980-\u09ff]/.test(s))return s;
 const size=s.match(/\d+(?:\.\d+)?\s*ইঞ্চি/); const length=size?size[0].replace(/\s*ইঞ্চি/, '"'):'';
 let kind=s.includes('জালি তাওয়া')?'Open Grill Tawa':s.includes('কান তাওয়া')?'Handled Tawa':s.includes('মাল্টিপ্যান')?'Multi Pan':s.includes('ফ্রাইপ্যান')?'Frying Pan':s.includes('কড়াই')?'Kadai':'Cookware';
 const special=s.includes('মিনি')?'Mini ':s.includes('স্পেশাল')?'Special ':s.includes('নিউ')?'New ':'';
 const oil=s.includes('অয়েল নজেল')?' with Oil Spout':'';
 return `Cast Iron ${special}${kind}${length?' · '+length:''}${oil}`;
}
