import { GuestWelcomeQuestions } from "@/features/events/components/public/guest-welcome-questions";

export default async function GuestWelcomePage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return <GuestWelcomeQuestions publicId={publicId} />;
}
