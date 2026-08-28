"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getEventTheme } from "@/features/events/lib/event-theme";
import { UploadStudio } from "@/features/uploads/components/upload-studio";
import { eventsService } from "@/features/events/services/events.service";
import type { PublicEvent } from "@/features/events/types/events";
import { clearGuestSession, readGuestSession } from "./event-entry";
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
  likeCount: number;
  likedByGuest: boolean;
}

function isVideoUrl(url: string): boolean {
  return url.includes("/video/upload/");
}

export function EventUploadPage({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<GuestSession | null>(null);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);
  const [likingImageId, setLikingImageId] = useState<number | null>(null);
  const [downloadingImageId, setDownloadingImageId] = useState<number | null>(
    null,
  );
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [quizReviewPercentage, setQuizReviewPercentage] = useState<number | null>(null);
  const [quizHasCorrectAnswers, setQuizHasCorrectAnswers] = useState(true);
  const lastViewerTap = useRef(0);

  useEffect(() => {
    let isActive = true;
    const stored = readGuestSession(publicId);
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
      clearGuestSession(publicId);
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
      } else if (response.status === 401) {
        clearGuestSession(publicId);
        router.replace(`/event/${publicId}`);
      }
    } finally {
      setIsGalleryLoading(false);
    }
  }, [publicId, router, session]);

  useEffect(() => {
    queueMicrotask(() => void loadGallery());
  }, [loadGallery]);

  useEffect(() => {
    if (activeImageIndex === null) return;
    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") setActiveImageIndex(null);
      if (keyEvent.key === "ArrowLeft") {
        setActiveImageIndex((current) =>
          current === null ? null : (current - 1 + gallery.length) % gallery.length,
        );
      }
      if (keyEvent.key === "ArrowRight") {
        setActiveImageIndex((current) =>
          current === null ? null : (current + 1) % gallery.length,
        );
      }
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImageIndex, gallery.length]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    void eventsService
      .getQuizReviewResponse(publicId, session.token, controller.signal)
      .then(async (response) => {
        if (!response.ok) return;
        const review = (await response.json()) as {
          percentage?: unknown;
          hasCorrectAnswers?: unknown;
        };
        setQuizHasCorrectAnswers(review.hasCorrectAnswers !== false);
        if (typeof review.percentage === "number") {
          setQuizReviewPercentage(review.percentage);
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [publicId, session]);

  async function toggleLike(imageId: number) {
    if (!session || likingImageId !== null) return;
    setLikingImageId(imageId);
    try {
      const response = await eventsService.toggleGuestImageLikeResponse(
        publicId,
        imageId,
        session.token,
      );
      if (!response.ok) return;
      const result = (await response.json()) as {
        liked: boolean;
        likeCount: number;
      };
      setGallery((current) =>
        current.map((image) =>
          image.id === imageId
            ? {
                ...image,
                likedByGuest: result.liked,
                likeCount: result.likeCount,
              }
            : image,
        ),
      );
    } finally {
      setLikingImageId(null);
    }
  }

  async function downloadImage(image: GalleryImage) {
    if (!session || downloadingImageId !== null) return;
    setDownloadingImageId(image.id);
    try {
      const response = await eventsService.getGuestImageDownloadResponse(
        publicId,
        image.id,
        session.token,
      );
      if (!response.ok) return;
      const { url } = (await response.json()) as { url: string };
      const link = document.createElement("a");
      link.href = url;
      link.download = image.originalName ?? `vento-photo-${image.id}`;
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloadingImageId(null);
    }
  }

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

  const theme = getEventTheme(event.themeColor);
  const activeImage =
    activeImageIndex === null ? null : gallery[activeImageIndex] ?? null;

  return (
    <main
      className="min-h-screen pb-32 sm:pb-20"
      style={{
        color: theme.primary,
        background: `radial-gradient(circle at 85% 8%, ${theme.accent}38, transparent 28rem), linear-gradient(145deg, ${theme.background}, #ffffff)`,
      }}
    >
      <div className="guest-gallery-container page-container relative">
        <header className="guest-top-navbar sm:pt-5">
          <div className="guest-top-navbar-surface flex items-center justify-between px-3.5 py-3 sm:px-5">
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

        {quizReviewPercentage !== null && (
          <div className="flex justify-end px-5 pt-4 sm:px-0">
            <Link
              href={`/event/${publicId}/quiz-review`}
              aria-label={quizHasCorrectAnswers ? `Моят quiz резултат: ${quizReviewPercentage}%` : "Преглед на отговорите от quiz-а"}
              className="grid h-20 w-20 place-items-center rounded-full text-center text-white shadow-[0_12px_30px_rgba(0,0,0,.18)] ring-4 ring-white/70 transition active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              }}
            >
              <span>
                <span className="block text-xl font-bold leading-none">{quizHasCorrectAnswers ? `${quizReviewPercentage}%` : "✓"}</span>
                <span className="mt-1 block text-[9px] font-bold tracking-[0.12em] uppercase opacity-75">quiz</span>
              </span>
            </Link>
          </div>
        )}

        <section className="guest-event-hero py-8 sm:py-12">
          <div
            className="relative overflow-hidden rounded-[2rem] p-7 text-white shadow-[0_24px_70px_rgba(0,0,0,.15)] sm:p-10"
            style={{
              background: event.coverImageUrl
                ? `url("${event.coverImageUrl}") center / cover no-repeat`
                : `linear-gradient(120deg, ${theme.primary}, ${theme.accent})`,
            }}
          >
            <div
              className="relative max-w-3xl"
              style={{ textShadow: "0 2px 10px rgba(0, 0, 0, 0.72)" }}
            >
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
                <span
                  className="rounded-full border border-white/70 bg-white/85 px-4 py-2 shadow-[0_6px_18px_rgba(0,0,0,.12)] backdrop-blur-sm transition hover:bg-white"
                  style={{ color: theme.primary, textShadow: "none" }}
                >
                  ◉ {event.location}
                </span>
                {event.startAt && (
                  <span
                    className="rounded-full border border-white/70 bg-white/85 px-4 py-2 shadow-[0_6px_18px_rgba(0,0,0,.12)] backdrop-blur-sm transition hover:bg-white"
                    style={{ color: theme.primary, textShadow: "none" }}
                  >
                    {formatEventDate(event.startAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="guest-event-intro mt-10">
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
          inputId="guest-mobile-photo-upload"
          uploadPath={`/events/public/${publicId}/images`}
          authorizationToken={session.token}
          theme={theme}
          onUploaded={() => void loadGallery()}
          mobileStickyAction
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
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
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
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
              {gallery.map((image, index) => (
                <article
                  key={image.id}
                  className="group overflow-hidden rounded-xl border border-black/15 bg-white shadow-[0_3px_10px_rgba(0,0,0,0.1)]"
                >
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    onDoubleClick={() => {
                      if (
                        window.matchMedia("(min-width: 768px)").matches &&
                        !isVideoUrl(image.url)
                      ) {
                        void toggleLike(image.id);
                      }
                    }}
                    className="relative block aspect-square w-full overflow-hidden bg-black/5"
                    aria-label={`${isVideoUrl(image.url) ? "Пусни видео" : "Отвори снимка"} от ${image.guestName ?? "гост"}`}
                  >
                    {isVideoUrl(image.url) ? (
                      <>
                        <video
                          src={image.url}
                          className="absolute inset-0 h-full w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/10">
                          <span className="grid h-14 w-14 place-items-center rounded-full border border-white/50 bg-black/55 text-white shadow-xl backdrop-blur-sm">
                            <PlayIcon />
                          </span>
                        </span>
                      </>
                    ) : (
                      <Image
                        src={image.url}
                        alt={image.originalName ?? `Снимка от ${image.guestName ?? "гост"}`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 33vw, 25vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    )}
                  </button>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-2 text-[#173b57]">
                    <span className="min-w-0 truncate text-[11px] font-semibold sm:text-xs">
                      {image.guestName ?? "Гост"}
                    </span>
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void toggleLike(image.id)}
                        disabled={likingImageId === image.id}
                        className={`flex h-8 min-w-8 items-center justify-center gap-1 px-1 text-xs font-bold transition disabled:opacity-50 ${
                          image.likedByGuest
                            ? "text-rose-500 active:scale-90 sm:hover:text-rose-600"
                            : "text-rose-500 active:scale-90 sm:hover:text-rose-600"
                        }`}
                        aria-label={
                          image.likedByGuest
                            ? "Премахни харесването"
                            : "Харесай снимката"
                        }
                      >
                        <HeartIcon filled={image.likedByGuest} />
                        {image.likeCount > 0 && <span>{image.likeCount}</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => void downloadImage(image)}
                        disabled={downloadingImageId === image.id}
                        className="grid h-8 w-8 place-items-center text-black transition active:scale-90 sm:hover:text-black/60 disabled:opacity-50"
                        aria-label="Свали снимката"
                      >
                        <DownloadIcon />
                      </button>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {activeImage && activeImageIndex !== null && (
          <div
            className="fixed inset-0 z-[100] grid place-items-center bg-black/90 p-0 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Преглед на снимка"
            onMouseDown={(mouseEvent) => {
              if (mouseEvent.target === mouseEvent.currentTarget) {
                setActiveImageIndex(null);
              }
            }}
          >
            <div className="relative grid h-full w-full max-w-6xl overflow-hidden bg-white sm:h-auto sm:max-h-[90vh] sm:grid-cols-[minmax(0,1fr)_340px] sm:rounded-2xl">
              <div
                className="relative min-h-0 bg-black max-sm:h-full max-sm:pb-40 sm:min-h-[34rem]"
                onDoubleClick={() => void toggleLike(activeImage.id)}
                onTouchEnd={() => {
                  const now = Date.now();
                  if (now - lastViewerTap.current < 320) {
                    lastViewerTap.current = 0;
                    void toggleLike(activeImage.id);
                    return;
                  }
                  lastViewerTap.current = now;
                }}
              >
                {isVideoUrl(activeImage.url) ? (
                  <video
                    src={activeImage.url}
                    className="absolute inset-0 h-full w-full object-contain"
                    controls
                    autoPlay
                    muted
                    playsInline
                  />
                ) : (
                  <Image
                    src={activeImage.url}
                    alt={activeImage.originalName ?? "Снимка от събитието"}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 75vw"
                    className="object-contain"
                  />
                )}
                {gallery.length > 1 && (
                  <>
                    <ViewerArrow
                      direction="left"
                      onClick={() =>
                        setActiveImageIndex(
                          (activeImageIndex - 1 + gallery.length) % gallery.length,
                        )
                      }
                    />
                    <ViewerArrow
                      direction="right"
                      onClick={() =>
                        setActiveImageIndex((activeImageIndex + 1) % gallery.length)
                      }
                    />
                  </>
                )}
              </div>

              <aside className="flex min-h-0 flex-col bg-white p-5 text-[#173b57] max-sm:absolute max-sm:inset-x-0 max-sm:bottom-0 max-sm:z-20 max-sm:rounded-t-2xl max-sm:shadow-[0_-16px_45px_rgba(0,0,0,.2)]">
                <div className="flex items-center justify-between border-b border-black/10 pb-4">
                  <div>
                    <p className="font-semibold">{activeImage.guestName ?? "Гост"}</p>
                    <p className="mt-0.5 text-xs text-black/45">
                      {formatImageDate(activeImage.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveImageIndex(null)}
                    className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5"
                    aria-label="Затвори"
                  >
                    <CloseIcon />
                  </button>
                </div>

                <div className="mt-4 border-t border-black/10 pt-4 sm:mt-auto">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleLike(activeImage.id)}
                      disabled={likingImageId === activeImage.id}
                      className={`flex h-11 items-center gap-2 px-2 text-sm font-bold transition ${
                        activeImage.likedByGuest
                          ? "text-rose-500 active:scale-90 sm:hover:text-rose-600"
                          : "text-rose-500 active:scale-90 sm:hover:text-rose-600"
                      }`}
                    >
                      <HeartIcon filled={activeImage.likedByGuest} />
                      {activeImage.likeCount > 0 && activeImage.likeCount}
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadImage(activeImage)}
                      disabled={downloadingImageId === activeImage.id}
                      className="grid h-11 w-11 place-items-center text-black transition active:scale-90 sm:hover:text-black/60"
                      aria-label="Свали снимката"
                    >
                      <DownloadIcon />
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-black/40">
                    {activeImageIndex + 1} от {gallery.length}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>

    </main>
  );
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
  return labels[value] ?? value;
}

function formatImageDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
    >
      <path
        d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.5 5.75v12.5L18 12 8.5 5.75Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ViewerArrow({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onTouchEnd={(touchEvent) => touchEvent.stopPropagation()}
      aria-label={direction === "left" ? "Предишна снимка" : "Следваща снимка"}
      className={`absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-xl text-white backdrop-blur transition hover:bg-black/70 ${
        direction === "left" ? "left-3" : "right-3"
      }`}
    >
      {direction === "left" ? "‹" : "›"}
    </button>
  );
}
