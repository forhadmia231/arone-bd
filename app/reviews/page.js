import ReviewsShowcase from '@/components/ReviewsShowcase';
import ReviewSubmissionForm from '@/components/ReviewSubmissionForm';

export const metadata = {
  title: 'Customer Reviews | Arone Bd',
  description: 'Read approved customer reviews and share your experience with Arone Bd.',
};

export const dynamic = 'force-dynamic';

export default function ReviewsPage() {
  return (
    <>
      <ReviewsShowcase />
      <ReviewSubmissionForm />
    </>
  );
}
