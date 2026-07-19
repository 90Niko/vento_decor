import Link from "next/link";
import { CreateEventForm } from "@/features/events/components/admin/create-event-form";
import { BrandLockup } from "@/shared/components/brand-lockup";

export default function CreateEventPage() {
  return (
    <main className="admin-canvas min-h-screen px-5 py-6 text-[#173b57] sm:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="surface-card flex items-center justify-between rounded-2xl px-4 py-3 sm:px-5">
          <BrandLockup subtitle="Администрация" />
          <Link
            href="/admin/events"
            className="secondary-action px-4 py-2.5"
          >
            <span aria-hidden="true">←</span>
            Към дашборда
          </Link>
        </header>

        <section className="py-10 sm:py-14">
          <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
            Създаване
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
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
