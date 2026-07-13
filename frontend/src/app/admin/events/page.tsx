import Link from "next/link";
import { BrandLockup } from "../../brand-lockup";
import { AdminEventsDashboard } from "./admin-events-dashboard";

export default function AdminEventsPage() {
  return (
    <main className="page-canvas min-h-screen pb-20 text-[#173b57]">
      <div className="page-container relative">
        <header className="sticky top-3 z-30 pt-3 sm:top-5 sm:pt-5">
          <div className="surface-card flex items-center justify-between rounded-2xl px-3.5 py-3 sm:rounded-[1.4rem] sm:px-5">
            <BrandLockup subtitle="Управление на събития" />
            <Link href="/" className="secondary-action px-4 py-2.5 text-xs sm:text-sm">
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">Към</span> галерията
            </Link>
          </div>
        </header>

        <section className="grid items-end gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_340px] lg:py-24">
          <div className="reveal-up max-w-4xl">
            <p className="eyebrow">Администрация</p>
            <h1 className="mt-5 text-5xl leading-[0.98] font-semibold tracking-[-0.055em] text-balance sm:text-7xl">
              Създавай поводи. Събирай истински моменти.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#173b57]/68 sm:text-lg sm:leading-8">
              Управлявай събитията, споделяй код за сканиране и разглеждай
              снимките от гостите в една подредена галерия.
            </p>
          </div>

          <div className="surface-card reveal-up rounded-[1.75rem] p-6 [animation-delay:100ms]">
            <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
              Работен процес
            </p>
            <div className="mt-5 flex items-center justify-between gap-2 text-center">
              <Step number="1" label="Създай" />
              <span className="h-px flex-1 bg-[#173b57]/12" />
              <Step number="2" label="Сподели" />
              <span className="h-px flex-1 bg-[#173b57]/12" />
              <Step number="3" label="Събери" />
            </div>
          </div>
        </section>

        <AdminEventsDashboard />
      </div>
    </main>
  );
}

function Step({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[#173b57] text-xs font-bold text-white">
        {number}
      </span>
      <p className="mt-2 text-xs font-semibold text-[#173b57]/68">{label}</p>
    </div>
  );
}
