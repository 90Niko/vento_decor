"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLockup } from "@/shared/components/brand-lockup";
import { eventsService } from "@/features/events/services/events.service";

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

export function guestSessionKey(publicId: string): string {
  return `vento:event:${publicId}:guest`;
}

export function guestOtpKey(publicId: string): string {
  return `vento:event:${publicId}:guest-otp`;
}

export function EventEntry({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const isOtpRequested = false;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadEvent() {
      try {
        const response = await eventsService.getPublicEventResponse(publicId, controller.signal);
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
      const response = await (isOtpRequested
        ? eventsService.verifyGuestOtpResponse(publicId, email.trim(), otp)
        : eventsService.requestGuestOtpResponse(
            publicId,
            normalizedName,
            email.trim(),
          ));
      if (!response.ok) {
        throw new Error(await readResponseError(response));
      }

      if (!isOtpRequested) {
        const otpResponse = (await response.json()) as { devCode?: string };
        sessionStorage.setItem(
          guestOtpKey(publicId),
          JSON.stringify({
            name: normalizedName,
            email: email.trim(),
            devCode: otpResponse.devCode,
          }),
        );
        router.push(`/event/${publicId}/verify`);
        return;
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
        submitError instanceof TypeError && submitError.message === "Failed to fetch"
          ? "Няма връзка със сървъра. Провери интернет връзката си и опитай отново."
          : submitError instanceof Error
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
              <label htmlFor="guest-email" className="mt-5 block text-sm font-bold">
                Адрес на електронна поща
              </label>
              <input
                id="guest-email"
                name="email"
                type="email"
                value={email}
                onChange={(inputEvent) => setEmail(inputEvent.target.value)}
                autoComplete="email"
                required
                disabled={isOtpRequested}
                className="field-input mt-3 bg-white"
              />
              {isOtpRequested && (
                <>
                  <label htmlFor="guest-otp" className="mt-5 block text-sm font-bold">
                    Еднократен код
                  </label>
                  <input
                    id="guest-otp"
                    name="otp"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(inputEvent) => setOtp(inputEvent.target.value)}
                    required
                    autoFocus
                    className="field-input mt-3 bg-white"
                  />
                </>
              )}

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

async function readResponseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) return payload.message.join(" ");
    if (payload.message) return payload.message;
  } catch {
    // Use the status fallback below for non-JSON errors.
  }
  return `Заявката не беше изпълнена (код ${response.status}).`;
}
