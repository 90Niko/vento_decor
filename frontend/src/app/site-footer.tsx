import Link from "next/link";
import { BrandLockup } from "./brand-lockup";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[linear-gradient(145deg,#132f27,#1d4036)] px-5 py-10 text-[#eef0e7] sm:px-8 sm:py-14">
      <div className="pointer-events-none absolute -right-20 -bottom-32 h-72 w-72 rounded-full bg-[#a45d3f]/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md">
          <BrandLockup subtitle="Галерия за красиви моменти" inverse />
          <p className="mt-5 text-sm leading-6 text-[#b9c8c0]">
            Събираме снимките от твоето събитие на едно място, за да останат
            спомените лесни за споделяне и разглеждане.
          </p>
        </div>

        <div className="sm:text-right">
          <nav aria-label="Навигация във футъра" className="flex gap-5 text-sm font-semibold sm:justify-end">
            <Link href="/" className="transition hover:text-[#d7e0bf]">
              Начало
            </Link>
            <Link
              href="/admin/events"
              className="transition hover:text-[#d7e0bf]"
            >
              Админ панел
            </Link>
          </nav>
          <p className="mt-5 text-xs text-[#8fa69d]">
            © {new Date().getFullYear()} Vento Decor. Всички права запазени.
          </p>
        </div>
      </div>
    </footer>
  );
}
