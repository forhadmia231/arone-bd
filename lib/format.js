export const money = (n, locale='bn-BD') => '৳' + Number(n || 0).toLocaleString(locale);
