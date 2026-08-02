"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { eventsService } from "@/features/events/services/events.service";
import { getApiUrl } from "@/shared/api/client";
import { copyToClipboard } from "@/shared/lib/copy-to-clipboard";
import { getEventTheme } from "@/features/events/lib/event-theme";

function isVideoUrl(url: string): boolean {
  return url.includes("/video/upload/");
}

interface EventImage {
  id: number;
  url: string;
  publicId: string;
  originalName: string | null;
  position: number;
  guestName: string | null;
  createdAt: string;
}

interface AdminEventDetails {
  id: number;
  publicId: string;
  title: string;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  isActive: boolean;
  guestCount: number;
  imageCount: number;
  themeColor: string;
  images: EventImage[];
}

export function EventGallery({ publicId }: { publicId: string }) {
  const [event, setEvent] = useState<AdminEventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvent() {
      try {
        const response = await eventsService.getAdminEventResponse(publicId, controller.signal);
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Събитието не е намерено."
              : `Галерията не може да бъде заредена (код ${response.status}).`,
          );
        }
        setEvent((await response.json()) as AdminEventDetails);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") {
          return;
        }
        setError(
          requestError instanceof TypeError
            ? "Няма връзка със сървъра. Провери дали backend-ът работи на порт 3001."
            : requestError instanceof Error
            ? requestError.message
            : "Възникна неочаквана грешка.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadEvent();
    return () => controller.abort();
  }, [publicId]);

  useEffect(() => {
    if (!event) return;
    const theme = getEventTheme(event.themeColor);
    const root = document.documentElement;
    root.classList.add("live-event-page-theme");
    root.style.setProperty("--active-event-theme-primary", theme.primary);
    root.style.setProperty("--active-event-theme-accent", theme.accent);
    root.style.setProperty("--active-event-theme-background", theme.background);

    return () => {
      root.classList.remove("live-event-page-theme");
      root.style.removeProperty("--active-event-theme-primary");
      root.style.removeProperty("--active-event-theme-accent");
      root.style.removeProperty("--active-event-theme-background");
    };
  }, [event]);

  async function deleteImage(image: EventImage) {
    const confirmed = window.confirm(
      `Да изтрия ли снимката${image.guestName ? ` от ${image.guestName}` : ""}? Действието е необратимо.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(image.id);
    setError(null);
    const deletedIndex = event?.images.findIndex((item) => item.id === image.id) ?? -1;
    try {
      const response = await eventsService.deleteImageResponse(image.id);
      if (!response.ok) {
        throw new Error(`Снимката не можа да бъде изтрита (код ${response.status}).`);
      }
      setEvent((current) =>
        current
          ? {
              ...current,
              imageCount: current.imageCount - 1,
              images: current.images.filter((item) => item.id !== image.id),
            }
          : current,
      );
      const remainingCount = Math.max(0, (event?.images.length ?? 1) - 1);
      setActiveImageIndex((current) => {
        if (remainingCount === 0) {
          return 0;
        }
        if (deletedIndex >= 0 && deletedIndex < current) {
          return current - 1;
        }
        if (deletedIndex === current) {
          return Math.min(current, remainingCount - 1);
        }
        return current;
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Възникна неочаквана грешка.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return <p className="py-24 text-center text-[#173b57]/68">Зареждане…</p>;
  }

  if (!event) {
    return (
      <div className="rounded-[2rem] bg-white/70 p-10 text-center">
        <h1 className="text-2xl font-semibold">Галерията не е достъпна</h1>
        <p className="mt-3 font-medium text-[#173b57]">{error}</p>
      </div>
    );
  }

  const activeImage = event.images[activeImageIndex];
  const carouselImageCount = event.images.length;

  function showPreviousImage() {
    setActiveImageIndex((current) =>
      current === 0 ? carouselImageCount - 1 : current - 1,
    );
  }

  function showNextImage() {
    setActiveImageIndex((current) => (current + 1) % carouselImageCount);
  }

  return (
    <div>
      <section className="surface-card overflow-hidden rounded-[2rem] p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="eyebrow">Преглед на събитието</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
              {event.title}
            </h1>
            {event.description && (
              <p className="mt-4 leading-7 text-[#173b57]/68">{event.description}</p>
            )}
            {event.location && (
              <p className="mt-4 text-sm font-semibold">📍 {event.location}</p>
            )}
          </div>
          <Link
            href={`/event/${event.publicId}`}
            target="_blank"
            className="primary-action"
          >
            Отвори публичното събитие ↗
          </Link>
        </div>

        <div className="mt-8 grid max-w-lg grid-cols-2 gap-4 border-t border-[#173b57]/10 pt-6">
          <Stat value={event.imageCount} label="снимки" />
          <Stat value={event.guestCount} label="регистрирани гости" />
        </div>

        <EventShareCard event={event} />
      </section>

      <section className="mt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-medium tracking-[-0.04em]">Снимки</h2>
          <span className="text-sm text-[#173b57]/68">{event.images.length} общо</span>
        </div>

        {error && (
          <p className="mb-5 rounded-2xl bg-[#5aa9d6]/15 px-4 py-3 text-sm font-medium text-[#173b57]" role="alert">
            {error}
          </p>
        )}

        {event.images.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#173b57]/20 bg-white/45 p-14 text-center text-[#173b57]/68">
            Все още няма качени снимки за това събитие.
          </div>
        ) : activeImage ? (
          <div
            role="region"
            aria-roledescription="въртележка"
            aria-label="Снимки от събитието"
            tabIndex={0}
            onKeyDown={(keyEvent) => {
              if (keyEvent.key === "ArrowLeft") {
                showPreviousImage();
              }
              if (keyEvent.key === "ArrowRight") {
                showNextImage();
              }
            }}
            onTouchStart={(touchEvent) => {
              touchStartX.current = touchEvent.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(touchEvent) => {
              const touchEndX = touchEvent.changedTouches[0]?.clientX;
              if (touchStartX.current === null || touchEndX === undefined) {
                return;
              }
              const distance = touchStartX.current - touchEndX;
              if (distance > 45) {
                showNextImage();
              } else if (distance < -45) {
                showPreviousImage();
              }
              touchStartX.current = null;
            }}
            className="outline-none focus-visible:ring-4 focus-visible:ring-[#5aa9d6]/25"
          >
            <div className="relative aspect-[5/4] sm:aspect-[16/9] lg:aspect-[16/8]">
              {event.images.map((image, index) => {
                const offset = getCircularOffset(
                  index,
                  activeImageIndex,
                  event.images.length,
                );
                if (offset === null) {
                  return null;
                }

                return (
                  <div
                    key={image.id}
                    className={`absolute top-1/2 transform-gpu overflow-hidden rounded-[1.25rem] shadow-[0_16px_40px_rgba(23,59,87,.22)] ring-0 ring-[#5aa9d6]/0 transition-[left,width,height,opacity,transform,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] [backface-visibility:hidden] will-change-[left,width,height,opacity,transform] hover:shadow-[0_20px_48px_rgba(23,59,87,.27)] hover:ring-2 hover:ring-[#5aa9d6]/45 sm:rounded-[1.5rem] ${getCarouselPositionClass(offset)}`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      aria-label={
                        offset === 0
                          ? `Активна снимка ${index + 1}`
                          : `Покажи снимка ${index + 1}`
                      }
                      aria-current={offset === 0 ? "true" : undefined}
                      className="absolute inset-0 h-full w-full focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60"
                    >
                      {isVideoUrl(image.url) ? (
                        <>
                          <video
                            src={image.url}
                            className={`absolute inset-0 h-full w-full object-cover transition-[filter] duration-500 ${
                              offset === 0
                                ? "grayscale-0 saturate-100"
                                : "grayscale saturate-0"
                            }`}
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
                          alt={image.originalName ?? "Снимка от събитието"}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 56vw, 48vw"
                          className={`object-cover transition-[filter] duration-500 [backface-visibility:hidden] ${
                            offset === 0
                              ? "blur-none grayscale-0 saturate-100"
                              : "grayscale saturate-0"
                          }`}
                        />
                      )}
                    </button>

                    {offset === 0 && (
                    <div className="absolute bottom-2.5 left-1/2 z-10 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Виж снимка ${index + 1}`}
                        title="Виж"
                        className={getPhotoActionClass(offset)}
                      >
                        <ViewIcon />
                      </a>
                      <a
                        href={`${getApiUrl()}/admin/event-images/${image.id}/download`}
                        aria-label={`Свали снимка ${index + 1}`}
                        title="Свали"
                        className={getPhotoActionClass(offset)}
                      >
                        <DownloadIcon />
                      </a>
                      <button
                        type="button"
                        onClick={() => void deleteImage(image)}
                        disabled={deletingId === image.id}
                        aria-label={`Изтрий снимка ${index + 1}`}
                        title="Изтрий"
                        className={`${getPhotoActionClass(offset)} hover:bg-[#5aa9d6] disabled:opacity-50`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    )}
                  </div>
                );
              })}

              {event.images.length > 1 && (
                <>
                  <CarouselButton
                    direction="previous"
                    label="Предишна снимка"
                    onClick={showPreviousImage}
                  />
                  <CarouselButton
                    direction="next"
                    label="Следваща снимка"
                    onClick={showNextImage}
                  />
                </>
              )}

            </div>

          </div>
        ) : null}
      </section>
    </div>
  );
}

function EventShareCard({ event }: { event: AdminEventDetails }) {
  const publicUrl = `${window.location.origin}/event/${event.publicId}`;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(publicUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 360,
      color: { dark: "#173b57", light: "#ffffff" },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  async function copyLink() {
    try {
      await copyToClipboard(publicUrl);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="mt-8 grid gap-6 rounded-[1.75rem] bg-[linear-gradient(145deg,#173b57,#5aa9d6)] p-5 text-white sm:grid-cols-[180px_1fr] sm:p-6">
      <div className="mx-auto w-full max-w-[180px] rounded-2xl bg-[#ffffff] p-3">
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt={`Код за сканиране за ${event.title}`}
            width={360}
            height={360}
            unoptimized
            className="h-auto w-full rounded-xl"
          />
        ) : (
          <div className="aspect-square animate-pulse rounded-xl bg-[#eaf6ff]" />
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#eaf6ff] uppercase">
          Постоянен код за сканиране и линк
        </p>
        <p className="mt-3 break-all rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-white/90">
          {publicUrl}
        </p>
        {qrError && (
          <p className="mt-2 text-xs text-[#eaf6ff]/80">
            Кодът за сканиране не можа да бъде генериран.
          </p>
        )}
        {copyError && (
          <p className="mt-2 text-xs text-[#eaf6ff]/80">
            Линкът не можа да бъде копиран. Маркирай го и го копирай ръчно.
          </p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="rounded-full border border-white/15 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            {copied ? "Линкът е копиран" : "Копирай линка"}
          </button>
          {qrDataUrl && (
            <a
              href={qrDataUrl}
              download={`vento-decor-${event.publicId}.png`}
              className="rounded-full bg-[#eaf6ff] px-4 py-3 text-center text-sm font-semibold text-[#173b57] transition hover:bg-[#5aa9d6]"
            >
              Свали кода за сканиране
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function getCircularOffset(
  index: number,
  activeIndex: number,
  imageCount: number,
): number | null {
  let offset = index - activeIndex;
  if (offset > imageCount / 2) {
    offset -= imageCount;
  } else if (offset < -imageCount / 2) {
    offset += imageCount;
  }

  return Math.abs(offset) <= 2 ? offset : null;
}

function getCarouselPositionClass(offset: number): string {
  const positions: Record<number, string> = {
    [-2]:
      "left-[11%] z-10 h-[46%] w-[22%] -translate-x-1/2 -translate-y-1/2 opacity-60",
    [-1]:
      "left-[26%] z-20 h-[68%] w-[36%] -translate-x-1/2 -translate-y-1/2 opacity-85 sm:w-[32%]",
    [0]:
      "left-1/2 z-30 h-[88%] w-[56%] -translate-x-1/2 -translate-y-1/2 opacity-100 sm:w-[48%]",
    [1]:
      "left-[74%] z-20 h-[68%] w-[36%] -translate-x-1/2 -translate-y-1/2 opacity-85 sm:w-[32%]",
    [2]:
      "left-[89%] z-10 h-[46%] w-[22%] -translate-x-1/2 -translate-y-1/2 opacity-60",
  };

  return positions[offset] ?? "pointer-events-none opacity-0";
}

function getPhotoActionClass(offset: number): string {
  const size =
    offset === 0
      ? "h-9 w-9"
      : Math.abs(offset) === 1
        ? "h-7 w-7 sm:h-8 sm:w-8"
        : "h-5 w-5 sm:h-6 sm:w-6";

  return `grid ${size} place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-md backdrop-blur-md transition hover:scale-105 hover:bg-black/80`;
}

function ViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.8" />
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

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CarouselButton({
  direction,
  label,
  onClick,
}: {
  direction: "previous" | "next";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/35 text-xl text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/55 sm:h-12 sm:w-12 ${
        direction === "previous" ? "left-5" : "right-5"
      }`}
    >
      <span aria-hidden="true">{direction === "previous" ? "←" : "→"}</span>
    </button>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-[#173b57]/68">{label}</p>
    </div>
  );
}
