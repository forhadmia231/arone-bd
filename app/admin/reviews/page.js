import AdminReviews from '@/components/AdminReviews';

export const metadata = {
  title: 'Customer Reviews',
};

export const dynamic = 'force-dynamic';

export default function Page() {
  return <AdminReviews />;
}
