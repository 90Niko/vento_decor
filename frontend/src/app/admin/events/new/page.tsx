import { CreateEventForm } from "@/features/events/components/admin/create-event-form";

export default function CreateEventPage() {
  return (
    <main className="admin-canvas min-h-screen px-0 py-2 text-[#173b57] sm:px-4 sm:py-4">
      <div className="mx-auto max-w-[1500px]">
        <section className="hidden py-7 sm:block sm:py-8">
          <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
            Създаване
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] lg:text-5xl">
            Създай ново събитие
          </h1>
          <p className="mt-3 max-w-2xl text-[#173b57]/55">
            Добави основните детайли и ще получиш персонален публичен линк и QR код за гостите.
          </p>
        </section>
        <CreateEventForm />
      </div>
    </main>
  );
}
