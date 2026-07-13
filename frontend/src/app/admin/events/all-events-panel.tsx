"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AdminEvent {
  id: number;
  publicId: string;
  title: string;
  description: string | null;
  startAt: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  guestCount: number;
  imageCount: number;
}

function getApiUrl(): string {
  return (
    CONFIGURED_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:3001`
  );
}

export function AllEventsPanel({ refreshVersion }: { refreshVersion: number }) {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${getApiUrl()}/events/admin`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Събитията не могат да бъдат заредени (код ${response.status}).`);
      }
      setEvents((await response.json()) as AdminEvent[]);
    } catch (requestError) {
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
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadEvents());
  }, [loadEvents, refreshVersion]);

  return (
    <section className="pt-4">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Архив</p>
          <h2 className="mt-2 text-3xl font-medium tracking-[-0.04em]">
            Всички събития
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void loadEvents()}
          disabled={isLoading}
          className="rounded-full border border-[#173b57]/15 bg-white/60 px-5 py-2.5 text-sm font-semibold transition hover:bg-white disabled:opacity-50"
        >
          Обнови
        </button>
      </div>

      {error && (
        <p className="mb-5 rounded-2xl bg-[#5aa9d6]/15 px-4 py-3 text-sm font-medium text-[#173b57]" role="alert">
          {error}
        </p>
      )}

      {isLoading && events.length === 0 ? (
        <div className="rounded-[2rem] border border-[#173b57]/10 bg-white/60 p-10 text-center text-[#173b57]/68">
          Зареждане…
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[#173b57]/20 bg-white/45 p-10 text-center text-[#173b57]/68">
          Все още няма създадени събития.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/admin/events/${event.publicId}`}
              className="surface-card group rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#5aa9d6]/40 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-[#5aa9d6]/25 px-3 py-1 text-[11px] font-semibold text-[#173b57]">
                  {event.isActive ? "Активен" : "Неактивен"}
                </span>
                <span className="text-xs text-[#173b57]/68">
                  {formatDate(event.createdAt)}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] group-hover:text-[#5aa9d6]">
                {event.title}
              </h3>
              <p className="mt-2 min-h-6 truncate text-sm text-[#173b57]/68">
                {event.location ?? "Без зададена локация"}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#173b57]/10 pt-5 text-sm">
                <Stat value={event.imageCount} label="снимки" />
                <Stat value={event.guestCount} label="гости" />
              </div>
              <p className="mt-5 text-sm font-semibold text-[#5aa9d6]">
                Отвори галерията →
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <span className="text-lg font-semibold">{value}</span>{" "}
      <span className="text-[#173b57]/68">{label}</span>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
