import { EventUploadPage } from "@/features/events/components/public/event-upload-page";

interface UploadPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function UploadPage({ params }: UploadPageProps) {
  const { publicId } = await params;

  return <EventUploadPage publicId={publicId} />;
}
