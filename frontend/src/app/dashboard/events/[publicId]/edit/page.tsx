import Link from "next/link";
import { EditEventForm } from "@/features/events/components/admin/edit-event-form";

export default async function CreatorEditEventPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  return <main className="admin-canvas min-h-screen px-5 py-8 text-[#173b57]"><div className="app-grid-container mx-auto max-w-4xl">
    <Link href={`/dashboard/events/${publicId}`} className="secondary-action">← Назад</Link>
    <h1 className="mt-8 text-4xl font-semibold">Редактирай събитието</h1>
    <div className="mt-8"><EditEventForm publicId={publicId} basePath="/dashboard/events" /></div>
  </div></main>;
}
