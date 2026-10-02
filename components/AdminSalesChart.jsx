'use client';
import {money} from '@/lib/format';
export default function AdminSalesChart({data=[],height=210}) {
  if(!data.length)return <div className="ar-empty">No reporting data yet.</div>;
  const max=Math.max(1,...data.map(d=>d.deliveredValue||0));
  const chartWidth=700,chartHeight=170,left=8,top=12;
  const x=i=>left+i*chartWidth/Math.max(1,data.length-1);
  const y=v=>top+chartHeight-(v/max)*chartHeight;
  const points=data.map((d,i)=>`${x(i).toFixed(2)},${y(d.deliveredValue||0).toFixed(2)}`).join(' ');
  const area=`${left},${top+chartHeight} ${points} ${left+chartWidth},${top+chartHeight}`;
  const ticks=[0,0.5,1];
  return <div className="ar-sales-chart" role="img" aria-label={`Delivered order value by placement date, ${data.length} days`}>
    <svg viewBox="0 0 720 215" preserveAspectRatio="none" style={{height}} aria-hidden="true">
      <defs><linearGradient id="ar-sales-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1e7553" stopOpacity="0.2"/>
        <stop offset="100%" stopColor="#1e7553" stopOpacity="0.008"/>
      </linearGradient></defs>
      {ticks.map(t=><g key={t}><line x1="8" y1={y(max*t)} x2="708" y2={y(max*t)} stroke="#e4ebe8" strokeDasharray="4 5"/>
        <text x="708" y={y(max*t)-5} textAnchor="end" fill="#798980" fontSize="10">{money(Math.round(max*t),'en-BD')}</text></g>)}
      <polygon points={area} fill="url(#ar-sales-fill)"/>
      <polyline points={points} fill="none" stroke="#20694c" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>
      {data.map((d,i)=>(data.length<=10||i%(Math.ceil(data.length/7))===0||i===data.length-1) &&
        <text key={d.date} x={x(i)} y="207" textAnchor="middle" fill="#728478" fontSize="10">{d.date.slice(5)}</text>)}
    </svg>
  </div>;
}
