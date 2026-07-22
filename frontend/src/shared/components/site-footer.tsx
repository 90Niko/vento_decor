"use client";

import { useState } from "react";
import { BrandLockup } from "./brand-lockup";

export function SiteFooter() {
  const [showSocialMessage, setShowSocialMessage] = useState(false);

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
            <button type="button" onClick={() => setShowSocialMessage(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-white transition hover:-translate-y-0.5 hover:bg-white/15" aria-label="Instagram — очаквай ни скоро">
              <InstagramIcon />
            </button>
            <button type="button" onClick={() => setShowSocialMessage(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-white transition hover:-translate-y-0.5 hover:bg-white/15" aria-label="TikTok — очаквай ни скоро">
              <TikTokIcon />
            </button>
            <button type="button" onClick={() => setShowSocialMessage(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-white transition hover:-translate-y-0.5 hover:bg-white/15" aria-label="Facebook — очаквай ни скоро">
              <FacebookIcon />
            </button>
            <button type="button" onClick={() => setShowSocialMessage(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-white transition hover:-translate-y-0.5 hover:bg-white/15" aria-label="X — очаквай ни скоро">
              <XIcon />
            </button>
          </div>
          {showSocialMessage && (
            <p role="status" className="mt-3 rounded-xl border border-white/10 bg-white/[0.08] px-3 py-2 text-xs text-[#eaf6ff]">
              Очаквай ни скоро в социалните мрежи.
            </p>
          )}
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

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 21v-8h2.8l.42-3H14V8.1c0-.87.25-1.46 1.62-1.46H17.4V4a23 23 0 0 0-2.45-.13c-2.43 0-4.1 1.48-4.1 4.2V10H8v3h2.85v8H14Z" fill="currentColor" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4l16 16M20 4 4 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
