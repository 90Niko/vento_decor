import { CreateEventForm } from "@/features/events/components/admin/create-event-form";

export default function CreatorNewEventPage() {
  return <main className="admin-canvas min-h-screen px-0 py-2 text-[#173b57] sm:px-4 sm:py-4"><div className="mx-auto max-w-[1240px]">
    <section className="hidden py-10 sm:block sm:py-12">
      <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">Създаване</p>
      <h1 className="mt-2 text-5xl font-semibold tracking-[-0.045em]">Създай ново събитие</h1>
      <p className="mt-3 max-w-2xl text-[#173b57]/55">Добави основните детайли и ще получиш персонален публичен линк и QR код за гостите.</p>
    </section>
    <CreateEventForm basePath="/dashboard/events" />
  </div></main>;
}
