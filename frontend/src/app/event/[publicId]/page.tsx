import { EventEntry } from "./event-entry";

interface EventPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { publicId } = await params;

  return <EventEntry publicId={publicId} />;
}
