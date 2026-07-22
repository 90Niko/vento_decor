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
          <p className="text-xs font-bold tracking-[0.14em] text-[#8ed3f4] uppercase">
            Последвай ни
          </p>
          <div className="mt-3 flex gap-2 sm:justify-end" aria-label="Социални мрежи">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-white" title="Instagram">
              <InstagramIcon />
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-white" title="TikTok">
              <TikTokIcon />
            </span>
          </div>
          <p className="mt-5 text-xs text-[#eaf6ff]/70">
            © {new Date().getFullYear()} Vento Decor. Всички права запазени.
          </p>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.7" r="1" fill="currentColor" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14.5 3v11.1a4.8 4.8 0 1 1-4.1-4.75" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M14.5 3c.6 3.1 2.3 4.8 5.5 5.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
