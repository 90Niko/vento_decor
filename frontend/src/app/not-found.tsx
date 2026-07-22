import Link from "next/link";
import { BrandLockup } from "@/shared/components/brand-lockup";

export default function NotFoundPage() {
  return (
    <main className="page-canvas grid min-h-screen place-items-center px-5 py-12 text-[#173b57]">
      <section className="surface-card w-full max-w-2xl rounded-[2rem] p-8 text-center sm:p-12">
        <BrandLockup subtitle="Галерия за красиви моменти" />
        <p className="mt-10 text-sm font-bold tracking-[0.2em] text-[#5aa9d6] uppercase">
          Грешка 404
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          Тази страница не съществува
        </h1>
        <p className="mx-auto mt-5 max-w-lg leading-7 text-[#173b57]/60">
          Адресът може да е изписан неправилно или страницата вече да е преместена.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="primary-action">Към началната страница</Link>
          <Link href="/login" className="secondary-action">Вход за creators</Link>
        </div>
      </section>
    </main>
  );
}
