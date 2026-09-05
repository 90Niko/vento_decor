import Link from "next/link";
import { EventGallery } from "@/features/events/components/admin/event-gallery";

export default async function CreatorEventPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  return <main className="page-canvas min-h-screen pb-20 text-[#173b57]"><div className="page-container max-w-7xl py-8">
    <Link href="/dashboard/events" className="secondary-action mb-8">← Моите събития</Link>
    <EventGallery publicId={publicId} basePath="/dashboard/events" />
  </div></main>;
}
