import { EventEntry } from "@/features/events/components/public/event-entry";

interface EventPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { publicId } = await params;

  return <EventEntry publicId={publicId} />;
}
