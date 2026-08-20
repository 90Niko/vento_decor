import Link from "next/link";
import { EditEventForm } from "@/features/events/components/admin/edit-event-form";

export default async function EditEventPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  return (
    <main className="admin-canvas min-h-screen px-5 py-8 text-[#173b57] sm:px-8">
      <div className="app-grid-container mx-auto max-w-4xl">
        <Link href={`/admin/events/${publicId}`} className="secondary-action">← Назад</Link>
        <h1 className="mt-8 text-4xl font-semibold tracking-[-0.04em]">Редактирай събитието</h1>
        <p className="mt-2 mb-8 text-[#173b57]/55">Промени информацията, която виждат гостите.</p>
        <EditEventForm publicId={publicId} />
      </div>
    </main>
  );
}
