import { EventGallery } from "@/features/events/components/admin/event-gallery";

interface EventDetailsPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { publicId } = await params;

  return (
    <main className="page-canvas min-h-screen pb-20 text-[#173b57]">
      <div className="page-container relative max-w-7xl">
        <EventGallery publicId={publicId} />
      </div>
    </main>
  );
}
