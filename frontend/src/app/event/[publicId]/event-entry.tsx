"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLockup } from "../../brand-lockup";

interface PublicEvent {
  publicId: string;
  title: string;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
}

interface GuestRegistration {
  guest: { id: number; name: string };
  token: string;
}

const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL;

function apiUrl(): string {
  return (
    CONFIGURED_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:3001`
  );
}

export function guestSessionKey(publicId: string): string {
  return `vento:event:${publicId}:guest`;
}

export function EventEntry({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvent() {
      try {
        const response = await fetch(`${apiUrl()}/events/public/${publicId}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Събитието не е намерено или вече не е активно."
              : "Събитието не може да бъде заредено.",
          );
        }
        setEvent((await response.json()) as PublicEvent);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Възникна неочаквана грешка.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadEvent();
    return () => controller.abort();
  }, [publicId]);

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName.length < 2) {
      setError("Въведи име с поне 2 символа.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiUrl()}/events/public/${publicId}/guests`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: normalizedName }),
        },
      );
      if (!response.ok) {
        throw new Error("Името не можа да бъде записано. Опитай отново.");
      }

      const registration = (await response.json()) as GuestRegistration;
      sessionStorage.setItem(
        guestSessionKey(publicId),
        JSON.stringify({
          token: registration.token,
          name: registration.guest.name,
        }),
      );
      router.push(`/event/${publicId}/upload`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Възникна неочаквана грешка.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-canvas grid min-h-screen place-items-center px-3 py-8 text-[#173b57] sm:px-6 sm:py-14">
      {isLoading ? (
        <section className="surface-card w-full max-w-xl rounded-[2rem] p-10 text-center">
          <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-[#173b57]/15 border-t-[#173b57]" />
          <p className="mt-5 text-sm font-medium text-[#173b57]/68">Зареждаме събитието…</p>
        </section>
      ) : event ? (
        <section className="surface-card reveal-up grid w-full max-w-5xl overflow-hidden rounded-[2.25rem] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative overflow-hidden bg-[linear-gradient(145deg,#173b57,#5aa9d6)] p-7 text-white sm:p-10 lg:p-12">
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#eaf6ff]/15 blur-2xl" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#5aa9d6]/20 blur-3xl" />
            <div className="relative flex h-full min-h-[30rem] flex-col">
              <BrandLockup subtitle="Галерия за гости" inverse />
              <div className="my-auto py-12">
                <p className="text-xs font-bold tracking-[0.2em] text-[#eaf6ff] uppercase">
                  Покана за споделяне
                </p>
                <h1 className="mt-4 text-4xl leading-[1.02] font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
                  {event.title}
                </h1>
                {event.description && (
                  <p className="mt-5 max-w-lg text-sm leading-7 text-[#eaf6ff]/80 sm:text-base">
                    {event.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-semibold text-[#eaf6ff]">
                {event.location && (
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2.5">
                    ◉ {event.location}
                  </span>
                )}
                {event.startAt && (
                  <span className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2.5">
                    {formatEventDate(event.startAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#5aa9d6]/35 text-lg">
              ✦
            </span>
            <p className="eyebrow mt-8">Добре дошли</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              Представи се на домакините
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#173b57]/68">
              След това ще можеш да добавиш любимите си снимки към общата галерия.
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              <label htmlFor="guest-name" className="text-sm font-bold">
                Твоето име
              </label>
              <input
                id="guest-name"
                name="name"
                value={name}
                onChange={(inputEvent) => setName(inputEvent.target.value)}
                minLength={2}
                maxLength={100}
                autoComplete="name"
                autoFocus
                required
                placeholder="Напиши името си"
                className="field-input mt-3 bg-white"
              />

              {error && (
                <p className="mt-3 rounded-xl bg-[#5aa9d6]/15 px-4 py-3 text-sm font-medium text-[#173b57]" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-action mt-5 w-full py-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Продължаване…" : "Продължи към снимките"}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
              <p className="mt-4 text-center text-xs leading-5 text-[#173b57]/58">
                Не се изисква регистрация. Името се използва само за тази галерия.
              </p>
            </form>
          </div>
        </section>
      ) : (
        <section className="surface-card w-full max-w-xl rounded-[2rem] p-10 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#5aa9d6]/15 text-2xl">!</span>
          <h1 className="mt-6 text-2xl font-semibold">Линкът не е достъпен</h1>
          <p className="mt-3 text-sm font-medium leading-6 text-[#173b57]">{error}</p>
        </section>
      )}
    </main>
  );
}

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
