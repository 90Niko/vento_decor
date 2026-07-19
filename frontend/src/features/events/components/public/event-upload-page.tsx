"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadStudio } from "@/features/uploads/components/upload-studio";
import { eventsService } from "@/features/events/services/events.service";
import type { PublicEvent } from "@/features/events/types/events";
import { guestSessionKey } from "./event-entry";
import { BrandLockup } from "@/shared/components/brand-lockup";

interface GuestSession {
  token: string;
  name: string;
}

interface GalleryImage {
  id: number;
  url: string;
  publicId: string;
  originalName: string | null;
  guestName: string | null;
  createdAt: string;
}

export function EventUploadPage({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);

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
      queueMicrotask(() => {
        if (isActive) setSession({ token: parsed.token!, name: parsed.name! });
      });
    } catch {
      sessionStorage.removeItem(guestSessionKey(publicId));
      router.replace(`/event/${publicId}`);
    }

    return () => {
      isActive = false;
    };
  }, [publicId, router]);

  useEffect(() => {
    const controller = new AbortController();
    eventsService
      .getPublicEvent(publicId, controller.signal)
      .then(setEvent)
      .catch(() => {
        // Keep the session redirect responsible for inaccessible events.
      });
    return () => controller.abort();
  }, [publicId]);

  const loadGallery = useCallback(async () => {
    if (!session) return;
    setIsGalleryLoading(true);
    try {
      const response = await eventsService.getGuestGalleryResponse(
        publicId,
        session.token,
      );
      if (response.ok) {
        setGallery((await response.json()) as GalleryImage[]);
      }
    } finally {
      setIsGalleryLoading(false);
    }
  }, [publicId, session]);

  useEffect(() => {
    queueMicrotask(() => void loadGallery());
  }, [loadGallery]);

  if (!session || !event) {
    return (
      <main className="page-canvas grid min-h-screen place-items-center text-[#173b57]/68">
        <div className="text-center">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-[#173b57]/15 border-t-[#173b57]" />
          <p className="mt-4 text-sm font-medium">Подготвяме галерията…</p>
        </div>
      </main>
    );
  }

  const theme = getTheme(event.themeColor);

  return (
    <main
      className="min-h-screen pb-20"
      style={{
        color: theme.primary,
        background: `radial-gradient(circle at 85% 8%, ${theme.accent}38, transparent 28rem), linear-gradient(145deg, ${theme.background}, #ffffff)`,
      }}
    >
      <div className="page-container relative">
        <header className="sticky top-3 z-30 pt-3 sm:top-5 sm:pt-5">
          <div className="surface-card flex items-center justify-between rounded-2xl px-3.5 py-3 sm:rounded-[1.4rem] sm:px-5">
            <BrandLockup subtitle="Галерия за гости" />
            <span className="flex items-center gap-2 rounded-full border border-black/10 bg-white/65 px-3 py-2 text-xs font-bold sm:px-4">
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-[10px] text-white"
                style={{ backgroundColor: theme.accent }}
              >
                {session.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-28 truncate sm:max-w-48">{session.name}</span>
            </span>
          </div>
        </header>

        <section className="py-8 sm:py-12">
          <div
            className="relative overflow-hidden rounded-[2rem] p-7 text-white shadow-[0_24px_70px_rgba(0,0,0,.15)] sm:p-10"
            style={{
              background: event.coverImageUrl
                ? `linear-gradient(120deg, ${theme.primary}f2, ${theme.accent}a8), url("${event.coverImageUrl}") center / cover`
                : `linear-gradient(120deg, ${theme.primary}, ${theme.accent})`,
            }}
          >
            <div className="relative max-w-3xl">
              <p className="text-xs font-bold tracking-[0.2em] text-white/70 uppercase">
                {getEventTypeLabel(event.eventType)}
              </p>
              <h1 className="mt-3 text-4xl leading-[1] font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
                {event.title}
              </h1>
              {event.description && (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
                  {event.description}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                  ◉ {event.location}
                </span>
                {event.startAt && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                    {formatEventDate(event.startAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10">
            <p
              className="text-xs font-bold tracking-[0.18em] uppercase"
              style={{ color: theme.accent }}
            >
              Сподели момента
            </p>
            <h2 className="mt-3 max-w-4xl text-4xl leading-[1] font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
              Качи снимките си от събитието.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 opacity-65 sm:text-lg">
              Избери любимите кадри. Те ще бъдат добавени към общата галерия с твоето име.
            </p>
          </div>
        </section>

        <UploadStudio
          uploadPath={`/events/public/${publicId}/images`}
          authorizationToken={session.token}
          theme={theme}
          onUploaded={() => void loadGallery()}
        />

        <section className="mt-14 border-t border-black/10 pt-10 sm:mt-20 sm:pt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p
                className="text-xs font-bold tracking-[0.18em] uppercase"
                style={{ color: theme.accent }}
              >
                Общи спомени
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Галерията на всички гости
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 opacity-60 sm:text-base">
                Разгледай моментите, споделени от всички присъстващи на събитието.
              </p>
            </div>
            <span className="rounded-full border border-black/10 bg-white/60 px-4 py-2 text-sm font-semibold">
              {gallery.length} {gallery.length === 1 ? "снимка" : "снимки"}
            </span>
          </div>

          {isGalleryLoading ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="aspect-[4/3] animate-pulse rounded-2xl bg-black/5" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="mt-8 rounded-[2rem] border border-dashed border-black/15 bg-white/45 p-12 text-center">
              <span
                className="mx-auto grid h-12 w-12 place-items-center rounded-2xl text-xl text-white"
                style={{ backgroundColor: theme.accent }}
              >
                ◇
              </span>
              <p className="mt-4 font-semibold">Бъди първият, който споделя момент</p>
              <p className="mt-1 text-sm opacity-55">Качи снимки и те ще се появят тук.</p>
            </div>
          ) : (
            <div className="mt-8 columns-2 gap-3 sm:columns-3 lg:columns-4">
              {gallery.map((image, index) => (
                <a
                  key={image.id}
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative mb-3 block break-inside-avoid overflow-hidden rounded-2xl bg-black/5 shadow-sm"
                >
                  <Image
                    src={image.url}
                    alt={image.originalName ?? `Снимка от ${image.guestName ?? "гост"}`}
                    width={800}
                    height={index % 3 === 0 ? 1000 : 700}
                    unoptimized
                    className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pt-10 pb-3 text-xs text-white opacity-0 transition group-hover:opacity-100">
                    <span className="font-semibold">{image.guestName ?? "Гост"}</span>
                    <span className="ml-2 text-white/65">{formatImageDate(image.createdAt)}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const THEMES: Record<
  string,
  { primary: string; accent: string; background: string }
> = {
  ocean: { primary: "#173b57", accent: "#5aa9d6", background: "#eaf6ff" },
  rose: { primary: "#6d3044", accent: "#d8899e", background: "#fff2f5" },
  sage: { primary: "#354f42", accent: "#8eaa96", background: "#f1f7f2" },
  lavender: { primary: "#493d6b", accent: "#a99bd4", background: "#f5f2ff" },
  terracotta: { primary: "#6d382b", accent: "#c8795d", background: "#fff4ef" },
  midnight: { primary: "#171b2e", accent: "#59658f", background: "#f0f2fa" },
};

function getTheme(value: string) {
  return THEMES[value] ?? THEMES.ocean;
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function getEventTypeLabel(value: string) {
  const labels: Record<string, string> = {
    wedding: "Сватбено събитие",
    birthday: "Рожден ден",
    baptism: "Кръщене",
    prom: "Бал",
    corporate: "Корпоративно събитие",
    other: "Специално събитие",
  };
  return labels[value] ?? labels.other;
}

function formatImageDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}
