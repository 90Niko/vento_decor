import Link from "next/link";
import { BrandLockup } from "@/shared/components/brand-lockup";

export default function AccessDeniedPage() {
  return (
    <main className="page-canvas grid min-h-screen place-items-center px-5 py-12 text-[#173b57]">
      <section className="app-grid-container surface-card w-full max-w-2xl rounded-[2rem] p-8 text-center sm:p-12">
        <BrandLockup subtitle="Защитена зона" />
        <div className="mx-auto mt-10 grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-2xl text-red-600" aria-hidden="true">
          ×
        </div>
        <p className="mt-6 text-sm font-bold tracking-[0.2em] text-red-500 uppercase">
          Достъпът е отказан
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Нямаш права за тази страница
        </h1>
        <p className="mx-auto mt-5 max-w-lg leading-7 text-[#173b57]/60">
          Admin зоната е достъпна единствено за администратора на Vento Decor.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard/events" className="primary-action">Към моя dashboard</Link>
          <Link href="/" className="secondary-action">Към началната страница</Link>
        </div>
      </section>
    </main>
  );
}
