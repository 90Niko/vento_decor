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

export function EventGallery({
  publicId,
  basePath = "/admin/events",
}: {
  publicId: string;
  basePath?: string;
}) {
  const [event, setEvent] = useState<AdminEventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openPhotoMenuId, setOpenPhotoMenuId] = useState<number | null>(null);
  const [selectedImageIds, setSelectedImageIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (openPhotoMenuId === null) return;
    function closePhotoMenu(pointerEvent: PointerEvent) {
      const target = pointerEvent.target;
      if (
        target instanceof Element &&
        target.closest(`[data-photo-menu="${openPhotoMenuId}"]`)
      ) {
        return;
      }
      setOpenPhotoMenuId(null);
    }
    document.addEventListener("pointerdown", closePhotoMenu);
    return () => document.removeEventListener("pointerdown", closePhotoMenu);
  }, [openPhotoMenuId]);

  async function deleteImage(image: EventImage) {
    const confirmed = window.confirm(
      `Да изтрия ли снимката${image.guestName ? ` от ${image.guestName}` : ""}? Действието е необратимо.`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(image.id);
    setError(null);
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

  function toggleImageSelection(imageId: number) {
    setSelectedImageIds((current) => {
      const next = new Set(current);
      if (next.has(imageId)) next.delete(imageId);
      else next.add(imageId);
      return next;
    });
  }

  async function deleteSelectedImages() {
    const imageIds = [...selectedImageIds];
    if (
      imageIds.length === 0 ||
      !window.confirm(
        `Да изтрия ли ${imageIds.length} избрани снимки? Действието е необратимо.`,
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    setError(null);
    const results = await Promise.all(
      imageIds.map(async (imageId) => {
        try {
          const response = await eventsService.deleteImageResponse(imageId);
          return { imageId, deleted: response.ok };
        } catch {
          return { imageId, deleted: false };
        }
      }),
    );
    const deletedIds = new Set(
      results.filter((result) => result.deleted).map((result) => result.imageId),
    );
    const failedIds = new Set(
      results.filter((result) => !result.deleted).map((result) => result.imageId),
    );

    setEvent((current) =>
      current
        ? {
            ...current,
            imageCount: current.imageCount - deletedIds.size,
            images: current.images.filter((image) => !deletedIds.has(image.id)),
          }
        : current,
    );
    setSelectedImageIds(failedIds);
    if (failedIds.size > 0) {
      setError(
        `${deletedIds.size} снимки са изтрити, но ${failedIds.size} не можаха да бъдат изтрити.`,
      );
    }
    setIsBulkDeleting(false);
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

  return (
    <div>
      <section>
        <div className="lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(22rem,0.85fr)] lg:items-start lg:gap-10 xl:gap-14">
          <div className="min-w-0 lg:py-5">
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

            <div className="mt-8 grid max-w-lg grid-cols-2 gap-4 border-t border-[#173b57]/10 pt-6">
              <Stat value={event.imageCount} label="снимки" />
              <Stat value={event.guestCount} label="регистрирани гости" />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`${basePath}/${event.publicId}/edit#event-quiz`}
                className="primary-action"
              >
                Отвори въпросите
              </Link>
              <Link
                href={`/event/${event.publicId}`}
                target="_blank"
                className="secondary-action"
              >
                Отвори публичното събитие ↗
              </Link>
            </div>
          </div>

          <EventShareCard event={event} />
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-medium tracking-[-0.04em]">Снимки</h2>
          {event.images.length > 0 && (
            <span className="text-sm text-[#173b57]/68">
              {event.images.length} общо
            </span>
          )}
        </div>

        {error && (
          <p className="mb-5 rounded-2xl bg-[#5aa9d6]/15 px-4 py-3 text-sm font-medium text-[#173b57]" role="alert">
            {error}
          </p>
        )}

        {selectedImageIds.size > 0 && (
          <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-[#173b57]/10 bg-white/80 p-3 shadow-sm">
            <span className="mr-auto px-2 text-sm font-bold">
              Избрани: {selectedImageIds.size}
            </span>
            <button
              type="button"
              onClick={() =>
                setSelectedImageIds(new Set(event.images.map((image) => image.id)))
              }
              className="rounded-full px-4 py-2 text-xs font-bold hover:bg-[#eaf6ff]"
            >
              Избери всички
            </button>
            <button
              type="button"
              onClick={() => setSelectedImageIds(new Set())}
              className="rounded-full px-4 py-2 text-xs font-bold hover:bg-[#eaf6ff]"
            >
              Отказ
            </button>
            <button
              type="button"
              onClick={() => void deleteSelectedImages()}
              disabled={isBulkDeleting}
              className="rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {isBulkDeleting ? "Изтриване…" : "Изтрий избраните"}
            </button>
          </div>
        )}

        {event.images.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#173b57]/20 bg-white/45 p-14 text-center text-[#173b57]/68">
            Все още няма качени снимки за това събитие.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {event.images.map((image, index) => (
              <article
                key={image.id}
                className={`group relative aspect-square rounded-xl bg-black/5 shadow-[0_8px_24px_rgba(23,59,87,.14)] sm:rounded-2xl ${
                  openPhotoMenuId === image.id ? "z-20" : ""
                } ${selectedImageIds.has(image.id) ? "ring-4 ring-[#5aa9d6]" : ""}`}
              >
                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Виж ${isVideoUrl(image.url) ? "видео" : "снимка"} ${index + 1}`}
                  className="absolute inset-0 overflow-hidden rounded-xl focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-white/60 sm:rounded-2xl"
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
                          alt={image.originalName ?? "Снимка от събитието"}
                          fill
                          unoptimized
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      )}
                </a>

                {selectedImageIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleImageSelection(image.id)}
                    aria-label={
                      selectedImageIds.has(image.id)
                        ? `Премахни снимка ${index + 1} от избраните`
                        : `Маркирай снимка ${index + 1}`
                    }
                    className={`absolute top-2 left-2 z-10 grid h-9 w-9 place-items-center rounded-full border-2 border-white shadow-md sm:top-3 sm:left-3 ${
                      selectedImageIds.has(image.id)
                        ? "bg-[#5aa9d6] text-white"
                        : "bg-black/45 text-transparent backdrop-blur"
                    }`}
                  >
                    <CheckIcon />
                  </button>
                )}

                <div
                  className="absolute top-2 right-2 z-10 sm:top-3 sm:right-3"
                  data-photo-menu={image.id}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenPhotoMenuId((current) =>
                        current === image.id ? null : image.id,
                      )
                    }
                    aria-label={`Действия за снимка ${index + 1}`}
                    aria-expanded={openPhotoMenuId === image.id}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/55 text-white shadow-md backdrop-blur-md transition hover:bg-black/80"
                  >
                    <MoreIcon />
                  </button>

                  {openPhotoMenuId === image.id && (
                    <div className="absolute top-12 right-0 w-36 overflow-hidden rounded-xl border border-black/10 bg-white p-1.5 text-sm font-semibold text-[#173b57] shadow-xl">
                      <button
                        type="button"
                        onClick={() => {
                          toggleImageSelection(image.id);
                          setOpenPhotoMenuId(null);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-[#eaf6ff]"
                      >
                        <SelectIcon />
                        Маркирай
                      </button>
                      <a
                        href={image.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setOpenPhotoMenuId(null)}
                        aria-label={`Виж снимка ${index + 1}`}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-[#eaf6ff]"
                      >
                        <ViewIcon />
                        Виж
                      </a>
                      <a
                        href={`${getApiUrl()}/admin/event-images/${image.id}/download`}
                        onClick={() => setOpenPhotoMenuId(null)}
                        aria-label={`Свали снимка ${index + 1}`}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-[#eaf6ff]"
                      >
                        <DownloadIcon />
                        Свали
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenPhotoMenuId(null);
                          void deleteImage(image);
                        }}
                        disabled={deletingId === image.id}
                        aria-label={`Изтрий снимка ${index + 1}`}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <TrashIcon />
                        Изтрий
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
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
  const copiedResetTimeout = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (copiedResetTimeout.current !== null) {
        window.clearTimeout(copiedResetTimeout.current);
      }
    };
  }, []);

  async function copyLink() {
    try {
      await copyToClipboard(publicUrl);
      setCopied(true);
      setCopyError(false);
      if (copiedResetTimeout.current !== null) {
        window.clearTimeout(copiedResetTimeout.current);
      }
      copiedResetTimeout.current = window.setTimeout(() => {
        setCopied(false);
        copiedResetTimeout.current = null;
      }, 5000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center text-[#173b57] lg:mt-0">
      <p className="text-center text-xs font-semibold tracking-[0.16em] uppercase">
        Постоянен код за сканиране и линк
      </p>

      <div className="mt-5 w-full max-w-sm">
        {qrDataUrl ? (
          <Image
            src={qrDataUrl}
            alt={`Код за сканиране за ${event.title}`}
            width={360}
            height={360}
            unoptimized
            className="h-auto w-full"
          />
        ) : (
          <div className="aspect-square animate-pulse rounded-xl bg-[#eaf6ff]" />
        )}
      </div>

      {qrError && (
        <p className="mt-3 text-center text-xs text-[#173b57]/70">
          Кодът за сканиране не можа да бъде генериран.
        </p>
      )}
      {copyError && (
        <p className="mt-3 text-center text-xs text-[#173b57]/70">
          Линкът не можа да бъде копиран. Опитай отново.
        </p>
      )}
      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#173b57] text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#5aa9d6]"
          aria-label={copied ? "Линкът е копиран" : "Копирай линка"}
          title={copied ? "Линкът е копиран" : "Копирай линка"}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        {qrDataUrl && (
          <a
            href={qrDataUrl}
            download={`vento-decor-${event.publicId}.png`}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-[#173b57] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#eaf6ff]"
            aria-label="Свали кода за сканиране"
            title="Свали кода за сканиране"
          >
            <QrDownloadIcon />
          </a>
        )}
      </div>
    </div>
  );
}

function ViewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function SelectIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="m8 12 2.7 2.7L16.5 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
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

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QrDownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
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

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm text-[#173b57]/68">{label}</p>
    </div>
  );
}
