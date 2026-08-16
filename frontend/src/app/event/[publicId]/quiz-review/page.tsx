import { GuestQuizReviewPage } from "@/features/events/components/public/guest-quiz-review-page";

interface QuizReviewPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function QuizReviewPage({ params }: QuizReviewPageProps) {
  const { publicId } = await params;
  return <GuestQuizReviewPage publicId={publicId} />;
}
