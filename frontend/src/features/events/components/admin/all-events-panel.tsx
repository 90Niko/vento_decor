"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent as ReactTouchEvent } from "react";
import { eventsService } from "@/features/events/services/events.service";

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

type EventFilter = "all" | "active" | "inactive";

export function AllEventsPanel({ refreshVersion, basePath = "/admin/events" }: { refreshVersion: number; basePath?: string }) {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventFilter>("all");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [swipe, setSwipe] = useState<{ id: number; offset: number } | null>(null);
  const swipeStart = useRef<{ id: number; x: number; y: number; offset: number; axis: "x" | "y" | null } | null>(null);
  const suppressSwipeClick = useRef(false);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = basePath.startsWith("/dashboard")
        ? await eventsService.getCreatorEventsResponse()
        : await eventsService.getAdminEventsResponse();
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
  }, [basePath]);

  async function deleteEvent(event: AdminEvent) {
    setOpenMenuId(null);
    const confirmed = window.confirm(
      `Да изтрия ли „${event.title}“? Всички гости и снимки към събитието също ще бъдат изтрити. Действието е необратимо.`,
    );
    if (!confirmed) return;

    setDeletingId(event.id);
    setError(null);
    try {
      const response = await eventsService.deleteEventResponse(event.publicId);
      if (!response.ok) {
        throw new Error(`Събитието не можа да бъде изтрито (код ${response.status}).`);
      }
      setEvents((current) => current.filter((item) => item.id !== event.id));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Възникна неочаквана грешка при изтриването.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function startEventSwipe(event: ReactTouchEvent<HTMLDivElement>, eventId: number) {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const touch = event.touches[0];
    swipeStart.current = { id: eventId, x: touch.clientX, y: touch.clientY, offset: 0, axis: null };
    suppressSwipeClick.current = false;
    setOpenMenuId(null);
    setSwipe({ id: eventId, offset: 0 });
  }

  function moveEventSwipe(event: ReactTouchEvent<HTMLDivElement>, eventId: number) {
    const start = swipeStart.current;
    if (!start || start.id !== eventId) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (!start.axis && Math.max(Math.abs(deltaX), Math.abs(deltaY)) > 6) {
      start.axis = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
    }
    if (start.axis !== "x") return;

    event.preventDefault();
    const offset = Math.min(112, Math.max(0, deltaX));
    start.offset = offset;
    if (offset > 8) suppressSwipeClick.current = true;
    setSwipe({ id: eventId, offset });
  }

  function endEventSwipe(item: AdminEvent) {
    if (swipeStart.current?.axis === "x" && swipeStart.current.offset >= 88) {
      void deleteEvent(item);
    }
    swipeStart.current = null;
    setSwipe(null);
  }

  function cancelEventSwipe() {
    swipeStart.current = null;
    setSwipe(null);
  }

  useEffect(() => {
    queueMicrotask(() => void loadEvents());
  }, [loadEvents, refreshVersion]);

  const totals = useMemo(
    () => ({
      events: events.length,
      active: events.filter((event) => event.isActive).length,
      guests: events.reduce((total, event) => total + event.guestCount, 0),
      images: events.reduce((total, event) => total + event.imageCount, 0),
    }),
    [events],
  );

  const visibleEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("bg");
    return events.filter((event) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "active" ? event.isActive : !event.isActive);
      const matchesQuery =
        !normalizedQuery ||
        event.title.toLocaleLowerCase("bg").includes(normalizedQuery) ||
        event.location?.toLocaleLowerCase("bg").includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [events, filter, query]);

  return (
    <section id="events" className="scroll-mt-28 space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Всички събития" value={totals.events} icon={<CalendarIcon />} />
        <MetricCard label="Активни събития" value={totals.active} icon={<PulseIcon />} accent />
        <MetricCard label="Регистрирани гости" value={totals.guests} icon={<UsersIcon />} />
        <MetricCard label="Събрани снимки" value={totals.images} icon={<ImageIcon />} />
      </div>

      <div className="surface-card overflow-hidden rounded-[1.75rem]">
        <div className="border-b border-[#173b57]/10 p-5 sm:p-7">
          <div>
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
                Управление
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em]">
                Събития
              </h2>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="relative block flex-1 lg:max-w-md">
              <span className="sr-only">Търси събитие</span>
              <span className="pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-[#173b57]/45">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Търси по име или локация..."
                className="field-input py-3 pr-4 pl-11"
              />
            </label>
            <div className="flex rounded-xl bg-[#173b57]/[0.055] p-1">
              {([
                ["all", "Всички"],
                ["active", "Активни"],
                ["inactive", "Неактивни"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    filter === value
                      ? "bg-white text-[#173b57] shadow-sm"
                      : "text-[#173b57]/55 hover:text-[#173b57]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="m-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        )}

        {isLoading && events.length === 0 ? (
          <EventListSkeleton />
        ) : visibleEvents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#5aa9d6]/12 text-[#5aa9d6]">
              <SearchIcon />
            </div>
            <p className="mt-4 font-semibold">Няма намерени събития</p>
            <p className="mt-1 text-sm text-[#173b57]/55">
              Опитай с друга дума или промени избрания филтър.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#173b57]/8">
            {visibleEvents.map((event) => {
              const swipeOffset = swipe?.id === event.id ? swipe.offset : 0;
              return (
              <div
                key={event.id}
                className="relative overflow-hidden bg-red-500"
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-28 items-center justify-center gap-2 text-sm font-bold text-white sm:hidden">
                  <TrashIcon />
                  Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹
                </div>
                <div
                  className={`group grid touch-pan-y gap-4 bg-white p-5 hover:bg-[#eaf6ff] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-7 ${swipe?.id === event.id ? "" : "transition-transform duration-200"}`}
                  style={{ transform: `translateX(${swipeOffset}px)` }}
                  onTouchStart={(touchEvent) => startEventSwipe(touchEvent, event.id)}
                  onTouchMove={(touchEvent) => moveEventSwipe(touchEvent, event.id)}
                  onTouchEnd={() => endEventSwipe(event)}
                  onTouchCancel={cancelEventSwipe}
                  onClickCapture={(clickEvent) => {
                    if (!suppressSwipeClick.current) return;
                    clickEvent.preventDefault();
                    clickEvent.stopPropagation();
                    suppressSwipeClick.current = false;
                  }}
                >
                <Link href={`${basePath}/${event.publicId}`} className="contents">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#173b57] text-sm font-bold text-white shadow-lg shadow-[#173b57]/10">
                    {getInitials(event.title)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold group-hover:text-[#5aa9d6]">
                        {event.title}
                      </h3>
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          event.isActive ? "bg-emerald-500" : "bg-[#173b57]/25"
                        }`}
                      />
                    </div>
                    <p className="mt-1 truncate text-sm text-[#173b57]/55">
                      {event.location ?? "Няма зададена локация"}
                      <span className="mx-2">·</span>
                      {formatDate(event.startAt ?? event.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-6 pl-16 sm:justify-end sm:pl-0">
                  <SmallStat value={event.guestCount} label="гости" />
                  <SmallStat value={event.imageCount} label="снимки" />
                </div>
                </Link>
                <div className="ml-16 flex min-h-10 items-center justify-end gap-2 sm:ml-0">
                  {openMenuId === event.id && (
                    <div className="event-actions-menu flex items-center gap-2 rounded-full bg-[#173b57]/5 p-1.5">
                      <Link
                        href={`${basePath}/${event.publicId}/edit`}
                        onClick={() => setOpenMenuId(null)}
                        aria-label={`Редактирай ${event.title}`}
                        title="Редактирай събитието"
                        className="grid h-9 w-9 place-items-center rounded-full bg-white text-[#5aa9d6] shadow-sm transition hover:bg-[#5aa9d6] hover:text-white"
                      >
                        <EditIcon />
                      </Link>
                      <button
                        type="button"
                        onClick={() => void deleteEvent(event)}
                        disabled={deletingId === event.id}
                        aria-label={`Изтрий ${event.title}`}
                        title="Изтрий събитието"
                        className="grid h-9 w-9 place-items-center rounded-full bg-white text-red-500 shadow-sm transition hover:bg-red-500 hover:text-white disabled:cursor-wait disabled:opacity-40"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuId((current) =>
                        current === event.id ? null : event.id,
                      )
                    }
                    aria-expanded={openMenuId === event.id}
                    aria-label={`Действия за ${event.title}`}
                    title="Действия"
                    className={`grid h-10 w-10 place-items-center rounded-full transition ${
                      openMenuId === event.id
                        ? "rotate-90 bg-[#173b57] text-white"
                        : "bg-[#173b57]/5 text-[#173b57]/55 hover:bg-[#173b57]/10 hover:text-[#173b57]"
                    }`}
                  >
                    <MoreIcon />
                  </button>
                </div>
                </div>
              </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#173b57]/10 bg-white/35 px-5 py-4 text-xs text-[#173b57]/55 sm:px-7">
          <span>{visibleEvents.length} от {events.length} събития</span>
          <button
            type="button"
            onClick={() => void loadEvents()}
            disabled={isLoading}
            className="font-semibold text-[#173b57] hover:text-[#5aa9d6] disabled:opacity-50"
          >
            {isLoading ? "Обновяване…" : "Обнови данните"}
          </button>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon, accent = false }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <article className={`rounded-[1.5rem] border p-5 shadow-[0_18px_50px_rgba(23,59,87,.07)] ${
      accent ? "border-[#173b57] bg-[#173b57] text-white" : "border-[#173b57]/10 bg-white/75"
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold ${accent ? "text-white/60" : "text-[#173b57]/50"}`}>{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em]">{value.toLocaleString("bg-BG")}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${accent ? "bg-white/10 text-[#8ed3f4]" : "bg-[#5aa9d6]/12 text-[#5aa9d6]"}`}>{icon}</span>
      </div>
    </article>
  );
}

function SmallStat({ value, label }: { value: number; label: string }) {
  return <div className="text-right"><p className="font-semibold">{value}</p><p className="text-[11px] text-[#173b57]/45">{label}</p></div>;
}

function EventListSkeleton() {
  return <div className="space-y-px p-5">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-[#173b57]/5" />)}</div>;
}

function getInitials(title: string) {
  return title.split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toLocaleUpperCase("bg");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function CalendarIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>; }
function PulseIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h4l2-5 4 10 2-5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function UsersIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" /><path d="M3.5 19c.5-4 2.5-6 5.5-6s5 2 5.5 6M16 5.5a3 3 0 0 1 0 5.5m1.5 2c2 .7 3 2.7 3 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>; }
function ImageIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" /><circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.7" /><path d="m4 17 5-4 3 2 3-3 5 5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>; }
function SearchIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function EditIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 20 4.2-1 10.7-10.7a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="m14.5 6.7 2.8 2.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function TrashIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function MoreIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>; }
