import { CreateEventForm } from "@/features/events/components/admin/create-event-form";
import { BrandLockup } from "@/shared/components/brand-lockup";

export default function CreatorNewEventPage() {
  return <main className="admin-canvas min-h-screen px-5 py-10 text-[#173b57]"><div className="mx-auto max-w-6xl">
    <header className="flex h-[76px] items-center px-1 sm:px-2">
      <BrandLockup href="/dashboard/events" subtitle="Creator dashboard" />
    </header>
    <h1 className="mt-10 text-4xl font-semibold">Създай ново събитие</h1>
    <div className="mt-8"><CreateEventForm basePath="/dashboard/events" /></div>
  </div></main>;
}
