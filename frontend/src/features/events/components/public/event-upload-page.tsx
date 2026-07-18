"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadStudio } from "@/features/uploads/components/upload-studio";
import { guestSessionKey } from "./event-entry";
import { BrandLockup } from "@/shared/components/brand-lockup";

interface GuestSession {
  token: string;
  name: string;
}

export function EventUploadPage({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<GuestSession | null>(null);

  useEffect(() => {
    let isActive = true;
    const stored = sessionStorage.getItem(guestSessionKey(publicId));
    if (!stored) {
      router.replace(`/event/${publicId}`);
      return () => {
        isActive = false;
      };
    }

    try {
      const parsed = JSON.parse(stored) as Partial<GuestSession>;
      if (typeof parsed.token !== "string" || typeof parsed.name !== "string") {
        throw new Error("Невалидна сесия на госта");
      }
      const guestSession = { token: parsed.token, name: parsed.name };
      queueMicrotask(() => {
        if (isActive) {
          setSession(guestSession);
        }
      });
    } catch {
      sessionStorage.removeItem(guestSessionKey(publicId));
      router.replace(`/event/${publicId}`);
    }

    return () => {
      isActive = false;
    };
  }, [publicId, router]);

  if (!session) {
    return (
      <main className="page-canvas grid min-h-screen place-items-center text-[#173b57]/68">
        <div className="text-center">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-[#173b57]/15 border-t-[#173b57]" />
          <p className="mt-4 text-sm font-medium">Подготвяме галерията…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-canvas min-h-screen pb-20 text-[#173b57]">
      <div className="page-container relative">
        <header className="sticky top-3 z-30 pt-3 sm:top-5 sm:pt-5">
          <div className="surface-card flex items-center justify-between rounded-2xl px-3.5 py-3 sm:rounded-[1.4rem] sm:px-5">
            <BrandLockup subtitle="Галерия за гости" />
            <span className="flex items-center gap-2 rounded-full border border-[#173b57]/10 bg-white/65 px-3 py-2 text-xs font-bold sm:px-4">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#5aa9d6]/35 text-[10px]">
                {session.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-28 truncate sm:max-w-48">{session.name}</span>
            </span>
          </div>
        </header>

        <section className="py-14 sm:py-20">
          <p className="eyebrow">Сподели момента</p>
          <h1 className="mt-5 max-w-4xl text-5xl leading-[0.98] font-semibold tracking-[-0.055em] text-balance sm:text-7xl">
            Качи снимките си от събитието.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#173b57]/68 sm:text-lg">
            Избери любимите кадри. Те ще бъдат добавени към галерията с твоето име.
          </p>
        </section>

        <UploadStudio
          uploadPath={`/events/public/${publicId}/images`}
          authorizationToken={session.token}
        />
      </div>
    </main>
  );
}
