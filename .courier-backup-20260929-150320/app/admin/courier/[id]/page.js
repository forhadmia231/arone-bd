import AdminCourierDetail from '@/components/AdminCourierDetail';
export const metadata={title:'Shipment Details | Arone Bd Admin'};
export const dynamic='force-dynamic';
export default async function Page({params}){const {id}=await params;return <AdminCourierDetail id={id}/>;}
