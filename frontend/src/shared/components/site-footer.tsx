import Link from "next/link";
import { BrandLockup } from "./brand-lockup";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[linear-gradient(145deg,#173b57,#5aa9d6)] px-5 py-10 text-[#ffffff] sm:px-8 sm:py-14">
      <div className="pointer-events-none absolute -right-20 -bottom-32 h-72 w-72 rounded-full bg-[#eaf6ff]/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-md">
          <BrandLockup subtitle="Галерия за красиви моменти" inverse />
          <p className="mt-5 text-sm leading-6 text-[#eaf6ff]">
            Събираме снимките от твоето събитие на едно място, за да останат
            спомените лесни за споделяне и разглеждане.
          </p>
        </div>

        <div className="sm:text-right">
          <nav aria-label="Навигация във футъра" className="flex gap-5 text-sm font-semibold sm:justify-end">
            <Link href="/" className="transition hover:text-[#eaf6ff]">
              Начало
            </Link>
            <Link
              href="/login"
              className="transition hover:text-[#eaf6ff]"
            >
              Вход за creators
            </Link>
          </nav>
          <p className="mt-5 text-xs text-[#eaf6ff]/70">
            © {new Date().getFullYear()} Vento Decor. Всички права запазени.
          </p>
        </div>
      </div>
    </footer>
  );
}
